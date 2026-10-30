import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.trim().length < 3) {
    return NextResponse.json([]);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      q.trim()
    )}&countrycodes=id&limit=6&addressdetails=1&accept-language=id`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AlamatKu-Web/1.0 (https://alamatku.app; contact@alamatku.app)',
        'Accept-Language': 'id, en',
      },
      next: { revalidate: 300 }, // Cache search for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Search geocode error:', error);
    const message = error instanceof Error ? error.message : 'Gagal mencari lokasi.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
