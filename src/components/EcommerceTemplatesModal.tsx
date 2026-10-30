'use client';

import React, { useState } from 'react';
import { AddressData } from '@/types/address';
import {
  X,
  Copy,
  Check,
  ShoppingBag,
  Store,
  Video,
  Bike,
  Sparkles,
  Info,
} from 'lucide-react';

interface EcommerceTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: AddressData;
}

type PlatformTab = 'shopee' | 'tokopedia' | 'tiktok' | 'gofood';

export default function EcommerceTemplatesModal({
  isOpen,
  onClose,
  address,
}: EcommerceTemplatesModalProps) {
  const [activeTab, setActiveTab] = useState<PlatformTab>('shopee');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const roadWithRtRw = [
    address.jalan,
    address.rt || address.rw ? `RT ${address.rt || '0'}/RW ${address.rw || '0'}` : '',
    address.kelurahan ? `Kel. ${address.kelurahan}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const platforms = [
    {
      id: 'shopee' as PlatformTab,
      name: 'Shopee',
      icon: <ShoppingBag className="w-4 h-4" />,
      color: 'hover:border-orange-500',
      activeColor: 'bg-orange-500 text-white shadow-md shadow-orange-500/20',
    },
    {
      id: 'tokopedia' as PlatformTab,
      name: 'Tokopedia',
      icon: <Store className="w-4 h-4" />,
      color: 'hover:border-emerald-500',
      activeColor: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20',
    },
    {
      id: 'tiktok' as PlatformTab,
      name: 'TikTok Shop',
      icon: <Video className="w-4 h-4" />,
      color: 'hover:border-slate-800',
      activeColor: 'bg-slate-900 dark:bg-slate-700 text-white shadow-md shadow-slate-900/20',
    },
    {
      id: 'gofood' as PlatformTab,
      name: 'GoFood / Grab',
      icon: <Bike className="w-4 h-4" />,
      color: 'hover:border-green-500',
      activeColor: 'bg-green-600 text-white shadow-md shadow-green-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Template Alamat E-Commerce & Kurir
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Salin kolom per kolom sesuai urutan form aplikasi tujuan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveTab(p.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === p.id
                  ? p.activeColor
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {p.icon}
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        {/* Content based on Active Tab */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* TAB 1: SHOPEE */}
          {activeTab === 'shopee' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl flex items-start gap-2.5 text-orange-900 dark:text-orange-200">
                <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <span>
                  <b>Urutan Form Shopee:</b> Buka <i>Saya &gt; Pengaturan Akun &gt; Alamat Saya &gt; Tambah Alamat Baru</i>.
                </span>
              </div>

              {/* Shopee Step 1 */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  1. Pilih Wilayah (Dropdown Shopee)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Provinsi:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{address.provinsi || '-'}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Kota / Kab:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{address.kota || '-'}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Kecamatan:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{address.kecamatan || '-'}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Kode Pos:</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">{address.kodePos || '-'}</span>
                    </div>
                    {address.kodePos && (
                      <button
                        onClick={() => copyText(address.kodePos, 'shopee-pos')}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500"
                      >
                        {copiedKey === 'shopee-pos' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Shopee Step 2: Jalan */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    2. Kolom &ldquo;Nama Jalan, Gedung, No. Rumah&rdquo;
                  </span>
                  <button
                    onClick={() => copyText(roadWithRtRw, 'shopee-jalan')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1 font-semibold"
                  >
                    {copiedKey === 'shopee-jalan' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Jalan</span>
                  </button>
                </div>
                <p className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                  {roadWithRtRw || '-'}
                </p>
              </div>

              {/* Shopee Step 3: Patokan */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    3. Kolom &ldquo;Detail Lainnya (Patokan)&rdquo;
                  </span>
                  {address.patokan && (
                    <button
                      onClick={() => copyText(address.patokan, 'shopee-patokan')}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1 font-semibold"
                    >
                      {copiedKey === 'shopee-patokan' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Salin Patokan</span>
                    </button>
                  )}
                </div>
                <p className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {address.patokan || <span className="text-slate-400 italic">Belum ada patokan. Tambahkan di form edit.</span>}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TOKOPEDIA */}
          {activeTab === 'tokopedia' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-start gap-2.5 text-emerald-900 dark:text-emerald-200">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <b>Form Tokopedia:</b> Cari &ldquo;Kota atau Kecamatan&rdquo; terlebih dahulu, lalu masukkan alamat lengkap dan catatan kurir.
                </span>
              </div>

              {/* Tokped 1: Kota / Kec */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    1. Kolom &ldquo;Kota atau Kecamatan&rdquo;
                  </span>
                  <button
                    onClick={() => copyText(`${address.kecamatan}, ${address.kota}`, 'tokped-kec')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold"
                  >
                    {copiedKey === 'tokped-kec' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin</span>
                  </button>
                </div>
                <p className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                  {address.kecamatan ? `${address.kecamatan}, ${address.kota}` : '-'}
                </p>
              </div>

              {/* Tokped 2: Alamat Lengkap */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    2. Kolom &ldquo;Alamat Lengkap&rdquo;
                  </span>
                  <button
                    onClick={() => copyText(roadWithRtRw, 'tokped-alamat')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold"
                  >
                    {copiedKey === 'tokped-alamat' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Alamat</span>
                  </button>
                </div>
                <p className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                  {roadWithRtRw}
                </p>
              </div>

              {/* Tokped 3: Catatan Kurir */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    3. Kolom &ldquo;Catatan untuk Kurir (Opsional)&rdquo;
                  </span>
                  {address.patokan && (
                    <button
                      onClick={() => copyText(address.patokan, 'tokped-catatan')}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold"
                    >
                      {copiedKey === 'tokped-catatan' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Salin</span>
                    </button>
                  )}
                </div>
                <p className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {address.patokan || <span className="text-slate-400 italic">Belum ada patokan.</span>}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: TIKTOK SHOP */}
          {activeTab === 'tiktok' && (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  Wilayah Bertingkat TikTok:
                </span>
                <p className="text-slate-700 dark:text-slate-300 font-medium mb-3">
                  {address.provinsi} &gt; {address.kota} &gt; {address.kecamatan} &gt; {address.kelurahan}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Kode Pos: <b>{address.kodePos || '-'}</b></span>
                  {address.kodePos && (
                    <button
                      onClick={() => copyText(address.kodePos, 'tiktok-pos')}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold"
                    >
                      {copiedKey === 'tiktok-pos' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Salin Kode Pos</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Nama Jalan & Gedung:
                  </span>
                  <button
                    onClick={() => {
                      const full = [roadWithRtRw, address.patokan ? `(${address.patokan})` : ''].filter(Boolean).join(' ');
                      copyText(full, 'tiktok-full');
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold"
                  >
                    {copiedKey === 'tiktok-full' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Lengkap</span>
                  </button>
                </div>
                <p className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium">
                  {[roadWithRtRw, address.patokan ? `(${address.patokan})` : ''].filter(Boolean).join(' ')}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: GOFOOD / GRAB */}
          {activeTab === 'gofood' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-2xl text-green-900 dark:text-green-200">
                <p className="font-semibold mb-1">💡 Tips Pemesanan Makanan Online:</p>
                <p className="text-[11px] text-green-800 dark:text-green-300">
                  Untuk driver ojol, patokan fisik (warna pagar, bel, atau lantai kos) jauh lebih penting daripada kelurahan/kecamatan.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Catatan Driver / Detail Lokasi Antar:
                  </span>
                  <button
                    onClick={() => {
                      const note = `${address.jalan}${address.patokan ? `, Patokan: ${address.patokan}` : ''}`;
                      copyText(note, 'driver-note');
                    }}
                    className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1 font-bold shadow-sm"
                  >
                    {copiedKey === 'driver-note' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Salin Catatan Driver</span>
                  </button>
                </div>
                <p className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                  {address.jalan}
                  {address.patokan && <span className="text-blue-600 dark:text-blue-400 font-normal">, Patokan: {address.patokan}</span>}
                </p>
              </div>
            </div>
          )}

          {/* Bottom All-in-One Bar */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
            <div>
              <p className="font-bold text-xs text-blue-900 dark:text-blue-200">Salin 1 Baris Lengkap</p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400">Untuk chat penjual atau catatan umum</p>
            </div>
            <button
              onClick={() => copyText(address.formattedAddress, 'all-single')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              {copiedKey === 'all-single' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedKey === 'all-single' ? 'Tersalin!' : 'Salin Semua'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
