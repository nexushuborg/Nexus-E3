import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Bus, MapPin, Settings, LogOut, ChevronDown, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import { Switch } from "@/components/ui/switch";

interface DriverSidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: "profile", label: "Driver Profile", icon: User, preview: "View and edit your profile", route: "/driver-profile" },
  { id: "bus", label: "Bus Management", icon: Bus, preview: "View admin & bus assignment details", route: "/driver-bus-management" },
  { id: "stops", label: "Stop Details", icon: MapPin, preview: "All stops & timings for your route", route: "/driver-stop-details" },
  { id: "settings", label: "Settings", icon: Settings, preview: "App preferences and security", route: "/driver-settings" },
];

const DriverSidebar = ({ open, onClose }: DriverSidebarProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isTracking, startTracking, stopTracking } = useLocation();
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleTextClick = (route: string) => {
    onClose();
    navigate(route);
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/");
  };

  const handleDutyToggle = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  // Match the student `AppSidebar` UI exactly (width, colors, animation)
  return (
    <>
      {/* Backdrop - identical to student sidebar */}
      <div
        className={`fixed inset-0 bg-foreground/20 z-30 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Sidebar - same classes and animation as AppSidebar */}
      <div className={`fixed left-0 top-0 bottom-0 w-72 bg-background z-40 shadow-xl animate-in slide-in-from-left duration-300 ${open ? "" : "-translate-x-full"}`}>
        <div className="p-6 pt-16">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-xl font-bold text-foreground">Campus Commute</h2>
              <p className="text-sm text-muted-foreground">Driver</p>
            </div>
            <div className="w-6" />
          </div>

          <nav className="space-y-2">
            <div className="border-b border-border pb-2">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 text-foreground">
                  <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>On Duty</span>
                </div>
                <Switch checked={isTracking} onCheckedChange={handleDutyToggle} />
              </div>
            </div>

            {menuItems.map((item) => (
              <div key={item.id} className="border-b border-border pb-2">
                <div className="flex items-center justify-between py-3">
                  <button
                    onClick={() => handleTextClick(item.route)}
                    className="flex items-center gap-3 text-foreground hover:text-primary transition-colors flex-1"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                  <button onClick={() => setExpanded(expanded === item.id ? null : item.id)} className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded === item.id ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {expanded === item.id && (
                  <div className="pl-8 pb-3 text-sm text-muted-foreground animate-in fade-in duration-200">{item.preview}</div>
                )}
              </div>
            ))}

            <button onClick={handleLogout} className="flex items-center gap-3 py-3 text-destructive hover:opacity-80 transition-opacity w-full">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
};

export default DriverSidebar;
