'use client';

import React, { useState, useRef } from 'react';
import { SavedAddress, AddressData } from '@/types/address';
import {
  Bookmark,
  Home,
  Building2,
  School,
  KeyRound,
  MapPin,
  Copy,
  Check,
  Trash2,
  Navigation,
  Download,
  Upload,
} from 'lucide-react';

interface SavedAddressesProps {
  savedList: SavedAddress[];
  onSelectAddress: (addr: AddressData) => void;
  onDeleteAddress: (id: string) => void;
  onImportAddresses?: (list: SavedAddress[]) => void;
}

export default function SavedAddresses({
  savedList,
  onSelectAddress,
  onDeleteAddress,
  onImportAddresses,
}: SavedAddressesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLabelBadge = (label: string, custom?: string) => {
    switch (label) {
      case 'Rumah':
        return {
          icon: <Home className="w-3.5 h-3.5" />,
          color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          text: 'Rumah',
        };
      case 'Kantor':
        return {
          icon: <Building2 className="w-3.5 h-3.5" />,
          color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          text: 'Kantor',
        };
      case 'Kos':
        return {
          icon: <School className="w-3.5 h-3.5" />,
          color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          text: 'Kos',
        };
      case 'Kontrakan':
        return {
          icon: <KeyRound className="w-3.5 h-3.5" />,
          color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          text: 'Kontrakan',
        };
      default:
        return {
          icon: <MapPin className="w-3.5 h-3.5" />,
          color: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          text: custom || 'Alamat',
        };
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJSON = () => {
    if (savedList.length === 0) return;
    const blob = new Blob([JSON.stringify(savedList, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alamatku-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportAddresses) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportAddresses(parsed);
        }
      } catch (err) {
        console.error('Import error:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (savedList.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400 border border-slate-100 dark:border-slate-800">
          <Bookmark className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
          Belum Ada Alamat Tersimpan
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-3">
          Simpan alamat penting (Kos, Rumah, atau Kantor) agar mudah disalin kapan saja saat belanja online.
        </p>

        {onImportAddresses && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <Upload className="w-3.5 h-3.5" />
              Pulihkan dari Cadangan JSON
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
            <Bookmark className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Daftar Alamat Tersimpan ({savedList.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
            title="Download cadangan alamat ke file JSON"
          >
            <Download className="w-3 h-3" />
            Cadangkan (JSON)
          </button>

          {onImportAddresses && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
                title="Pulihkan alamat dari file JSON"
              >
                <Upload className="w-3 h-3" />
                Impor
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {savedList.map((item) => {
          const badge = getLabelBadge(item.label, item.customLabel);
          return (
            <div
              key={item.id}
              className="group p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all flex flex-col justify-between bg-white dark:bg-slate-800/40"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}
                  >
                    {badge.icon}
                    {badge.text}
                  </span>

                  <button
                    onClick={() => onDeleteAddress(item.id)}
                    className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Hapus alamat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed mb-3 line-clamp-3">
                  {item.address.formattedAddress}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectAddress(item.address)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  Lihat di Peta
                </button>

                <button
                  onClick={() => handleCopy(item.id, item.address.formattedAddress)}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 dark:text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
