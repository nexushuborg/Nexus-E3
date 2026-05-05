import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Menu, MapPin, User, Bus, Clock, Phone, AlertTriangle, WifiOff } from "lucide-react";
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

// Direct polyline through all stop coordinates or road geometry
const RoutePolyline = ({ stops, roadPoints }: { stops: any[], roadPoints: [number, number][] }) => {
  const map = useMap();
  const stopPositions: [number, number][] = stops.map((s: any) => [s.coordinates.lat, s.coordinates.lng]);
  const positionsToDraw = roadPoints && roadPoints.length > 0 ? roadPoints : stopPositions;

  useEffect(() => {
    if (!map || stopPositions.length < 2) return;
    const bounds = L.latLngBounds(stopPositions);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, []);

  return (
    <Polyline
      positions={positionsToDraw}
      pathOptions={{ color: '#1e3a8a', weight: 5, opacity: 0.85 }}
    />
  );
};

const MapController = ({ coords }: { coords: { lat: number; lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) { map.setView([coords.lat, coords.lng], map.getZoom(), { animate: true }); }
  }, [coords]);
  return null;
};

// Fit map to show all stops on first load
const FitBounds = ({ stops }: { stops: any[] }) => {
  const map = useMap();
  useEffect(() => {
    if (stops && stops.length >= 2) {
      const bounds = L.latLngBounds(stops.map(s => [s.coordinates.lat, s.coordinates.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, []);
  return null;
};

const DriverHome = () => {
  const navigate = useNavigate();
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
  // Road geometry points fetched from OSRM for accurate road-following simulation
  const [roadPoints, setRoadPoints] = useState<[number,number][]>([]);
  const [roadFetched, setRoadFetched] = useState(false);

  // Initialize socket connection + join bus room
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:8000", {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("[Driver] Socket connected:", newSocket.id);
      // FIX #1: Join room on connect, before any location is sent
      if (user?.routeNo) {
        newSocket.emit("join-bus", { busId: String(user.routeNo), driverId: user._id });
      }
      setSocketReady(true);
    });

    newSocket.on("disconnect", () => {
      console.log("[Driver] Socket disconnected");
      setSocketReady(false);
    });

    // FIXED: Duplicate Driver Broadcasting Lock (BUG 2)
    newSocket.on("route-already-active", (data) => {
      import("@/hooks/use-toast").then(({ toast }) => {
        toast({
          title: "Access Denied",
          description: data.message || "Route is already active by another driver.",
          variant: "destructive"
        });
      });
      setLocationSharing(false);
      setIsSimulating(false);
      setBroadcastCount(0);
    });

    // FIXED: Deleted Route Crashes Driver Map (BUG 4)
    newSocket.on("route-deleted", () => {
      import("@/hooks/use-toast").then(({ toast }) => {
        toast({
          title: "Route Removed",
          description: "Your assigned route has been removed by the administrator.",
          variant: "destructive"
        });
      });
      setLocationSharing(false);
      setIsSimulating(false);
      newSocket.disconnect();
      navigate("/driver-dashboard");
    });

    // FIXED: Blocked Driver Socket Not Severed (BUG 2)
    newSocket.on("force-disconnect", (data) => {
      if (data.targetDriverId === user?._id) {
        import("@/hooks/use-toast").then(({ toast }) => {
          toast({
            title: "Account Suspended",
            description: "Your account has been suspended. Contact admin.",
            variant: "destructive"
          });
        });
        setLocationSharing(false);
        setIsSimulating(false);
        newSocket.disconnect();
        
        // Dispatch custom logout event if needed, or navigate directly to login since interceptor triggers on 401 anyway.
        // To be safe, just clear storage/state by calling AuthContext logout if we had access here, 
        // but we can just redirect and let the next API call fail or let the user re-login.
        navigate("/login");
      }
    });

    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [user?.routeNo]);

  // Fetch OSRM road geometry once when route is known
  useEffect(() => {
    const assignedRoute = routes.find(r => r.busNumber === user?.routeNo);
    if (!assignedRoute || assignedRoute.stoppages.length < 2) return;
    if (roadFetched) return;

    const coords = assignedRoute.stoppages
      .map(s => `${s.coordinates.lng},${s.coordinates.lat}`)
      .join(';');

    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        const pts: [number,number][] = data.routes?.[0]?.geometry?.coordinates?.map(
          ([lng, lat]: [number,number]) => [lat, lng] as [number,number]
        ) ?? [];
        if (pts.length > 0) {
          setRoadPoints(pts);
          console.log(`[Driver] OSRM road loaded: ${pts.length} points`);
        }
        setRoadFetched(true);
      })
      .catch(err => {
        console.warn('[Driver] OSRM fetch failed, falling back to stop-to-stop:', err.message);
        // Fallback: use stop coordinates directly
        const fallback: [number,number][] = assignedRoute.stoppages.map(
          s => [s.coordinates.lat, s.coordinates.lng]
        );
        setRoadPoints(fallback);
        setRoadFetched(true);
      });
  }, [routes, user?.routeNo, roadFetched]);

  // Road-following simulation — walks along real OSRM road geometry
  useEffect(() => {
    if (!isSimulating || !locationSharing || !dutyStatus || !socketReady || !socket || !user?.routeNo) return;
    if (roadPoints.length < 2) {
      console.warn('[Driver] Road points not ready yet...');
      return;
    }

    let pointIdx = 0;
    console.log(`[Driver] Starting road-following simulation along ${roadPoints.length} road points`);

    const simInterval = setInterval(() => {
      if (pointIdx >= roadPoints.length) {
        pointIdx = 0; // loop the route
      }
      const [lat, lng] = roadPoints[pointIdx];
      pointIdx++;

      setCoords({ lat, lng });
      socket.emit('driver-send-location', { busId: String(user.routeNo), lat, lng, driverId: user?._id });
      setBroadcastCount(c => c + 1);
    }, 800); // 800ms per point = smooth realistic road movement

    return () => {
      console.log('[Driver] Stopping road-following simulation');
      clearInterval(simInterval);
    };
  }, [isSimulating, locationSharing, dutyStatus, socketReady, socket, user?.routeNo, roadPoints]);

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
            lng: newCoords.lng,
            driverId: user?._id
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
    <div className="px-6 pb-4 z-50 bg-background transition-all">
      {/* FIXED: You are Offline Banner (BONUS 1) */}
      {!socketReady && (
        <div className="absolute top-0 left-0 right-0 z-[1001] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold shadow-md animate-in slide-in-from-top">
          <WifiOff className="w-4 h-4" /> Connection lost — trying to reconnect...
        </div>
      )}

      <div className={`flex items-center justify-between ${!socketReady ? 'pt-12' : 'pt-4'}`}>
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
        .live-bus-marker { transition: transform 1.5s cubic-bezier(0.2,0.8,0.2,1) !important; }
        .leaflet-routing-alt { display: none !important; }
      `}</style>
      {(() => {
        const assignedRoute = routes.find(r => r.busNumber === user?.routeNo);
        // FIXED: Deleted Route Crashes Driver Map (BUG 4) - Fallback check
        if (!assignedRoute) {
           return (
             <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
               <div className="text-center p-6 bg-background rounded-2xl shadow-sm border">
                 <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                 <h3 className="font-semibold text-lg">No Route Assigned</h3>
                 <p className="text-sm text-muted-foreground mt-1">You are not currently assigned to any active route.</p>
               </div>
             </div>
           );
        }

        const startPos: [number, number] = [assignedRoute.startPoint.coordinates.lat, assignedRoute.startPoint.coordinates.lng];
        
        return (
          <MapContainer center={startPos} zoom={12} zoomControl={true} className="absolute inset-0 w-full h-full z-0">
            {assignedRoute && <FitBounds stops={assignedRoute.stoppages} />}
            <MapController coords={coords} />
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {/* Full route line through all stops — always visible */}
            {assignedRoute && <RoutePolyline stops={assignedRoute.stoppages} roadPoints={roadPoints} />}
            {assignedRoute && assignedRoute.stoppages.map((stop: any, idx: number) => {
              const isFirst = idx === 0;
              const isLast  = idx === assignedRoute.stoppages.length - 1;
              return (
                <CircleMarker key={stop.name + idx} center={[stop.coordinates.lat, stop.coordinates.lng]}
                  radius={isFirst || isLast ? 10 : 7}
                  pathOptions={{ color: isFirst ? '#16a34a' : isLast ? '#dc2626' : '#1e40af', fillColor: isFirst ? '#22c55e' : isLast ? '#ef4444' : '#3b82f6', fillOpacity: 0.95, weight: 2.5 }}>
                  <Tooltip direction="top" offset={[0, -10]}>
                    <span style={{ fontWeight: 700 }}>{idx + 1}. {stop.name}</span>
                    {stop.arrivalTime && <span style={{ color: '#6b7280', marginLeft: 6 }}>{stop.arrivalTime}</span>}
                  </Tooltip>
                </CircleMarker>
              );
            })}
            {coords && (
              <Marker position={[coords.lat, coords.lng]} icon={BusIcon}>
                <Popup>🚌 Live — broadcasting to students</Popup>
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
