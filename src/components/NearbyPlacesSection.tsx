'use client';

import React, { useState, useMemo } from 'react';
import { NearbyPlace } from '@/types/address';
import {
  School,
  Church,
  Building,
  HeartPulse,
  ShoppingBag,
  Bus,
  MapPin,
  Plus,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Send,
  HelpCircle,
} from 'lucide-react';

interface NearbyPlacesSectionProps {
  places: NearbyPlace[];
  suggestedRTRW?: { rt: string; rw: string; source: string; distanceMeters: number } | null;
  onApplyRTRW: (rt: string, rw: string) => void;
  onAddPatokan: (patokanText: string) => void;
}

type FilterCategory = 'all' | 'school' | 'worship' | 'health' | 'commercial' | 'government';

export default function NearbyPlacesSection({
  places = [],
  suggestedRTRW,
  onApplyRTRW,
  onAddPatokan,
}: NearbyPlacesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [addedPatokanId, setAddedPatokanId] = useState<string | null>(null);
  const [customPatokan, setCustomPatokan] = useState('');
  const [customAdded, setCustomAdded] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [showInfoPopover, setShowInfoPopover] = useState(false);

  const isGoogleSource = places.some((p) => p.source === 'google');

  const getCategoryIcon = (category: NearbyPlace['category']) => {
    switch (category) {
      case 'school':
        return <School className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'worship':
        return <Church className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'health':
        return <HeartPulse className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />;
      case 'government':
        return <Building className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'commercial':
        return <ShoppingBag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'transit':
        return <Bus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const handlePatokanClick = (place: NearbyPlace) => {
    const text = `Dekat ${place.name} (±${place.distanceMeters}m)`;
    onAddPatokan(text);
    setAddedPatokanId(place.id);
    setTimeout(() => setAddedPatokanId(null), 2000);
  };

  const handleAddCustomPatokan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPatokan.trim()) return;
    onAddPatokan(customPatokan.trim());
    setCustomAdded(true);
    setCustomPatokan('');
    setTimeout(() => setCustomAdded(false), 2500);
  };

  const filteredPlaces = useMemo(() => {
    if (selectedFilter === 'all') return places;
    return places.filter((p) => p.category === selectedFilter);
  }, [places, selectedFilter]);

  const visiblePlaces = isExpanded ? filteredPlaces : filteredPlaces.slice(0, 4);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
            <School className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                Fasilitas & Sekolah Sekitar ({places.length})
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h4>

              {isGoogleSource ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Google Places Live
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowInfoPopover(!showInfoPopover)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1 transition-colors"
                  title="Klik untuk info sumber peta"
                >
                  <span>Peta Terbuka (OSM)</span>
                  <HelpCircle className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Gunakan sebagai referensi RT/RW lingkungan atau patokan kurir ekspedisi
            </p>
          </div>
        </div>

        {filteredPlaces.length > 4 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <span>Ringkas</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Lihat Semua ({filteredPlaces.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Info Popover about Google Maps vs OSM */}
      {showInfoPopover && (
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs text-slate-700 dark:text-slate-300 space-y-2 animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200 text-xs">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Mengapa Google Maps memiliki tempat lebih lengkap?</span>
            </div>
            <button
              onClick={() => setShowInfoPopover(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Google Maps mengumpulkan data bisnis mikro (warung, sekolah swasta, ruko, klinik) dari jutaan pemilik usaha yang mendaftar di <b>Google Bisnisku</b> dan sinyal Android. Sedangkan OpenStreetMap (OSM) mengandalkan sukarelawan komunitas sehingga fasilitas mikro di area pedesaan/kecamatan belum semua terdata.
          </p>
          <p className="text-[11px] text-blue-800 dark:text-blue-300 font-medium">
            💡 Ingin 100% data Google Maps? Anda dapat memasukkan <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-[10px]">GOOGLE_MAPS_API_KEY</code> di pengaturan server untuk mengaktifkan Google Places Live.
          </p>
        </div>
      )}

      {/* Suggested RT/RW from School / Facility Anchor */}
      {suggestedRTRW && (suggestedRTRW.rt || suggestedRTRW.rw) && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <p className="font-black text-emerald-950 dark:text-emerald-100">
                Terdeteksi dari {suggestedRTRW.source}: RT {suggestedRTRW.rt} / RW {suggestedRTRW.rw}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Fasilitas ini berjarak ±{suggestedRTRW.distanceMeters}m dari titik Anda
              </p>
            </div>
          </div>

          <button
            onClick={() => onApplyRTRW(suggestedRTRW.rt, suggestedRTRW.rw)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1 text-xs active:scale-95 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Gunakan RT/RW Ini</span>
          </button>
        </div>
      )}

      {/* Quick Custom Landmark Input */}
      <form onSubmit={handleAddCustomPatokan} className="flex gap-2">
        <input
          type="text"
          value={customPatokan}
          onChange={(e) => setCustomPatokan(e.target.value)}
          placeholder="Ketik patokan kurir sendiri (misal: Pagar hitam depan warung Bu Siti)..."
          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button
          type="submit"
          disabled={!customPatokan.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
        >
          {customAdded ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              <span>Tersimpan</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Simpan Patokan</span>
            </>
          )}
        </button>
      </form>

      {/* Category Filter Pills */}
      {places.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Semua ({places.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('school')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              selectedFilter === 'school'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Sekolah ({places.filter((p) => p.category === 'school').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('worship')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              selectedFilter === 'worship'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Ibadah ({places.filter((p) => p.category === 'worship').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('health')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              selectedFilter === 'health'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Kesehatan ({places.filter((p) => p.category === 'health').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('commercial')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              selectedFilter === 'commercial'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Belanja / Toko ({places.filter((p) => p.category === 'commercial').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('government')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
              selectedFilter === 'government'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Pos / Instansi ({places.filter((p) => p.category === 'government').length})
          </button>
        </div>
      )}

      {/* Grid of Places or Empty State */}
      {visiblePlaces.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {visiblePlaces.map((place) => (
            <div
              key={place.id}
              className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col justify-between gap-2"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {getCategoryIcon(place.category)}
                    {place.categoryLabel}
                  </span>

                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    ±{place.distanceMeters}m
                  </span>
                </div>

                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {place.name}
                </h5>

                {place.street && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {place.street}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                {place.detectedRTRW?.rt || place.detectedRTRW?.rw ? (
                  <button
                    type="button"
                    onClick={() => onApplyRTRW(place.detectedRTRW?.rt || '', place.detectedRTRW?.rw || '')}
                    className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-bold hover:bg-emerald-200 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Ambil RT {place.detectedRTRW.rt || '-'}/RW {place.detectedRTRW.rw || '-'}</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400">Landmark Sekitar</span>
                )}

                <button
                  type="button"
                  onClick={() => handlePatokanClick(place)}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors"
                  title="Tambahkan fasilitas ini sebagai patokan kurir"
                >
                  {addedPatokanId === place.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Ditambahkan</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Jadikan Patokan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Belum ada fasilitas sekitar yang terpetakan untuk kategori ini.
          </p>
          <p className="text-[11px]">
            Kamu bisa gunakan formulir di atas untuk mengetik patokan kurir secara mandiri.
          </p>
        </div>
      )}
    </div>
  );
}
