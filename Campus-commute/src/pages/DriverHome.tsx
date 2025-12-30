import { useEffect, useState } from "react";
import { Menu, MapPin, User, Bus, Clock, Phone } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import DriverSidebar from "@/components/DriverSidebar";

const DriverHome = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dutyStatus, setDutyStatus] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
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
            
            <h1 className="text-lg font-semibold text-foreground">Driver Dashboard</h1>

            <div className="w-10" />
          </div>
        </div>

        {/* Map Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100/50 via-blue-50/30 to-background dark:from-blue-950/40 dark:via-blue-950/20">
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 10 30 L 30 50 L 50 45 L 70 65" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" />
            <path d="M 70 65 L 85 70 L 90 85" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeDasharray="6,4" opacity="0.5" />
            {/* Stops */}
            <circle cx="10" cy="30" r="2.5" fill="hsl(var(--primary))" />
            <circle cx="30" cy="50" r="2.5" fill="hsl(var(--primary))" />
            <circle cx="50" cy="45" r="4" fill="hsl(var(--primary))" className="animate-pulse" />
            <circle cx="70" cy="65" r="2.5" fill="hsl(var(--primary))" opacity="0.6" />
            <circle cx="85" cy="70" r="2.5" fill="hsl(var(--primary))" opacity="0.4" />

            {/* Driver current location marker - approximate center overlay */}
            <g>
              <circle cx="55" cy="30" r="3.5" fill="#10B981" opacity="0.9" className="animate-pulse" />
            </g>

            {/* Bus live marker */}
            <g>
              <circle cx="50" cy="40" r="5" fill="hsl(var(--primary))" className="shadow-lg" />
            </g>
          </svg>
        </div>

        {/* Driver Info Card */}
        <div className="px-6 pt-12 pb-6 relative z-10">
          <div className="bg-muted rounded-3xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="driver" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{user?.fullName || "Driver"}</h2>
                <p className="text-muted-foreground">Route no.{user?.routeNo || "1"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-2xl">
                <div className="flex items-center gap-3">
                  <Bus className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Duty Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${dutyStatus ? "text-green-500" : "text-muted-foreground"}`}>
                    {dutyStatus ? "On" : "Off"}
                  </span>
                  <Switch 
                    checked={dutyStatus}
                    onCheckedChange={setDutyStatus}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-2xl">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Location Sharing</span>
                </div>
                <Switch 
                  checked={locationSharing}
                  onCheckedChange={setLocationSharing}
                />
              </div>

              <div className="p-4 bg-background rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Timing</span>
                </div>
                <p className="text-muted-foreground ml-8">{user?.timing || "06:00 AM"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Route Info */}
        <div className="px-6 relative z-10">
          <h3 className="text-lg font-semibold text-foreground mb-4">Today's Route</h3>
          <div className="bg-muted rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-foreground font-medium">Route no.{user?.routeNo || "1"}</span>
              <span className="text-primary text-sm">Active</span>
            </div>
            <p className="text-muted-foreground text-sm mb-4">Kottur → Guindy → Saidapet → BSLR Mall → Campus</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>6 stops</span>
              <span>•</span>
              <span>45 mins estimated</span>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="px-6 mt-6">
          <button className="w-full bg-primary/10 text-primary rounded-2xl p-4 flex items-center justify-center gap-3">
            <Phone className="w-5 h-5" />
            <span className="font-medium">Emergency Contact</span>
          </button>
        </div>

        {/* Sidebar */}
        <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
    </MobileLayout>
  );
};

export default DriverHome;
