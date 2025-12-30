import { useState } from "react";
import { Menu } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import DriverSidebar from "@/components/DriverSidebar";
import RouteMap from "@/components/RouteMap";
import busRoutes from "@/data/busRoutes";
import { useLocation } from "@/contexts/LocationContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const DriverHome = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isTracking, startTracking, stopTracking, error } = useLocation();
  const { toast } = useToast();

  const assignedRoute = busRoutes.find(route => route.busNumber === user?.selectedRoute);

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
      toast({
        title: "Tracking Stopped",
        description: "Your location is no longer being shared.",
      });
    } else {
      startTracking();
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Tracking Started",
          description: "Your location is now being shared.",
        });
      }
    }
  };

  return (
    <MobileLayout>
      <div className="relative min-h-screen bg-background">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 px-6 pt-12 pb-4 z-10">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-white bg-black bg-opacity-50 rounded-full"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Map Background */}
        <div className="absolute inset-0 z-0 h-full w-full">
          {assignedRoute ? (
            <RouteMap route={assignedRoute} />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <p>No route assigned.</p>
            </div>
          )}
        </div>

        {/* Start/Stop Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <Button
            onClick={handleToggleTracking}
            className={`w-full text-lg font-bold py-6 ${
              isTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isTracking ? "Stop" : "Start"}
          </Button>
        </div>

        {/* Sidebar */}
        <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
    </MobileLayout>
  );
};

export default DriverHome;

