import { useState, useEffect, useRef, useMemo } from "react";
import { Menu, Bell, MapPin, ChevronUp, ChevronDown, Bus, Clock, Navigation, ChevronLeft, ChevronRight, Crosshair, WifiOff } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import GradientButton from "@/components/GradientButton";
import AppSidebar from "@/components/AppSidebar";
import NotificationSheet from "@/components/NotificationSheet";
import RouteMap from "@/components/RouteMap";
import { useAuth } from "@/contexts/AuthContext";
import { useRouteContext } from "@/contexts/RouteContext";

const Home = () => {
  const { user } = useAuth();
  const { routes, selectedRoute, setSelectedRoute, liveBusPosition, setLiveBusPosition, stopETAs, notifications, clearNotifications, socketConnected } = useRouteContext();
  const mapRef = useRef<any>(null);
  const [trackingBus, setTrackingBus] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(true);
  
  // Fix #5: Real ETA from backend stop-wise calculation
  const eta = useMemo(() => {
    if (stopETAs.length > 0) {
      return stopETAs[0].minutes; // nearest stop ETA
    }
    return null; // no data yet
  }, [stopETAs]); 

  if (!selectedRoute) {
    return (
      <MobileLayout>
         <div className="flex items-center justify-center h-screen w-full bg-background">
            <div className="animate-pulse flex flex-col items-center">
               <Bus className="w-12 h-12 text-primary opacity-50 mb-4" />
               <p className="text-muted-foreground font-medium">Booting Tracker Network...</p>
            </div>
         </div>
      </MobileLayout>
    );
  }

  const handleScroll = (direction: "left" | "right") => {
    const container = document.getElementById("routes-container-desktop");
    if (container) {
      const scrollAmount = 150;
      if (direction === "left") {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const activeDriver = selectedRoute?.drivers && selectedRoute.drivers.length > 0 
    ? selectedRoute.drivers[0] 
    : null;

  return (
    <MobileLayout>
      {/* Root Layout Layer: Column on mobile, Row split on Desktop */}
      <div className="relative h-screen overflow-hidden flex flex-col md:flex-row w-full bg-background">
        
        {/* =========================================
            DESKTOP SIDEBAR (w-96 pinned left)
            Hidden on Mobile, Displayed on md+ 
        ===========================================*/}
        <div className="hidden md:flex flex-col w-96 h-screen overflow-y-auto bg-card border-r border-border shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 flex-shrink-0">
           <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Campus Commute</h2>
              
              {/* Desktop Route Selection Carousel */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Route</h3>
                  <div className="flex gap-1">
                    <button onClick={() => handleScroll("left")} className="p-1 hover:bg-muted rounded-full">
                      <ChevronLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <button onClick={() => handleScroll("right")} className="p-1 hover:bg-muted rounded-full">
                      <ChevronRight className="w-5 h-5 text-foreground" />
                    </button>
                  </div>
                </div>

                <div 
                  id="routes-container-desktop"
                  className="flex gap-4 overflow-x-auto pb-4 scroll-smooth hide-scrollbar"
                  style={{ scrollbarWidth: "none" }}
                >
                  {routes.map((route) => (
                    <button
                      key={route.busNumber + "desktop"}
                      onClick={() => setSelectedRoute(route)}
                      className={`flex flex-col items-center min-w-[70px] transition-all relative ${
                        selectedRoute.busNumber === route.busNumber ? "scale-105" : ""
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                          selectedRoute.busNumber === route.busNumber 
                            ? "bg-primary text-primary-foreground shadow-md" 
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Bus className="w-6 h-6" />
                      </div>
                      <span className={`text-[11px] mt-2 text-center whitespace-nowrap leading-tight ${
                        selectedRoute.busNumber === route.busNumber ? "text-foreground font-semibold" : "text-muted-foreground"
                      }`}>
                        {route.busName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Stop details */}
              <div className="bg-muted/50 rounded-2xl p-5 mb-6 border border-border/50">
                 <h3 className="font-semibold text-foreground text-lg mb-1">{selectedRoute.routeName}</h3>
                 <p className="text-sm text-muted-foreground">{selectedRoute.startPoint.name} to {selectedRoute.endPoint.name}</p>
                 
                 <div className="grid grid-cols-2 gap-4 mt-5">
                   <div>
                     <p className="text-xs text-muted-foreground mb-1">Timing</p>
                     <p className="text-sm font-medium">{selectedRoute.classTime}</p>
                   </div>
                   {activeDriver && (
                     <div>
                       <p className="text-xs text-muted-foreground mb-1">Driver</p>
                       <p className="text-sm font-medium">{activeDriver.name}</p>
                     </div>
                   )}
                 </div>
              </div>

              {/* Desktop Timeline */}
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Stoppage Timeline</h3>
              <div className="space-y-0">
                {selectedRoute.stoppages.map((stop, index) => {
                  const isFirst = index === 0;
                  const isLast = index === selectedRoute.stoppages.length - 1;
                  return (
                  <div key={stop.name + "desktop"} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-2 bg-background z-10 ${
                         isFirst ? "border-green-500" : isLast ? "border-red-500" : "border-primary"
                      }`} />
                      {!isLast && <div className="w-0.5 h-12 bg-border my-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-foreground">{stop.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stop.arrivalTime || "TBD"}</p>
                    </div>
                  </div>
                )})}
              </div>
           </div>
        </div>

        {/* =========================================
            MAP STRETCH ZONE (flex-1 fill right)
        ===========================================*/}
        <div className="flex-1 relative h-screen w-full bg-muted/20">
          
          {/* Leaflet Map Background (Filters removed for 100% vibrance) */}
          <div className="absolute inset-0 z-0">
            <RouteMap />
          </div>

          {/* Map Top-Gradient Shadow (ensures top bar icons are readable) */}
          <div className="absolute top-0 left-0 right-0 h-32 z-[1] pointer-events-none bg-gradient-to-b from-background/40 to-transparent"></div>

          {/* FIXED: You are Offline Banner (BONUS 1) */}
          {!socketConnected && (
            <div className="absolute top-0 left-0 right-0 z-[1001] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold shadow-md animate-in slide-in-from-top">
              <WifiOff className="w-4 h-4" /> Connection lost — trying to reconnect...
            </div>
          )}

          {/* Top Floating Control Bar */}
          <div className={`absolute left-0 right-0 z-10 px-6 pb-4 pointer-events-none flex items-center justify-between transition-all ${!socketConnected ? 'top-10 pt-4' : 'top-0 pt-12'}`}>
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-3 bg-background/80 backdrop-blur rounded-full shadow-sm pointer-events-auto hover:bg-background transition-colors"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            
            <div className="bg-background/80 backdrop-blur px-4 py-2 rounded-full shadow-sm flex items-center gap-2 pointer-events-auto border border-border/50">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Active Tracker</span>
            </div>

            <button 
              onClick={() => setNotificationsOpen(true)}
              className="p-3 bg-background/80 backdrop-blur rounded-full shadow-sm relative pointer-events-auto hover:bg-background transition-colors"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-background">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>
          </div>

          {/* ETA Pill */}
          {liveBusPosition && eta !== null && (
            <div className="absolute top-40 left-1/2 -translate-x-1/2 z-[1001] pointer-events-none">
              <div className="bg-primary/95 backdrop-blur text-primary-foreground px-5 py-2.5 rounded-full text-sm shadow-xl flex items-center gap-2 border border-primary-foreground/20">
                <Clock className="w-4 h-4" />
                <span className="font-medium whitespace-nowrap">Incoming in ~{eta} min</span>
              </div>
            </div>
          )}

          {/* 📍 Track Bus Button — shown when live bus is active */}
          {liveBusPosition && (
            <div className="absolute bottom-48 right-4 z-[1001] md:bottom-8">
              <button
                onClick={() => {
                  setTrackingBus(true);
                  // Dispatch a custom event that RouteMap listens to for recentering
                  window.dispatchEvent(new CustomEvent('recenter-on-bus', { detail: liveBusPosition }));
                  setTimeout(() => setTrackingBus(false), 2000);
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl font-semibold text-sm transition-all ${
                  trackingBus
                    ? 'bg-emerald-500 text-white scale-95'
                    : 'bg-background/95 backdrop-blur text-foreground border border-border hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                <Crosshair className="w-4 h-4" />
                {trackingBus ? 'Tracking...' : '📍 Track Bus'}
              </button>
            </div>
          )}

          {/* =========================================
              MOBILE BOTTOM SHEET (Hidden on md+)
          ===========================================*/}
          <div 
            className={`md:hidden absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 z-20 flex flex-col ${
              bottomSheetExpanded ? "h-[65%]" : "h-32"
            }`}
          >
            <div className="px-6 pt-4 flex-1 flex flex-col overflow-hidden">
              <button 
                onClick={() => setBottomSheetExpanded(!bottomSheetExpanded)}
                className="w-full flex justify-center mb-4 pb-2"
              >
                {bottomSheetExpanded ? (
                  <ChevronDown className="w-6 h-6 text-muted-foreground" />
                ) : (
                  <ChevronUp className="w-6 h-6 text-muted-foreground" />
                )}
              </button>

              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {selectedRoute.busName}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground mt-0.5">
                    {selectedRoute.startPoint.name} <span className="opacity-50 mx-1">→</span> {selectedRoute.endPoint.name}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bus className="w-6 h-6 text-primary" />
                </div>
              </div>

              {bottomSheetExpanded && (
                <div className="flex-1 overflow-y-auto hide-scrollbar pb-6 space-y-6">
                   <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted rounded-2xl p-4">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Timing</p>
                      <p className="text-sm font-bold text-foreground">{selectedRoute.classTime}</p>
                    </div>
                    <div className="bg-muted rounded-2xl p-4">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">ETA</p>
                      <p className="text-sm font-bold text-primary flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {eta !== null ? `${eta} min` : "—"}
                      </p>
                    </div>
                   </div>

                   <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Live Timeline</h4>
                      <div className="space-y-0">
                        {selectedRoute.stoppages.map((stop, index) => {
                          const isFirst = index === 0;
                          const isLast = index === selectedRoute.stoppages.length - 1;
                          return (
                          <div key={stop.name + "mobile"} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-3.5 h-3.5 rounded-full border-2 bg-background z-10 ${
                                isFirst ? "border-green-500" : isLast ? "border-red-500" : "border-primary"
                              }`} />
                              {!isLast && <div className="w-0.5 h-10 bg-border my-1" />}
                            </div>
                            <div className="flex-1 pb-4 flex justify-between items-center -mt-1">
                              <span className="text-[15px] font-medium text-foreground">{stop.name}</span>
                              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">{stop.arrivalTime || "TBD"}</span>
                            </div>
                          </div>
                        )})}
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
          {/* END MOBILE BOTTOM SHEET */}
          
        </div>
        
        {/* Global Floating Handlers */}
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <NotificationSheet
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={notifications}
          onClear={clearNotifications}
        />
        
      </div>
    </MobileLayout>
  );
};

export default Home;
