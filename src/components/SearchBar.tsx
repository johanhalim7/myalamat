'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { NominatimSearchResult } from '@/types/address';

interface SearchBarProps {
  onSelectLocation: (lat: number, lon: number) => void;
}

export default function SearchBar({ onSelectLocation }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: NominatimSearchResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      onSelectLocation(lat, lon);
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Cari nama jalan, perumahan, kelurahan, atau gedung di Indonesia..."
          className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {isLoading && (
          <div className="absolute right-3.5 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          </div>
        )}
        {!isLoading && query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden max-h-72 overflow-y-auto">
          <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            Hasil Rekomendasi Lokasi
          </div>
          {results.map((item) => (
            <button
              key={item.place_id}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-start gap-2.5 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0 group"
            >
              <div className="mt-0.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 transition-colors shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {item.display_name.split(',')[0]}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {item.display_name.split(',').slice(1).join(',').trim()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && !isLoading && query.trim().length >= 3 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 z-50 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Tidak ditemukan lokasi yang cocok untuk &ldquo;{query}&rdquo;. Coba geser pin langsung pada peta.
        </div>
      )}
    </div>
  );
}
