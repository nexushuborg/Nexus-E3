const ROUTES = require("../data/routes.json");
const { busState } = require("../models/busState");
const { calculateStopWiseETA } = require("../utils/eta");

const TIMEOUT = 10000;

function socketHandler(io) {
  io.on("connection", (socket) => {

    socket.on("join-bus", ({ busId }) => {
      socket.join(busId);

      if (!busState[busId]) {
        busState[busId] = {
          broadcaster: socket.id,
          users: new Set([socket.id]),
          lastPing: Date.now()
        };

        socket.emit("broadcaster-status", { isBroadcaster: true });
      } else {
        busState[busId].users.add(socket.id);
        socket.emit("broadcaster-status", { isBroadcaster: false });
      }
    });

    socket.on("send-location", async ({ busId, lat, lng }) => {
      const bus = busState[busId];
      if (!bus || bus.broadcaster !== socket.id) return;

      bus.lastPing = Date.now();
      io.to(busId).emit("bus-location", { lat, lng });

      const route = ROUTES.find(r => r.busNumber === busId);
      if (!route) return;

      const stopETAs = await calculateRouteETA(
        { lat, lng },
        route
      );

      io.to(busId).emit("bus-stop-eta", stopETAs);
    });
    
    // Handle driver location broadcasting
    socket.on("driver-send-location", async ({ busId, lat, lng }) => {
      // In a real implementation, you would authenticate the driver here
      const route = ROUTES.find(r => r.busNumber === busId);
      if (!route) return;
      
      // Update bus state with new location
      if (!busState[busId]) {
        busState[busId] = {
          broadcaster: socket.id,
          users: new Set([socket.id]),
          lastPing: Date.now()
        };
      } else {
        busState[busId].broadcaster = socket.id;
        busState[busId].lastPing = Date.now();
      }
      
      // Broadcast the new location to all users watching this bus
      io.to(busId).emit("bus-location", { lat, lng });
      
      // Calculate and broadcast ETAs
      const stopETAs = await calculateRouteETA(
        { lat, lng },
        route
      );
      
      io.to(busId).emit("bus-stop-eta", stopETAs);
    });

    socket.on("disconnect", () => {
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
