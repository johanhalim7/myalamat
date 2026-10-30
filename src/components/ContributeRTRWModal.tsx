'use client';

import React, { useState } from 'react';
import { AddressData, CommunityRTRWContribution } from '@/types/address';
import { X, Check, Sparkles, HeartHandshake, Loader2 } from 'lucide-react';

interface ContributeRTRWModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: AddressData | null;
  onContributionSuccess: (newEntry: CommunityRTRWContribution) => void;
}

export default function ContributeRTRWModal({
  isOpen,
  onClose,
  address,
  onContributionSuccess,
}: ContributeRTRWModalProps) {
  const [rt, setRt] = useState(address?.rt || '');
  const [rw, setRw] = useState(address?.rw || '');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !address) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rt.trim() && !rw.trim()) {
      setErrorMessage('Nomor RT atau RW harus diisi minimal salah satu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/rtrw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: address.latitude,
          longitude: address.longitude,
          rt: rt.trim(),
          rw: rw.trim(),
          kelurahan: address.kelurahan,
          kecamatan: address.kecamatan,
          kota: address.kota,
          catatan: catatan.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan data.');
      }

      onContributionSuccess(data.contribution);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Bantu Komunitas: Bagikan RT/RW
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </h3>
              <p className="text-[11px] text-emerald-100">
                Bantu anak kos & warga baru di area ini mengetahui RT/RW mereka
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800">
              {errorMessage}
            </div>
          )}

          {/* Location preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Titik Lokasi Saat Ini:
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {address.jalan || 'Titik Terpilih'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {address.kelurahan ? `Kel. ${address.kelurahan}, ` : ''}
              {address.kecamatan ? `Kec. ${address.kecamatan}, ` : ''}
              {address.kota}
            </p>
          </div>

          {/* RT & RW Input */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                RT (Rukun Tetangga) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={rt}
                onChange={(e) => setRt(e.target.value)}
                placeholder="Contoh: 003"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                RW (Rukun Warga) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={rw}
                onChange={(e) => setRw(e.target.value)}
                placeholder="Contoh: 008"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Catatan Sumber / Plang */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Sumber / Patokan (Opsional)
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Plang di gapura Gang Mawar 3 / info bapak kos"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
            💡 <b>Kenapa ini penting?</b> Peta daring seperti Google Maps & OSM tidak mencatat RT/RW. Dengan membagikan ini, siapa saja yang tinggal atau memesan paket di sekitar titik ini akan terbantu!
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Kirim Data RT/RW</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
