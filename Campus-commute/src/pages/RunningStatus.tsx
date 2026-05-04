import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bus, MapPin, Clock, Navigation, Bell, BellRing, Gauge,
  Circle, CheckCircle2, Radio, Timer, Route as RouteIcon, Wifi, WifiOff, AlertTriangle
} from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import AuthCard from "@/components/AuthCard";
import BackButton from "@/components/BackButton";
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
  const [alarmStopName, setAlarmStopName] = useState<string>("");
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false); // FIXED: BUG 5
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const vibrateIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Selected stop ETA for alarm
  const selectedStopETA = useMemo(() => {
    if (!alarmStopName) return null;
    const etaObj = stopETAs.find((e) => e.stopName === alarmStopName);
    return etaObj ? etaObj.minutes : null;
  }, [stopETAs, alarmStopName]);

  // Set default alarm stop if empty
  useEffect(() => {
    if (selectedRoute && !alarmStopName) {
      setAlarmStopName(selectedRoute.endPoint.name);
    }
  }, [selectedRoute, alarmStopName]);

  // Alarm trigger logic
  useEffect(() => {
    if (!alarmEnabled || alarmFired || selectedStopETA === null) return;
    
    // Check if the bus has already passed the stop.
    const hasPassed = tripStatus?.visitedStops?.includes(alarmStopName);
    if (hasPassed) {
      setAlarmEnabled(false);
      toast({ 
        title: "Bus passed your stop", 
        description: `The bus has already crossed ${alarmStopName}. Alarm disabled.` 
      });
      return;
    }

    if (selectedStopETA <= alarmMinutes) {
      setAlarmFired(true);
      setIsAlarmRinging(true);
      
      // FIXED: Mobile Audio/Vibration Alarm (BUG 5)
      // Start audio only if unlocked
      if (audioUnlocked && audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else if (!audioRef.current) {
        // Fallback try
        audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audioRef.current.loop = true;
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      }

      // Start vibration
      if ("vibrate" in navigator) {
        navigator.vibrate([500, 500, 500]);
        vibrateIntervalRef.current = setInterval(() => {
          navigator.vibrate([500, 500, 500]);
        }, 2000);
      }

      // Browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`🔔 Bus approaching ${alarmStopName}`, {
          body: `Your bus will arrive in ~${selectedStopETA} minutes!`,
          icon: "/favicon.ico",
        });
      }
    }
  }, [alarmEnabled, alarmFired, selectedStopETA, alarmMinutes, alarmStopName, tripStatus?.visitedStops, toast]);

  const stopAlarm = useCallback(() => {
    setIsAlarmRinging(false);
    setAlarmEnabled(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (vibrateIntervalRef.current) {
      clearInterval(vibrateIntervalRef.current);
    }
    if ("vibrate" in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  // FIXED: Alarm Persist Fix on Logout (BONUS 3)
  useEffect(() => {
    window.addEventListener("clear-alarm", stopAlarm);
    return () => window.removeEventListener("clear-alarm", stopAlarm);
  }, [stopAlarm]);

  // Request notification permission on alarm enable
  const enableAlarm = useCallback(() => {
    if (!alarmStopName) {
      toast({ title: "Error", description: "Please select a stop" });
      return;
    }
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    // FIXED: Mobile Audio/Vibration Alarm (BUG 5)
    // Unlock Audio Context on user gesture
    if (!audioUnlocked) {
       if (!audioRef.current) {
          audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audioRef.current.loop = true;
       }
       audioRef.current.play().then(() => {
           audioRef.current?.pause();
           audioRef.current!.currentTime = 0;
           setAudioUnlocked(true);
       }).catch(e => console.log("Audio unlock failed (Safari strict mode?):", e));
    }

    setAlarmEnabled(true);
    setAlarmFired(false);
    setShowAlarmModal(false);
    toast({
      title: "⏰ Alarm Set",
      description: `Notify ${alarmMinutes} min before arrival at ${alarmStopName}`,
    });
  }, [alarmMinutes, alarmStopName, toast]);

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
      <AuthCard className="max-h-[95vh] overflow-y-auto flex flex-col p-6 sm:p-8 my-auto">
        <div className="flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <BackButton to="/home" />
          <h1 className="text-xl font-bold text-foreground">Running Status</h1>
          <div className="w-10 flex justify-end">
            {socketConnected ? (
              <Wifi className="w-5 h-5 text-emerald-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
          </div>
        </div>

        {/* Route Title Card */}
        <div className="p-4 bg-muted/50 rounded-2xl border border-border/50 mb-4">
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
        <div className="mb-4">
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
          <div className="grid grid-cols-2 gap-3 mb-4">
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
        <div className="mb-4">
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
              <p className="font-medium text-sm truncate max-w-[200px]">
                {alarmEnabled ? `Alarm set for ${alarmStopName}` : "Set Arrival Alarm"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {alarmEnabled ? `Alert ${alarmMinutes}m before arrival` : "Get notified before the bus reaches your stop"}
              </p>
            </div>
              {alarmEnabled && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-lg font-bold">
                ON
              </span>
            )}
          </button>
        </div>

        {/* FIXED: Mobile Audio/Vibration Alarm (BUG 5) - Warning message */}
        {alarmEnabled && !audioUnlocked && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-start gap-2 cursor-pointer hover:bg-amber-500/20" 
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.play().then(() => {
                  audioRef.current?.pause();
                  setAudioUnlocked(true);
                }).catch(() => {});
              }
            }}>
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Audio alarm may be blocked. Tap here to ensure sound is enabled for the alarm.
            </p>
          </div>
        )}

        {/* Alarm Modal */}
        {showAlarmModal && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowAlarmModal(false)} />
            <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-background rounded-t-3xl z-50 p-6 pb-10 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <h3 className="text-lg font-bold text-foreground mb-4">Set Arrival Alarm</h3>
              
              {/* Stop Selection */}
              <p className="text-sm font-semibold text-foreground mb-2">1. Select your target stop:</p>
              <div className="mb-6 relative">
                 <select 
                   value={alarmStopName} 
                   onChange={(e) => setAlarmStopName(e.target.value)}
                   className="w-full appearance-none bg-muted hover:bg-muted/80 border border-border rounded-xl p-3.5 pr-8 text-sm text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer"
                 >
                    {selectedRoute.stoppages.map(s => {
                      const passed = tripStatus?.visitedStops?.includes(s.name);
                      return (
                         <option key={s.name} value={s.name} disabled={passed}>
                            {s.name} {passed ? "(Already passed)" : ""}
                         </option>
                      );
                    })}
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                 </div>
              </div>

              {/* Time Selection */}
              <p className="text-sm font-semibold text-foreground mb-2">
                2. Notify me before arrival:
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
        <div className="flex-1 pb-4">
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
                  <div className="flex-1 pb-2 -mt-0.5 flex justify-between items-center">
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
      </AuthCard>

      {/* Persistent Alarm Ringing Overlay */}
      {isAlarmRinging && (
        <div className="fixed inset-0 z-[100] bg-destructive/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-background rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <BellRing className="w-10 h-10 text-destructive" />
            </div>
            
            <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">
              Bus Arriving!
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Your bus is ~<span className="font-bold text-foreground">{selectedStopETA} min</span> away from <span className="font-bold text-foreground">{alarmStopName}</span>
            </p>
            
            <button
              onClick={stopAlarm}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground py-4 rounded-xl font-bold text-lg shadow-lg shadow-destructive/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-6 h-6" />
              Stop Alarm
            </button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
};

export default RunningStatus;
