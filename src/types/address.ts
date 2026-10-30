export interface OfficialVillageCandidate {
  name: string;
  distanceMeters?: number | null;
  isNearest?: boolean;
}

export interface AddressData {
  jalan: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  patokan: string;
  formattedAddress: string;
  displayName: string;
  latitude: number;
  longitude: number;
  accuracy: number | null; // in meters
  officialVillages?: OfficialVillageCandidate[];
}

export type AddressLabel = 'Rumah' | 'Kantor' | 'Kos' | 'Kontrakan' | 'Lainnya';

export interface SavedAddress {
  id: string;
  label: AddressLabel;
  customLabel?: string;
  address: AddressData;
  createdAt: number;
}

export interface CommunityRTRWContribution {
  id: string;
  latitude: number;
  longitude: number;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  catatan?: string;
  upvotes: number;
  downvotes: number;
  createdAt: number;
  distanceMeters?: number;
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: 'school' | 'worship' | 'government' | 'health' | 'commercial' | 'transit' | 'other';
  categoryLabel: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  street?: string;
  source?: 'google' | 'osm';
  detectedRTRW?: {
    rt?: string;
    rw?: string;
    source: string;
  };
  fullAddress?: string;
}

export interface AIAddressAnalysis {
  jalan: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  patokan: string;
  formattedAddress: string;
  confidenceScore: number; // 0 - 100
  aiSource: 'gemini' | 'heuristic_engine';
  explanation: string;
  deliveryAdvice: string;
  hierarchyVerified: boolean;
  detectedFromPOIs?: {
    placeName: string;
    rt?: string;
    rw?: string;
    distanceMeters: number;
  };
  geminiError?: string;
  hasServerKey?: boolean;
  officialCandidates?: OfficialVillageCandidate[];
  refereeDecision?: {
    selectedVillage: string;
    reason: string;
    wasitSource: 'gemini' | 'smart_referee';
  };
}

export interface NominatimAddress {
  road?: string;
  street?: string;
  pedestrian?: string;
  residential?: string;
  house_number?: string;
  building?: string;
  neighbourhood?: string;
  hamlet?: string;
  suburb?: string;
  village?: string;
  subdistrict?: string;
  district?: string;
  city_district?: string;
  town?: string;
  city?: string;
  city_block?: string;
  municipality?: string;
  regency?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  [key: string]: string | undefined;
}

export interface NominatimReverseResponse {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: NominatimAddress;
  error?: string;
}

export interface NominatimSearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance: number;
}
