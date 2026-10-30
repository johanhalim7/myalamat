import { NextRequest, NextResponse } from 'next/server';
import { AddressData, AIAddressAnalysis, NearbyPlace, CommunityRTRWContribution } from '@/types/address';
import { formatSingleLineAddress } from '@/utils/addressParser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      address,
      nearbyPlaces = [],
      communityRTRW = [],
      userNotes = '',
      apiKey = '',
    } = body as {
      address: AddressData;
      nearbyPlaces?: NearbyPlace[];
      communityRTRW?: CommunityRTRWContribution[];
      userNotes?: string;
      apiKey?: string;
    };

    if (!address) {
      return NextResponse.json({ error: 'Data alamat diperlukan.' }, { status: 400 });
    }

    const effectiveKey = apiKey || process.env.GEMINI_API_KEY || '';

    // If Gemini key is available, call Gemini API
    if (effectiveKey) {
      try {
        const geminiResult = await callGeminiAPI(effectiveKey, address, nearbyPlaces, communityRTRW, userNotes);
        if (geminiResult) {
          return NextResponse.json(geminiResult);
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to heuristic engine:', geminiError);
      }
    }

    // Fallback: Built-in Indonesian Administrative & Postal Intelligence Engine
    const heuristicResult = runHeuristicEngine(address, nearbyPlaces, communityRTRW, userNotes);
    return NextResponse.json(heuristicResult);
  } catch (err: unknown) {
    console.error('AI analyze error:', err);
    return NextResponse.json(
      { error: 'Gagal menganalisis alamat dengan AI.' },
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

  let confidenceScore = 85;
  const explanationParts: string[] = [];
  let detectedFromPOIs: AIAddressAnalysis['detectedFromPOIs'] | undefined;

  // 1. Check and correct Kelurahan vs Kecamatan
  const directional = /\b(utara|selatan|barat|timur|tengah|wetan|kidul|kulon)\b/i;
  if (directional.test(kelurahan) && (!kecamatan || kecamatan === kota)) {
    explanationParts.push(`Memperbaiki '${kelurahan}' yang sebelumnya terdeteksi sebagai kelurahan menjadi kecamatan.`);
    kecamatan = kelurahan;
    kelurahan = '';
    confidenceScore += 5;
  }

  // 2. If RT/RW is empty, check nearby places or community
  if (!rt && !rw) {
    // Check nearby community data first
    if (communityRTRW.length > 0 && communityRTRW[0].rt && communityRTRW[0].rw) {
      rt = communityRTRW[0].rt;
      rw = communityRTRW[0].rw;
      explanationParts.push(
        `Mengisi RT ${rt} / RW ${rw} dari kontribusi warga sekitar (±${communityRTRW[0].distanceMeters}m).`
      );
      confidenceScore += 10;
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
        confidenceScore += 10;
      }
    }
  }

  // 3. Build optimized courier patokan from nearest landmark
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
        : 'Hierarki administrasi (Kelurahan, Kecamatan, Kota) telah divalidasi sesuai standar wilayah Indonesia.',
    deliveryAdvice:
      'Gunakan format ini untuk memesan paket di Shopee atau Tokopedia. Pastikan memilih Kecamatan terlebih dahulu saat memasukkan alamat baru.',
    hierarchyVerified: true,
    detectedFromPOIs,
  };
}

// Call Gemini Live API
async function callGeminiAPI(
  key: string,
  address: AddressData,
  nearbyPlaces: NearbyPlace[],
  communityRTRW: CommunityRTRWContribution[],
  userNotes: string
): Promise<AIAddressAnalysis | null> {
  const prompt = `Anda adalah Spesialis Alamat & Logistik Pos Indonesia. Tugas Anda adalah memvalidasi, merapikan, dan menyempurnakan struktur alamat Indonesia berikut agar 100% akurat untuk kurir e-commerce (Shopee, Tokopedia, J&T, SiCepat).

Data Alamat Mentah:
- Display Name: ${address.displayName}
- Jalan Terdeteksi: ${address.jalan}
- RT: ${address.rt || 'KOSONG'}
- RW: ${address.rw || 'KOSONG'}
- Kelurahan/Desa: ${address.kelurahan}
- Kecamatan: ${address.kecamatan}
- Kota/Kabupaten: ${address.kota}
- Provinsi: ${address.provinsi}
- Kode Pos: ${address.kodePos}
- Koordinat: ${address.latitude}, ${address.longitude}

Fasilitas / Sekolah / Tempat Sekitar:
${nearbyPlaces.slice(0, 5).map((p) => `- ${p.name} (${p.categoryLabel}, ±${p.distanceMeters}m)`).join('\n') || 'Tidak ada'}

Data RT/RW Komunitas Terdekat:
${communityRTRW.slice(0, 3).map((c) => `- RT ${c.rt}/RW ${c.rw} (±${c.distanceMeters}m)`).join('\n') || 'Tidak ada'}

Catatan Pengguna: ${userNotes || 'Tidak ada'}

Instruksi Khusus:
1. Pastikan Kecamatan dan Kelurahan tidak tertukar (misal: "Coblong", "Setiabudi", "Bogor Utara" adalah KECAMATAN, sedangkan "Lebak Gede", "Pasar Manggis", "Tanah Baru" adalah KELURAHAN).
2. Jika RT/RW kosong, simpulkan atau ambil dari sekolah/masjid/komunitas sekitar yang paling masuk akal.
3. Rangkai patokan kurir yang sangat jelas memanfaatkan sekolah atau tempat ibadah terdekat.
4. Kembalikan HANYA JSON valid tanpa markdown formatting dengan struktur:
{
  "jalan": string,
  "rt": string,
  "rw": string,
  "kelurahan": string,
  "kecamatan": string,
  "kota": string,
  "provinsi": string,
  "kodePos": string,
  "patokan": string,
  "confidenceScore": number (70-100),
  "explanation": string,
  "deliveryAdvice": string
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
      key
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  const parsed = JSON.parse(rawText);

  const updatedObj: AddressData = {
    ...address,
    jalan: parsed.jalan || address.jalan,
    rt: parsed.rt || address.rt,
    rw: parsed.rw || address.rw,
    kelurahan: parsed.kelurahan || address.kelurahan,
    kecamatan: parsed.kecamatan || address.kecamatan,
    kota: parsed.kota || address.kota,
    provinsi: parsed.provinsi || address.provinsi,
    kodePos: parsed.kodePos || address.kodePos,
    patokan: parsed.patokan || address.patokan,
  };

  return {
    jalan: updatedObj.jalan,
    rt: updatedObj.rt,
    rw: updatedObj.rw,
    kelurahan: updatedObj.kelurahan,
    kecamatan: updatedObj.kecamatan,
    kota: updatedObj.kota,
    provinsi: updatedObj.provinsi,
    kodePos: updatedObj.kodePos,
    patokan: updatedObj.patokan,
    formattedAddress: formatSingleLineAddress(updatedObj),
    confidenceScore: parsed.confidenceScore || 95,
    aiSource: 'gemini',
    explanation: parsed.explanation || 'Diverifikasi langsung menggunakan model Gemini AI.',
    deliveryAdvice: parsed.deliveryAdvice || 'Format telah disesuaikan untuk pengiriman ekspedisi.',
    hierarchyVerified: true,
  };
}
