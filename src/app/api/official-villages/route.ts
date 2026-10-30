import { NextRequest, NextResponse } from 'next/server';
import { getOfficialVillagesForDistrict } from '@/utils/kemendagri';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district') || '';
  const regency = searchParams.get('regency') || '';
  const province = searchParams.get('province') || '';
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');

  if (!district) {
    return NextResponse.json(
      { error: 'Parameter district diperlukan.' },
      { status: 400 }
    );
  }

  const lat = latStr ? parseFloat(latStr) : null;
  const lon = lonStr ? parseFloat(lonStr) : null;

  try {
    const data = await getOfficialVillagesForDistrict(
      district,
      regency,
      province,
      lat,
      lon
    );

    if (!data) {
      return NextResponse.json({
        district,
        regency,
        villages: [],
      });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Official villages route error:', error);
    const message = error instanceof Error ? error.message : 'Gagal memuat data desa resmi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
