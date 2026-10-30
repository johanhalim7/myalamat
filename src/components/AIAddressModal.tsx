'use client';

import React, { useState } from 'react';
import { AddressData, AIAddressAnalysis, NearbyPlace, CommunityRTRWContribution } from '@/types/address';
import { X, Sparkles, Brain, Check, Loader2, Info, CheckCircle2 } from 'lucide-react';

interface AIAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: AddressData | null;
  nearbyPlaces: NearbyPlace[];
  communityRTRW: CommunityRTRWContribution[];
  onApplyAI: (updated: AddressData) => void;
}

export default function AIAddressModal({
  isOpen,
  onClose,
  address,
  nearbyPlaces,
  communityRTRW,
  onApplyAI,
}: AIAddressModalProps) {
  const [userNotes, setUserNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAddressAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !address) return null;

  const handleRunAI = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          nearbyPlaces,
          communityRTRW,
          userNotes: userNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menjalankan analisis.');
      }

      setAnalysisResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!analysisResult) return;
    const updated: AddressData = {
      ...address,
      jalan: analysisResult.jalan || address.jalan,
      rt: analysisResult.rt || address.rt,
      rw: analysisResult.rw || address.rw,
      kelurahan: analysisResult.kelurahan || address.kelurahan,
      kecamatan: analysisResult.kecamatan || address.kecamatan,
      kota: analysisResult.kota || address.kota,
      provinsi: analysisResult.provinsi || address.provinsi,
      kodePos: analysisResult.kodePos || address.kodePos,
      patokan: analysisResult.patokan || address.patokan,
      formattedAddress: analysisResult.formattedAddress || address.formattedAddress,
    };
    onApplyAI(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Smart Address Specialist
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </h3>
              <p className="text-[11px] text-violet-100">
                Koreksi hierarki wilayah, bersihkan jalan vs kelurahan, & buat patokan kurir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800">
              {errorMessage}
            </div>
          )}

          {/* Engine Status Badge */}
          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-[11px] text-slate-700 dark:text-slate-300">
              <b className="text-indigo-600 dark:text-indigo-400">Smart Postal Engine Bawaan:</b> Siap pakai otomatis, instan, bebas kuota, dan tanpa perlu setup API key.
            </div>
          </div>

          {/* Current Address Preview */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Alamat yang Akan Dianalisis:
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
              {address.formattedAddress || 'Titik Terpilih'}
            </p>
          </div>

          {/* Optional User Notes */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Tambahan (Opsional):
            </label>
            <input
              type="text"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Misal: Kosan putri pagar hitam, dekat warung madura..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleRunAI}
            disabled={isAnalyzing}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sedang Menganalisis & Menyempurnakan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Jalankan Analisis Sekarang</span>
              </>
            )}
          </button>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-3xl border border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                  <Sparkles className="w-3 h-3" />
                  Skor Akurasi: {analysisResult.confidenceScore}%
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                  Sumber: <b className="text-indigo-600 dark:text-indigo-400">Smart Postal Engine ⚡</b>
                </span>
              </div>

              {/* Formatted address */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-xs text-slate-900 dark:text-slate-100 font-bold leading-relaxed">
                {analysisResult.formattedAddress}
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900">
                  <span className="text-[10px] text-slate-400 block">Jalan:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate block">
                    {analysisResult.jalan || '-'}
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900">
                  <span className="text-[10px] text-slate-400 block">Kelurahan / Desa (Resmi):</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate block">
                    {analysisResult.kelurahan || '-'}
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900">
                  <span className="text-[10px] text-slate-400 block">Kecamatan:</span>
                  <span className="font-semibold">{analysisResult.kecamatan || '-'}</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900">
                  <span className="text-[10px] text-slate-400 block">RT / RW:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {analysisResult.rt || analysisResult.rw ? `RT ${analysisResult.rt || '-'}/RW ${analysisResult.rw || '-'}` : '-'}
                  </span>
                </div>
              </div>

              {/* Kemendagri Official Candidates & Quick Selector */}
              {analysisResult.officialCandidates && analysisResult.officialCandidates.length > 0 && (
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                    Daftar Resmi Kemendagri di Kec. {analysisResult.kecamatan}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.officialCandidates.map((c) => {
                      const isSelected =
                        (analysisResult.kelurahan || '').toLowerCase().trim() ===
                        c.name.toLowerCase().trim();
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => {
                            setAnalysisResult({
                              ...analysisResult,
                              kelurahan: c.name,
                            });
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                          <span>{c.name}</span>
                          {c.distanceMeters != null && (
                            <span className="opacity-70 text-[9px]">
                              {c.distanceMeters < 100
                                ? '0km'
                                : `${(c.distanceMeters / 1000).toFixed(1)}km`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Explanation & Advice */}
              <div className="space-y-1.5 text-[11px] text-indigo-950 dark:text-indigo-200">
                <p className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span><b>Penjelasan:</b> {analysisResult.explanation}</span>
                </p>
                {analysisResult.patokan && (
                  <p className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs">
                    <b>Patokan Kurir:</b> {analysisResult.patokan}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 text-xs font-semibold"
          >
            Batal
          </button>

          {analysisResult && (
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Hasil</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
