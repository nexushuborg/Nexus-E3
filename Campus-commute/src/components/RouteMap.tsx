import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Stop {
  name: string;
  lat: number;
  lng: number;
  status: "passed" | "current" | "upcoming";
  time: string;
}

interface RouteMapProps {
  stops: Stop[];
  routeNumber?: string;
}

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const bearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const RouteMap: React.FC<RouteMapProps> = ({ stops, routeNumber = "Route" }) => {
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const completedLineRef = useRef<L.Polyline | null>(null);
  const remainingLineRef = useRef<L.Polyline | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!document.getElementById("route-map-keyframes")) {
      const style = document.createElement("style");
      style.id = "route-map-keyframes";
      style.innerHTML = `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(14,165,233,0.18); }
          70% { box-shadow: 0 0 0 12px rgba(14,165,233,0); }
          100% { box-shadow: 0 0 0 0 rgba(14,165,233,0); }
        }
      `;
      document.head.appendChild(style);
    }

    const mapInstance = L.map("route-map", {
      zoomControl: true,
      attributionControl: false,
    }).setView([stops[0]?.lat || 13.0827, stops[0]?.lng || 80.2707], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(mapInstance);

    // Locate control (centers on user marker)
    const locateControl = L.control({ position: "topright" });
    locateControl.onAdd = function () {
      const container = L.DomUtil.create("div", "leaflet-bar rounded bg-white shadow p-1 m-2 cursor-pointer");
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.justifyContent = "center";
      container.style.width = "38px";
      container.style.height = "38px";
      container.title = "Center on my location";
      container.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' class='w-5 h-5 text-primary'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 2v2m0 16v2m10-10h-2M4 12H2m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M6.343 6.343L4.93 4.93' /></svg>`;

      L.DomEvent.on(container, "click", () => {
        const m = mapRef.current;
        const um = userMarkerRef.current;
        if (m && um) {
          m.setView(um.getLatLng(), 15, { animate: true });
        }
      });

      return container;
    };
    locateControl.addTo(mapInstance);

    mapRef.current = mapInstance;

    return () => {
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      mapInstance.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render stops, lines, user and bus
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous layers except tile layer
    map.eachLayer((layer) => {
      if ((layer as any)._url) return; // tile layer has _url
      try {
        map.removeLayer(layer);
      } catch (e) {
        // ignore
      }
    });

    if (stops.length === 0) return;

    // Build coordinates
    const coords: [number, number][] = stops.map((s) => [s.lat, s.lng]);

    // Add stop markers
    stops.forEach((stop, idx) => {
      const isCurrent = stop.status === "current";
      const isPassed = stop.status === "passed";
      const color = isPassed ? "#22c55e" : isCurrent ? "#3b82f6" : "#94a3b8";

      const el = L.DomUtil.create("div", "stop-marker");
      el.style.width = "36px";
      el.style.height = "36px";
      el.style.borderRadius = "50%";
      el.style.background = color;
      el.style.border = "3px solid white";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
      el.innerText = String(idx + 1);
      if (isCurrent) el.style.animation = "pulse 2s infinite";

      L.marker([stop.lat, stop.lng], {
        icon: L.divIcon({ html: el.outerHTML, className: "", iconSize: [36, 36], iconAnchor: [18, 18] }),
      })
        .addTo(map)
        .bindPopup(`<strong>${stop.name}</strong><br/>Time: ${stop.time}`);
    });

    // Draw full route dashed for remaining and solid for completed
    const fullLine = L.polyline(coords, { color: "#3b82f6", weight: 3, opacity: 0.25, dashArray: "6,6" }).addTo(map);

    // Bus marker simulation
    let busPosIndex = 0;
    let busT = 0; // interpolation between stops[busPosIndex] -> stops[busPosIndex+1]

    const busEl = L.DomUtil.create("div", "bus-marker");
    busEl.style.width = "40px";
    busEl.style.height = "24px";
    busEl.style.background = "#0ea5e9";
    busEl.style.borderRadius = "6px";
    busEl.style.display = "flex";
    busEl.style.alignItems = "center";
    busEl.style.justifyContent = "center";
    busEl.style.color = "white";
    busEl.style.fontSize = "12px";
    busEl.style.transformOrigin = "center";
    busEl.innerText = "BUS";

    const busMarker = L.marker(coords[0], {
      icon: L.divIcon({ html: busEl.outerHTML, className: "", iconSize: [40, 24], iconAnchor: [20, 12] }),
    }).addTo(map);
    busMarkerRef.current = busMarker;

    // Completed and remaining polylines
    const completedLine = L.polyline([coords[0]], { color: "#1f2937", weight: 4, opacity: 0.9 }).addTo(map);
    const remainingLine = L.polyline(coords, { color: "#3b82f6", weight: 3, opacity: 0.5, dashArray: "6,6" }).addTo(map);
    completedLineRef.current = completedLine;
    remainingLineRef.current = remainingLine;

    // Fit bounds
    if (coords.length) map.fitBounds(coords as any, { padding: [60, 60] });

    // Animation loop
    let lastTime = performance.now();
    const speed = 0.00005; // tune as needed

    const animate = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      if (stops.length > 1) {
        busT += dt * speed;
        while (busT >= 1 && busPosIndex < stops.length - 2) {
          busT -= 1;
          busPosIndex++;
        }
        const a = stops[busPosIndex];
        const b = stops[Math.min(busPosIndex + 1, stops.length - 1)];
        const lat = lerp(a.lat, b.lat, clamp(busT));
        const lng = lerp(a.lng, b.lng, clamp(busT));
        busMarker.setLatLng([lat, lng]);

        // rotate based on bearing
        const head = bearing(a.lat, a.lng, b.lat, b.lng);
        const el = (busMarker.getElement() as HTMLElement | null);
        if (el) el.style.transform = `rotate(${head}deg)`;

        // update polylines
        const completedCoords = coords.slice(0, busPosIndex + 1).concat([[lat, lng]] as any);
        completedLine.setLatLngs(completedCoords as any);
        remainingLine.setLatLngs([[lat, lng]].concat(coords.slice(busPosIndex + 1) as any));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // User geolocation
    if (navigator.geolocation) {
      const userEl = L.DomUtil.create("div", "user-marker");
      userEl.style.width = "18px";
      userEl.style.height = "18px";
      userEl.style.borderRadius = "50%";
      userEl.style.background = "rgba(14,165,233,0.9)";
      userEl.style.boxShadow = "0 0 0 6px rgba(14,165,233,0.18)";
      userEl.style.border = "2px solid white";

      const userMarker = L.marker(coords[0] || [13.0827, 80.2707], {
        icon: L.divIcon({ html: userEl.outerHTML, className: "", iconSize: [18, 18], iconAnchor: [9, 9] }),
      }).addTo(map);
      userMarkerRef.current = userMarker;

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          userMarker.setLatLng([lat, lng]);
        },
        () => {
          // ignore
        },
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
      watchIdRef.current = id as unknown as number;
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (watchIdRef.current && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current);
      try {
        map.removeLayer(completedLine);
      } catch (e) {}
      try {
        map.removeLayer(remainingLine);
      } catch (e) {}
      try {
        map.removeLayer(busMarker);
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  return <div id="route-map" className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden" />;
};

export default RouteMap;
