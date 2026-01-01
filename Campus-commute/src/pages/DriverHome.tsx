import { useEffect, useState, useRef } from "react";
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

  useEffect(() => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(newCoords);
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(id);
    }
  }, []);

  return (
    <MobileLayout>
      <div className="relative min-h-screen bg-background">
        {/* Top Bar */}
        <div className="px-6 pt-12 pb-4 relative z-50 pointer-events-auto">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setSidebarOpen((s) => !s)}
              className="p-2 -ml-2 z-50 active:scale-95 transition-transform touch-manipulation"
            >
              <Menu className="w-6 h-6 text-foreground" />
            </button>
            
            <h1 className="text-lg font-semibold text-foreground">Driver Home</h1>

            <div className="w-10" />
          </div>
        </div>

        {/* Map */}
        <MapContainer 
          center={[13.0827, 80.2707]} 
          zoom={13} 
          style={{ height: 'calc(100vh - 80px)', width: '100%' }}
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

        {/* Location Sharing Button */}
        <div className="fixed bottom-0 left-0 right-0 z-[1001]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex justify-center p-4">
            <button 
              onClick={() => setLocationSharing(!locationSharing)} 
              className={`${locationSharing ? 'bg-red-500' : 'bg-green-500'} text-white py-3 px-8 rounded-lg font-medium shadow-lg min-w-[200px]`}
            >
              {locationSharing ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} dutyStatus={dutyStatus} onDutyStatusChange={setDutyStatus} />
      </div>
    </MobileLayout>
  );
};

export default DriverHome;
