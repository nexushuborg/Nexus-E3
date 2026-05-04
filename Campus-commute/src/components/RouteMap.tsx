// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { useRouteContext } from '../contexts/RouteContext';
import { useToast } from "@/hooks/use-toast";

// Helper to auto-recenter the map on the live position or start position
const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 14, { animate: true, duration: 1 });
    }
  }, [lat, lng, map]);
  return null;
};

// Map Icon Defines
const StartIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background-color:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconAnchor: [10, 10]
});

const EndIcon = L.divIcon({
  className: '',
  html: `<div style="width:24px;height:24px;background-color:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;"><div style="width:8px;height:8px;background:white;border-radius:50%"></div></div>`,
  iconAnchor: [12, 12]
});

// FIXED: Bus Marker Rotation (BONUS 2)
const getBusIcon = (rotation: number) => L.divIcon({
  className: 'live-bus-marker',
  html: `<div style="transform: rotate(${rotation}deg); width:40px;height:40px;background-color:#0f766e;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.4);"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg></div>`,
  iconAnchor: [20, 20]
});

// Shows full route as solid dark blue line, snapping to real roads using OSRM
const RoutePolyline = ({ stops }: { stops: any[] }) => {
  const map = useMap();
  const [roadPoints, setRoadPoints] = useState<[number, number][]>([]);

  useEffect(() => {
    if (stops.length < 2) return;

    const coordsString = stops
      .map(s => `${s.coordinates.lng},${s.coordinates.lat}`)
      .join(';');

    fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        const pts: [number, number][] = data.routes?.[0]?.geometry?.coordinates?.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        ) ?? [];
        
        if (pts.length > 0) {
          setRoadPoints(pts);
          const bounds = L.latLngBounds(pts);
          map.fitBounds(bounds, { padding: [50, 50] });
        } else {
          const fallback: [number, number][] = stops.map(s => [s.coordinates.lat, s.coordinates.lng]);
          setRoadPoints(fallback);
          map.fitBounds(L.latLngBounds(fallback), { padding: [50, 50] });
        }
      })
      .catch(err => {
        console.warn('OSRM fetch failed, falling back to straight lines:', err.message);
        const fallback: [number, number][] = stops.map(s => [s.coordinates.lat, s.coordinates.lng]);
        setRoadPoints(fallback);
        map.fitBounds(L.latLngBounds(fallback), { padding: [50, 50] });
      });
  }, [stops, map]);

  if (roadPoints.length === 0) return null;

  return <Polyline positions={roadPoints} pathOptions={{ color: '#1e3a8a', weight: 6, opacity: 0.85 }} />;
};

// Recenter on live bus position when it changes
const LiveRecenter = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom(), { animate: true, duration: 1.5 });
  }, [position, map]);

  // Also listen for the manual 'Track Bus' button event
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        map.setView(e.detail as [number, number], 16, { animate: true, duration: 1 });
      }
    };
    window.addEventListener('recenter-on-bus', handler);
    return () => window.removeEventListener('recenter-on-bus', handler);
  }, [map]);

  return null;
};

const RouteMap: React.FC<any> = () => {
  const { selectedRoute, liveBusPosition, busRotation } = useRouteContext();
  const { toast } = useToast();
  const [visitedStops, setVisitedStops] = useState<Set<string>>(new Set());
  const isRouteBusy = false; // Added to fix ReferenceError

  if (!selectedRoute || !selectedRoute.stoppages || selectedRoute.stoppages.length === 0) {
    return <div className="w-full h-full min-h-[50vh] flex items-center justify-center bg-slate-100 text-slate-500 font-medium">Loading Routes...</div>;
  }

  // Reset visited stops on route change
  useEffect(() => {
    setVisitedStops(new Set());
  }, [selectedRoute]);

  // Client-side proximity toasts as backup for real-time geofencing
  useEffect(() => {
    if (!liveBusPosition) return;

    try {
      const busLatLng = L.latLng(liveBusPosition[0], liveBusPosition[1]);

      for (const stop of selectedRoute.stoppages) {
        if (visitedStops.has(stop.name)) continue;

        const stopLatLng = L.latLng(stop.coordinates.lat, stop.coordinates.lng);
        const distanceMeters = busLatLng.distanceTo(stopLatLng);

        if (distanceMeters < 500) {
          toast({
            title: "📍 Approaching Stop",
            description: `${stop.name} — Arriving shortly!`,
          });
          
          setVisitedStops(prev => {
            const newSet = new Set(prev);
            newSet.add(stop.name);
            return newSet;
          });
          
          break;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [liveBusPosition, selectedRoute, visitedStops, toast]);

  // Raw Fallback line
  const rawFallbackCoords: [number, number][] = selectedRoute.stoppages.map(stop => [
    stop.coordinates.lat, 
    stop.coordinates.lng
  ]);

  const startPoint = rawFallbackCoords[0];
  const endPoint = rawFallbackCoords[rawFallbackCoords.length - 1];

  return (
    <div className="w-full h-full min-h-[50vh] relative z-0">
      
      {/* Traffic Pill Overlays */}
      <div className="absolute top-[100px] left-1/2 -translate-x-1/2 z-[1000] pointer-events-none transition-all duration-500">
        {isRouteBusy ? (
          <div className="bg-amber-500/95 backdrop-blur text-white px-5 py-2.5 rounded-full text-xs md:text-sm shadow-xl flex items-center font-bold tracking-widest border-2 border-amber-400">
            HEAVY TRAFFIC - SHOWING ALTERNATIVES
          </div>
        ) : (
          <div className="bg-emerald-500/95 backdrop-blur text-white px-5 py-2.5 rounded-full text-xs md:text-sm shadow-xl flex items-center font-bold tracking-widest border-2 border-emerald-400">
            FASTEST ROUTE
          </div>
        )}
      </div>

      {/* Dynamic CSS for smooth marker animation */}
      <style>{`
        .live-bus-marker {
          transition: transform 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
        .leaflet-routing-alt {
            display: none !important;
        }
      `}</style>

      <MapContainer
        center={startPoint} 
        zoom={14} 
        zoomControl={false}
        className="w-full h-full min-h-screen z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap lat={startPoint[0]} lng={startPoint[1]} />

        {/* Recenter on live bus when tracking */}
        {liveBusPosition && <LiveRecenter position={liveBusPosition} />}

        {/* Full route line — always visible, dark blue */}
        <RoutePolyline stops={selectedRoute.stoppages} />

        {/* Render all intermediate stops */}
        {selectedRoute.stoppages.map((stop: any, idx: number) => {
          const isFirst = idx === 0;
          const isLast = idx === selectedRoute.stoppages.length - 1;
          
          // Skip first and last as they have their own big markers below
          if (isFirst || isLast) return null;

          return (
            <CircleMarker 
              key={stop.name + idx} 
              center={[stop.coordinates.lat, stop.coordinates.lng]}
              radius={7}
              pathOptions={{ color: '#1e40af', fillColor: '#3b82f6', fillOpacity: 0.95, weight: 2.5 }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <span style={{ fontWeight: 700 }}>{idx + 1}. {stop.name}</span>
                {stop.arrivalTime && <span style={{ color: '#6b7280', marginLeft: 6 }}> - {stop.arrivalTime}</span>}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Start / End Nodes */}
        {startPoint && (
          <Marker position={startPoint} icon={StartIcon}>
            <Tooltip direction="top" offset={[0, -10]} permanent>
              <span style={{ fontWeight: 700 }}>1. {selectedRoute.stoppages[0].name}</span>
            </Tooltip>
          </Marker>
        )}
        {endPoint && (
          <Marker position={endPoint} icon={EndIcon}>
            <Tooltip direction="top" offset={[0, -10]} permanent>
              <span style={{ fontWeight: 700 }}>{selectedRoute.stoppages.length}. {selectedRoute.stoppages[selectedRoute.stoppages.length - 1].name}</span>
            </Tooltip>
          </Marker>
        )}
        
        {/* Live Bus Marker — only shown when driver is broadcasting */}
        {liveBusPosition && (
           <Marker position={liveBusPosition} icon={getBusIcon(busRotation)}></Marker>
        )}

      </MapContainer>
    </div>
  );
};

export default RouteMap;
