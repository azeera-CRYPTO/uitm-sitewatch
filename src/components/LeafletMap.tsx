import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type Pin = { id: string; lat: number; lng: number; color?: string; popup?: string; accuracy?: number };

export default function LeafletMap({ pins, height = 200, onPinClick }: { pins: Pin[]; height?: number; onPinClick?: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true }).setView([5.7604, 102.2793], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    pins.forEach((p) => {
      if (p.accuracy) L.circle([p.lat, p.lng], { radius: p.accuracy, color: p.color ?? "#5b2a86", weight: 1, fillOpacity: 0.1 }).addTo(layer);
      const m = L.circleMarker([p.lat, p.lng], { radius: 8, color: "#ffffff", weight: 2, fillColor: p.color ?? "#5b2a86", fillOpacity: 1 }).addTo(layer);
      if (p.popup) m.bindPopup(p.popup);
      if (onPinClick) m.on("click", () => onPinClick(p.id));
    });
    if (pins.length === 1) map.setView([pins[0].lat, pins[0].lng], 17);
    else if (pins.length > 1) map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng])), { padding: [30, 30] });
  }, [pins, onPinClick]);

  return <div ref={ref} style={{ height }} className="w-full overflow-hidden rounded-lg border z-0" />;
}
