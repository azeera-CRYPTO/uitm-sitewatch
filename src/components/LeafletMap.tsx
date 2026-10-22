import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { mapStatusClass, type Pin } from "@/lib/map-reports";

export type { Pin } from "@/lib/map-reports";

export default function LeafletMap({ pins, height = 200, clustered = false, onPinClick }: { pins: Pin[]; height?: number; clustered?: boolean; onPinClick?: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true }).setView([5.7604, 102.2793], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
    layerRef.current = (clustered ? L.markerClusterGroup({
      maxClusterRadius: 50,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          className: "report-map-cluster",
          html: `<span aria-label="${count} laporan">${count}</span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
      },
    }) : L.layerGroup()).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [clustered]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    pins.forEach((p) => {
      const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
      if (p.accuracy && !clustered) L.circle([p.lat, p.lng], { radius: p.accuracy, color: p.color ?? primary, weight: 1, fillOpacity: 0.1 }).addTo(layer);
      const m = L.marker([p.lat, p.lng], { icon: L.divIcon({
        className: `report-map-pin ${mapStatusClass(p.status)}`,
        html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11],
      }), title: p.status ? `${p.status} — ${p.id}` : "Lokasi laporan" }).addTo(layer);
      if (p.popup) { const text = document.createElement("span"); text.textContent = p.popup; m.bindPopup(text); }
      if (onPinClick) m.on("click", () => onPinClick(p.id));
    });
    if (pins.length === 1 && pins[0]) map.setView([pins[0].lat, pins[0].lng], 17);
    else if (pins.length > 1) map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng])), { padding: [30, 30] });
  }, [pins, onPinClick, clustered]);

  return <div ref={ref} style={{ height }} className="w-full overflow-hidden rounded-lg border z-0" />;
}
