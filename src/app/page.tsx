'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import InteractiveMap from '@/components/Map';
import AddressCard from '@/components/AddressCard';
import AddressEditModal from '@/components/AddressEditModal';
import SaveAddressModal from '@/components/SaveAddressModal';
import EcommerceTemplatesModal from '@/components/EcommerceTemplatesModal';
import SmartAddressParserModal from '@/components/SmartAddressParserModal';
import ShareModal from '@/components/ShareModal';
import SavedAddresses from '@/components/SavedAddresses';
import CommunityRTRWBanner from '@/components/CommunityRTRWBanner';
import ContributeRTRWModal from '@/components/ContributeRTRWModal';
import NearbyPlacesSection from '@/components/NearbyPlacesSection';
import AIAddressModal from '@/components/AIAddressModal';
import {
  AddressData,
  SavedAddress,
  NominatimReverseResponse,
  CommunityRTRWContribution,
  NearbyPlace,
  OfficialVillageCandidate,
} from '@/types/address';
import { parseNominatimToAddress, formatSingleLineAddress } from '@/utils/addressParser';
import { AlertCircle, Sparkles, Navigation, Info, Wand2, ShoppingBag, Users, Brain } from 'lucide-react';

// Default center: Monas, Jakarta Pusat
const DEFAULT_COORDS: [number, number] = [-6.175392, 106.827153];
const STORAGE_KEY = 'alamatku_saved_addresses_v1';

export default function HomePage() {
  const [coords, setCoords] = useState<[number, number]>(DEFAULT_COORDS);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [communityContributions, setCommunityContributions] = useState<CommunityRTRWContribution[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [nearbySuggestedRTRW, setNearbySuggestedRTRW] = useState<{ rt: string; rw: string; source: string; distanceMeters: number } | null>(null);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isSmartParserOpen, setIsSmartParserOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const savedSectionRef = useRef<HTMLDivElement>(null);

  // Load saved addresses from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedAddresses(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load saved addresses:', e);
    }
  }, []);

  // Save to localStorage helper
  const updateSavedInStorage = (newList: SavedAddress[]) => {
    setSavedAddresses(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Failed to write to localStorage:', e);
    }
  };

  // Fetch Community RT/RW data
  const fetchCommunityRTRW = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/rtrw?lat=${lat}&lon=${lon}&radius=1500`);
      if (res.ok) {
        const data = await res.json();
        setCommunityContributions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching community RT/RW:', err);
    }
  }, []);

  // Fetch Nearby Places & Facilities (Schools, Mosques, Offices, RT/RW Anchors)
  const fetchNearbyPlaces = useCallback(
    async (lat: number, lon: number, district?: string, regency?: string, village?: string) => {
      try {
        const params = new URLSearchParams({
          lat: lat.toString(),
          lon: lon.toString(),
        });
        if (district) params.set('district', district);
        if (regency) params.set('regency', regency);
        if (village) params.set('village', village);

        const res = await fetch(`/api/nearby-places?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setNearbyPlaces(data.places || []);
          setNearbySuggestedRTRW(data.suggestedRTRW || null);

          // Auto-fill RT/RW if empty and high-confidence anchor nearby (<= 300m)
          if (data.suggestedRTRW && (data.suggestedRTRW.distanceMeters ?? 999) <= 300) {
            setAddress((prev) => {
              if (!prev) return prev;
              if (!prev.rt && !prev.rw) {
                const updated: AddressData = {
                  ...prev,
                  rt: data.suggestedRTRW.rt || prev.rt,
                  rw: data.suggestedRTRW.rw || prev.rw,
                };
                updated.formattedAddress = formatSingleLineAddress(updated);
                return updated;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error('Error fetching nearby places:', err);
      }
    },
    []
  );

  // Fetch Official Kemendagri Villages for District
  const fetchOfficialVillages = useCallback(
    async (parsedAddr: AddressData, lat: number, lon: number) => {
      if (!parsedAddr.kecamatan) return;
      try {
        const query = new URLSearchParams({
          district: parsedAddr.kecamatan,
          regency: parsedAddr.kota,
          province: parsedAddr.provinsi,
          lat: lat.toString(),
          lon: lon.toString(),
        });
        const res = await fetch(`/api/official-villages?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const villages: OfficialVillageCandidate[] = data.villages || [];
          if (villages.length > 0) {
            setAddress((prev) => {
              if (!prev) return prev;
              const shouldUpdateKelurahan =
                !prev.kelurahan ||
                prev.kelurahan.toLowerCase() === prev.kecamatan.toLowerCase() ||
                prev.kelurahan.toLowerCase() === prev.jalan.toLowerCase();

              const chosenKelurahan = shouldUpdateKelurahan
                ? data.nearestVillage?.name || villages[0].name
                : prev.kelurahan;

              const updated: AddressData = {
                ...prev,
                kelurahan: chosenKelurahan,
                officialVillages: villages,
              };
              updated.formattedAddress = formatSingleLineAddress(updated);
              return updated;
            });
          }
        }
      } catch (err) {
        console.error('Error fetching official villages:', err);
      }
    },
    []
  );

  // Reverse Geocode Function with enhanced Indonesian hierarchy parsing
  const fetchAddressForCoords = useCallback(
    async (lat: number, lon: number, acc: number | null = null) => {
      setIsGeocoding(true);
      setErrorMessage(null);
      try {
        let res = await fetch(`/api/reverse?lat=${lat}&lon=${lon}`);
        if (!res.ok) {
          // Automatic fast retry after 500ms in case of temporary rate limit or network glitch
          await new Promise((r) => setTimeout(r, 500));
          res = await fetch(`/api/reverse?lat=${lat}&lon=${lon}`);
        }
        if (!res.ok) {
          throw new Error('Gagal menghubungi layanan geocoding.');
        }
        const data: NominatimReverseResponse = await res.json();
        const parsed = parseNominatimToAddress(data, lat, lon, acc);
        setAddress(parsed);

        // Concurrently fetch community RT/RW, nearby facilities, and official Kemendagri villages
        fetchCommunityRTRW(lat, lon);
        fetchNearbyPlaces(lat, lon, parsed.kecamatan, parsed.kota, parsed.kelurahan);
        fetchOfficialVillages(parsed, lat, lon);
      } catch (err: unknown) {
        console.error('Geocoding error:', err);
        setErrorMessage(
          'Tidak dapat memuat detail nama jalan secara otomatis. Kamu dapat menggeser pin atau mengisi alamat secara manual.'
        );
      } finally {
        setIsGeocoding(false);
      }
    },
    [fetchCommunityRTRW, fetchNearbyPlaces, fetchOfficialVillages]
  );

  const handleSelectOfficialVillage = useCallback((villageName: string) => {
    setAddress((prev) => {
      if (!prev) return prev;
      const updated: AddressData = {
        ...prev,
        kelurahan: villageName,
      };
      updated.formattedAddress = formatSingleLineAddress(updated);
      return updated;
    });
  }, []);

  const handleApplySuggestedRTRW = useCallback((rt: string, rw: string) => {
    setAddress((prev) => {
      if (!prev) return prev;
      const updated: AddressData = {
        ...prev,
        rt,
        rw,
      };
      updated.formattedAddress = formatSingleLineAddress(updated);
      return updated;
    });
  }, []);

  // Initial geocode for default coords
  useEffect(() => {
    fetchAddressForCoords(DEFAULT_COORDS[0], DEFAULT_COORDS[1], null);
  }, [fetchAddressForCoords]);

  // Geolocation Handler with Automatic Two-Tier Fallback
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Browser Anda tidak mendukung fitur pendeteksi lokasi (Geolocation).');
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    const onLocationSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const acc = pos.coords.accuracy;

      setCoords([lat, lon]);
      setAccuracy(acc);
      setIsLocating(false);

      fetchAddressForCoords(lat, lon, acc);
    };

    const onFinalLocationError = (err: GeolocationPositionError) => {
      setIsLocating(false);
      console.warn('Geolocation final error:', err);
      let msg = 'Gagal mendeteksi lokasi otomatis.';
      if (err.code === 1) {
        msg = 'Izin lokasi tidak diberikan. Harap aktifkan izin lokasi di browser Anda atau gunakan kolom pencarian.';
      } else if (err.code === 2) {
        msg = 'Sinyal lokasi/GPS tidak tersedia saat ini. Coba geser pin di peta.';
      } else if (err.code === 3) {
        msg = 'Permintaan lokasi memakan waktu terlalu lama. Silakan coba kembali.';
      }
      setErrorMessage(msg);
    };

    // Attempt 1: High accuracy GPS with generous timeout (15s) and 60s cache
    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      (err) => {
        // If timed out (3) or unavailable (2), automatically fallback to fast Wi-Fi / Cell network triangulation
        if (err.code === 2 || err.code === 3) {
          console.warn('High-accuracy GPS cold start timed out or unavailable, falling back to network geolocation...');
          navigator.geolocation.getCurrentPosition(
            onLocationSuccess,
            onFinalLocationError,
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000, // allow 5 minutes cached network position
            }
          );
          return;
        }

        // If permission denied (1), don't retry, show error directly
        onFinalLocationError(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // 15 seconds allows user to tap 'Allow' on permission dialog
        maximumAge: 60000, // 1 minute cache avoids cold GPS restart
      }
    );
  };

  // Handle Marker Position Change (from map dragging or click)
  const handlePositionChange = (lat: number, lng: number) => {
    setCoords([lat, lng]);
    setAccuracy(null);
    fetchAddressForCoords(lat, lng, null);
  };

  // Handle Search Result Selection
  const handleSelectLocation = (lat: number, lon: number) => {
    setCoords([lat, lon]);
    setAccuracy(null);
    fetchAddressForCoords(lat, lon, null);
  };

  // Handle Manual Edit Save
  const handleSaveEdit = (updated: AddressData) => {
    setAddress(updated);
  };

  // Handle AI Smart Parsed Address
  const handleApplySmartParsed = (updated: AddressData) => {
    setAddress(updated);
  };

  // Apply RT/RW to current address
  const handleApplyRTRW = (rt: string, rw: string) => {
    if (!address) return;
    const updated: AddressData = {
      ...address,
      rt,
      rw,
    };
    updated.formattedAddress = formatSingleLineAddress(updated);
    setAddress(updated);
  };

  // Add Patokan from nearby facilities
  const handleAddPatokan = (patokanText: string) => {
    if (!address) return;
    const existing = address.patokan ? `${address.patokan}, ` : '';
    const updated: AddressData = {
      ...address,
      patokan: `${existing}${patokanText}`,
    };
    updated.formattedAddress = formatSingleLineAddress(updated);
    setAddress(updated);
  };

  // Handle Upvote for community contribution
  const handleVoteCommunityRTRW = async (id: string, action: 'upvote' | 'downvote') => {
    try {
      await fetch('/api/rtrw', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      fetchCommunityRTRW(coords[0], coords[1]);
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  // Handle Contribution Success
  const handleContributionSuccess = (newEntry: CommunityRTRWContribution) => {
    handleApplyRTRW(newEntry.rt, newEntry.rw);
    fetchCommunityRTRW(coords[0], coords[1]);
  };

  // Handle AI Apply
  const handleApplyAI = (updated: AddressData) => {
    setAddress(updated);
  };

  // Handle Saving to Saved Addresses
  const handleSaveAddress = (newEntry: SavedAddress) => {
    const updated = [newEntry, ...savedAddresses];
    updateSavedInStorage(updated);
  };

  // Handle Deleting Saved Address
  const handleDeleteSavedAddress = (id: string) => {
    const updated = savedAddresses.filter((item) => item.id !== id);
    updateSavedInStorage(updated);
  };

  // Handle Importing JSON Addresses
  const handleImportAddresses = (importedList: SavedAddress[]) => {
    const combined = [...importedList, ...savedAddresses];
    const unique = combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
    updateSavedInStorage(unique);
  };

  // Select a saved address to view on map
  const handleSelectSavedAddress = (savedAddr: AddressData) => {
    setCoords([savedAddr.latitude, savedAddr.longitude]);
    setAddress(savedAddr);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToSaved = () => {
    savedSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <Header
        onDetectLocation={handleDetectLocation}
        isLocating={isLocating}
        savedCount={savedAddresses.length}
        onScrollToSaved={handleScrollToSaved}
        onOpenSmartParser={() => setIsSmartParserOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 md:py-6 space-y-6">
        {/* Banner / Introduction */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 dark:from-blue-900 dark:via-indigo-900 dark:to-slate-900 rounded-3xl p-5 md:p-7 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
            <Navigation className="w-64 h-64 -rotate-12 translate-x-12" />
          </div>

          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Sistem Alamat Pintar & AI Terintegrasi
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-snug">
              Temukan Alamat Lengkap, Akurat & Terverifikasi AI
            </h2>

            <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
              Baru pindah kos atau rumah baru? Sistem kami otomatis memvalidasi hierarki Kelurahan/Kecamatan, mencari RT/RW dari sekolah & warga sekitar, serta menyusun patokan kurir siap pakai.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-blue-700 text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Navigation className="w-4 h-4 fill-blue-600" />
              {isLocating ? 'Sedang Membaca GPS...' : 'Gunakan Lokasi Saya Sekarang'}
            </button>

            <button
              onClick={() => setIsAIModalOpen(true)}
              className="px-3.5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Brain className="w-4 h-4 text-amber-300" />
              <span>Analisis & Validasi AI</span>
            </button>

            <button
              onClick={() => setIsContributeModalOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 text-xs font-bold rounded-xl backdrop-blur-sm border border-emerald-400/30 flex items-center gap-1.5 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-emerald-300" />
              <span>Bantu Bagikan RT/RW</span>
            </button>

            <button
              onClick={() => setIsSmartParserOpen(true)}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl backdrop-blur-sm border border-white/20 flex items-center gap-1.5 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Format Alamat Acak (AI)</span>
            </button>

            {address && (
              <button
                onClick={() => setIsTemplatesOpen(true)}
                className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl backdrop-blur-sm border border-white/20 flex items-center gap-1.5 transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-orange-300" />
                <span>Template E-Commerce</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full">
          <SearchBar onSelectLocation={handleSelectLocation} />
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-3 text-xs text-red-800 dark:text-red-200 shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Informasi:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Community RT/RW Banner */}
        <CommunityRTRWBanner
          contributions={communityContributions}
          onApplyRTRW={handleApplyRTRW}
          onVote={handleVoteCommunityRTRW}
          onOpenContributeModal={() => setIsContributeModalOpen(true)}
        />

        {/* Main Grid: Map & Address Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Column (7 Cols on Desktop) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Peta Interaktif (Jalan & Satelit)</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                Koordinat: {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
              </span>
            </div>

            <div className="h-[380px] md:h-[480px] w-full">
              <InteractiveMap
                position={coords}
                accuracy={accuracy}
                onPositionChange={handlePositionChange}
                isLoading={isGeocoding}
                communityContributions={communityContributions}
                onSelectCommunityRTRW={handleApplyRTRW}
              />
            </div>

            {/* Quick helper note */}
            <div className="p-3 bg-slate-100/80 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-400">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                <b>Hierarki Wilayah Terverifikasi:</b> Sistem otomatis memisahkan nama Kelurahan dan Kecamatan secara presisi. Anda juga dapat menggunakan mode <b>Satelit</b> untuk melihat foto udara atap rumah & gang.
              </span>
            </div>
          </div>

          {/* Address Information Column (5 Cols on Desktop) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <AddressCard
              address={address}
              isLoading={isGeocoding}
              onOpenEdit={() => setIsEditOpen(true)}
              onOpenSave={() => setIsSaveOpen(true)}
              onOpenTemplates={() => setIsTemplatesOpen(true)}
              onOpenShare={() => setIsShareOpen(true)}
              onOpenSmartParser={() => setIsSmartParserOpen(true)}
              onOpenAIModal={() => setIsAIModalOpen(true)}
              onSelectVillage={handleSelectOfficialVillage}
              suggestedRTRW={nearbySuggestedRTRW}
              onApplySuggestedRTRW={handleApplySuggestedRTRW}
            />
          </div>
        </div>

        {/* Nearby Facilities & Schools Section */}
        <div>
          <NearbyPlacesSection
            places={nearbyPlaces}
            suggestedRTRW={nearbySuggestedRTRW}
            onApplyRTRW={handleApplyRTRW}
            onAddPatokan={handleAddPatokan}
          />
        </div>

        {/* Saved Addresses Section */}
        <div ref={savedSectionRef} className="pt-4">
          <SavedAddresses
            savedList={savedAddresses}
            onSelectAddress={handleSelectSavedAddress}
            onDeleteAddress={handleDeleteSavedAddress}
            onImportAddresses={handleImportAddresses}
          />
        </div>
      </main>

      {/* Modals */}
      {address && (
        <>
          <AddressEditModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            address={address}
            onSave={handleSaveEdit}
          />

          <SaveAddressModal
            isOpen={isSaveOpen}
            onClose={() => setIsSaveOpen(false)}
            address={address}
            onSaved={handleSaveAddress}
          />

          <EcommerceTemplatesModal
            isOpen={isTemplatesOpen}
            onClose={() => setIsTemplatesOpen(false)}
            address={address}
          />

          <ShareModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            address={address}
          />

          <ContributeRTRWModal
            isOpen={isContributeModalOpen}
            onClose={() => setIsContributeModalOpen(false)}
            address={address}
            onContributionSuccess={handleContributionSuccess}
          />

          <AIAddressModal
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            address={address}
            nearbyPlaces={nearbyPlaces}
            communityRTRW={communityContributions}
            onApplyAI={handleApplyAI}
          />
        </>
      )}

      {/* Smart Parser Modal */}
      <SmartAddressParserModal
        isOpen={isSmartParserOpen}
        onClose={() => setIsSmartParserOpen(false)}
        currentAddress={address}
        onApplyParsed={handleApplySmartParsed}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
