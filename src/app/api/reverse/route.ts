import { NextRequest, NextResponse } from 'next/server';

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

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&addressdetails=1&accept-language=id`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AlamatKu-Web/1.0 (https://alamatku.app; contact@alamatku.app)',
        'Accept-Language': 'id, en',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Reverse geocode error:', error);
    const message = error instanceof Error ? error.message : 'Gagal mengambil data alamat dari server peta.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
