import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Menu, Bell, MapPin, ChevronUp, ChevronDown, Bus, Clock, AlertCircle } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import GradientButton from "@/components/GradientButton";
import AppSidebar from "@/components/AppSidebar";
import NotificationSheet from "@/components/NotificationSheet";
import RouteDetailsModal from "@/components/RouteDetailsModal";
import RouteMap from "@/components/RouteMap";
import { useAuth } from "@/contexts/AuthContext";

interface BackendRouteStop {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  sequenceOrder: number;
  arrivalTime?: string;
}

interface BackendRouteDriver {
  name: string;
  contact: string;
}

interface BackendRoute {
  busNumber: string;
  busName: string;
  routeName: string;
  startPoint: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  stoppages: BackendRouteStop[];
  endPoint: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  classTime: string;
  arrivalBus?: string;
  drivers: BackendRouteDriver[];
  isActive: boolean;
  remarks?: string;
}

interface Route {
  id: string;
  number: string;
  stops: string[];
  timing: string;
  assignedBus?: string;
  assignedDriver?: string;
  conductorName?: string;
  conductorPhone?: string;
  eta?: number;
}

interface Stop {
  name: string;
  time: string;
  status: "passed" | "current" | "upcoming";
}

const stops: Stop[] = [
  { name: "Kottur", time: "06:00 AM", status: "passed" },
  { name: "Guindy", time: "06:10 AM", status: "passed" },
  { name: "Saidapet", time: "06:15 AM", status: "current" },
  { name: "BSLR Mall", time: "06:20 AM", status: "upcoming" },
];

const Home = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(true);
  const [eta, setEta] = useState<number>(10);
  const [routeInfo, setRouteInfo] = useState<Route | null>(null);
  const [fullRouteData, setFullRouteData] = useState<BackendRoute | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [busLocation, setBusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);
  const [stopETAs, setStopETAs] = useState<any[]>([]);
  
  // Socket connection
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:8000");
    setSocket(newSocket);
    
    // Listen for bus location updates
    newSocket.on("bus-location", (location) => {
      setBusLocation({ lat: location.lat, lng: location.lng });
    });
    
    // Listen for stop ETAs
    newSocket.on("bus-stop-eta", (etas) => {
      setStopETAs(etas.stops || []);
      setCurrentStopIndex(etas.currentStopIndex || 0);
      
      // Update ETA to next stop
      if (etas.stops && etas.stops.length > 0) {
        const nextStop = etas.stops[0];
        if (nextStop && nextStop.minutes !== undefined) {
          setEta(nextStop.minutes);
        }
      }
    });
    
    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // Join bus room when route info changes
  useEffect(() => {
    if (socket && routeInfo?.id) {  // Use routeInfo.id instead of number for more reliable identification
      socket.emit("join-bus", { busId: routeInfo.id });
    }
  }, [socket, routeInfo?.id]);

  // Fetch ETA and route info from backend API
  useEffect(() => {
    const fetchRouteInfo = async () => {
      try {
        if (user?.routeNo) {
          // Get the route from backend based on user's route number
          // Ensure routeId is properly formatted
          let routeId = user.routeNo;
          
          // If routeNo is already a string, use it directly
          if (typeof user.routeNo === 'string') {
            routeId = user.routeNo;
          } else if (typeof user.routeNo === 'number') {
            // If routeNo is a number, try to find a matching route in the backend
            const allRoutesResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/routes`);
            if (allRoutesResponse.ok) {
              const allRoutes = await allRoutesResponse.json();
              // Find a route that matches the route number
              const matchingRoute = allRoutes.find((route: any) => 
                route.busNumber.includes(user.routeNo.toString()) || 
                route.routeName.includes(user.routeNo.toString())
              );
              if (matchingRoute) {
                routeId = matchingRoute.busNumber;
              }
            }
          }
          
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/routes/${routeId}`);
          if (response.ok) {
            const routeData: BackendRoute = await response.json();
            
            // Convert backend route format to frontend format
            const convertedRoute: Route = {
              id: routeData.busNumber,
              number: routeData.routeName,
              stops: routeData.stoppages?.map((stop: BackendRouteStop) => stop.name) || [],
              timing: routeData.classTime,
              assignedBus: routeData.arrivalBus,
              assignedDriver: routeData.drivers?.[0]?.name,
              conductorName: routeData.drivers?.[1]?.name, // Assuming second driver is conductor
              conductorPhone: routeData.drivers?.[1]?.contact, // Assuming second driver is conductor
            };
            
            setFullRouteData(routeData);
            setRouteInfo(convertedRoute);
          } else {
            console.error('Failed to fetch route data:', response.status, response.statusText);
            // Fallback to default values
            setRouteInfo({
              id: 'default',
              number: 'Default Route',
              stops: ['Stop 1', 'Stop 2', 'Stop 3'],
              timing: '08:00 AM TO 1:00 PM',
              assignedBus: 'N/A',
              assignedDriver: 'N/A',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching route info:', err);
        // Fallback to default values
        setRouteInfo({
          id: 'default',
          number: 'Default Route',
          stops: ['Stop 1', 'Stop 2', 'Stop 3'],
          timing: '08:00 AM TO 1:00 PM',
          assignedBus: 'N/A',
          assignedDriver: 'N/A',
        });
        // Fallback to default ETA
        setEta(10);
      }
    };
    
    fetchRouteInfo();
  }, [user?.routeNo]);

  // Prepare map stops with coordinates for the background map
  const mapStops = fullRouteData?.stoppages && fullRouteData.stoppages.length > 0 
    ? fullRouteData.stoppages.map((stop, index) => {
        let status: "passed" | "current" | "upcoming" = "upcoming";
        
        // Determine status based on current stop index
        if (index < currentStopIndex) {
          status = "passed";
        } else if (index === currentStopIndex) {
          status = "current";
        } else {
          status = "upcoming";
        }
        
        // Find ETA for this stop if available
        const stopEta = stopETAs.find(etaObj => etaObj.stopName === stop.name);
        
        return {
          name: stop.name,
          lat: stop.coordinates.lat,
          lng: stop.coordinates.lng,
          status,
          time: stop.arrivalTime || "--:--",
          minutes: stopEta?.minutes,
          km: stopEta?.km,
          sequenceOrder: stop.sequenceOrder,
        };
      })
    : routeInfo?.stops && routeInfo.stops.length > 0
      ? routeInfo.stops.map((stop, index) => {
          // For fallback, use default coordinates
          return {
            name: stop,
            lat: 20.352000 - (index * 0.02), // Default coordinates for ITER campus
            lng: 85.817000 + (index * 0.01),
            status: index < currentStopIndex ? "passed" as const : index === currentStopIndex ? "current" as const : "upcoming" as const,
            time: "--:--",
            minutes: undefined,
            km: undefined,
            sequenceOrder: index,
          };
        })
      : [
          { name: "ITER Campus", lat: 20.352000, lng: 85.817000, status: "current" as const, time: "--:--", sequenceOrder: 0 },
          { name: "Gate 1", lat: 20.355000, lng: 85.820000, status: "upcoming" as const, time: "--:--", sequenceOrder: 1 },
          { name: "Admin Block", lat: 20.350000, lng: 85.815000, status: "upcoming" as const, time: "--:--", sequenceOrder: 2 },
        ];

  return (
    <MobileLayout>
      <div className="relative h-screen overflow-hidden">
        {/* Leaflet Map Background - Faded & Greyscale Effect */}
        <div className="absolute inset-0 z-0 opacity-40" style={{ filter: 'grayscale(100%)' }}>
          <RouteMap 
            stops={mapStops} 
            routeNumber="Route"
            busLocation={busLocation}
            showLiveTracking={!!busLocation}
            currentStopIndex={currentStopIndex}
          />
        </div>

        {/* Overlay gradient for better readability */}
        <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-background/30 via-background/20 to-background/50"></div>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 px-6 pt-12 pb-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2"
            >
              <Menu className="w-6 h-6 text-foreground" />
            </button>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Your Current Location</span>
            </div>

            <button 
              onClick={() => setNotificationsOpen(true)}
              className="p-2 -mr-2 relative"
            >
              <Bell className="w-6 h-6 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>
        </div>

        {/* Status Chip with ETA */}
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm shadow-lg flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Reaching your stop in {eta} min</span>
          </div>
        </div>

        {/* Bus Icon on Map */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-10">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Bus className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>

        {/* Bottom Sheet */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-lg transition-all duration-300 z-20 ${
            bottomSheetExpanded ? "h-[55%]" : "h-32"
          }`}
        >
          <div className="px-6 pt-4">
            {/* Handle */}
            <button 
              onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
              className="w-full flex justify-center mb-4"
            >
              {bottomSheetExpanded ? (
                <ChevronDown className="w-6 h-6 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-6 h-6 text-muted-foreground" />
              )}
            </button>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {routeInfo?.number || "Route no.1"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {routeInfo?.stops?.length ? `${routeInfo.stops[0]} to ${routeInfo.stops[routeInfo.stops.length - 1]}` : "Kottur to Campus"}
                </p>
              </div>
              <div className="text-right">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Bus className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Route and ETA Info */}
            {bottomSheetExpanded && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Timing</p>
                  <p className="text-sm font-medium text-foreground">
                    {routeInfo?.timing || "06:00 AM"}
                  </p>
                </div>
                <div className="bg-muted rounded-xl p-3 flex flex-col items-end">
  <p className="text-xs text-muted-foreground mb-1">
    ETA
  </p>
  <p className="text-sm font-medium text-foreground flex items-center gap-1">
    <Clock className="w-4 h-4 text-primary" />
    {eta} min
  </p>
</div>

                {routeInfo?.assignedBus && (
                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Bus</p>
                    <p className="text-sm font-medium text-foreground">
                      {routeInfo.assignedBus}
                    </p>
                  </div>
                )}
                {routeInfo?.assignedDriver && (
                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Driver</p>
                    <p className="text-sm font-medium text-foreground">
                      {routeInfo.assignedDriver}
                    </p>
                  </div>
                )}
              </div>
            )}

            {bottomSheetExpanded && (
              <>
                {/* Timeline */}
                <div className="space-y-0 mb-6">
                  {mapStops.map((stop, index) => (
                    <div key={stop.name} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div 
                          className={`w-4 h-4 rounded-full border-2 ${
                            stop.status === "passed" 
                              ? "bg-primary border-primary" 
                              : stop.status === "current"
                              ? "bg-primary border-primary animate-pulse"
                              : "bg-muted border-muted-foreground"
                          }`}
                        />
                        {index < mapStops.length - 1 && (
                          <div className={`w-0.5 h-8 ${
                            stop.status === "passed" ? "bg-primary" : "bg-muted"
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 flex justify-between pb-6">
                        <span className={`text-sm ${
                          stop.status === "current" ? "text-primary font-medium" : "text-card-foreground"
                        }`}>
                          {stop.name}
                        </span>
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground">{stop.time}</span>
                          {stop.minutes !== undefined && (
                            <div className="text-xs text-primary">
                              ETA: {stop.minutes} min {stop.km && `(${stop.km} km)`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <GradientButton 
                  onClick={() => setShowRouteDetails(true)}
                  className="w-full"
                >
                  View Route Details
                </GradientButton>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Notifications */}
        <NotificationSheet 
          open={notificationsOpen} 
          onClose={() => setNotificationsOpen(false)} 
        />

        {/* Route Details Modal */}
        {routeInfo && (
          <RouteDetailsModal
            open={showRouteDetails}
            onClose={() => setShowRouteDetails(false)}
            routeNumber={routeInfo.number}
            stops={routeInfo.stops}
            timing={routeInfo.timing}
            eta={eta}
            assignedBus={routeInfo.assignedBus}
            assignedDriver={routeInfo.assignedDriver}
            conductorName={routeInfo.conductorName}
            conductorPhone={routeInfo.conductorPhone}
            stopETAs={stopETAs}
          />
        )}
      </div>
    </MobileLayout>
  );
};

export default Home;
