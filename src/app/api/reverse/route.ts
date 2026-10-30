import { NextRequest, NextResponse } from 'next/server';
import { NominatimReverseResponse } from '@/types/address';

interface BigDataCloudResponse {
  latitude: number;
  longitude: number;
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  postcode?: string;
  countryName?: string;
  localityInfo?: {
    administrative?: Array<{
      name: string;
      adminLevel?: number;
      description?: string;
    }>;
    informative?: Array<{
      name: string;
      order?: number;
      description?: string;
    }>;
  };
}

interface GoogleGeocodeResponse {
  status: string;
  results?: Array<{
    formatted_address: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Parameter lat dan lon harus diisi.' },
      { status: 400 }
    );
  }

  // 1. If Google Maps API key is configured, try Google Geocoding first (high accuracy, no 1req/s rate limit)
  const googleApiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleApiKey) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
        lat
      )},${encodeURIComponent(lon)}&language=id&key=${googleApiKey}`;

      const gRes = await fetch(gUrl, {
        signal: AbortSignal.timeout(3500),
        next: { revalidate: 300 },
      });

      if (gRes.ok) {
        const gData = (await gRes.json()) as GoogleGeocodeResponse;
        if (gData.status === 'OK' && gData.results && gData.results.length > 0) {
          const top = gData.results[0];
          const comps = top.address_components || [];

          const getComp = (type: string) =>
            comps.find((c) => c.types.includes(type))?.long_name || '';

          const road = getComp('route');
          const houseNo = getComp('street_number');
          const kelurahan =
            getComp('administrative_area_level_4') ||
            getComp('sublocality_level_1') ||
            getComp('sublocality');
          const kecamatan =
            getComp('administrative_area_level_3') ||
            getComp('locality');
          const kota =
            getComp('administrative_area_level_2');
          const provinsi =
            getComp('administrative_area_level_1');
          const postcode = getComp('postal_code');

          const mapped: NominatimReverseResponse = {
            place_id: 111111,
            lat,
            lon,
            display_name: top.formatted_address,
            address: {
              road: houseNo ? `${road} No. ${houseNo}` : road,
              village: kelurahan,
              suburb: kelurahan,
              city_district: kecamatan,
              county: kota,
              city: kota,
              state: provinsi,
              postcode,
              country: 'Indonesia',
              country_code: 'id',
            },
          };

          return NextResponse.json(mapped);
        }
      }
    } catch (gErr) {
      console.warn('Google reverse geocode error, fallback to OSM:', gErr);
    }
  }

  // 2. Primary Free Engine: OpenStreetMap Nominatim with retry
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&addressdetails=1&accept-language=id`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AlamatKu-Web/1.0 (https://alamatku.app; contact@alamatku.app)',
        'Accept-Language': 'id, en',
      },
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 60 },
    });

    if (response.ok) {
      const data = await response.json();
      if (!data.error) {
        return NextResponse.json(data);
      }
    }
    console.warn(`Nominatim reverse returned status ${response.status}, triggering resilient fallback...`);
  } catch (osmErr) {
    console.warn('Nominatim reverse error/timeout, triggering resilient fallback:', osmErr);
  }

  // 3. Resilient Secondary Fallback: BigDataCloud Reverse Geocoding (Free, instant, 0 rate limit block)
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(lon)}&localityLanguage=id`;

    const bdcRes = await fetch(bdcUrl, {
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 300 },
    });

    if (bdcRes.ok) {
      const bdData = (await bdcRes.json()) as BigDataCloudResponse;
      const adminList = bdData.localityInfo?.administrative || [];
      const informList = bdData.localityInfo?.informative || [];

      const stateItem = adminList.find((a) => a.adminLevel === 4);
      const countyItem = adminList.find((a) => a.adminLevel === 5);
      const districtItem =
        adminList.find((a) => a.adminLevel === 6) ||
        informList.find((i) => i.description?.toLowerCase().includes('kecamatan'));
      const villageItem =
        bdData.locality ||
        adminList.find((a) => a.adminLevel === 7)?.name ||
        '';

      const roadItem =
        informList.find((i) => i.description?.toLowerCase().includes('jalan'))?.name || '';

      const displayNameParts = [
        roadItem,
        villageItem,
        districtItem?.name,
        countyItem?.name,
        stateItem?.name || bdData.principalSubdivision,
        'Indonesia',
      ].filter(Boolean);

      const fallbackMapped: NominatimReverseResponse = {
        place_id: 888888,
        lat,
        lon,
        display_name: displayNameParts.join(', '),
        address: {
          road: roadItem,
          village: villageItem,
          suburb: villageItem,
          city_district: districtItem?.name || bdData.city || '',
          county: countyItem?.name || bdData.city || '',
          city: countyItem?.name || bdData.city || '',
          state: stateItem?.name || bdData.principalSubdivision || '',
          postcode: bdData.postcode || '',
          country: 'Indonesia',
          country_code: 'id',
        },
      };

      return NextResponse.json(fallbackMapped);
    }
  } catch (bdcErr) {
    console.warn('BigDataCloud reverse geocode fallback failed:', bdcErr);
  }

  return NextResponse.json(
    { error: 'Layanan geocoding sementara tidak dapat dihubungi. Silakan geser pin pada peta.' },
    { status: 500 }
  );
}
