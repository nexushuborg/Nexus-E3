import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import busRoutes from "@/data/busRoutes";

type BusRoute = typeof busRoutes[0];

interface RouteMapProps {
  route: BusRoute;
  driverLocation?: [number, number] | null;
}

// Leaflet icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const busIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

const RouteMap: React.FC<RouteMapProps> = ({ route, driverLocation }) => {
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!route || mapRef.current) return;

    const map = L.map("route-map", {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    }).setView([route.startPoint.coordinates.lat, route.startPoint.coordinates.lng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route) return;

    // Clear existing layers
    map.eachLayer((layer: any) => {
      if (layer._url || layer === driverMarkerRef.current) return;
      map.removeLayer(layer);
    });

    const { startPoint, endPoint, stoppages } = route;

    const startMarker = L.marker([startPoint.coordinates.lat, startPoint.coordinates.lng])
      .addTo(map)
      .bindPopup(`<b>Start:</b> ${startPoint.name}`);

    const endMarker = L.marker([endPoint.coordinates.lat, endPoint.coordinates.lng])
      .addTo(map)
      .bindPopup(`<b>End:</b> ${endPoint.name}`);

    const stopMarkers = stoppages.map(stop =>
      L.marker([stop.coordinates.lat, stop.coordinates.lng])
        .addTo(map)
        .bindPopup(`<b>${stop.name}</b><br/>Arrival: ${stop.arrivalTime || "N/A"}`)
    );

    const allMarkers = [startMarker, endMarker, ...stopMarkers];
    const group = L.featureGroup(allMarkers);
    map.fitBounds(group.getBounds(), { padding: [50, 50] });

    const latlngs = stoppages
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      .map(stop => [stop.coordinates.lat, stop.coordinates.lng] as [number, number]);

    L.polyline(latlngs, { color: "blue" }).addTo(map);
  }, [route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (driverLocation) {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker(driverLocation, { icon: busIcon }).addTo(map);
      } else {
        driverMarkerRef.current.setLatLng(driverLocation);
      }
      map.setView(driverLocation, map.getZoom());
    }
  }, [driverLocation]);


  return (
    <div
      id="route-map"
      className="absolute inset-0 w-full h-full min-h-screen"
    />
  );
};

export default RouteMap;
