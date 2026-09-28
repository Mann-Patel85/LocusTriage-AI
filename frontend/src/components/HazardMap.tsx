'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CivicIssue } from '../types';
import { api } from '../services/api';

interface HazardMapProps {
  issues: CivicIssue[];
  onStatusUpdated?: () => void;
  center?: [number, number];
  zoom?: number;
}

export const HazardMap: React.FC<HazardMapProps> = ({
  issues,
  onStatusUpdated,
  center = [23.0225, 72.5714], // Default Ahmedabad, India
  zoom = 12,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [LeafletComponents, setLeafletComponents] = useState<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
    Promise.all([
      import('leaflet'),
      import('react-leaflet')
    ]).then(([L, RL]) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      setLeafletComponents({
        L,
        MapContainer: RL.MapContainer,
        TileLayer: RL.TileLayer,
        CircleMarker: RL.CircleMarker,
        Popup: RL.Popup,
        Tooltip: RL.Tooltip,
      });
    });
  }, []);

  // Filter valid issues located within India geographical bounding box
  const validIssues = issues.filter(
    (i) =>
      i.latitude !== null &&
      i.longitude !== null &&
      !isNaN(Number(i.latitude)) &&
      !isNaN(Number(i.longitude)) &&
      Number(i.latitude) >= 6.0 &&
      Number(i.latitude) <= 37.5 &&
      Number(i.longitude) >= 68.0 &&
      Number(i.longitude) <= 97.5
  );

  // Auto-pan to fit all points whenever issues update
  useEffect(() => {
    if (mapRef.current && validIssues.length > 0 && LeafletComponents?.L) {
      try {
        const bounds = LeafletComponents.L.latLngBounds(
          validIssues.map((p) => [Number(p.latitude), Number(p.longitude)])
        );
        mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (e) {
        // ignore if map not ready
      }
    }
  }, [validIssues, LeafletComponents]);

  if (!isMounted || !LeafletComponents) {
    return (
      <div className="w-full h-96 rounded-xl bg-orange-50/70 border border-orange-200 flex flex-col items-center justify-center text-stone-500 space-y-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Rendering India Geospatial Triage Map...</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } = LeafletComponents;

  const calculatedCenter: [number, number] = validIssues.length > 0
    ? [
        validIssues.reduce((acc, curr) => acc + Number(curr.latitude), 0) / validIssues.length,
        validIssues.reduce((acc, curr) => acc + Number(curr.longitude), 0) / validIssues.length,
      ]
    : center;

  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 8) return '#dc2626'; // Red (Critical)
    if (urgency >= 5) return '#ea580c'; // Vibrant Orange (Moderate-High)
    return '#2563eb'; // Blue (Low)
  };

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    try {
      await api.updateIssueStatus(issueId, newStatus);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      console.error('Failed to update status from map popup:', err);
    }
  };

  const indiaBounds: [[number, number], [number, number]] = [
    [6.5, 68.0],
    [37.5, 97.5],
  ];

  return (
    <div className="w-full h-[450px] lg:h-[550px] rounded-xl overflow-hidden border border-orange-200 shadow-xl relative">
      <MapContainer
        ref={mapRef}
        center={calculatedCenter}
        zoom={zoom}
        minZoom={4}
        maxBounds={indiaBounds}
        maxBoundsViscosity={0.8}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {validIssues.map((issue) => (
          <CircleMarker
            key={issue.issue_id}
            center={[Number(issue.latitude), Number(issue.longitude)]}
            radius={issue.urgency_score >= 8 ? 10 : issue.urgency_score >= 5 ? 8 : 6}
            pathOptions={{
              fillColor: getUrgencyColor(issue.urgency_score),
              fillOpacity: 0.9,
              color: '#ffffff',
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <span className="font-semibold text-xs text-stone-900">{issue.category}</span>
              <span className="text-[10px] ml-1 font-bold text-orange-600">({issue.urgency_score}/10)</span>
            </Tooltip>

            <Popup>
              <div className="p-1 max-w-[270px] text-stone-900">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono text-orange-700 font-bold">{issue.issue_id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      issue.urgency_score >= 8
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : issue.urgency_score >= 5
                        ? 'bg-orange-100 text-orange-800 border border-orange-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    Urgency {issue.urgency_score}/10
                  </span>
                </div>

                <h4 className="font-bold text-sm text-stone-900 mb-1">{issue.category}</h4>
                <p className="text-xs text-stone-600 mb-3 leading-relaxed">{issue.description}</p>

                {issue.image_url && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-orange-200">
                    <img
                      src={api.getImageUrl(issue.image_url)}
                      alt={issue.category}
                      className="w-full h-24 object-cover"
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-orange-100">
                  <label className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold block mb-1">
                    Municipal Dispatch Status:
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['Pending', 'In Progress', 'Resolved'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(issue.issue_id, st)}
                        className={`text-[10px] py-1 px-1.5 rounded font-semibold text-center transition-all ${
                          issue.status === st
                            ? 'bg-orange-600 text-white font-bold shadow-xs'
                            : 'bg-stone-100 text-stone-700 hover:bg-orange-100 hover:text-orange-900'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-orange-200 text-xs shadow-xl pointer-events-auto">
        <div className="text-[11px] font-bold text-stone-800 mb-1.5 flex items-center justify-between gap-3">
          <span>Hazard Urgency Level</span>
          <span className="text-[9px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
            INDIA REGION
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span className="text-stone-700 font-medium">Critical (8 - 10)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
            <span className="text-stone-700 font-medium">Moderate (5 - 7)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-stone-700 font-medium">Low / Minor (1 - 4)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
