import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bus, MapPin, Clock, Navigation, Bell, BellRing, Gauge,
  Circle, CheckCircle2, Radio, Timer, Route as RouteIcon, Wifi, WifiOff
} from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import { useRouteContext } from "@/contexts/RouteContext";
import { useToast } from "@/hooks/use-toast";

const RunningStatus = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    selectedRoute,
    liveBusPosition,
    stopETAs,
    tripStatus,
    socketConnected,
  } = useRouteContext();

  // Alarm feature state
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmMinutes, setAlarmMinutes] = useState(15);
  const [alarmFired, setAlarmFired] = useState(false);
  const [showAlarmModal, setShowAlarmModal] = useState(false);

  // Elapsed time counter
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!tripStatus?.tripStartTime || tripStatus.status !== "running") {
      setElapsed("");
      return;
    }
    const interval = setInterval(() => {
      const diff = Date.now() - tripStatus.tripStartTime!;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(`${mins}m ${secs.toString().padStart(2, "0")}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [tripStatus?.tripStartTime, tripStatus?.status]);

  // Nearest stop ETA for alarm
  const nearestETA = useMemo(() => {
    if (stopETAs.length > 0) return stopETAs[0].minutes;
    return null;
  }, [stopETAs]);

  // ETA to destination (last stop)
  const destinationETA = useMemo(() => {
    if (stopETAs.length > 0) return stopETAs[stopETAs.length - 1].minutes;
    return null;
  }, [stopETAs]);

  // Alarm trigger logic
  useEffect(() => {
    if (!alarmEnabled || alarmFired || destinationETA === null) return;
    if (destinationETA <= alarmMinutes) {
      setAlarmFired(true);
      // Browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🔔 Bus Arrival Alert", {
          body: `Your bus will arrive in ~${destinationETA} minutes!`,
          icon: "/favicon.ico",
        });
      }
      toast({
        title: "🔔 Arrival Alert!",
        description: `Bus arriving at destination in ~${destinationETA} min`,
      });
    }
  }, [alarmEnabled, alarmFired, destinationETA, alarmMinutes, toast]);

  // Request notification permission on alarm enable
  const enableAlarm = useCallback(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setAlarmEnabled(true);
    setAlarmFired(false);
    setShowAlarmModal(false);
    toast({
      title: "⏰ Alarm Set",
      description: `You'll be notified ${alarmMinutes} min before arrival`,
    });
  }, [alarmMinutes, toast]);

  const status = tripStatus?.status || "not-started";

  const statusConfig = {
    "not-started": { label: "Not Started", color: "bg-gray-400", textColor: "text-gray-600", icon: Circle, pulse: false },
    running: { label: "Running", color: "bg-emerald-500", textColor: "text-emerald-600", icon: Radio, pulse: true },
    reached: { label: "Reached", color: "bg-blue-500", textColor: "text-blue-600", icon: CheckCircle2, pulse: false },
  };

  const cfg = statusConfig[status];

  if (!selectedRoute) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="animate-pulse flex flex-col items-center">
            <Bus className="w-12 h-12 text-primary opacity-50 mb-4" />
            <p className="text-muted-foreground font-medium">Loading...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-background flex flex-col">

        {/* Header */}
        <div className="px-5 pt-12 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/home")}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1">Running Status</h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {socketConnected ? (
              <><Wifi className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">Live</span></>
            ) : (
              <><WifiOff className="w-3.5 h-3.5 text-red-400" /><span className="text-red-500">Offline</span></>
            )}
          </div>
        </div>

        {/* Route Title Card */}
        <div className="mx-5 p-4 bg-muted/50 rounded-2xl border border-border/50 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-foreground">{selectedRoute.busName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedRoute.startPoint.name} → {selectedRoute.endPoint.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Vehicle</p>
              <p className="text-sm font-semibold text-foreground">{selectedRoute.arrivalBus}</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mx-5 mb-4">
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
            status === "running" ? "bg-emerald-500/5 border-emerald-500/20" :
            status === "reached" ? "bg-blue-500/5 border-blue-500/20" :
            "bg-muted border-border/50"
          }`}>
            <div className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${cfg.color}`}>
                <cfg.icon className="w-6 h-6 text-white" />
              </div>
              {cfg.pulse && (
                <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400 opacity-30"></span>
              )}
            </div>
            <div className="flex-1">
              <p className={`font-bold text-lg ${cfg.textColor}`}>{cfg.label}</p>
              {status === "running" && elapsed && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Timer className="w-3 h-3" /> Running for {elapsed}
                </p>
              )}
              {status === "not-started" && (
                <p className="text-xs text-muted-foreground">
                  Waiting for driver to start the trip
                </p>
              )}
              {status === "reached" && (
                <p className="text-xs text-muted-foreground">Bus has reached the destination</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {status === "running" && (
          <div className="mx-5 grid grid-cols-2 gap-3 mb-4">
            <div className="bg-muted/50 rounded-2xl p-4 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Next Stop</p>
              <p className="text-sm font-bold text-foreground truncate flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                {tripStatus?.nextStopName || "—"}
              </p>
            </div>
            <div className="bg-muted/50 rounded-2xl p-4 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">ETA (Next)</p>
              <p className="text-sm font-bold text-primary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {nearestETA !== null ? `${nearestETA} min` : "—"}
              </p>
            </div>
            <div className="bg-muted/50 rounded-2xl p-4 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Distance Left</p>
              <p className="text-sm font-bold text-foreground flex items-center gap-1">
                <RouteIcon className="w-3.5 h-3.5 text-orange-500" />
                {tripStatus?.distanceRemainingKm ? `${tripStatus.distanceRemainingKm} km` : "—"}
              </p>
            </div>
            <div className="bg-muted/50 rounded-2xl p-4 border border-border/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">ETA Dest.</p>
              <p className="text-sm font-bold text-primary flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" />
                {destinationETA !== null ? `${destinationETA} min` : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Alarm Button */}
        <div className="mx-5 mb-4">
          <button
            onClick={() => {
              if (alarmEnabled) {
                setAlarmEnabled(false);
                setAlarmFired(false);
                toast({ title: "Alarm Disabled" });
              } else {
                setShowAlarmModal(true);
              }
            }}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
              alarmEnabled
                ? "bg-primary/5 border-primary/30 text-primary"
                : "bg-muted/50 border-border/50 text-foreground hover:border-primary/30"
            }`}
          >
            {alarmEnabled ? (
              <BellRing className="w-5 h-5 text-primary animate-bounce" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            <div className="flex-1 text-left">
              <p className="font-medium text-sm">
                {alarmEnabled ? `Alarm set — ${alarmMinutes} min before arrival` : "Set Arrival Alarm"}
              </p>
              <p className="text-xs text-muted-foreground">
                {alarmEnabled ? "Tap to disable" : "Get notified before the bus arrives"}
              </p>
            </div>
            {alarmEnabled && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-lg font-bold">
                ON
              </span>
            )}
          </button>
        </div>

        {/* Alarm Modal */}
        {showAlarmModal && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowAlarmModal(false)} />
            <div className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <h3 className="text-lg font-bold text-foreground mb-4">Set Arrival Alarm</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Notify me before the bus reaches the destination:
              </p>
              <div className="flex gap-3 mb-6">
                {[5, 10, 15, 20, 30].map(m => (
                  <button
                    key={m}
                    onClick={() => setAlarmMinutes(m)}
                    className={`flex-1 py-3 rounded-xl text-center text-sm font-medium transition-all ${
                      alarmMinutes === m
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
              <button
                onClick={enableAlarm}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Enable Alarm
              </button>
            </div>
          </>
        )}

        {/* Live Stoppage Timeline */}
        <div className="mx-5 flex-1 pb-8">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5" />
            Live Stoppage Timeline
          </h3>

          <div className="space-y-0">
            {selectedRoute.stoppages.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === selectedRoute.stoppages.length - 1;
              const isVisited = tripStatus?.visitedStops?.includes(stop.name) ?? false;
              const isCurrent = tripStatus?.nearestStopIndex === index && status === "running";
              const isNext = tripStatus?.nextStopIndex === index && status === "running";

              // Get ETA for this stop
              const stopETA = stopETAs.find(e => e.stopName === stop.name);

              return (
                <div key={`${stop.name}-${index}`} className="flex items-start gap-3">
                  {/* Timeline Node */}
                  <div className="flex flex-col items-center w-6 flex-shrink-0">
                    <div className={`w-4 h-4 rounded-full border-2 z-10 flex items-center justify-center transition-all ${
                      isCurrent ? "border-emerald-500 bg-emerald-500 scale-125 shadow-lg shadow-emerald-500/30" :
                      isVisited ? "border-emerald-500 bg-emerald-500" :
                      isNext ? "border-primary bg-primary/20 animate-pulse" :
                      isFirst ? "border-green-500 bg-green-500" :
                      isLast ? "border-red-500 bg-background" :
                      "border-muted-foreground/30 bg-background"
                    }`}>
                      {isCurrent && (
                        <Bus className="w-2.5 h-2.5 text-white" />
                      )}
                      {isVisited && !isCurrent && (
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-12 my-0.5 transition-colors ${
                        isVisited ? "bg-emerald-400" : "bg-border"
                      }`} />
                    )}
                  </div>

                  {/* Stop Info */}
                  <div className={`flex-1 pb-2 -mt-0.5 flex justify-between items-center ${
                    isCurrent ? "" : ""
                  }`}>
                    <div className="flex-1">
                      <span className={`text-[13px] font-medium ${
                        isCurrent ? "text-emerald-600 dark:text-emerald-400 font-bold" :
                        isVisited ? "text-muted-foreground line-through" :
                        isNext ? "text-primary font-semibold" :
                        "text-foreground"
                      }`}>
                        {stop.name}
                      </span>
                      {isCurrent && (
                        <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                          Current
                        </span>
                      )}
                      {isNext && !isCurrent && (
                        <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                          Next
                        </span>
                      )}
                    </div>

                    {/* Time / ETA */}
                    <div className="text-right ml-2 flex-shrink-0">
                      {status === "running" && stopETA && !isVisited ? (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                          ~{stopETA.minutes}m
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          {stop.arrivalTime || "—"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </MobileLayout>
  );
};

export default RunningStatus;
