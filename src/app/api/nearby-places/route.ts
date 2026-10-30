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
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    [key: string]: string | undefined;
  };
}

interface GooglePlaceItem {
  place_id: string;
  name: string;
  vicinity?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
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
  if (!text) return null;
  let rt: string | undefined;
  let rw: string | undefined;

  // Pattern 1: RT. 07 / RW. 03 or RT 01/RW 05 or RT.01/05
  const combinedMatch = text.match(/\bRT\.?\s*(\d{1,3})\s*(?:[\/,&\-]|dan)\s*RW\.?\s*(\d{1,3})\b/i);
  if (combinedMatch) {
    rt = combinedMatch[1];
    rw = combinedMatch[2];
  } else {
    // Pattern 2: RT 03 and RW 05 separately
    const rtMatch = text.match(/\bRT\.?\s*(\d{1,3})\b/i);
    if (rtMatch) rt = rtMatch[1];
    const rwMatch = text.match(/\bRW\.?\s*(\d{1,3})\b/i);
    if (rwMatch) rw = rwMatch[1];

    // Pattern 3: Composite slash e.g. "07/03"
    const composite = text.match(/\b(\d{1,3})\s*\/\s*(\d{1,3})\b/);
    if (composite && (!rt || !rw)) {
      if (!rt) rt = composite[1];
      if (!rw) rw = composite[2];
    }
  }

  if (rt || rw) {
    return { rt, rw };
  }
  return null;
}

function mapGoogleTypesToCategory(types: string[] = []): { category: NearbyPlace['category']; categoryLabel: string } {
  if (types.some((t) => ['school', 'primary_school', 'secondary_school', 'university'].includes(t))) {
    return { category: 'school', categoryLabel: 'Sekolah / Pendidikan' };
  }
  if (types.some((t) => ['place_of_worship', 'mosque', 'church', 'hindu_temple'].includes(t))) {
    return { category: 'worship', categoryLabel: 'Tempat Ibadah' };
  }
  if (types.some((t) => ['hospital', 'doctor', 'pharmacy', 'health', 'physiotherapist'].includes(t))) {
    return { category: 'health', categoryLabel: 'Kesehatan' };
  }
  if (types.some((t) => ['local_government_office', 'police', 'post_office', 'city_hall', 'courthouse'].includes(t))) {
    return { category: 'government', categoryLabel: 'Instansi / Pos Warga' };
  }
  if (types.some((t) => ['convenience_store', 'supermarket', 'store', 'gas_station', 'bank', 'restaurant', 'cafe', 'bakery'].includes(t))) {
    return { category: 'commercial', categoryLabel: 'Belanja / Niaga / SPBU' };
  }
  if (types.some((t) => ['transit_station', 'bus_station', 'subway_station', 'train_station'].includes(t))) {
    return { category: 'transit', categoryLabel: 'Transportasi' };
  }
  return { category: 'other', categoryLabel: 'Fasilitas Sekitar' };
}

function classifyOSMPlace(name: string, type: string = ''): { category: NearbyPlace['category']; categoryLabel: string } {
  const text = `${name} ${type}`.toLowerCase();

  // Health first to prevent substring collisions (e.g. "puskesmas" containing "sma")
  if (/\b(puskesmas|klinik|apotek|bidan|rs|rsud|hospital|dokter|poskesdes)\b/i.test(text) || text.includes('kesehatan')) {
    return { category: 'health', categoryLabel: 'Kesehatan' };
  }

  // Worship
  if (/\b(masjid|mushola|langgar|gereja|pura|vihara|klenteng)\b/i.test(text) || text.includes('worship') || text.includes('ibadah')) {
    return { category: 'worship', categoryLabel: 'Tempat Ibadah' };
  }

  // Government & Community
  if (/\b(kelurahan|desa|kecamatan|kantor|balai|pos ronda|pos kamling|pos satpam|posyandu|polsek|koramil|bhabinkamtibmas)\b/i.test(text) || text.includes('government')) {
    return { category: 'government', categoryLabel: 'Instansi / Pos Warga' };
  }

  // Education (Schools)
  if (/\b(sdn|sd|smpn|smp|sman|sma|smk|smkn|madrasah|pesantren|paud|tk|sekolah|school|universitas|kampus|college)\b/i.test(text) || text.includes('pendidikan')) {
    return { category: 'school', categoryLabel: 'Sekolah / Pendidikan' };
  }

  // Commercial / Stores / Fuel
  if (/\b(indomaret|alfamart|alfamidi|spbu|pertashop|pasar|warung|toko|minimarket|supermarket|bengkel|atm|bank)\b/i.test(text) || text.includes('shop') || text.includes('mart')) {
    return { category: 'commercial', categoryLabel: 'Belanja / Niaga / SPBU' };
  }

  // Transit
  if (/\b(terminal|stasiun|halte|bus|angkot|pangkalan)\b/i.test(text) || text.includes('transit')) {
    return { category: 'transit', categoryLabel: 'Transportasi' };
  }

  return { category: 'other', categoryLabel: 'Fasilitas Sekitar' };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');
  const district = searchParams.get('district') || '';
  const regency = searchParams.get('regency') || '';
  const village = searchParams.get('village') || '';

  if (!latStr || !lonStr) {
    return NextResponse.json(
      { error: 'Parameter lat dan lon harus diisi.' },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json(
      { error: 'Koordinat tidak valid.' },
      { status: 400 }
    );
  }

  const places: NearbyPlace[] = [];
  let dataSource: 'google' | 'osm' = 'osm';

  // 1. Check for Google Places API Key (High fidelity Google Maps landmark coverage)
  const googleApiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleApiKey) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=2000&language=id&key=${googleApiKey}`;
      const gRes = await fetch(gUrl, { next: { revalidate: 300 } });

      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.status === 'OK' && Array.isArray(gData.results) && gData.results.length > 0) {
          dataSource = 'google';
          for (const item of gData.results as GooglePlaceItem[]) {
            const pLat = item.geometry?.location?.lat;
            const pLon = item.geometry?.location?.lng;
            if (!pLat || !pLon || !item.name) continue;

            const dist = getDistanceInMeters(lat, lon, pLat, pLon);
            const { category, categoryLabel } = mapGoogleTypesToCategory(item.types);

            const rtrwMatch = extractRTRWFromText(`${item.name} ${item.vicinity || ''}`);

            places.push({
              id: `google-${item.place_id}`,
              name: item.name,
              category,
              categoryLabel,
              latitude: pLat,
              longitude: pLon,
              distanceMeters: dist,
              street: item.vicinity,
              source: 'google',
              detectedRTRW: rtrwMatch
                ? {
                    rt: rtrwMatch.rt,
                    rw: rtrwMatch.rw,
                    source: item.name,
                  }
                : undefined,
              fullAddress: item.vicinity || item.name,
            });
          }
        }
      }
    } catch (gErr) {
      console.warn('Google Places API call failed, falling back to OSM:', gErr);
    }
  }

  // 2. Fallback / Default: Enhanced OpenStreetMap (Nominatim Multi-Anchor Search)
  if (places.length === 0) {
    try {
      // Expanded viewbox of ~2.2 km (delta 0.02)
      const delta = 0.02;
      const minLon = (lon - delta).toFixed(5);
      const maxLon = (lon + delta).toFixed(5);
      const minLat = (lat - delta).toFixed(5);
      const maxLat = (lat + delta).toFixed(5);

      // Multi-anchor queries tailored to Indonesian settlements
      const baseQueries = [
        'sdn',
        'smp',
        'sma',
        'madrasah',
        'sekolah',
        'puskesmas',
        'klinik',
        'apotek',
        'masjid',
        'mushola',
        'kantor desa',
        'balai desa',
        'posyandu',
        'pos ronda',
        'pos kamling',
        'balai rw',
        'indomaret',
        'alfamart',
        'spbu',
        'pasar',
      ];

      // If district, regency, or village is known, add contextual high-confidence anchor queries
      const contextualQueries: string[] = [];
      if (district) {
        contextualQueries.push(`Puskesmas ${district}`);
        contextualQueries.push(`Kecamatan ${district}`);
        contextualQueries.push(`Masjid ${district}`);
        contextualQueries.push(`SDN ${district}`);
        if (regency) {
          contextualQueries.push(`Puskesmas ${district} ${regency}`);
        }
      }
      if (village) {
        contextualQueries.push(`Kantor Desa ${village}`);
        contextualQueries.push(`Balai Desa ${village}`);
        contextualQueries.push(`SDN ${village}`);
      }

      const combinedQueries = baseQueries.concat(contextualQueries);
      const allQueries = Array.from(new Set(combinedQueries));

      // Run parallel queries with Promise.allSettled
      const searchPromises = allQueries.map(async (query) => {
        // Omitting bounded=1 allows finding points in viewbox without exact-string-only boundary rejections
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          query
        )}&viewbox=${minLon},${maxLat},${maxLon},${minLat}&countrycodes=id&limit=4&addressdetails=1&accept-language=id`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'AlamatKu-Web/1.0 (https://alamatku.app)',
          },
          next: { revalidate: 600 },
        });

        if (res.ok) {
          return (await res.json()) as NominatimSearchItem[];
        }
        return [];
      });

      const settledResults = await Promise.allSettled(searchPromises);
      const flatResults: NominatimSearchItem[] = [];

      for (const res of settledResults) {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          flatResults.push(...res.value);
        }
      }

      const seenKeys = new Set<string>();

      for (const item of flatResults) {
        const pLat = parseFloat(item.lat);
        const pLon = parseFloat(item.lon);
        if (isNaN(pLat) || isNaN(pLon)) continue;

        const dist = getDistanceInMeters(lat, lon, pLat, pLon);
        // Only include POIs within 2,800m (2.8 km radius)
        if (dist > 2800) continue;

        let name = item.name || '';
        if (!name || name === 'SDN' || name === 'Masjid' || name === 'Mushola' || name === 'Klinik') {
          // Enrich generic names with road or village name
          const subLocation = item.address?.village || item.address?.suburb || item.address?.road || '';
          if (subLocation && name) {
            name = `${name} (${subLocation})`;
          } else {
            name = item.display_name?.split(',')[0] || name;
          }
        }

        if (!name) continue;

        // Proximity-based deduplication key (~20m)
        const key = `${name.toLowerCase().trim()}-${Math.round(pLat * 1000)}-${Math.round(pLon * 1000)}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        const id = String(item.place_id || item.osm_id || Math.random());
        const fullDisplay = item.display_name || '';
        const { category, categoryLabel } = classifyOSMPlace(name, item.type);

        const textToScan = [
          item.address?.city_block,
          name,
          fullDisplay,
        ].filter(Boolean).join(' ');

        const foundRTRW = extractRTRWFromText(textToScan);

        places.push({
          id,
          name,
          category,
          categoryLabel,
          latitude: pLat,
          longitude: pLon,
          distanceMeters: dist,
          street: item.address?.road || item.address?.street || item.address?.village,
          source: 'osm',
          detectedRTRW: foundRTRW
            ? {
                rt: foundRTRW.rt,
                rw: foundRTRW.rw,
                source: name,
              }
            : undefined,
          fullAddress: fullDisplay,
        });
      }
    } catch (osmErr) {
      console.error('OSM nearby search error:', osmErr);
    }
  }

  // Sort strictly by proximity (closest first)
  places.sort((a, b) => a.distanceMeters - b.distanceMeters);

  // Take top 25 most relevant places
  const finalPlaces = places.slice(0, 25);

  // Find places that have RT/RW hints
  const rtrwPlaces = finalPlaces.filter(
    (p) => p.detectedRTRW && (p.detectedRTRW.rt || p.detectedRTRW.rw)
  );
  const placeWithRTRW = rtrwPlaces[0];

  return NextResponse.json({
    dataSource,
    places: finalPlaces,
    suggestedRTRW: placeWithRTRW?.detectedRTRW
      ? {
          rt: placeWithRTRW.detectedRTRW.rt || '',
          rw: placeWithRTRW.detectedRTRW.rw || '',
          source: placeWithRTRW.name,
          distanceMeters: placeWithRTRW.distanceMeters,
        }
      : null,
    rtrwCandidates: rtrwPlaces.map((p) => ({
      rt: p.detectedRTRW!.rt || '',
      rw: p.detectedRTRW!.rw || '',
      source: p.name,
      distanceMeters: p.distanceMeters,
    })),
  });
}
