import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Menu, MapPin, User, Bus, Clock, Phone } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import DriverSidebar from "@/components/DriverSidebar";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import { useRouteContext } from "@/contexts/RouteContext";

const BusIcon = L.divIcon({
  className: 'live-bus-marker',
  html: `<div style="width:40px;height:40px;background-color:#0f766e;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.4);"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg></div>`,
  iconAnchor: [20, 20]
});

const RoutingControl = ({ stops }: { stops: any[] }) => {
  const map = useMap();
  const [routeFound, setRouteFound] = useState(false);

  useEffect(() => {
    if (!map || !stops || stops.length < 2) return;
    const waypoints = stops.map((s: any) => L.latLng(s.coordinates.lat, s.coordinates.lng));

    const control = (L.Routing as any).control({
      waypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      showAlternatives: false,
      fitSelectedRoutes: true,
      show: false,
      createMarker: () => null, // Don't show default OSRM markers
      lineOptions: {
        styles: [{ color: '#0ea5e9', opacity: 0.85, weight: 6 }]
      }
    }).addTo(map);

    control.on('routesfound', () => setRouteFound(true));
    control.on('routingerror', () => {
      console.warn('OSRM routing failed, using fallback polyline');
      setRouteFound(false);
    });

    // Fit bounds to show all stops
    const bounds = L.latLngBounds(waypoints);
    map.fitBounds(bounds, { padding: [40, 40] });

    return () => {
      try { map.removeControl(control); } catch (e) {}
    };
  }, [map, stops]);

  // Fallback: draw straight polyline between stops if OSRM fails
  if (!routeFound && stops && stops.length >= 2) {
    const positions: [number, number][] = stops.map((s: any) => [s.coordinates.lat, s.coordinates.lng]);
    return <Polyline positions={positions} pathOptions={{ color: '#0ea5e9', weight: 5, opacity: 0.7, dashArray: '10, 10' }} />;
  }

  return null;
};

const MapController = ({ coords }: { coords: { lat: number; lng: number } | null }) => {
  const map = useMap();

  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], 13);
    }
  }, [coords]);

  return null;
};

const DriverHome = () => {
  const { user } = useAuth();
  const { routes } = useRouteContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dutyStatus, setDutyStatus] = useState(true);
  // FIX #1: Start with location sharing OFF — driver must click "Start"
  const [locationSharing, setLocationSharing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketReady, setSocketReady] = useState(false);
  const [broadcastCount, setBroadcastCount] = useState(0);
  
  // Initialize socket connection + join bus room
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:8000", {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("[Driver] Socket connected:", newSocket.id);
      // FIX #1: Join room on connect, before any location is sent
      if (user?.routeNo) {
        newSocket.emit("join-bus", { busId: String(user.routeNo) });
      }
      setSocketReady(true);
    });

    newSocket.on("disconnect", () => {
      console.log("[Driver] Socket disconnected");
      setSocketReady(false);
    });

    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [user?.routeNo]);

  // Simulation Loop
  useEffect(() => {
    if (!isSimulating || !locationSharing || !dutyStatus || !socketReady || !socket || !user?.routeNo) return;
    
    const assignedRoute = routes.find(r => r.busNumber === user?.routeNo);
    if (!assignedRoute || assignedRoute.stoppages.length < 2) return;

    let currentStopIdx = 0;
    let progress = 0; // 0 to 1 between current and next stop
    
    console.log("[Driver] Starting GPS Simulation...");

    const simInterval = setInterval(() => {
      if (currentStopIdx >= assignedRoute.stoppages.length - 1) {
        // Reached the end, loop back or stop
        currentStopIdx = 0;
        progress = 0;
      }

      const p1 = assignedRoute.stoppages[currentStopIdx].coordinates;
      const p2 = assignedRoute.stoppages[currentStopIdx + 1].coordinates;
      
      progress += 0.05; // 5% per second (20 seconds between stops)
      if (progress >= 1) {
        progress = 0;
        currentStopIdx++;
      }

      if (currentStopIdx < assignedRoute.stoppages.length - 1) {
        const lat = p1.lat + (p2.lat - p1.lat) * progress;
        const lng = p1.lng + (p2.lng - p1.lng) * progress;
        
        setCoords({ lat, lng });
        socket.emit("driver-send-location", {
          busId: String(user.routeNo),
          lat, lng
        });
        setBroadcastCount(c => c + 1);
      }
    }, 1000);

    return () => {
      console.log("[Driver] Stopping GPS Simulation");
      clearInterval(simInterval);
    };
  }, [isSimulating, locationSharing, dutyStatus, socketReady, socket, user?.routeNo, routes]);

  // GPS watching — only when locationSharing is ON and socket is ready (and NOT simulating)
  useEffect(() => {
    if (isSimulating || !navigator.geolocation || !locationSharing || !dutyStatus || !socketReady || !socket) {
      return;
    }

    console.log("[Driver] Starting Real GPS watch...");

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        
        // Send location to backend
        if (user?.routeNo) {
          socket.emit("driver-send-location", {
            busId: String(user.routeNo),
            lat: newCoords.lat,
            lng: newCoords.lng
          });
          setBroadcastCount(c => c + 1);
        }
      },
      (error) => {
        console.error('[Driver] Geolocation error:', error);
      },
      // FIX #8: maximumAge 5s instead of 60s for fresh GPS
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    
    return () => {
      console.log("[Driver] Stopping GPS watch");
      navigator.geolocation.clearWatch(id);
    };
  }, [socket, socketReady, locationSharing, dutyStatus, user?.routeNo]);

  return (
    <MobileLayout>
  <div className="flex flex-col min-h-screen bg-background">

    {/* Top Bar */}
    <div className="px-6  pb-4 z-50 bg-background">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setSidebarOpen((s) => !s)}
          className="p-2 z-50 active:scale-95 transition-transform touch-manipulation"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>

        <h1 className="text-lg font-semibold text-foreground">
          Driver Home
        </h1>

        <div className="w-10" />
      </div>
    </div>

    {/* Map Section */}
    <div className="flex-1 relative">
      <style>{`
        .live-bus-marker {
          transition: transform 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
        }
        .leaflet-routing-alt {
            display: none !important;
        }
      `}</style>
      
      {(() => {
        const assignedRoute = routes.find(r => r.busNumber === user?.routeNo);
        const startPos: [number, number] = assignedRoute 
          ? [assignedRoute.startPoint.coordinates.lat, assignedRoute.startPoint.coordinates.lng] 
          : [13.0827, 80.2707];

        return (
          <MapContainer
            center={startPos}
            zoom={13}
            zoomControl={false}
            className="absolute inset-0 w-full h-full z-0"
          >
            <MapController coords={coords} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {assignedRoute && (
               <RoutingControl stops={assignedRoute.stoppages} />
            )}

            {/* Stop markers along the route */}
            {assignedRoute && assignedRoute.stoppages.map((stop, idx) => (
              <CircleMarker
                key={idx}
                center={[stop.coordinates.lat, stop.coordinates.lng]}
                radius={7}
                pathOptions={{ color: '#1e40af', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 2 }}
              >
                <Tooltip direction="top" offset={[0, -8]} permanent={false}>
                  <span style={{ fontWeight: 600 }}>{idx + 1}. {stop.name}</span>
                </Tooltip>
              </CircleMarker>
            ))}

            {coords && (
              <Marker position={[coords.lat, coords.lng]} icon={BusIcon}>
                <Popup>Your live GPS location broadcast</Popup>
              </Marker>
            )}
          </MapContainer>
        );
      })()}
    </div>

    {/* Location Sharing Button + Status */}
    <div
      className="fixed bottom-0 left-0 right-0 z-[1001]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex flex-col items-center gap-2 p-4 bg-background/80 backdrop-blur-sm">
        {/* Connection status */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${socketReady ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-muted-foreground">
            {socketReady ? 'Connected' : 'Disconnected'}
          </span>
          {locationSharing && broadcastCount > 0 && (
            <span className="text-muted-foreground ml-2">• {broadcastCount} updates sent</span>
          )}
        </div>

        <div className="flex gap-2 w-full max-w-[400px]">
          <button
            onClick={() => {
              const willShare = !locationSharing;
              setLocationSharing(willShare);
              if (!willShare && socket && user?.routeNo) {
                socket.emit("driver-offline", { busId: String(user.routeNo) });
                setBroadcastCount(0);
              }
            }}
            className={`flex-1 ${
              locationSharing ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
            } text-white py-3 px-4 rounded-lg font-medium shadow-lg transition-colors text-sm`}
          >
            {locationSharing ? "Stop GPS" : "Start Real GPS"}
          </button>
          
          <button
            onClick={() => {
              const newSim = !isSimulating;
              setIsSimulating(newSim);
              if (!locationSharing && newSim) {
                setLocationSharing(true);
              }
              if (!newSim && socket && user?.routeNo) {
                socket.emit("driver-offline", { busId: String(user.routeNo) });
                setBroadcastCount(0);
                setLocationSharing(false);
              }
            }}
            className={`flex-1 ${
              isSimulating ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-500 hover:bg-blue-600"
            } text-white py-3 px-4 rounded-lg font-medium shadow-lg transition-colors text-sm`}
          >
            {isSimulating ? "Stop Simulation" : "Simulate Route"}
          </button>
        </div>
      </div>
    </div>

    {/* Sidebar */}
    <DriverSidebar
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      dutyStatus={dutyStatus}
      onDutyStatusChange={setDutyStatus}
    />

  </div>
</MobileLayout>

  );
};

export default DriverHome;
