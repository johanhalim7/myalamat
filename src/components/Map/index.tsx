'use client';

import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] md:min-h-[460px] rounded-2xl bg-slate-100 animate-pulse flex flex-col items-center justify-center border border-slate-200 text-slate-400 gap-2">
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
        <svg
          className="w-5 h-5 text-slate-400 animate-bounce"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <p className="text-xs font-medium">Memuat Peta Interaktif...</p>
    </div>
  ),
});

export default MapClient;
