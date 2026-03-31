import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Menu, MapPin, User, Bus, Clock, Phone } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import DriverSidebar from "@/components/DriverSidebar";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dutyStatus, setDutyStatus] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:8000");
    setSocket(newSocket);
    
    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // Join bus room when user route changes
  useEffect(() => {
    if (socket && user?.routeNo) {
      const busId = String(user.routeNo);
      socket.emit("join-bus", { busId });
    }
  }, [socket, user?.routeNo]);

  useEffect(() => {
    if (navigator.geolocation && locationSharing && dutyStatus) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(newCoords);
          
          // Send location to backend if socket is connected and user is on duty
          if (socket && user?.routeNo) {
            socket.emit("driver-send-location", {
              busId: user.routeNo,
              lat: newCoords.lat,
              lng: newCoords.lng
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
      
      return () => navigator.geolocation.clearWatch(id);
    }
  }, [socket, locationSharing, dutyStatus, user?.routeNo]);

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
      <MapContainer
        center={[13.0827, 80.2707]}
        zoom={13}
        className="absolute inset-0 w-full h-full z-0"
      >
        <MapController coords={coords} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {coords && (
          <Marker position={[coords.lat, coords.lng]}>
            <Popup>Your current location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>

    {/* Location Sharing Button */}
    <div
      className="fixed bottom-0 left-0 right-0 z-[1001]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex justify-center p-4">
        <button
          onClick={() => setLocationSharing(!locationSharing)}
          className={`${
            locationSharing ? "bg-red-500" : "bg-green-500"
          } text-white py-3 px-8 rounded-lg font-medium shadow-lg min-w-[200px]`}
        >
          {locationSharing ? "Stop" : "Start"}
        </button>
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
