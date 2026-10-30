'use client';

import React, { useState, useEffect } from 'react';
import { AddressData } from '@/types/address';
import { formatWhatsAppShareText, getGoogleMapsUrl } from '@/utils/addressParser';
import { X, Share2, Copy, Check, MessageSquare, ExternalLink, QrCode } from 'lucide-react';
import QRCodeLib from 'qrcode';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: AddressData;
}

export default function ShareModal({
  isOpen,
  onClose,
  address,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const shareText = formatWhatsAppShareText(address);
  const mapsUrl = getGoogleMapsUrl(address.latitude, address.longitude);
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  useEffect(() => {
    if (isOpen && address) {
      QRCodeLib.toDataURL(mapsUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [isOpen, address, mapsUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Bagikan Alamat & QR Code
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* QR Code toggle box */}
          {showQR ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR Code Titik Alamat"
                  className="w-48 h-48 rounded-xl shadow-md border border-slate-200 mb-2"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-slate-200 animate-pulse mb-2" />
              )}
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pindai untuk membuka titik lokasi di Google Maps
              </p>
              <button
                type="button"
                onClick={() => setShowQR(false)}
                className="mt-2 text-xs text-blue-600 hover:underline font-medium"
              >
                Kembali ke teks
              </button>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto">
              {shareText}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Kirim ke WhatsApp Kurir / Teman
            </a>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopy}
                className="py-2.5 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Tersalin!' : 'Salin Pesan'}
              </button>

              <button
                type="button"
                onClick={() => setShowQR(!showQR)}
                className="py-2.5 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {showQR ? 'Tutup QR' : 'Lihat QR Code'}
              </button>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              Buka Titik di Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
