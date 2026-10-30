'use client';

import React, { useState } from 'react';
import { AddressData } from '@/types/address';
import {
  Copy,
  Check,
  Edit3,
  Bookmark,
  Share2,
  ShoppingBag,
  MapPin,
  AlertTriangle,
  Compass,
  FileText,
  ExternalLink,
  Wand2,
  Brain,
} from 'lucide-react';
import { formatFormalAddress, getGoogleMapsUrl } from '@/utils/addressParser';

interface AddressCardProps {
  address: AddressData | null;
  isLoading: boolean;
  onOpenEdit: () => void;
  onOpenSave: () => void;
  onOpenTemplates: () => void;
  onOpenShare: () => void;
  onOpenSmartParser: () => void;
  onOpenAIModal?: () => void;
}

export default function AddressCard({
  address,
  isLoading,
  onOpenEdit,
  onOpenSave,
  onOpenTemplates,
  onOpenShare,
  onOpenSmartParser,
  onOpenAIModal,
}: AddressCardProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyText = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  if (!address && !isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Compass className="w-7 h-7 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          Pilih Lokasi untuk Menampilkan Alamat
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Klik tombol &ldquo;Lokasi Saya&rdquo; atau geser pin di peta untuk melihat alamat lengkap di titik tersebut.
        </p>
      </div>
    );
  }

  const isRtRwEmpty = !address?.rt && !address?.rw;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Alamat Terdeteksi
            </h3>
            <span className="text-[11px] text-slate-400">
              Format terverifikasi e-commerce & kurir
            </span>
          </div>
        </div>

        {/* GPS Accuracy Badge & AI Badge */}
        <div className="flex items-center gap-1.5">
          {address?.accuracy && (
            <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full font-medium border border-slate-200 dark:border-slate-700">
              GPS: ±{Math.round(address.accuracy)}m
            </span>
          )}

          {onOpenAIModal && (
            <button
              onClick={onOpenAIModal}
              className="px-2.5 py-1 bg-violet-100 dark:bg-violet-950/60 hover:bg-violet-200 text-violet-800 dark:text-violet-300 rounded-full font-bold text-[11px] flex items-center gap-1 border border-violet-200 dark:border-violet-800 transition-colors"
            >
              <Brain className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>Analisis AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Single-line Formatted Box */}
      <div className="relative p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 group">
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Alamat Siap Salin (Shopee / Tokped / TikTok / Kurir)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => copyText(formatFormalAddress(address!), 'formal')}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Salin dalam format dokumen multi-baris"
            >
              <FileText className="w-3 h-3" />
              {copiedType === 'formal' ? 'Format Formal Tersalin!' : 'Format Formal'}
            </button>
          </div>
        </div>

        <p className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed break-words">
          {isLoading ? (
            <span className="text-slate-400 italic">Sedang mengambil nama alamat...</span>
          ) : (
            address?.formattedAddress || '-'
          )}
        </p>

        {/* Prominent Copy Button & Ecommerce Button */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => copyText(address?.formattedAddress || '', 'shopee')}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            {copiedType === 'shopee' ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Alamat Berhasil Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Alamat 1 Baris</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenTemplates}
            className="text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 font-bold flex items-center gap-1.5 px-3 py-2 rounded-xl border border-orange-200 dark:border-orange-800 transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-orange-500" />
            <span>Template E-Commerce</span>
          </button>
        </div>
      </div>

      {/* RT/RW Alert if empty */}
      {isRtRwEmpty && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <b>RT & RW belum terisi.</b> Lihat daftar fasilitas & sekolah di bawah atau klik <b>Analisis AI</b> untuk mengisi otomatis.
            </span>
          </div>
          <button
            onClick={onOpenEdit}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shrink-0 text-[11px] transition-colors"
          >
            Lengkapi
          </button>
        </div>
      )}

      {/* Breakdown Detail Grid */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Rincian Komponen Alamat:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Jalan */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Jalan & Nomor:</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{address?.jalan || '-'}</span>
            </div>
            {address?.jalan && (
              <button
                onClick={() => copyText(address.jalan, 'field-jalan')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title="Salin Jalan"
              >
                {copiedType === 'field-jalan' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* RT / RW */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">RT / RW:</span>
              <span className={`font-semibold ${isRtRwEmpty ? 'text-amber-600 dark:text-amber-400 italic' : 'text-slate-800 dark:text-slate-200'}`}>
                {address?.rt || address?.rw ? `RT ${address.rt || '-'} / RW ${address.rw || '-'}` : 'Belum diisi'}
              </span>
            </div>
            <button
              onClick={onOpenEdit}
              className="text-blue-600 dark:text-blue-400 hover:underline p-1 text-[11px] font-semibold"
            >
              Ubah
            </button>
          </div>

          {/* Kelurahan */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Kelurahan / Desa:</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{address?.kelurahan || '-'}</span>
            </div>
            {address?.kelurahan && (
              <button
                onClick={() => copyText(address.kelurahan, 'field-kel')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title="Salin Kelurahan"
              >
                {copiedType === 'field-kel' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Kecamatan */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Kecamatan:</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{address?.kecamatan || '-'}</span>
            </div>
            {address?.kecamatan && (
              <button
                onClick={() => copyText(address.kecamatan, 'field-kec')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title="Salin Kecamatan"
              >
                {copiedType === 'field-kec' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Kota / Kabupaten */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Kota / Kabupaten:</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{address?.kota || '-'}</span>
            </div>
            {address?.kota && (
              <button
                onClick={() => copyText(address.kota, 'field-kota')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title="Salin Kota"
              >
                {copiedType === 'field-kota' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Provinsi & Kode Pos */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Provinsi & Kode Pos:</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                {address?.provinsi || '-'} {address?.kodePos ? `(${address.kodePos})` : ''}
              </span>
            </div>
            {address?.kodePos && (
              <button
                onClick={() => copyText(address.kodePos, 'field-kodepos')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title="Salin Kode Pos"
              >
                {copiedType === 'field-kodepos' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Patokan (jika ada) */}
        {address?.patokan && (
          <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 text-xs">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block mb-0.5">
              Patokan / Petunjuk Kurir:
            </span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">{address.patokan}</span>
          </div>
        )}
      </div>

      {/* Action Footer Toolbar */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenEdit}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Manual
          </button>

          {onOpenAIModal && (
            <button
              onClick={onOpenAIModal}
              className="px-3 py-1.5 bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Brain className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              AI Assistant
            </button>
          )}

          <button
            onClick={onOpenSmartParser}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Rapikan alamat acak dengan AI"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Format Teks
          </button>

          <button
            onClick={onOpenSave}
            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5" />
            Simpan
          </button>

          <button
            onClick={onOpenShare}
            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Bagikan & QR
          </button>
        </div>

        {address && (
          <a
            href={getGoogleMapsUrl(address.latitude, address.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Google Maps
          </a>
        )}
      </div>
    </div>
  );
}
