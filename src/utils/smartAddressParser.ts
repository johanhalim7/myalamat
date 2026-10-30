import { AddressData } from '@/types/address';
import { formatSingleLineAddress } from './addressParser';

/**
 * Intelligent client-side Indonesian address parser.
 * Extracts Jalan, No, RT, RW, Kelurahan, Kecamatan, Kota, Provinsi, Kode Pos, Patokan from raw text.
 */
export function parseRawIndonesianAddress(rawText: string): Partial<AddressData> {
  const text = rawText.trim();
  const result: Partial<AddressData> = {
    jalan: '',
    rt: '',
    rw: '',
    kelurahan: '',
    kecamatan: '',
    kota: '',
    provinsi: '',
    kodePos: '',
    patokan: '',
  };

  // 1. Extract Postal Code (5 consecutive digits)
  const postcodeMatch = text.match(/\b([1-9]\d{4})\b/);
  if (postcodeMatch) {
    result.kodePos = postcodeMatch[1];
  }

  // 2. Extract RT & RW
  const rtMatch = text.match(/\bRT\.?\s*([0-9]{1,3})\b/i);
  if (rtMatch) {
    result.rt = rtMatch[1];
  }
  const rwMatch = text.match(/\bRW\.?\s*([0-9]{1,3})\b/i);
  if (rwMatch) {
    result.rw = rwMatch[1];
  }
  // Try composite RT/RW e.g. 03/05 or RT.03/05
  const compositeRTRW = text.match(/\b(?:RT\.?)?\s*([0-9]{1,3})\s*\/\s*(?:RW\.?)?\s*([0-9]{1,3})\b/i);
  if (compositeRTRW && (!result.rt || !result.rw)) {
    result.rt = compositeRTRW[1];
    result.rw = compositeRTRW[2];
  }

  // 3. Extract Kelurahan / Desa
  const kelMatch = text.match(/\b(?:Kelurahan|Kel\.|Desa)\s+([a-zA-Z0-9\s]+?)(?=,|\.|\bKecamatan\b|\bKec\b|\bKota\b|\bKab\b|\bRT\b|\bRW\b|$)/i);
  if (kelMatch) {
    result.kelurahan = kelMatch[1].trim();
  }

  // 4. Extract Kecamatan
  const kecMatch = text.match(/\b(?:Kecamatan|Kec\.)\s+([a-zA-Z0-9\s]+?)(?=,|\.|\bKota\b|\bKabupaten\b|\bKab\b|\bProvinsi\b|\bProv\b|\bKode\b|$)/i);
  if (kecMatch) {
    result.kecamatan = kecMatch[1].trim();
  }

  // 5. Extract Kota / Kabupaten
  const kotaMatch = text.match(/\b(?:Kota|Kabupaten|Kab\.)\s+([a-zA-Z0-9\s]+?)(?=,|\.|\bProvinsi\b|\bProv\b|\b[1-9]\d{4}\b|$)/i);
  if (kotaMatch) {
    result.kota = kotaMatch[1].trim();
  }

  // 6. Extract Patokan (sebelah / depan / samping / seberang / pagar / warna / dekat)
  const patokanMatch = text.match(/\b(?:patokan|sebelah|depan|samping|seberang|dekat|pagar)\s*[:\-]?\s*([a-zA-Z0-9\s]+?)(?=,|\.|$)/i);
  if (patokanMatch) {
    result.patokan = patokanMatch[0].trim();
  }

  // 7. Extract Jalan
  const jalanMatch = text.match(/\b(?:Jalan|Jl\.|Gg\.|Gang|Komplek|Komp\.|Perumahan|Perum)\s+([^,]+)/i);
  if (jalanMatch) {
    // Clean out RT/RW or other tags if captured in jalan
    let cleanJalan = jalanMatch[0]
      .replace(/\b(?:RT|RW)\b.*$/i, '')
      .replace(/\b(?:Kelurahan|Kel|Kecamatan|Kec)\b.*$/i, '')
      .trim();
    if (cleanJalan.endsWith(',')) cleanJalan = cleanJalan.slice(0, -1);
    result.jalan = cleanJalan;
  } else {
    // If no explicit "Jl." prefix found, use first sentence fragment
    const parts = text.split(/,|\n/);
    if (parts[0]) {
      result.jalan = parts[0].trim();
    }
  }

  return result;
}

export function applyParsedAddress(original: AddressData, parsed: Partial<AddressData>): AddressData {
  const merged: AddressData = {
    ...original,
    jalan: parsed.jalan || original.jalan,
    rt: parsed.rt || original.rt,
    rw: parsed.rw || original.rw,
    kelurahan: parsed.kelurahan || original.kelurahan,
    kecamatan: parsed.kecamatan || original.kecamatan,
    kota: parsed.kota || original.kota,
    provinsi: parsed.provinsi || original.provinsi,
    kodePos: parsed.kodePos || original.kodePos,
    patokan: parsed.patokan || original.patokan,
  };
  merged.formattedAddress = formatSingleLineAddress(merged);
  return merged;
}
