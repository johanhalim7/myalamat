import { NextRequest, NextResponse } from 'next/server';
import { NearbyPlace } from '@/types/address';

interface NominatimSearchItem {
  place_id?: number;
  osm_id?: number;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
  display_name?: string;
  address?: {
    road?: string;
    street?: string;
    city_block?: string;
    [key: string]: string | undefined;
  };
}

// Haversine formula
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function extractRTRWFromText(text: string): { rt?: string; rw?: string } | null {
  let rt: string | undefined;
  let rw: string | undefined;

  const rtMatch = text.match(/\bRT\.?\s*(\d{1,3})\b/i);
  if (rtMatch) rt = rtMatch[1];
  const rwMatch = text.match(/\bRW\.?\s*(\d{1,3})\b/i);
  if (rwMatch) rw = rwMatch[1];

  const composite = text.match(/\b(\d{1,3})\s*\/\s*(\d{1,3})\b/);
  if (composite && (!rt || !rw)) {
    if (!rt) rt = composite[1];
    if (!rw) rw = composite[2];
  }

  if (rt || rw) {
    return { rt, rw };
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');

  if (!latStr || !lonStr) {
    return NextResponse.json(
      { error: 'Parameter lat dan lon harus diisi.' },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  const places: NearbyPlace[] = [];

  try {
    // Search for schools, mosques, puskesmas, offices within bounding box of ~700 meters
    const delta = 0.007; // ~770m
    const minLon = (lon - delta).toFixed(5);
    const maxLon = (lon + delta).toFixed(5);
    const minLat = (lat - delta).toFixed(5);
    const maxLat = (lat + delta).toFixed(5);

    const queryCategories = ['sekolah', 'masjid', 'puskesmas', 'kelurahan', 'kantor'];
    
    // Run searches in parallel
    const searchPromises = queryCategories.map(async (query) => {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        query
      )}&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1&limit=4&addressdetails=1&accept-language=id`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AlamatKu-Web/1.0 (https://alamatku.app)',
        },
        next: { revalidate: 300 },
      });
      if (res.ok) {
        return (await res.json()) as NominatimSearchItem[];
      }
      return [];
    });

    const searchResults = await Promise.all(searchPromises);
    const flatResults = searchResults.flat();

    const seenIds = new Set<string>();

    for (const item of flatResults) {
      const pLat = parseFloat(item.lat);
      const pLon = parseFloat(item.lon);
      const id = String(item.place_id || item.osm_id);

      if (seenIds.has(id) || isNaN(pLat) || isNaN(pLon)) continue;
      seenIds.add(id);

      const dist = getDistanceInMeters(lat, lon, pLat, pLon);
      const name = item.name || item.display_name?.split(',')[0] || '';
      const fullDisplay = item.display_name || '';

      if (!name) continue;

      // Classify category
      let category: NearbyPlace['category'] = 'other';
      let categoryLabel = 'Fasilitas';

      const lowerName = (name + ' ' + (item.type || '')).toLowerCase();
      if (lowerName.includes('sekolah') || lowerName.includes('sd') || lowerName.includes('smp') || lowerName.includes('sma') || lowerName.includes('univ') || lowerName.includes('college') || lowerName.includes('school')) {
        category = 'school';
        categoryLabel = 'Sekolah / Pendidikan';
      } else if (lowerName.includes('masjid') || lowerName.includes('mushola') || lowerName.includes('gereja') || lowerName.includes('worship')) {
        category = 'worship';
        categoryLabel = 'Tempat Ibadah';
      } else if (lowerName.includes('puskesmas') || lowerName.includes('klinik') || lowerName.includes('hospital') || lowerName.includes('rs')) {
        category = 'health';
        categoryLabel = 'Kesehatan';
      } else if (lowerName.includes('kelurahan') || lowerName.includes('kantor') || lowerName.includes('pos') || lowerName.includes('ronda')) {
        category = 'government';
        categoryLabel = 'Instansi / Pos Warga';
      } else if (lowerName.includes('indomaret') || lowerName.includes('alfamart') || lowerName.includes('pasar') || lowerName.includes('warung')) {
        category = 'commercial';
        categoryLabel = 'Belanja / Niaga';
      }

      // Check for RT / RW in name, address tags, or city_block
      let detectedRTRW: NearbyPlace['detectedRTRW'] | undefined;
      const textToScan = [
        item.address?.city_block,
        name,
        fullDisplay,
      ].filter(Boolean).join(' ');

      const found = extractRTRWFromText(textToScan);
      if (found) {
        detectedRTRW = {
          rt: found.rt,
          rw: found.rw,
          source: name,
        };
      }

      places.push({
        id,
        name,
        category,
        categoryLabel,
        latitude: pLat,
        longitude: pLon,
        distanceMeters: dist,
        street: item.address?.road || item.address?.street,
        detectedRTRW,
        fullAddress: fullDisplay,
      });
    }

    // Sort by proximity
    places.sort((a, b) => a.distanceMeters - b.distanceMeters);

    // Find first place that contains RT/RW info
    const placeWithRTRW = places.find((p) => p.detectedRTRW && (p.detectedRTRW.rt || p.detectedRTRW.rw));

    return NextResponse.json({
      places,
      suggestedRTRW: placeWithRTRW?.detectedRTRW
        ? {
            rt: placeWithRTRW.detectedRTRW.rt || '',
            rw: placeWithRTRW.detectedRTRW.rw || '',
            source: placeWithRTRW.name,
            distanceMeters: placeWithRTRW.distanceMeters,
          }
        : null,
    });
  } catch (err: unknown) {
    console.error('Nearby places error:', err);
    return NextResponse.json({ places: [], suggestedRTRW: null });
  }
}
