'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Map as MapIcon, Satellite } from 'lucide-react';
import { CommunityRTRWContribution } from '@/types/address';

interface MapClientProps {
  position: [number, number];
  accuracy?: number | null;
  onPositionChange: (lat: number, lng: number) => void;
  isLoading?: boolean;
  communityContributions?: CommunityRTRWContribution[];
  onSelectCommunityRTRW?: (rt: string, rw: string) => void;
}

type MapLayerType = 'street' | 'satellite';

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> kontributor',
    },
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Earthstar Geographics',
    },
  },
};

export default function MapClient({
  position,
  accuracy,
  onPositionChange,
  isLoading = false,
  communityContributions = [],
  onSelectCommunityRTRW,
}: MapClientProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const communityLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const onSelectCommunityRTRWRef = useRef(onSelectCommunityRTRW);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('street');

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    onSelectCommunityRTRWRef.current = onSelectCommunityRTRW;
  }, [onSelectCommunityRTRW]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: position,
      zoom: 16,
      zoomControl: true,
      attributionControl: true,
    });

    const initialTile = L.tileLayer(TILE_LAYERS.street.url, TILE_LAYERS.street.options).addTo(map);
    currentTileLayerRef.current = initialTile;

    // Layer group for community RT/RW pins
    const communityGroup = L.layerGroup().addTo(map);
    communityLayerGroupRef.current = communityGroup;

    // Custom modern pin icon with SVG
    const customIcon = L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
          <div class="pin-pulse"></div>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); transform: translateY(-8px);">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#ef4444"></path>
            <circle cx="12" cy="10" r="3" fill="#ffffff" stroke="#b91c1c" stroke-width="1.5"></circle>
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 32],
      popupAnchor: [0, -32],
    });

    // Create Draggable Marker
    const marker = L.marker(position, {
      draggable: true,
      icon: customIcon,
    }).addTo(map);

    marker.bindPopup(`
      <div style="text-align: center; font-size: 13px; font-weight: 500; padding: 4px;">
        📍 <b>Titik Alamat Kamu</b><br/>
        <span style="color: #64748b; font-size: 11px;">Geser pin atau klik peta untuk menyesuaikan</span>
      </div>
    `);

    // Handle marker dragend
    marker.on('dragend', () => {
      const latlng = marker.getLatLng();
      onPositionChangeRef.current(latlng.lat, latlng.lng);
    });

    // Handle map click to reposition pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onPositionChangeRef.current(lat, lng);
    });

    // Add Accuracy Circle if available
    let circle: L.Circle | null = null;
    if (accuracy && accuracy > 0) {
      circle = L.circle(position, {
        radius: Math.min(accuracy, 200),
        color: '#3b82f6',
        fillColor: '#60a5fa',
        fillOpacity: 0.15,
        weight: 1.5,
      }).addTo(map);
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      communityLayerGroupRef.current = null;
      currentTileLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Community Markers on Map
  useEffect(() => {
    if (!communityLayerGroupRef.current) return;
    communityLayerGroupRef.current.clearLayers();

    communityContributions.forEach((item) => {
      const communityIcon = L.divIcon({
        className: 'custom-community-pin',
        html: `
          <div style="background: #059669; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: 700; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap; cursor: pointer;">
            👥 RT ${item.rt}/${item.rw}
          </div>
        `,
        iconSize: [60, 20],
        iconAnchor: [30, 10],
      });

      const comMarker = L.marker([item.latitude, item.longitude], {
        icon: communityIcon,
      });

      comMarker.bindPopup(`
        <div style="font-size: 12px; font-family: sans-serif; text-align: center; padding: 4px;">
          <b style="color: #059669;">👥 Data RT/RW Komunitas</b><br/>
          <b>RT ${item.rt} / RW ${item.rw}</b><br/>
          <span style="font-size: 10px; color: #64748b;">${item.catatan || 'Kontribusi warga'}</span>
        </div>
      `);

      comMarker.on('click', () => {
        if (onSelectCommunityRTRWRef.current) {
          onSelectCommunityRTRWRef.current(item.rt, item.rw);
        }
      });

      communityLayerGroupRef.current?.addLayer(comMarker);
    });
  }, [communityContributions]);

  // Switch Layer (Street ↔ Satellite)
  const toggleMapLayer = (layer: MapLayerType) => {
    if (!mapInstanceRef.current || activeLayer === layer) return;

    if (currentTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
    }

    const newTile = L.tileLayer(TILE_LAYERS[layer].url, TILE_LAYERS[layer].options).addTo(
      mapInstanceRef.current
    );
    currentTileLayerRef.current = newTile;
    setActiveLayer(layer);
  };

  // Update map and marker when position prop changes externally
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    const currentMarkerPos = markerRef.current.getLatLng();
    const isDifferent =
      Math.abs(currentMarkerPos.lat - position[0]) > 0.00001 ||
      Math.abs(currentMarkerPos.lng - position[1]) > 0.00001;

    if (isDifferent) {
      markerRef.current.setLatLng(position);
      mapInstanceRef.current.flyTo(position, mapInstanceRef.current.getZoom(), {
        animate: true,
        duration: 0.8,
      });
    }

    // Update or create accuracy circle
    if (accuracy && accuracy > 0) {
      if (circleRef.current) {
        circleRef.current.setLatLng(position);
        circleRef.current.setRadius(Math.min(accuracy, 200));
      } else {
        circleRef.current = L.circle(position, {
          radius: Math.min(accuracy, 200),
          color: '#3b82f6',
          fillColor: '#60a5fa',
          fillOpacity: 0.15,
          weight: 1.5,
        }).addTo(mapInstanceRef.current);
      }
    } else if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
  }, [position, accuracy]);

  return (
    <div className="relative w-full h-full min-h-[350px] md:min-h-[460px] rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating map hint */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 pointer-events-none transition-opacity duration-300">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
        Geser pin 📍 atau klik peta untuk atur lokasi akurat
      </div>

      {/* Layer Switcher Control (Street vs Satellite) */}
      <div className="absolute bottom-4 right-3 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1">
        <button
          type="button"
          onClick={() => toggleMapLayer('street')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeLayer === 'street'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Tampilan Peta Jalan Standard"
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Jalan</span>
        </button>

        <button
          type="button"
          onClick={() => toggleMapLayer('satellite')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeLayer === 'satellite'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Tampilan Foto Satelit (Melihat Atap & Gerbang)"
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satelit</span>
        </button>
      </div>

      {/* Loading overlay for geocode updates */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-white/40 dark:bg-black/50 backdrop-blur-[2px] flex items-center justify-center pointer-events-none transition-all">
          <div className="bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-medium">
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Memperbarui alamat...</span>
          </div>
        </div>
      )}
    </div>
  );
}
