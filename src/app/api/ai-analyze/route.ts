import { NextRequest, NextResponse } from 'next/server';
import {
  AddressData,
  AIAddressAnalysis,
  NearbyPlace,
  CommunityRTRWContribution,
  OfficialVillageCandidate,
} from '@/types/address';
import { formatSingleLineAddress } from '@/utils/addressParser';
import { getOfficialVillagesForDistrict } from '@/utils/kemendagri';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'kemendagri-referee',
    hasServerKey: !!process.env.GEMINI_API_KEY,
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
      apiKey = '',
      engine = 'smart',
    } = body as {
      address: AddressData;
      nearbyPlaces?: NearbyPlace[];
      communityRTRW?: CommunityRTRWContribution[];
      userNotes?: string;
      apiKey?: string;
      engine?: 'smart' | 'gemini';
    };

    if (!address) {
      return NextResponse.json({ error: 'Data alamat diperlukan.' }, { status: 400 });
    }

    // 1. Fetch official Kemendagri village candidates for this district
    let officialCandidates: OfficialVillageCandidate[] = [];
    try {
      const officialData = await getOfficialVillagesForDistrict(
        address.kecamatan,
        address.kota,
        address.provinsi,
        address.latitude,
        address.longitude
      );
      officialCandidates = officialData?.villages || [];
    } catch (kemendagriErr) {
      console.warn('Failed to load official Kemendagri villages:', kemendagriErr);
    }

    const effectiveKey = apiKey || process.env.GEMINI_API_KEY || '';
    let refereeResult: {
      selectedVillage: string;
      explanation: string;
      confidenceScore: number;
      source: 'gemini' | 'smart_referee';
    } | null = null;

    // 2. Only invoke Gemini if user specifically requested 'gemini' mode or provided apiKey
    const shouldRunGemini =
      (engine === 'gemini' || !!apiKey) && !!effectiveKey && officialCandidates.length > 0;

    if (shouldRunGemini) {
      try {
        const geminiDecision = await callGeminiReferee(
          effectiveKey,
          address,
          officialCandidates,
          nearbyPlaces,
          userNotes
        );
        if (geminiDecision) {
          refereeResult = {
            ...geminiDecision,
            source: 'gemini',
          };
        }
      } catch (geminiErr) {
        console.warn('Gemini referee timed out or errored, fallback to smart referee:', geminiErr);
      }
    }

    // 3. Fallback to Built-in Smart Kemendagri Referee (Instant, local, zero-hang)
    if (!refereeResult) {
      const smartDecision = runSmartReferee(
        officialCandidates,
        nearbyPlaces,
        address.kecamatan,
        address.kelurahan
      );
      refereeResult = {
        ...smartDecision,
        source: 'smart_referee',
      };
    }

    // 4. Run full analysis with verified official village
    const analysis = runHeuristicEngine(
      address,
      nearbyPlaces,
      communityRTRW,
      userNotes,
      officialCandidates,
      refereeResult
    );

    return NextResponse.json(analysis);
  } catch (err: unknown) {
    console.error('AI analyze error:', err);
    return NextResponse.json(
      { error: 'Gagal menganalisis alamat dengan Wasit AI.' },
      { status: 500 }
    );
  }
}

async function callGeminiReferee(
  key: string,
  address: AddressData,
  candidates: OfficialVillageCandidate[],
  nearbyPlaces: NearbyPlace[],
  userNotes: string
): Promise<{ selectedVillage: string; explanation: string; confidenceScore: number } | null> {
  const prompt = `Anda adalah Wasit Validasi Wilayah Resmi Pos Indonesia.
Tugas Anda adalah MEMILIH 1 Desa/Kelurahan yang paling tepat dari DAFTAR RESMI KEMENDAGRI berikut.
DILARANG KERAS MENGARANG ATAU MEMILIH NAMA DI LUAR DAFTAR RESMI INI!

Kecamatan: ${address.kecamatan}
Kabupaten/Kota: ${address.kota}
Provinsi: ${address.provinsi}
Koordinat: ${address.latitude}, ${address.longitude}

Daftar Desa/Kelurahan Resmi Kemendagri di Kecamatan ${address.kecamatan}:
${candidates
  .map(
    (c, i) =>
      `${i + 1}. ${c.name} (${
        c.distanceMeters != null
          ? `±${(c.distanceMeters / 1000).toFixed(1)} km dari titik`
          : 'Jarak pusat tidak diketahui'
      }${c.isNearest ? ' - Pusat Desa Terdekat' : ''})`
  )
  .join('\n')}

Fasilitas & Tempat Sekitar:
${nearbyPlaces.slice(0, 5).map((p) => `- ${p.name} (${p.categoryLabel}, ±${p.distanceMeters}m)`).join('\n') || 'Tidak ada data'}

Catatan Pengguna: ${userNotes || 'Tidak ada'}

Instruksi Wasit:
1. Pilih SATU nama desa yang PERSIS sama dengan salah satu nama di Daftar Resmi Kemendagri di atas.
2. Utamakan desa dengan jarak terdekat atau yang paling didukung bukti fasilitas/sekolah sekitar.
3. Kembalikan HANYA format JSON valid tanpa markdown code block:
{
  "selectedVillage": "Nama Desa Persis Dari Daftar",
  "confidenceScore": number (85-99),
  "explanation": "Alasan singkat pemilihan desa berdasarkan jarak/fasilitas"
}`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        method: 'POST',
        signal: AbortSignal.timeout(3500), // Strict 3.5s timeout!
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': key.trim(),
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) return null;
    const json = await response.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    // Hard Whitelist Enforcement: must match one of the official Kemendagri candidates
    const match = candidates.find(
      (c) => c.name.toLowerCase() === (parsed.selectedVillage || '').toLowerCase().trim()
    );

    if (!match) {
      // Hallucination outside Kemendagri list rejected!
      return null;
    }

    return {
      selectedVillage: match.name,
      explanation: parsed.explanation || `Divalidasi dari daftar resmi Kemendagri oleh Wasit AI.`,
      confidenceScore: parsed.confidenceScore || 95,
    };
  } catch (err) {
    console.warn('Gemini referee network error/timeout:', err);
    return null;
  }
}

function runSmartReferee(
  candidates: OfficialVillageCandidate[],
  nearbyPlaces: NearbyPlace[],
  districtName: string,
  fallbackVillage: string = ''
): { selectedVillage: string; explanation: string; confidenceScore: number } {
  if (candidates.length === 0) {
    return {
      selectedVillage: fallbackVillage || '',
      explanation: fallbackVillage
        ? `Menggunakan nama '${fallbackVillage}' dari data geocoding wilayah.`
        : 'Wilayah terkonfirmasi di tingkat kecamatan.',
      confidenceScore: 85,
    };
  }

  // 1. Check if any candidate's name is mentioned in nearby POIs (e.g. "SDN 1 Kondangsari")
  for (const c of candidates) {
    const poiMatch = nearbyPlaces.find((p) =>
      p.name.toLowerCase().includes(c.name.toLowerCase())
    );
    if (poiMatch) {
      return {
        selectedVillage: c.name,
        explanation: `Wasit AI mencocokkan desa resmi '${c.name}' dari fasilitas sekitar (${poiMatch.name}).`,
        confidenceScore: 98,
      };
    }
  }

  // 2. Select the nearest official candidate by spatial distance
  const nearest = candidates.find((c) => c.isNearest) || candidates[0];
  const distText =
    nearest.distanceMeters != null
      ? ` (±${(nearest.distanceMeters / 1000).toFixed(1)} km dari titik)`
      : '';

  return {
    selectedVillage: nearest.name,
    explanation: `Wasit AI memilih '${nearest.name}' dari ${candidates.length} desa resmi Kemendagri di Kec. ${districtName} berdasarkan pusat desa terdekat${distText}.`,
    confidenceScore: 95,
  };
}

// Built-in intelligent heuristic engine
function runHeuristicEngine(
  address: AddressData,
  nearbyPlaces: NearbyPlace[],
  communityRTRW: CommunityRTRWContribution[],
  userNotes: string,
  officialCandidates: OfficialVillageCandidate[],
  refereeResult: {
    selectedVillage: string;
    explanation: string;
    confidenceScore: number;
    source: 'gemini' | 'smart_referee';
  }
): AIAddressAnalysis {
  const jalan = address.jalan;
  let rt = address.rt;
  let rw = address.rw;
  let kelurahan = refereeResult.selectedVillage || address.kelurahan;
  const kecamatan = address.kecamatan;
  const kota = address.kota;
  const provinsi = address.provinsi;
  const kodePos = address.kodePos;
  let patokan = address.patokan;

  let confidenceScore = refereeResult.confidenceScore;
  const explanationParts: string[] = [refereeResult.explanation];
  let detectedFromPOIs: AIAddressAnalysis['detectedFromPOIs'] | undefined;

  // Clean if kelurahan is identical to jalan
  if (kelurahan && jalan && kelurahan.toLowerCase() === jalan.toLowerCase()) {
    kelurahan = refereeResult.selectedVillage || '';
  }

  // 1. If RT/RW is empty, check nearby places or community
  if (!rt && !rw) {
    // Check nearby community data first
    if (communityRTRW.length > 0 && communityRTRW[0].rt && communityRTRW[0].rw) {
      rt = communityRTRW[0].rt;
      rw = communityRTRW[0].rw;
      explanationParts.push(
        `Mengisi RT ${rt} / RW ${rw} dari kontribusi warga sekitar (±${communityRTRW[0].distanceMeters}m).`
      );
      confidenceScore = Math.min(confidenceScore + 3, 99);
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
        confidenceScore = Math.min(confidenceScore + 3, 99);
      }
    }
  }

  // 2. Build optimized courier patokan from nearest landmark
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
    aiSource: refereeResult.source === 'gemini' ? 'gemini' : 'heuristic_engine',
    explanation: explanationParts.join(' '),
    deliveryAdvice:
      'Gunakan format ini untuk memesan paket di Shopee atau Tokopedia. Pastikan memilih Kecamatan terlebih dahulu saat memasukkan alamat baru.',
    hierarchyVerified: true,
    detectedFromPOIs,
    officialCandidates,
    refereeDecision: {
      selectedVillage: refereeResult.selectedVillage,
      reason: refereeResult.explanation,
      wasitSource: refereeResult.source,
    },
    hasServerKey: !!process.env.GEMINI_API_KEY,
  };
}
