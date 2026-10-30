'use client';

import React, { useState } from 'react';
import { AddressData } from '@/types/address';
import { X, Copy, Check, ShoppingBag, Sparkles } from 'lucide-react';

interface ShopeeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: AddressData;
}

export default function ShopeeGuideModal({
  isOpen,
  onClose,
  address,
}: ShopeeGuideModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-orange-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-orange-100 flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Panduan Isi Form Alamat Shopee
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              </h3>
              <p className="text-[11px] text-orange-100">
                Salin bagian per bagian langsung ke aplikasi Shopee Anda
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Step 1 */}
          <div className="p-3.5 bg-orange-50/70 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-orange-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white inline-flex items-center justify-center text-[11px] font-bold">
                  1
                </span>
                Pilih Wilayah (Provinsi / Kota / Kecamatan / Kode Pos)
              </span>
            </div>
            <p className="text-slate-600 mb-2 text-[11px]">
              Di Shopee, buka form tambah alamat, lalu pilih dropdown wilayah berikut:
            </p>
            <div className="grid grid-cols-2 gap-2 text-slate-800">
              <div className="bg-white p-2 rounded-lg border border-orange-100">
                <span className="text-[10px] text-slate-400 block">Provinsi:</span>
                <span className="font-semibold">{address.provinsi || '-'}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-orange-100">
                <span className="text-[10px] text-slate-400 block">Kota / Kabupaten:</span>
                <span className="font-semibold">{address.kota || '-'}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-orange-100">
                <span className="text-[10px] text-slate-400 block">Kecamatan:</span>
                <span className="font-semibold">{address.kecamatan || '-'}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-orange-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Kode Pos:</span>
                  <span className="font-semibold text-orange-600">{address.kodePos || '-'}</span>
                </div>
                {address.kodePos && (
                  <button
                    onClick={() => copyToClipboard(address.kodePos, 'kodepos')}
                    className="p-1 hover:bg-orange-50 text-orange-600 rounded"
                  >
                    {copiedField === 'kodepos' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Nama Jalan */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white inline-flex items-center justify-center text-[11px] font-bold">
                  2
                </span>
                Kolom &ldquo;Nama Jalan, Gedung, No. Rumah&rdquo;
              </span>
              <button
                onClick={() => {
                  const jalanRtrw = [
                    address.jalan,
                    address.rt || address.rw ? `RT ${address.rt || '0'}/RW ${address.rw || '0'}` : '',
                    address.kelurahan ? `Kel. ${address.kelurahan}` : '',
                  ].filter(Boolean).join(', ');
                  copyToClipboard(jalanRtrw, 'jalan');
                }}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1 font-medium transition-colors"
              >
                {copiedField === 'jalan' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kolom Ini</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium">
              {[
                address.jalan,
                address.rt || address.rw ? `RT ${address.rt || '0'}/RW ${address.rw || '0'}` : '',
                address.kelurahan ? `Kel. ${address.kelurahan}` : '',
              ].filter(Boolean).join(', ') || 'Belum diisi'}
            </div>
          </div>

          {/* Step 3: Detail Lainnya */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white inline-flex items-center justify-center text-[11px] font-bold">
                  3
                </span>
                Kolom &ldquo;Detail Lainnya (Patokan)&rdquo;
              </span>
              {address.patokan && (
                <button
                  onClick={() => copyToClipboard(address.patokan, 'patokan')}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1 font-medium transition-colors"
                >
                  {copiedField === 'patokan' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Patokan</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
              {address.patokan || (
                <span className="text-slate-400 italic">
                  Belum ada patokan. Klik &apos;Edit Alamat&apos; di beranda untuk menambahkan (misal: warna pagar, seberang masjid).
                </span>
              )}
            </div>
          </div>

          {/* Atau Salin Utuh */}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 flex items-center justify-between">
            <div>
              <p className="font-semibold text-xs">Butuh Alamat 1 Baris Lengkap?</p>
              <p className="text-[11px] text-blue-700">Untuk catatan pesanan atau chat penjual</p>
            </div>
            <button
              onClick={() => copyToClipboard(address.formattedAddress, 'all')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-sm"
            >
              {copiedField === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedField === 'all' ? 'Tersalin!' : 'Salin Semua'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
