import { useEffect, useState } from "react";
import { Menu, MapPin, User, Bus, Clock, Phone } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import DriverSidebar from "@/components/DriverSidebar";
import BackButton from "@/components/BackButton";

const DriverDashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dutyStatus, setDutyStatus] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        <BackButton to="/driver-home" />
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-muted rounded-full transition-colors">
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Driver Dashboard</h1>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{user?.fullName || "Driver"}</h2>
              <p className="text-muted-foreground">Route no.{user?.routeNo || "1"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-2xl border">
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

            <div className="flex items-center justify-between p-4 bg-background rounded-2xl border">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-foreground">Location Sharing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${locationSharing ? "text-green-500" : "text-muted-foreground"}`}>
                  {locationSharing ? "On" : "Off"}
                </span>
                <Switch
                  checked={locationSharing}
                  onCheckedChange={setLocationSharing}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-2xl border">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-foreground">Current Time</span>
              </div>
              <span className="text-foreground font-mono">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-2xl border">
              <div className="flex items-center gap-3">
                <Bus className="w-5 h-5 text-primary" />
                <span className="text-foreground">Today's Route</span>
              </div>
              <span className="text-foreground">
                Route {user?.routeNo || "1"}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} dutyStatus={dutyStatus} onDutyStatusChange={setDutyStatus} />
      </div>
    </MobileLayout>
  );
};

export default DriverDashboard;