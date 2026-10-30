'use client';

import React, { useState } from 'react';
import { NearbyPlace } from '@/types/address';
import { School, Church, Building, HeartPulse, ShoppingBag, Bus, MapPin, Plus, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface NearbyPlacesSectionProps {
  places: NearbyPlace[];
  suggestedRTRW?: { rt: string; rw: string; source: string; distanceMeters: number } | null;
  onApplyRTRW: (rt: string, rw: string) => void;
  onAddPatokan: (patokanText: string) => void;
}

export default function NearbyPlacesSection({
  places,
  suggestedRTRW,
  onApplyRTRW,
  onAddPatokan,
}: NearbyPlacesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [addedPatokanId, setAddedPatokanId] = useState<string | null>(null);

  if (!places || places.length === 0) return null;

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

  const visiblePlaces = isExpanded ? places : places.slice(0, 4);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
            <School className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              Fasilitas & Sekolah Sekitar ({places.length})
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Gunakan untuk referensi RT/RW lingkungan atau patokan kurir ekspedisi
            </p>
          </div>
        </div>

        {places.length > 4 && (
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
                <span>Lihat Semua ({places.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Suggested RT/RW from School / Facility */}
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

      {/* Grid of Places */}
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
    </div>
  );
}
