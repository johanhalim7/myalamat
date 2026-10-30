'use client';

import React, { useState } from 'react';
import { AddressData } from '@/types/address';
import { parseRawIndonesianAddress, applyParsedAddress } from '@/utils/smartAddressParser';
import { X, Wand2, Check, Sparkles } from 'lucide-react';

interface SmartAddressParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: AddressData | null;
  onApplyParsed: (updated: AddressData) => void;
}

export default function SmartAddressParserModal({
  isOpen,
  onClose,
  currentAddress,
  onApplyParsed,
}: SmartAddressParserModalProps) {
  const [inputText, setInputText] = useState('');
  const [parsedResult, setParsedResult] = useState<Partial<AddressData> | null>(null);

  if (!isOpen) return null;

  const handleParse = () => {
    if (!inputText.trim()) return;
    const parsed = parseRawIndonesianAddress(inputText);
    setParsedResult(parsed);
  };

  const handleApply = () => {
    if (!parsedResult) return;
    const base = currentAddress || {
      jalan: '',
      rt: '',
      rw: '',
      kelurahan: '',
      kecamatan: '',
      kota: '',
      provinsi: '',
      kodePos: '',
      patokan: '',
      formattedAddress: '',
      displayName: '',
      latitude: -6.175392,
      longitude: 106.827153,
      accuracy: null,
    };
    const finalAddress = applyParsedAddress(base, parsedResult);
    onApplyParsed(finalAddress);
    onClose();
  };

  const exampleText = 'Kost Melati 2, Jl. Cikutra Barat No. 42 RT 03 RW 08 Kel. Cikutra Kec. Cibeunying Kidul Kota Bandung Jawa Barat 40124 (Pagar abu-abu samping warung madura)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Format Alamat Cerdas (AI Parser)
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </h3>
              <p className="text-[11px] text-indigo-100">
                Tempel teks alamat acak dari WhatsApp / SMS, sistem akan merapikannya
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
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Tempel Teks Alamat Mentah:
              </label>
              <button
                type="button"
                onClick={() => {
                  setInputText(exampleText);
                  setParsedResult(parseRawIndonesianAddress(exampleText));
                }}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                Coba Contoh
              </button>
            </div>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Contoh: jl diponegoro gang melati no 5 rt 02 rw 05 kelurahan sukajadi kota bandung 40162 pagar hitam samping fotocopy..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleParse}
            disabled={!inputText.trim()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Wand2 className="w-4 h-4" />
            <span>Ekstrak & Rapikan Alamat</span>
          </button>

          {/* Parsed Result Preview */}
          {parsedResult && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                Hasil Ekstraksi Komponen:
              </span>

              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Jalan:</span>
                  <span className="font-semibold">{parsedResult.jalan || '-'}</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">RT / RW:</span>
                  <span className="font-semibold">
                    {parsedResult.rt || parsedResult.rw ? `RT ${parsedResult.rt || '-'}/RW ${parsedResult.rw || '-'}` : '-'}
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Kelurahan:</span>
                  <span className="font-semibold">{parsedResult.kelurahan || '-'}</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Kecamatan:</span>
                  <span className="font-semibold">{parsedResult.kecamatan || '-'}</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Kota:</span>
                  <span className="font-semibold">{parsedResult.kota || '-'}</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Kode Pos:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{parsedResult.kodePos || '-'}</span>
                </div>
              </div>

              {parsedResult.patokan && (
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-[10px] text-slate-400 block">Patokan Terdeteksi:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{parsedResult.patokan}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-semibold"
          >
            Batal
          </button>

          {parsedResult && (
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Gunakan Alamat Ini</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
