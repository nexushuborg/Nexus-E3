import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bus, ChevronLeft, ChevronRight, Clock, MapPin, Navigation } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import GradientButton from "@/components/GradientButton";
import BackButton from "@/components/BackButton";
import { useRouteContext } from "@/contexts/RouteContext";

const RouteSelection = () => {
  const navigate = useNavigate();
  const { routes, selectedRoute, setSelectedRoute } = useRouteContext();
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = (direction: "left" | "right") => {
    const container = document.getElementById("routes-container");
    if (container) {
      const scrollAmount = 90;
      if (direction === "left") {
        container.scrollLeft -= scrollAmount;
        setScrollPosition(container.scrollLeft);
      } else {
        container.scrollLeft += scrollAmount;
        setScrollPosition(container.scrollLeft);
      }
    }
  };

  const activeDriver = selectedRoute.drivers && selectedRoute.drivers.length > 0 
    ? selectedRoute.drivers[0] 
    : null;

  return (
    <MobileLayout>
      <div className="w-full max-w-[1024px] mx-auto">
        <div className="bg-background/95 border border-border rounded-[2rem] shadow-[0_30px_70px_-40px_rgba(15,23,42,0.35)] p-8">
          <div className="flex items-center justify-between mb-6">
            <BackButton />
          </div>

          <div className="flex-1 pt-2">
            <h1 className="text-3xl font-bold text-foreground text-center mb-4">
              Campus Commute
            </h1>
            <h2 className="text-xl text-muted-foreground text-center mb-10">
              Select Your Bus Route
            </h2>

            {/* Horizontal Carousel */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => handleScroll("left")}
                className="p-2 hover:bg-muted rounded-full transition-colors flex-shrink-0"
              >
                <ChevronLeft className="w-6 h-6 text-foreground" />
              </button>

              <div
                id="routes-container"
                className="flex gap-5 overflow-x-auto pb-4 flex-1 scroll-smooth hide-scrollbar"
                style={{ scrollBehavior: "smooth", scrollbarWidth: "none" }}
              >
                {routes.map((route) => (
                  <button
                    key={route.busNumber}
                    onClick={() => setSelectedRoute(route)}
                    className={`flex flex-col items-center min-w-[100px] transition-all relative ${
                      selectedRoute.busNumber === route.busNumber ? "scale-105" : ""
                    }`}
                  >
                    <div 
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                        selectedRoute.busNumber === route.busNumber 
                          ? "bg-primary text-primary-foreground shadow-xl" 
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Bus className="w-7 h-7" />
                    </div>

                    {selectedRoute.busNumber === route.busNumber && (
                      <div className="absolute top-0 right-0 bg-primary border-2 border-background text-white rounded-full p-0.5">
                        <Navigation className="w-3 h-3" />
                      </div>
                    )}

                    <span className={`text-xs mt-2 text-center leading-snug ${
                      selectedRoute.busNumber === route.busNumber ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}>
                      {route.busName}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleScroll("right")}
                className="p-2 hover:bg-muted rounded-full transition-colors flex-shrink-0"
              >
                <ChevronRight className="w-6 h-6 text-foreground" />
              </button>
            </div>

            {/* Selected Route Details Panel */}
            {selectedRoute && (
              <div className="bg-muted rounded-3xl p-6 space-y-5">
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedRoute.routeName}
                </h3>

                {/* Stops Preview */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Route Endpoints
                  </p>
                  <p className="text-sm text-foreground">
                    {selectedRoute.startPoint.name} <span className="mx-2">→</span> {selectedRoute.endPoint.name}
                  </p>
                </div>

                {/* Timing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Timing
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedRoute.classTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Bus</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedRoute.arrivalBus}
                    </p>
                  </div>
                </div>

                {activeDriver && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Driver</p>
                      <p className="text-sm font-medium text-foreground">
                        {activeDriver.name}
                      </p>
                    </div>
                    {activeDriver.contact && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Driver Contact</p>
                        <p className="text-sm font-medium text-primary">
                          +91 {activeDriver.contact}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedRoute.remarks && (
                  <div className="pt-2">
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                      * {selectedRoute.remarks}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-12">
              <GradientButton 
                onClick={() => navigate("/home")}
              >
                Continue to Live Tracker
              </GradientButton>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default RouteSelection;
