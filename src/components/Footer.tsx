import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <span>Dibuat dengan</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          <span>untuk membantu pejuang belanja online & pendatang baru</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          OpenStreetMap &bull; Esri Satellite &bull; PWA Offline Ready &bull; Bebas Biaya
        </p>
      </div>
    </footer>
  );
}
