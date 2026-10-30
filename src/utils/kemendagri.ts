import { OfficialVillageCandidate } from '@/types/address';
import fs from 'fs';
import path from 'path';

export interface KemendagriDistrictResult {
  district: string;
  regency: string;
  province: string;
  nearestVillage?: OfficialVillageCandidate;
  villages: OfficialVillageCandidate[];
}

interface EmsifaItem {
  id: string;
  name: string;
  province_id?: string;
  regency_id?: string;
  district_id?: string;
}

const MEMORY_CACHE = new Map<string, KemendagriDistrictResult>();
const CACHE_FILE = path.join(process.cwd(), 'data', 'kemendagri_cache.json');

function cleanName(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(
      /^(provinsi|propinsi|kota administrasi|kota madya|kota|kabupaten|kab\.?|kecamatan|kec\.?|distrik|daerah istimewa|dki)\s+/i,
      ''
    )
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function toTitleCase(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Haversine formula
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Load cache from disk if available
function loadDiskCache(): Record<string, KemendagriDistrictResult> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to read kemendagri cache file:', err);
  }
  return {};
}

function saveDiskCache(cacheObj: Record<string, KemendagriDistrictResult>) {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheObj, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to save kemendagri cache file:', err);
  }
}

/**
 * Fetch official Kemendagri villages for a given district & regency,
 * with distance calculation to user coordinate.
 */
export async function getOfficialVillagesForDistrict(
  districtName: string,
  regencyName: string,
  provinceName: string = '',
  userLat?: number | null,
  userLon?: number | null
): Promise<KemendagriDistrictResult | null> {
  const cleanD = cleanName(districtName);
  const cleanR = cleanName(regencyName);
  const cleanP = cleanName(provinceName);

  if (!cleanD) return null;

  const cacheKey = `${cleanP}_${cleanR}_${cleanD}`;

  // 1. Check in-memory cache
  if (MEMORY_CACHE.has(cacheKey)) {
    const cached = MEMORY_CACHE.get(cacheKey)!;
    return recalculateDistances(cached, userLat, userLon);
  }

  // 2. Check disk cache
  const disk = loadDiskCache();
  if (disk[cacheKey]) {
    MEMORY_CACHE.set(cacheKey, disk[cacheKey]);
    return recalculateDistances(disk[cacheKey], userLat, userLon);
  }

  try {
    // 3. Resolve province (with 2.5s timeout to prevent hanging)
    const provsRes = await fetch(
      'https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json',
      {
        signal: AbortSignal.timeout(2500),
        next: { revalidate: 86400 },
      }
    );
    if (!provsRes.ok) return null;
    const provs = (await provsRes.json()) as EmsifaItem[];

    let targetProv = cleanP
      ? provs.find((p) => {
          const cp = cleanName(p.name);
          return cp.includes(cleanP) || cleanP.includes(cp);
        })
      : null;

    if (!targetProv && provs.length > 0) {
      targetProv = provs[0];
    }
    if (!targetProv) return null;

    // 4. Resolve regency
    const regRes = await fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${targetProv.id}.json`,
      {
        signal: AbortSignal.timeout(2500),
        next: { revalidate: 86400 },
      }
    );
    if (!regRes.ok) return null;
    const regencies = (await regRes.json()) as EmsifaItem[];

    let targetReg = cleanR
      ? regencies.find((r) => {
          const cr = cleanName(r.name);
          return cr.includes(cleanR) || cleanR.includes(cr);
        })
      : null;

    if (!targetReg && regencies.length > 0) {
      targetReg = regencies[0];
    }
    if (!targetReg) return null;

    // 5. Resolve district
    const distRes = await fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${targetReg.id}.json`,
      {
        signal: AbortSignal.timeout(2500),
        next: { revalidate: 86400 },
      }
    );
    if (!distRes.ok) return null;
    const districts = (await distRes.json()) as EmsifaItem[];

    const targetDist = districts.find((d) => {
      const cd = cleanName(d.name);
      return cd.includes(cleanD) || cleanD.includes(cd);
    });

    if (!targetDist) return null;

    // 6. Fetch official villages
    const villRes = await fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${targetDist.id}.json`,
      {
        signal: AbortSignal.timeout(2500),
        next: { revalidate: 86400 },
      }
    );
    if (!villRes.ok) return null;
    const rawVillages = (await villRes.json()) as EmsifaItem[];

    const cleanRegencyName = targetReg.name.replace(/^(kabupaten|kota)\s+/i, '');

    // 7. Fast Candidate List with safe distance resolution (no parallel flood)
    const candidateList = rawVillages.map((v) => ({
      name: toTitleCase(v.name),
      distanceMeters: null as number | null,
      lat: null as number | null,
      lon: null as number | null,
      isNearest: false,
    }));

    // Optionally resolve distance for the first 2 candidates with strict timeout
    if (userLat != null && userLon != null && candidateList.length > 0) {
      const candidatesToResolve = candidateList.slice(0, 2);
      await Promise.allSettled(
        candidatesToResolve.map(async (c) => {
          try {
            const q = `${c.name}, ${toTitleCase(targetDist.name)}, ${cleanRegencyName}`;
            const searchRes = await fetch(
              `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
                q
              )}&limit=1`,
              {
                headers: { 'User-Agent': 'AlamatKu-Web/1.0 (https://alamatku.app)' },
                signal: AbortSignal.timeout(1500),
                next: { revalidate: 86400 * 7 },
              }
            );
            if (searchRes.ok) {
              const resData = (await searchRes.json()) as Array<{ lat: string; lon: string }>;
              if (resData.length > 0) {
                const vLat = parseFloat(resData[0].lat);
                const vLon = parseFloat(resData[0].lon);
                c.lat = vLat;
                c.lon = vLon;
                c.distanceMeters = getDistanceMeters(userLat, userLon, vLat, vLon);
              }
            }
          } catch {
            // timeout or network error safely ignored
          }
        })
      );
    }

    // Sort by distance ascending if distances exist
    candidateList.sort((a, b) => {
      if (a.distanceMeters == null && b.distanceMeters == null) return 0;
      if (a.distanceMeters == null) return 1;
      if (b.distanceMeters == null) return -1;
      return a.distanceMeters - b.distanceMeters;
    });

    if (candidateList.length > 0) {
      candidateList[0].isNearest = true;
    }

    const result: KemendagriDistrictResult = {
      district: toTitleCase(targetDist.name),
      regency: toTitleCase(targetReg.name),
      province: toTitleCase(targetProv.name),
      nearestVillage: candidateList[0],
      villages: candidateList.map((c) => ({
        name: c.name,
        distanceMeters: c.distanceMeters,
        isNearest: !!c.isNearest,
      })),
    };

    // Save cache
    MEMORY_CACHE.set(cacheKey, result);
    disk[cacheKey] = result;
    saveDiskCache(disk);

    return result;
  } catch (err) {
    console.error('Error fetching official Kemendagri villages:', err);
    return null;
  }
}

function recalculateDistances(
  cached: KemendagriDistrictResult,
  userLat?: number | null,
  userLon?: number | null
): KemendagriDistrictResult {
  if (userLat == null || userLon == null) {
    return cached;
  }

  // If already calculated, return sorted
  const sorted = [...cached.villages].sort((a, b) => {
    if (a.distanceMeters == null && b.distanceMeters == null) return 0;
    if (a.distanceMeters == null) return 1;
    if (b.distanceMeters == null) return -1;
    return a.distanceMeters - b.distanceMeters;
  });

  return {
    ...cached,
    nearestVillage: sorted[0],
    villages: sorted,
  };
}
