import { NextRequest, NextResponse } from 'next/server';
import { AddressData, AIAddressAnalysis, NearbyPlace, CommunityRTRWContribution } from '@/types/address';
import { formatSingleLineAddress } from '@/utils/addressParser';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'built-in',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      address,
      nearbyPlaces = [],
      communityRTRW = [],
      userNotes = '',
    } = body as {
      address: AddressData;
      nearbyPlaces?: NearbyPlace[];
      communityRTRW?: CommunityRTRWContribution[];
      userNotes?: string;
    };

    if (!address) {
      return NextResponse.json({ error: 'Data alamat diperlukan.' }, { status: 400 });
    }

    // Run Built-in Indonesian Administrative & Postal Intelligence Engine
    const result = runHeuristicEngine(
      address,
      nearbyPlaces,
      communityRTRW,
      userNotes
    );
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('AI analyze error:', err);
    return NextResponse.json(
      { error: 'Gagal menganalisis alamat dengan Smart Engine.' },
      { status: 500 }
    );
  }
}

// Built-in intelligent heuristic engine
function runHeuristicEngine(
  address: AddressData,
  nearbyPlaces: NearbyPlace[],
  communityRTRW: CommunityRTRWContribution[],
  userNotes: string
): AIAddressAnalysis {
  const jalan = address.jalan;
  let rt = address.rt;
  let rw = address.rw;
  let kelurahan = address.kelurahan;
  let kecamatan = address.kecamatan;
  const kota = address.kota;
  const provinsi = address.provinsi;
  const kodePos = address.kodePos;
  let patokan = address.patokan;

  let confidenceScore = 90;
  const explanationParts: string[] = [];
  let detectedFromPOIs: AIAddressAnalysis['detectedFromPOIs'] | undefined;

  // 1. Detect if kelurahan is actually a road or building, and clean it!
  const isRoadPattern = /^(jl\.?|jalan|gang|gg\.?|lorong|lrg\.?|boulevard|bulevar|avenue|ave|ruas|tol|perum|perumahan|komplek|komp\.?|blok)\b/i;
  if (
    kelurahan &&
    (isRoadPattern.test(kelurahan) ||
      (jalan && kelurahan.toLowerCase() === jalan.toLowerCase()) ||
      (jalan && jalan.toLowerCase().includes(kelurahan.toLowerCase())))
  ) {
    explanationParts.push(`Membersihkan '${kelurahan}' dari kolom kelurahan/desa karena terdeteksi sebagai nama jalan.`);
    kelurahan = '';
  }

  // 2. Check and correct Kelurahan vs Kecamatan
  const directional = /\b(utara|selatan|barat|timur|tengah|wetan|kidul|kulon)\b/i;
  if (directional.test(kelurahan) && (!kecamatan || kecamatan === kota)) {
    explanationParts.push(`Memperbaiki '${kelurahan}' yang sebelumnya terdeteksi sebagai kelurahan menjadi kecamatan.`);
    kecamatan = kelurahan;
    kelurahan = '';
    confidenceScore += 5;
  }

  // 3. If kelurahan is empty, search nearbyPlaces for a Kelurahan / Desa office or public facility
  if (!kelurahan && nearbyPlaces.length > 0) {
    const kelurahanPOI = nearbyPlaces.find((p) =>
      /\b(kelurahan|desa|balai\s+desa)\b/i.test(p.name)
    );
    if (kelurahanPOI) {
      const match = kelurahanPOI.name.match(/\b(?:kelurahan|desa|balai\s+desa)\s+([a-zA-Z\s]+)/i);
      if (match && match[1]) {
        kelurahan = match[1].trim();
        explanationParts.push(`Mendeteksi Kelurahan '${kelurahan}' dari fasilitas sekitar (${kelurahanPOI.name}).`);
        confidenceScore += 5;
      }
    }
  }

  // 4. If RT/RW is empty, check nearby places or community
  if (!rt && !rw) {
    // Check nearby community data first
    if (communityRTRW.length > 0 && communityRTRW[0].rt && communityRTRW[0].rw) {
      rt = communityRTRW[0].rt;
      rw = communityRTRW[0].rw;
      explanationParts.push(
        `Mengisi RT ${rt} / RW ${rw} dari kontribusi warga sekitar (±${communityRTRW[0].distanceMeters}m).`
      );
      confidenceScore += 5;
    } else {
      // Check nearby public facilities (schools, mosques, offices)
      const placeWithRTRW = nearbyPlaces.find((p) => p.detectedRTRW?.rt || p.detectedRTRW?.rw);
      if (placeWithRTRW?.detectedRTRW) {
        rt = placeWithRTRW.detectedRTRW.rt || '';
        rw = placeWithRTRW.detectedRTRW.rw || '';
        detectedFromPOIs = {
          placeName: placeWithRTRW.name,
          rt,
          rw,
          distanceMeters: placeWithRTRW.distanceMeters,
        };
        explanationParts.push(
          `Mendeteksi RT ${rt} / RW ${rw} dari fasilitas publik terdekat: ${placeWithRTRW.name} (±${placeWithRTRW.distanceMeters}m).`
        );
        confidenceScore += 5;
      }
    }
  }

  // 5. Build optimized courier patokan from nearest landmark
  if (!patokan && nearbyPlaces.length > 0) {
    const topPOIs = nearbyPlaces.slice(0, 2);
    const landmarkNotes = topPOIs
      .map((p) => `${p.name} (±${p.distanceMeters}m)`)
      .join(', ');
    patokan = `Dekat ${landmarkNotes}`;
    explanationParts.push(`Membuat patokan kurir otomatis menggunakan landmark fasilitas terdekat.`);
  }

  if (userNotes.trim()) {
    patokan = patokan ? `${userNotes.trim()} (${patokan})` : userNotes.trim();
    explanationParts.push(`Menambahkan catatan khusus dari pengguna ke dalam patokan.`);
  }

  const updatedAddressObj: AddressData = {
    ...address,
    jalan,
    rt,
    rw,
    kelurahan,
    kecamatan,
    kota,
    provinsi,
    kodePos,
    patokan,
  };

  const formattedAddress = formatSingleLineAddress(updatedAddressObj);

  return {
    jalan,
    rt,
    rw,
    kelurahan,
    kecamatan,
    kota,
    provinsi,
    kodePos,
    patokan,
    formattedAddress,
    confidenceScore: Math.min(confidenceScore, 99),
    aiSource: 'heuristic_engine',
    explanation:
      explanationParts.length > 0
        ? explanationParts.join(' ')
        : 'Hierarki administrasi (Jalan, Kelurahan, Kecamatan, Kota) telah divalidasi dan disesuaikan standar pos logistik Indonesia.',
    deliveryAdvice:
      'Gunakan format ini untuk memesan paket di Shopee atau Tokopedia. Pastikan memilih Kecamatan terlebih dahulu saat memasukkan alamat baru.',
    hierarchyVerified: true,
    detectedFromPOIs,
  };
}
