const ROUTES = require("../data/routes.json");
const { busState } = require("../models/busState");
const { calculateStopWiseETA } = require("../utils/eta");

const TIMEOUT = 10000;
const PROXIMITY_RADIUS_M = 500; // meters for "bus near stop" alert

// Haversine distance in meters
function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── Student / generic join ──────────────────────────────────
    socket.on("join-bus", ({ busId }) => {
      socket.join(busId);

      if (!busState[busId]) {
        busState[busId] = {
          broadcaster: socket.id,
          users: new Set([socket.id]),
          lastPing: Date.now(),
          visitedStops: new Set(),
        };
        socket.emit("broadcaster-status", { isBroadcaster: true });
      } else {
        busState[busId].users.add(socket.id);
        socket.emit("broadcaster-status", { isBroadcaster: false });
      }
    });

    // ── Legacy send-location (kept for backward compat) ────────
    socket.on("send-location", async ({ busId, lat, lng }) => {
      const bus = busState[busId];
      if (!bus || bus.broadcaster !== socket.id) return;

      bus.lastPing = Date.now();
      io.to(busId).emit("driver-location-update", { routeId: busId, lat, lng });

      const route = ROUTES.find((r) => r.busNumber === busId);
      if (!route) return;

      const stopETAs = await calculateStopWiseETA({ lat, lng }, route.stoppages);
      io.to(busId).emit("bus-stop-eta", stopETAs);
    });

    // ── Driver location broadcast ──────────────────────────────
    socket.on("driver-send-location", async ({ busId, lat, lng }) => {
      // CRITICAL FIX: ensure driver socket is IN the room
      socket.join(busId);

      const route = ROUTES.find((r) => r.busNumber === busId);
      if (!route) return;

      const isNewSession =
        !busState[busId] || busState[busId].broadcaster !== socket.id;

      // Initialise / update bus state
      if (!busState[busId]) {
        busState[busId] = {
          broadcaster: socket.id,
          users: new Set([socket.id]),
          lastPing: Date.now(),
          visitedStops: new Set(),
          tripStartTime: Date.now(),
        };
      } else {
        busState[busId].users.add(socket.id);
        busState[busId].broadcaster = socket.id;
        busState[busId].lastPing = Date.now();
        if (!busState[busId].tripStartTime) {
          busState[busId].tripStartTime = Date.now();
        }
      }

      // ── Trip-started notification (only on first location of new session)
      if (isNewSession) {
        busState[busId].tripStartTime = Date.now();
        io.to(busId).emit("trip-started", {
          routeId: busId,
          routeName: route.routeName || route.busName,
          message: `${route.busName} has started its trip`,
          timestamp: Date.now(),
        });
      }

      // ── Broadcast live position to all listeners ──
      io.to(busId).emit("driver-location-update", { routeId: busId, lat, lng });

      // ── Proximity check — bus near a stop ──
      const bus = busState[busId];
      // Find nearest stop and next stop
      let nearestStopIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < route.stoppages.length; i++) {
        const d = haversineM(lat, lng, route.stoppages[i].coordinates.lat, route.stoppages[i].coordinates.lng);
        if (d < minDist) {
          minDist = d;
          nearestStopIdx = i;
        }
      }

      const nextStopIdx = Math.min(nearestStopIdx + 1, route.stoppages.length - 1);
      const lastStop = route.stoppages[route.stoppages.length - 1];
      const distToEnd = haversineM(lat, lng, lastStop.coordinates.lat, lastStop.coordinates.lng);
      const isReached = distToEnd < PROXIMITY_RADIUS_M && nearestStopIdx >= route.stoppages.length - 2;

      for (const stop of route.stoppages) {
        if (bus.visitedStops && bus.visitedStops.has(stop.name)) continue;

        const dist = haversineM(lat, lng, stop.coordinates.lat, stop.coordinates.lng);
        if (dist < PROXIMITY_RADIUS_M) {
          io.to(busId).emit("bus-near-stop", {
            routeId: busId,
            stopName: stop.name,
            distanceMeters: Math.round(dist),
            message: `Bus approaching ${stop.name}`,
            timestamp: Date.now(),
          });

          if (!bus.visitedStops) bus.visitedStops = new Set();
          bus.visitedStops.add(stop.name);
        }
      }

      // ── Emit rich trip-status-update for Running Status page ──
      io.to(busId).emit("trip-status-update", {
        routeId: busId,
        status: isReached ? "reached" : "running",
        lat,
        lng,
        tripStartTime: bus.tripStartTime,
        nearestStopIndex: nearestStopIdx,
        nearestStopName: route.stoppages[nearestStopIdx].name,
        nextStopIndex: nextStopIdx,
        nextStopName: route.stoppages[nextStopIdx].name,
        distanceRemainingKm: (distToEnd / 1000).toFixed(2),
        totalStops: route.stoppages.length,
        visitedStops: bus.visitedStops ? [...bus.visitedStops] : [],
        timestamp: Date.now(),
      });

      // ── Calculate and broadcast ETAs ──
      try {
        const stopETAs = await calculateStopWiseETA({ lat, lng }, route.stoppages);
        io.to(busId).emit("bus-stop-eta", stopETAs);
      } catch (err) {
        console.error("[Socket] ETA calculation error:", err.message);
      }
    });

    // ── On-demand trip status request ──
    socket.on("get-trip-status", ({ busId }) => {
      const bus = busState[busId];
      const route = ROUTES.find((r) => r.busNumber === busId);
      if (!bus || !route) {
        socket.emit("trip-status-update", {
          routeId: busId,
          status: "not-started",
          timestamp: Date.now(),
        });
        return;
      }
      // If we have bus state but no recent ping, it's stale
      socket.emit("trip-status-update", {
        routeId: busId,
        status: "running",
        tripStartTime: bus.tripStartTime || null,
        visitedStops: bus.visitedStops ? [...bus.visitedStops] : [],
        timestamp: Date.now(),
      });
    });

    // ── Driver goes offline ────────────────────────────────────
    socket.on("driver-offline", ({ busId }) => {
      const route = ROUTES.find((r) => r.busNumber === busId);

      io.to(busId).emit("bus-offline", { routeId: busId });
      io.to(busId).emit("trip-ended", {
        routeId: busId,
        routeName: route ? route.busName : busId,
        message: `${route ? route.busName : busId} has ended its trip`,
        timestamp: Date.now(),
      });

      if (busState[busId]) {
        delete busState[busId];
      }
    });

    // ── Disconnect cleanup ─────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      for (const id in busState) {
        const bus = busState[id];
        if (!bus.users.has(socket.id)) continue;

        bus.users.delete(socket.id);

        if (bus.broadcaster === socket.id) {
          promote(io, id);
        }

        if (bus.users.size === 0) {
          delete busState[id];
        }
      }
    });
  });

  // Stale broadcaster promotion interval
  setInterval(() => {
    const now = Date.now();
    for (const id in busState) {
      if (now - busState[id].lastPing > TIMEOUT) {
        promote(io, id);
      }
    }
  }, 5000);
}

function promote(io, busId) {
  const bus = busState[busId];
  if (!bus || bus.users.size === 0) return;

  const next = bus.users.values().next().value;
  bus.broadcaster = next;
  bus.lastPing = Date.now();

  io.to(next).emit("broadcaster-status", { isBroadcaster: true });
  io.to(busId).emit("handover");
}

module.exports = { socketHandler };
