'use client';

import React, { useState } from 'react';
import { CommunityRTRWContribution } from '@/types/address';
import { Users, Check, ThumbsUp, MapPin, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface CommunityRTRWBannerProps {
  contributions: CommunityRTRWContribution[];
  onApplyRTRW: (rt: string, rw: string) => void;
  onVote: (id: string, action: 'upvote' | 'downvote') => void;
  onOpenContributeModal: () => void;
}

export default function CommunityRTRWBanner({
  contributions,
  onApplyRTRW,
  onVote,
  onOpenContributeModal,
}: CommunityRTRWBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});

  if (!contributions || contributions.length === 0) {
    return (
      <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            <b>Belum ada data RT/RW warga untuk titik ini.</b> Tahu RT/RW lokasimu?
          </span>
        </div>
        <button
          onClick={onOpenContributeModal}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bantu Bagikan RT/RW</span>
        </button>
      </div>
    );
  }

  const bestMatch = contributions[0];

  const handleVote = (id: string) => {
    if (votedIds[id]) return;
    onVote(id, 'upvote');
    setVotedIds((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-3xl shadow-sm text-xs space-y-2.5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
          <div className="p-1.5 bg-emerald-600 text-white rounded-xl shadow-sm">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-emerald-950 dark:text-emerald-100">
                Data Komunitas: RT {bestMatch.rt} / RW {bestMatch.rw}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                ±{bestMatch.distanceMeters}m dari pin
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
              {bestMatch.catatan || 'Kontribusi terverifikasi dari warga / tetangga sekitar'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onApplyRTRW(bestMatch.rt, bestMatch.rw)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Gunakan RT/RW Ini</span>
          </button>

          <button
            onClick={() => handleVote(bestMatch.id)}
            disabled={votedIds[bestMatch.id]}
            className={`p-1.5 rounded-xl border flex items-center gap-1 text-[11px] font-bold transition-all ${
              votedIds[bestMatch.id]
                ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-300'
                : 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
            title="Konfirmasi bahwa data RT/RW ini benar"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{bestMatch.upvotes}</span>
          </button>

          {contributions.length > 1 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded list of other nearby contributions */}
      {isExpanded && contributions.length > 1 && (
        <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 space-y-2">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            Titik RT/RW Lain di Sekitar:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {contributions.slice(1).map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      RT {item.rt} / RW {item.rw}
                    </span>
                    <span className="text-[10px] text-slate-400">({item.distanceMeters}m)</span>
                  </div>
                  {item.catatan && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                      {item.catatan}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onApplyRTRW(item.rt, item.rw)}
                  className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-lg text-[10px] font-bold hover:bg-emerald-200 transition-colors"
                >
                  Pilih
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
