import { AddressData, NominatimReverseResponse } from '@/types/address';

export function parseNominatimToAddress(
  data: NominatimReverseResponse,
  lat: number,
  lon: number,
  accuracy: number | null = null
): AddressData {
  const addr = data.address || {};
  const displayName = data.display_name || '';

  // 1. Parse tokens from display_name (OSM hierarchical order in Indonesia)
  const rawParts = displayName
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  let parsedKelurahan = '';
  let parsedKecamatan = '';
  let parsedKota = '';
  let parsedProvinsi = '';
  let parsedKodePos = addr.postcode || '';
  let parsedRT = '';
  let parsedRW = '';

  // Scan for RT/RW in city_block or display_name tokens
  if (addr.city_block) {
    const rtrwMatch = addr.city_block.match(/(?:RT\.?\s*(\d+))?\s*(?:\/?\s*RW\.?\s*(\d+))?/i);
    if (rtrwMatch) {
      if (rtrwMatch[1]) parsedRT = rtrwMatch[1];
      if (rtrwMatch[2]) parsedRW = rtrwMatch[2];
    }
  }

  // Check display_name tokens for RT/RW (e.g. "RW 10", "RT 03/RW 05")
  for (const part of rawParts) {
    const rtMatch = part.match(/\bRT\.?\s*(\d{1,3})\b/i);
    if (rtMatch && !parsedRT) parsedRT = rtMatch[1];
    const rwMatch = part.match(/\bRW\.?\s*(\d{1,3})\b/i);
    if (rwMatch && !parsedRW) parsedRW = rwMatch[1];

    const compositeMatch = part.match(/\b(\d{1,3})\s*\/\s*(\d{1,3})\b/);
    if (compositeMatch && (!parsedRT || !parsedRW)) {
      if (!parsedRT) parsedRT = compositeMatch[1];
      if (!parsedRW) parsedRW = compositeMatch[2];
    }
  }

  // Road & House Number (extract first so we can differentiate roads from kelurahan)
  const roadName = addr.road || addr.street || addr.pedestrian || addr.residential || '';
  const houseNumber = addr.house_number || addr.building || '';
  let jalan = roadName;
  if (jalan && houseNumber && !jalan.includes(houseNumber)) {
    jalan = `${jalan} No. ${houseNumber}`;
  }

  // Work backwards from end of display_name
  const hierarchyParts = [...rawParts];
  if (hierarchyParts.length > 0 && hierarchyParts[hierarchyParts.length - 1].toLowerCase() === 'indonesia') {
    hierarchyParts.pop(); // Remove "Indonesia"
  }

  // Check for 5-digit postcode at the end
  if (hierarchyParts.length > 0 && /^[0-9]{5}$/.test(hierarchyParts[hierarchyParts.length - 1])) {
    parsedKodePos = hierarchyParts.pop() || parsedKodePos;
  }

  // Next is Provinsi
  if (hierarchyParts.length > 0) {
    parsedProvinsi = hierarchyParts.pop() || '';
  }

  // Next is Kota / Kabupaten
  if (hierarchyParts.length > 0) {
    parsedKota = hierarchyParts.pop() || '';
  }

  // Next is Kecamatan
  if (hierarchyParts.length > 0) {
    parsedKecamatan = hierarchyParts.pop() || '';
  }

  // Next candidate for Kelurahan / Desa
  if (hierarchyParts.length > 0) {
    const candidate = hierarchyParts.pop() || '';
    // Prevent taking road name, building, or street prefixes as Kelurahan!
    if (!isRoadOrBuilding(candidate, roadName)) {
      parsedKelurahan = candidate;
    }
  }

  // Cross-reference with Nominatim address object tags if present
  if (addr.state && !parsedProvinsi) parsedProvinsi = addr.state;
  if (addr.city || addr.regency || addr.municipality || addr.town) {
    const osmCity = addr.city || addr.regency || addr.municipality || addr.town || '';
    if (osmCity && !osmCity.toLowerCase().includes('indonesia')) {
      // In DKI Jakarta, addr.city is sometimes "DKI Jakarta" and addr.city_district is "Jakarta Selatan"
      if (osmCity.toLowerCase().includes('daerah khusus') || osmCity.toLowerCase().includes('dki')) {
        parsedProvinsi = osmCity;
        if (addr.city_district) parsedKota = addr.city_district;
      } else {
        parsedKota = osmCity;
      }
    }
  }

  // Check if kecamatan and kelurahan were swapped or misclassified by OSM
  // For instance, if kelurahan has directional keywords (Utara/Selatan/dll) and kecamatan is empty
  const directionalRegex = /\b(utara|selatan|barat|timur|tengah|wetan|kidul|kulon)\b/i;
  if (directionalRegex.test(parsedKelurahan) && (!parsedKecamatan || parsedKecamatan === parsedKota)) {
    parsedKecamatan = parsedKelurahan;
    parsedKelurahan = '';
  }

  // Fallbacks for Kecamatan if still empty
  if (!parsedKecamatan && (addr.district || addr.subdistrict || addr.city_district)) {
    parsedKecamatan = addr.district || addr.subdistrict || addr.city_district || '';
  }

  // Fallbacks for Kelurahan: check specific OSM address tags
  if (!parsedKelurahan) {
    if (addr.village && !isRoadOrBuilding(addr.village, roadName)) {
      parsedKelurahan = addr.village;
    } else if (addr.hamlet && !isRoadOrBuilding(addr.hamlet, roadName)) {
      parsedKelurahan = addr.hamlet;
    } else if (addr.suburb && addr.suburb !== parsedKecamatan && !isRoadOrBuilding(addr.suburb, roadName)) {
      parsedKelurahan = addr.suburb;
    } else if (addr.neighbourhood && addr.neighbourhood !== parsedKecamatan && !isRoadOrBuilding(addr.neighbourhood, roadName)) {
      parsedKelurahan = addr.neighbourhood;
    }
  }

  // Safety check: Never allow kelurahan to equal road, kecamatan, or kota
  if (parsedKelurahan) {
    if (
      isRoadOrBuilding(parsedKelurahan, roadName) ||
      (jalan && parsedKelurahan.toLowerCase() === jalan.toLowerCase()) ||
      (parsedKecamatan && parsedKelurahan.toLowerCase() === parsedKecamatan.toLowerCase()) ||
      (parsedKota && parsedKelurahan.toLowerCase() === parsedKota.toLowerCase())
    ) {
      parsedKelurahan = '';
    }
  }

  // If road is still empty, look at first part of display_name that is not an admin unit
  if (!jalan && rawParts.length > 0) {
    const firstPart = rawParts[0];
    if (
      firstPart !== parsedKelurahan &&
      firstPart !== parsedKecamatan &&
      firstPart !== parsedKota &&
      firstPart !== parsedProvinsi
    ) {
      jalan = firstPart;
    }
  }

  const addressObj: AddressData = {
    jalan: cleanString(jalan),
    rt: cleanString(parsedRT),
    rw: cleanString(parsedRW),
    kelurahan: cleanString(stripAdminPrefix(parsedKelurahan)),
    kecamatan: cleanString(stripAdminPrefix(parsedKecamatan)),
    kota: cleanString(parsedKota),
    provinsi: cleanString(parsedProvinsi),
    kodePos: cleanString(parsedKodePos),
    patokan: '',
    formattedAddress: '',
    displayName,
    latitude: lat,
    longitude: lon,
    accuracy,
  };

  addressObj.formattedAddress = formatSingleLineAddress(addressObj);
  return addressObj;
}

function isRoadOrBuilding(str: string, knownRoad: string = ''): boolean {
  if (!str) return false;
  const s = str.trim().toLowerCase();
  if (knownRoad) {
    const r = knownRoad.trim().toLowerCase();
    if (s === r || s.startsWith(r) || r.startsWith(s)) return true;
  }
  if (
    /^(jl\.?|jalan|gang|gg\.?|lorong|lrg\.?|boulevard|bulevar|avenue|ave|ruas|tol|arteri|perum|perumahan|komplek|komp\.?|blok|kav|kavling|gedung|tower|mall|plaza|apartemen|hotel|wisma|graha|kantor|rs|rsud|puskesmas|sekolah|masjid|gereja)\b/i.test(
      s
    )
  ) {
    return true;
  }
  if (/\b(no\.?|nomor|km\.?|kilometer)\s*\d+/i.test(s)) return true;
  if (/^(rt|rw)\s*\d+/i.test(s) || /^\d+\/\d+$/.test(s)) return true;
  return false;
}

function stripAdminPrefix(str: string): string {
  if (!str) return '';
  return str
    .replace(/^(kelurahan|desa|kel\.?|ds\.?)\s+/i, '')
    .replace(/^(kecamatan|kec\.?|distrik)\s+/i, '')
    .trim();
}

function cleanString(str: string): string {
  return str ? str.trim().replace(/\s+/g, ' ') : '';
}

/**
 * Format satu baris siap pakai untuk Shopee, Tokopedia, kurir, dll.
 */
export function formatSingleLineAddress(addr: AddressData): string {
  const parts: string[] = [];

  // Jalan + No
  if (addr.jalan) {
    parts.push(addr.jalan);
  }

  // RT / RW
  if (addr.rt || addr.rw) {
    const rtText = addr.rt ? `RT ${addr.rt}` : '';
    const rwText = addr.rw ? `RW ${addr.rw}` : '';
    const rtrw = [rtText, rwText].filter(Boolean).join('/');
    parts.push(rtrw);
  }

  // Patokan (bila ada)
  if (addr.patokan) {
    parts.push(`(${addr.patokan})`);
  }

  // Kelurahan
  if (addr.kelurahan) {
    const kel = addr.kelurahan.toLowerCase().startsWith('kel') || addr.kelurahan.toLowerCase().startsWith('desa')
      ? addr.kelurahan
      : `Kel. ${addr.kelurahan}`;
    parts.push(kel);
  }

  // Kecamatan
  if (addr.kecamatan) {
    const kec = addr.kecamatan.toLowerCase().startsWith('kec')
      ? addr.kecamatan
      : `Kec. ${addr.kecamatan}`;
    parts.push(kec);
  }

  // Kota/Kabupaten
  if (addr.kota) {
    parts.push(addr.kota);
  }

  // Provinsi & Kode Pos
  if (addr.provinsi && addr.kodePos) {
    parts.push(`${addr.provinsi} ${addr.kodePos}`);
  } else if (addr.provinsi) {
    parts.push(addr.provinsi);
  } else if (addr.kodePos) {
    parts.push(addr.kodePos);
  }

  return parts.join(', ');
}

/**
 * Format multi-line untuk dokumen formal / surat
 */
export function formatFormalAddress(addr: AddressData): string {
  const lines: string[] = [];

  if (addr.jalan) lines.push(addr.jalan);
  
  const rtrwParts: string[] = [];
  if (addr.rt) rtrwParts.push(`RT ${addr.rt}`);
  if (addr.rw) rtrwParts.push(`RW ${addr.rw}`);
  if (rtrwParts.length > 0) lines.push(rtrwParts.join(' / '));

  if (addr.patokan) lines.push(`Patokan: ${addr.patokan}`);

  const kelKec: string[] = [];
  if (addr.kelurahan) {
    const kel = addr.kelurahan.toLowerCase().startsWith('kel') || addr.kelurahan.toLowerCase().startsWith('desa')
      ? addr.kelurahan
      : `Kelurahan ${addr.kelurahan}`;
    kelKec.push(kel);
  }
  if (addr.kecamatan) {
    const kec = addr.kecamatan.toLowerCase().startsWith('kec')
      ? addr.kecamatan
      : `Kecamatan ${addr.kecamatan}`;
    kelKec.push(kec);
  }
  if (kelKec.length > 0) lines.push(kelKec.join(', '));

  const kotaProv: string[] = [];
  if (addr.kota) kotaProv.push(addr.kota);
  if (addr.provinsi) kotaProv.push(addr.provinsi);
  if (kotaProv.length > 0) lines.push(kotaProv.join(', '));

  if (addr.kodePos) lines.push(`Kode Pos: ${addr.kodePos}`);

  return lines.join('\n');
}

/**
 * Format teks untuk dikirim ke WhatsApp (misal ke kurir paket / teman)
 */
export function formatWhatsAppShareText(addr: AddressData): string {
  const singleLine = formatSingleLineAddress(addr);
  const mapsUrl = `https://www.google.com/maps?q=${addr.latitude},${addr.longitude}`;
  
  return `📍 *Alamat Lengkap Saya:*\n${singleLine}\n\n📌 *Titik Google Maps:*\n${mapsUrl}`;
}

export function getGoogleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}
