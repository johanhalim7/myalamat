'use client';

import React, { useState } from 'react';
import { AddressData, AddressLabel, SavedAddress } from '@/types/address';
import { X, Bookmark, Home, Building2, School, KeyRound, MapPin } from 'lucide-react';

interface SaveAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: AddressData;
  onSaved: (saved: SavedAddress) => void;
}

const labelOptions: { label: AddressLabel; icon: React.ReactNode; desc: string }[] = [
  { label: 'Rumah', icon: <Home className="w-4 h-4" />, desc: 'Tempat tinggal utama' },
  { label: 'Kos', icon: <School className="w-4 h-4" />, desc: 'Kamar kos/asrama' },
  { label: 'Kontrakan', icon: <KeyRound className="w-4 h-4" />, desc: 'Rumah kontrakan' },
  { label: 'Kantor', icon: <Building2 className="w-4 h-4" />, desc: 'Tempat kerja' },
  { label: 'Lainnya', icon: <MapPin className="w-4 h-4" />, desc: 'Label kustom' },
];

export default function SaveAddressModal({
  isOpen,
  onClose,
  address,
  onSaved,
}: SaveAddressModalProps) {
  const [selectedLabel, setSelectedLabel] = useState<AddressLabel>('Rumah');
  const [customLabel, setCustomLabel] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: SavedAddress = {
      id: Date.now().toString(),
      label: selectedLabel,
      customLabel: selectedLabel === 'Lainnya' ? customLabel.trim() : undefined,
      address,
      createdAt: Date.now(),
    };

    onSaved(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <Bookmark className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Simpan Alamat ke AlamatKu
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
              Pilih Kategori / Label Alamat:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {labelOptions.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setSelectedLabel(opt.label)}
                  className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                    selectedLabel === opt.label
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 font-bold ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`p-1.5 rounded-lg ${
                      selectedLabel === opt.label
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {opt.icon}
                  </span>
                  <div>
                    <p className="font-semibold">{opt.label}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedLabel === 'Lainnya' && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Label Kustom:
              </label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Misal: Rumah Nenek, Workshop, Cabang 2"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Alamat yang Disimpan:
            </span>
            <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
              {address.formattedAddress || 'Alamat saat ini'}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm"
            >
              Simpan Sekarang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
