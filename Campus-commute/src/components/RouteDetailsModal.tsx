import React from "react";
import { X, MapPin, Clock, Bus, User, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StopWithETA {
  name: string;
  time: string;
  minutes?: number;
  km?: string;
  sequenceOrder?: number;
  arrivalTime?: string;
}

interface RouteDetailsModalProps {
  open: boolean;
  onClose: () => void;
  routeNumber: string;
  stops: string[];
  timing: string;
  eta?: number;
  assignedBus?: string;
  assignedDriver?: string;
  conductorName?: string;
  conductorPhone?: string;
  stopETAs?: StopWithETA[];
}

const RouteDetailsModal: React.FC<RouteDetailsModalProps> = ({
  open,
  onClose,
  routeNumber,
  stops,
  timing,
  eta,
  assignedBus,
  assignedDriver,
  conductorName,
  conductorPhone,
  stopETAs,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {routeNumber}
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Route Timeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Route Stops
            </h3>
            <div className="space-y-2">
              {(stopETAs && stopETAs.length > 0 ? stopETAs : stops.map(stop => ({ name: stop, time: "--:--" } as StopWithETA))).map((stopData, index) => {
                const stopName = stopData.name;
                const stopTime = stopData.time;
                const stopMinutes = stopData.minutes;
                const stopKm = stopData.km;
                
                return (
                  <div
                    key={`${stopName}-${index}`}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-foreground">{stopName}</div>
                      {(stopMinutes !== undefined || stopTime !== "--:--") && (
                        <div className="text-xs text-muted-foreground">
                          {stopTime !== "--:--" && `${stopTime} `}
                          {stopMinutes !== undefined && `• ETA: ${stopMinutes}min ${stopKm ? `(${stopKm}km)` : ''}`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Route Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Timing
              </p>
              <p className="text-sm font-semibold text-foreground">{timing}</p>
            </div>

            {eta && (
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ETA
                </p>
                <p className="text-sm font-semibold text-foreground">{eta} min</p>
              </div>
            )}

            {assignedBus && (
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Bus className="w-3 h-3" />
                  Bus
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {assignedBus}
                </p>
              </div>
            )}

            {assignedDriver && (
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Driver
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {assignedDriver}
                </p>
              </div>
            )}
          </div>

          {/* Conductor Info */}
          {conductorName && (
            <div className="bg-primary/10 rounded-xl p-3 space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Conductor Information
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-foreground">
                  <span className="text-muted-foreground">Name:</span> {conductorName}
                </p>
                {conductorPhone && (
                  <p className="text-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <a
                      href={`tel:${conductorPhone}`}
                      className="text-primary hover:underline"
                    >
                      {conductorPhone}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RouteDetailsModal;
