import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronDown, User, Settings, LogOut, Bus, Info, Shield, Radio } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

const studentMenuItems = [
  { 
    id: "stoppage", 
    label: "Stoppage Details", 
    icon: MapPin,
    preview: "View all bus stops and timings",
    route: "/stoppage-details"
  },
  { 
    id: "running-status", 
    label: "Running Status", 
    icon: Radio,
    preview: "Live bus tracking & ETA updates",
    route: "/running-status"
  },
  { 
    id: "driver", 
    label: "Driver's Info", 
    icon: Bus,
    preview: "Route 1 - Mr. Rajesh Kumar",
    route: "/driver-info"
  },
  { 
    id: "profile", 
    label: "Profile", 
    icon: User,
    preview: "View and edit your profile",
    route: "/profile"
  },
  { 
    id: "settings", 
    label: "Settings", 
    icon: Settings,
    preview: "App preferences and security",
    route: "/settings"
  },
];

const driverMenuItems = [
  { 
    id: "profile", 
    label: "Profile", 
    icon: User,
    preview: "View and edit your profile",
    route: "/driver-profile"
  },
  { 
    id: "settings", 
    label: "Settings", 
    icon: Settings,
    preview: "App preferences and security",
    route: "/settings"
  },
];

const adminMenuItems = [
  { 
    id: "routes", 
    label: "Manage Routes", 
    icon: Bus,
    preview: "Add, edit, and delete routes",
    route: "/admin-panel"
  },
  { 
    id: "settings", 
    label: "Settings", 
    icon: Settings,
    preview: "App preferences and security",
    route: "/settings"
  },
];

const AppSidebar = ({ open, onClose }: AppSidebarProps) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const menuItems = 
    user?.role === "driver" 
      ? driverMenuItems 
      : user?.role === "admin" 
      ? adminMenuItems 
      : studentMenuItems;

  const handleTextClick = (route: string) => {
    onClose();
    navigate(route);
  };

  const handleArrowClick = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/");
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-foreground/20 z-30"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-72 bg-background z-40 shadow-xl animate-in slide-in-from-left duration-300">
        <div className="p-6 pt-16">
          <h2 className="text-xl font-bold text-foreground mb-8">Menu</h2>

          <nav className="space-y-2">
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
                  <button
                    onClick={() => handleArrowClick(item.id)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <ChevronDown 
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        expandedItem === item.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
                
                {/* Preview on arrow click */}
                {expandedItem === item.id && (
                  <div className="pl-8 pb-3 text-sm text-muted-foreground animate-in fade-in duration-200">
                    {item.preview}
                  </div>
                )}
              </div>
            ))}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 py-3 text-destructive hover:opacity-80 transition-opacity w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
};

export default AppSidebar;
