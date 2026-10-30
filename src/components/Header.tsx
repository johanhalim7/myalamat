'use client';

import React from 'react';
import { MapPin, Navigation, Loader2, Moon, Sun, Download, Wand2 } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { usePWA } from './PWAProvider';

interface HeaderProps {
  onDetectLocation: () => void;
  isLocating: boolean;
  savedCount: number;
  onScrollToSaved: () => void;
  onOpenSmartParser: () => void;
}

export default function Header({
  onDetectLocation,
  isLocating,
  savedCount,
  onScrollToSaved,
  onOpenSmartParser,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, installApp } = usePWA();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <MapPin className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                AlamatKu
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                ID
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Pencari alamat akurat & detail siap e-commerce
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Smart Parser Button */}
          <button
            type="button"
            onClick={onOpenSmartParser}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition-colors"
            title="Rapikan alamat acak dengan AI"
          >
            <Wand2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">Format Cerdas</span>
          </button>

          {/* Saved count badge */}
          {savedCount > 0 && (
            <button
              onClick={onScrollToSaved}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex items-center gap-1.5"
            >
              <span>Tersimpan</span>
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[11px] font-bold inline-flex items-center justify-center">
                {savedCount}
              </span>
            </button>
          )}

          {/* PWA Install Button (shows when installable) */}
          {isInstallable && (
            <button
              type="button"
              onClick={installApp}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all animate-bounce"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pasang App</span>
            </button>
          )}

          {/* Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* GPS Button */}
          <button
            onClick={onDetectLocation}
            disabled={isLocating}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
              isLocating
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
            }`}
          >
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="hidden sm:inline">Mendeteksi GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 fill-white/20" />
                <span className="hidden sm:inline">Lokasi Saya</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
