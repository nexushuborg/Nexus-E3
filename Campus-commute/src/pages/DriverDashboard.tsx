import { useEffect, useState } from "react";
import { Menu, MapPin, User, Bus, Clock, Phone } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import AuthCard from "@/components/AuthCard";
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
      <AuthCard className="max-h-[95vh] overflow-y-auto flex flex-col p-4 sm:p-6 my-auto">
        <div className="flex flex-col relative w-full h-full">
          <BackButton to="/driver-home" />
          
          {/* Header */}
          <div className="flex items-center justify-between pt-8 pb-4 border-b border-border">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-muted rounded-full transition-colors">
              <Menu className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Driver Dashboard</h1>
            <div className="w-10" />
          </div>

          {/* Content */}
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{user?.fullName || "Driver"}</h2>
                <p className="text-muted-foreground text-sm">Route no. {user?.routeNo || "1"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-transparent">
                <div className="flex items-center gap-3">
                  <Bus className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium">Duty Status</span>
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

              <div className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-transparent">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium">Location Sharing</span>
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

              <div className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-transparent">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium">Current Time</span>
                </div>
                <span className="text-foreground font-mono">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-transparent">
                <div className="flex items-center gap-3">
                  <Bus className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-medium">Today's Route</span>
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
      </AuthCard>
    </MobileLayout>
  );
};

export default DriverDashboard;