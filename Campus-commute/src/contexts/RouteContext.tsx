import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

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

export interface StopETA {
  stopName: string;
  stopId: number;
  minutes: number;
  km: string;
}

export interface LiveNotification {
  id: string;
  type: "trip-started" | "trip-ended" | "bus-near-stop" | "location-update";
  title: string;
  message: string;
  timestamp: number;
}

export interface TripStatus {
  routeId: string;
  status: "running" | "not-started" | "reached";
  lat?: number;
  lng?: number;
  tripStartTime?: number;
  nearestStopIndex?: number;
  nearestStopName?: string;
  nextStopIndex?: number;
  nextStopName?: string;
  distanceRemainingKm?: string;
  totalStops?: number;
  visitedStops?: string[];
  timestamp: number;
}

interface RouteContextType {
  routes: BusRoute[];
  selectedRoute: BusRoute | null;
  setSelectedRoute: (route: BusRoute) => void;
  liveBusPosition: [number, number] | null;
  setLiveBusPosition: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  busRotation: number;
  stopETAs: StopETA[];
  notifications: LiveNotification[];
  clearNotifications: () => void;
  socketConnected: boolean;
  tripStatus: TripStatus | null;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider = ({ children }: { children: ReactNode }) => {
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);
  const [liveBusPosition, setLiveBusPosition] = useState<[number, number] | null>(null);
  const [busRotation, setBusRotation] = useState<number>(0);
  const [stopETAs, setStopETAs] = useState<StopETA[]>([]);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [tripStatus, setTripStatus] = useState<TripStatus | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const addNotification = useCallback((notif: Omit<LiveNotification, "id">) => {
    setNotifications(prev => [
      { ...notif, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ...prev.slice(0, 49), // keep max 50
    ]);
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  // Fetch routes from backend
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch("http://localhost:8000/routes");
        if (response.ok) {
          const data = await response.json();
          setRoutes(data);
          if (data.length > 0) {
            setSelectedRoute(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch routes", err);
      }
    };
    fetchRoutes();
  }, []);

  // Single shared socket connection — joins the selected route's room
  useEffect(() => {
    if (!selectedRoute) return;

    const socketURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
    const socket = io(socketURL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[RouteContext] Socket connected:", socket.id);
      setSocketConnected(true);
      // Join the selected bus room
      socket.emit("join-bus", { busId: selectedRoute.busNumber });
    });

    socket.on("disconnect", () => {
      console.log("[RouteContext] Socket disconnected");
      setSocketConnected(false);
    });

    // ── Live bus position updates ──
    socket.on("driver-location-update", (data: { routeId: string; lat: number; lng: number }) => {
      if (data.routeId === selectedRoute.busNumber) {
        setLiveBusPosition((prev) => {
          if (prev) {
            // FIXED: Bus Marker Rotation (BONUS 2)
            const [prevLat, prevLng] = prev;
            if (prevLat !== data.lat || prevLng !== data.lng) {
              // CSS rotate: 0 is Right (East), 90 is Down (South), -90 is Up (North)
              // latDiff: >0 is North. lngDiff: >0 is East.
              const latDiff = prevLat - data.lat; // Invert to make North negative (Up in CSS)
              const lngDiff = data.lng - prevLng;
              const bearing = Math.atan2(latDiff, lngDiff) * 180 / Math.PI;
              setBusRotation(bearing);
            }
          }
          return [data.lat, data.lng];
        });
      }
    });

    // ── Real ETA data from backend ──
    socket.on("bus-stop-eta", (data: StopETA[]) => {
      if (Array.isArray(data)) {
        setStopETAs(data);
      }
    });

    // ── Bus went offline ──
    socket.on("bus-offline", (data: { routeId: string }) => {
      if (data.routeId === selectedRoute.busNumber) {
        setLiveBusPosition(null);
        setStopETAs([]);
        setTripStatus({ routeId: data.routeId, status: "not-started", timestamp: Date.now() });
      }
    });

    // ── Trip status update (for Running Status page) ──
    socket.on("trip-status-update", (data: TripStatus) => {
      if (data.routeId === selectedRoute.busNumber) {
        setTripStatus(data);
      }
    });

    // Request current trip status on connect
    socket.emit("get-trip-status", { busId: selectedRoute.busNumber });

    // ── Trip started ──
    socket.on("trip-started", (data: { routeId: string; routeName: string; message: string; timestamp: number }) => {
      if (data.routeId === selectedRoute.busNumber) {
        addNotification({
          type: "trip-started",
          title: "🚌 Trip Started",
          message: data.message,
          timestamp: data.timestamp,
        });
      }
    });

    // ── Bus near a stop ──
    socket.on("bus-near-stop", (data: { routeId: string; stopName: string; message: string; timestamp: number }) => {
      if (data.routeId === selectedRoute.busNumber) {
        addNotification({
          type: "bus-near-stop",
          title: "📍 Approaching Stop",
          message: data.message,
          timestamp: data.timestamp,
        });
      }
    });

    // ── Trip ended ──
    socket.on("trip-ended", (data: { routeId: string; routeName: string; message: string; timestamp: number }) => {
      if (data.routeId === selectedRoute.busNumber) {
        setLiveBusPosition(null);
        setStopETAs([]);
        setTripStatus({ routeId: data.routeId, status: "not-started", timestamp: Date.now() });
        addNotification({
          type: "trip-ended",
          title: "🏁 Trip Ended",
          message: data.message,
          timestamp: data.timestamp,
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedRoute, addNotification]);

  // Reset live data when route changes
  useEffect(() => {
    setLiveBusPosition(null);
    setStopETAs([]);
    setTripStatus(null);
  }, [selectedRoute?.busNumber]);

  return (
    <RouteContext.Provider
      value={{
        routes,
        selectedRoute,
        setSelectedRoute,
        liveBusPosition,
        setLiveBusPosition,
        busRotation,
        stopETAs,
        notifications,
        clearNotifications,
        socketConnected,
        tripStatus,
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
