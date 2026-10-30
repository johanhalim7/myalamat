'use client';

import React, { useState } from 'react';
import { AddressData } from '@/types/address';
import { formatSingleLineAddress } from '@/utils/addressParser';
import { X, Check, Info } from 'lucide-react';

interface AddressEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: AddressData;
  onSave: (updated: AddressData) => void;
}

export default function AddressEditModal({
  isOpen,
  onClose,
  address,
  onSave,
}: AddressEditModalProps) {
  const [formData, setFormData] = useState<AddressData>({ ...address });

  if (!isOpen) return null;

  const handleChange = (field: keyof AddressData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      next.formattedAddress = formatSingleLineAddress(next);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...formData,
      formattedAddress: formatSingleLineAddress(formData),
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              ✏️ Sesuaikan & Lengkapi Alamat
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lengkapi nomor rumah, RT/RW, atau patokan agar kurir tidak tersasar.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* RT/RW Alert */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              <b>Catatan RT/RW:</b> Data peta otomatis biasanya tidak memiliki RT/RW. Anda dapat melihatnya di plang gapura gang atau papan nama RT setempat.
            </span>
          </div>

          {/* Jalan & Nomor */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nama Jalan, Gang, atau Nomor Rumah / Gedung <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.jalan}
              onChange={(e) => handleChange('jalan', e.target.value)}
              placeholder="Contoh: Jl. Diponegoro No. 42 / Gang Mawar 3"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* RT & RW */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                RT (Rukun Tetangga)
              </label>
              <input
                type="text"
                value={formData.rt}
                onChange={(e) => handleChange('rt', e.target.value)}
                placeholder="Contoh: 003"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                RW (Rukun Warga)
              </label>
              <input
                type="text"
                value={formData.rw}
                onChange={(e) => handleChange('rw', e.target.value)}
                placeholder="Contoh: 008"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Patokan / Catatan Khusus */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Patokan / Detail Tambahan (Sangat berguna untuk kurir)
            </label>
            <input
              type="text"
              value={formData.patokan}
              onChange={(e) => handleChange('patokan', e.target.value)}
              placeholder="Contoh: Rumah cat pagar hitam, samping warung madura, belok kiri"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Kelurahan & Kecamatan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kelurahan / Desa
              </label>
              <input
                type="text"
                value={formData.kelurahan}
                onChange={(e) => handleChange('kelurahan', e.target.value)}
                placeholder="Kelurahan"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kecamatan
              </label>
              <input
                type="text"
                value={formData.kecamatan}
                onChange={(e) => handleChange('kecamatan', e.target.value)}
                placeholder="Kecamatan"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Kota & Provinsi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kota / Kabupaten
              </label>
              <input
                type="text"
                value={formData.kota}
                onChange={(e) => handleChange('kota', e.target.value)}
                placeholder="Kota/Kabupaten"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Provinsi
              </label>
              <input
                type="text"
                value={formData.provinsi}
                onChange={(e) => handleChange('provinsi', e.target.value)}
                placeholder="Provinsi"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Kode Pos */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Kode Pos (5 digit)
            </label>
            <input
              type="text"
              maxLength={5}
              value={formData.kodePos}
              onChange={(e) => handleChange('kodePos', e.target.value)}
              placeholder="Contoh: 40124"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preview Hasil */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Preview Hasil Alamat:
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
              {formatSingleLineAddress(formData) || 'Belum ada alamat'}
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
