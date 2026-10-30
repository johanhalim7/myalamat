import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CommunityRTRWContribution } from '@/types/address';

const DATA_FILE = path.join(process.cwd(), 'data', 'community_rtrw.json');

function readContributions(): CommunityRTRWContribution[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading community RT/RW data:', err);
    return [];
  }
}

function writeContributions(data: CommunityRTRWContribution[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing community RT/RW data:', err);
  }
}

// Haversine formula to calculate distance in meters between two lat/lon points
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
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

// GET: Find nearest community RT/RW data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');
  const radiusStr = searchParams.get('radius') || '1000'; // Default radius 1km

  if (!latStr || !lonStr) {
    return NextResponse.json(
      { error: 'Parameter lat dan lon harus diisi.' },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  const maxRadius = parseFloat(radiusStr);

  const all = readContributions();

  // Calculate distance for each entry and filter within radius
  const withDistance = all
    .map((item) => {
      const distanceMeters = getDistanceInMeters(lat, lon, item.latitude, item.longitude);
      return { ...item, distanceMeters };
    })
    .filter((item) => item.distanceMeters <= maxRadius)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return NextResponse.json(withDistance);
}

// POST: Contribute a new RT/RW entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude, rt, rw, kelurahan, kecamatan, kota, catatan } = body;

    if (!latitude || !longitude || (!rt && !rw)) {
      return NextResponse.json(
        { error: 'Koordinat lokasi serta nomor RT atau RW wajib diisi.' },
        { status: 400 }
      );
    }

    const all = readContributions();

    // Check if duplicate entry already exists within 20 meters with same RT/RW
    const existing = all.find(
      (item) =>
        getDistanceInMeters(latitude, longitude, item.latitude, item.longitude) < 25 &&
        item.rt === rt &&
        item.rw === rw
    );

    if (existing) {
      existing.upvotes += 1;
      writeContributions(all);
      return NextResponse.json({
        message: 'Data serupa sudah ada. Jumlah konfirmasi berhasil ditambah!',
        contribution: existing,
      });
    }

    const newEntry: CommunityRTRWContribution = {
      id: `rtrw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      latitude: Number(latitude),
      longitude: Number(longitude),
      rt: String(rt).trim(),
      rw: String(rw).trim(),
      kelurahan: String(kelurahan || '').trim(),
      kecamatan: String(kecamatan || '').trim(),
      kota: String(kota || '').trim(),
      catatan: catatan ? String(catatan).trim() : undefined,
      upvotes: 1,
      downvotes: 0,
      createdAt: Date.now(),
    };

    all.push(newEntry);
    writeContributions(all);

    return NextResponse.json({
      message: 'Terima kasih! Kontribusi RT/RW Anda telah disimpan untuk membantu sesama.',
      contribution: newEntry,
    });
  } catch (err: unknown) {
    console.error('Error contributing RT/RW:', err);
    return NextResponse.json(
      { error: 'Gagal menyimpan kontribusi data RT/RW.' },
      { status: 500 }
    );
  }
}

// PUT: Vote (Upvote / Downvote)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || (action !== 'upvote' && action !== 'downvote')) {
      return NextResponse.json(
        { error: 'ID dan action (upvote/downvote) wajib diisi.' },
        { status: 400 }
      );
    }

    const all = readContributions();
    const target = all.find((item) => item.id === id);

    if (!target) {
      return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });
    }

    if (action === 'upvote') {
      target.upvotes += 1;
    } else {
      target.downvotes += 1;
    }

    writeContributions(all);

    return NextResponse.json({
      message: 'Vote berhasil dicatat.',
      target,
    });
  } catch (err: unknown) {
    console.error('Error voting on RT/RW:', err);
    return NextResponse.json({ error: 'Gagal memproses vote.' }, { status: 500 });
  }
}
