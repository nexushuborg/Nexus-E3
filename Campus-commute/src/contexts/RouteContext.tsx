import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Stop {
  name: string;
  coordinates: Coordinate;
  sequenceOrder: number;
  arrivalTime: string | null;
}

export interface BusRoute {
  busNumber: string;
  busName: string;
  routeName: string;
  startPoint: { name: string; coordinates: Coordinate };
  stoppages: Stop[];
  endPoint: { name: string; coordinates: Coordinate };
  classTime: string;
  arrivalBus: string;
  drivers: any[];
  isActive: boolean;
  remarks: string | null;
}

interface RouteContextType {
  routes: BusRoute[];
  selectedRoute: BusRoute;
  setSelectedRoute: (route: BusRoute) => void;
  liveBusPosition: [number, number];
  setLiveBusPosition: React.Dispatch<React.SetStateAction<[number, number]>>;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider = ({ children }: { children: ReactNode }) => {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);
  const [liveBusPosition, setLiveBusPosition] = useState<[number, number]>([20.2961, 85.8245]); // Default bbsr

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch("http://localhost:8000/routes");
        if (response.ok) {
          const data = await response.json();
          setRoutes(data);
          if (data.length > 0) {
            setSelectedRoute(data[0]);
            setLiveBusPosition([data[0].startPoint.coordinates.lat, data[0].startPoint.coordinates.lng]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch routes", err);
      }
    };
    fetchRoutes();
  }, []);

  if (!selectedRoute) return null; // Prevent rendering components that depend on routes before they load

  return (
    <RouteContext.Provider
      value={{
        routes,
        selectedRoute,
        setSelectedRoute,
        liveBusPosition,
        setLiveBusPosition,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
};

export const useRouteContext = (): RouteContextType => {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error("useRouteContext must be used within a RouteProvider");
  }
  return context;
};
