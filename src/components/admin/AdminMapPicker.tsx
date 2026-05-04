import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface AdminMapPickerProps {
  onCoordsPicked: (coords: { x: number; y: number }) => void;
  onClose: () => void;
}

export default function AdminMapPicker({ onCoordsPicked, onClose }: AdminMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("/blueprint.jpg");

  // Fetch active floor plan
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("floor_plans")
        .select("image_url")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (data?.image_url) setImageUrl(data.image_url);
    })();
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 3,
      zoomSnap: 0.25,
      attributionControl: false,
    });

    const bounds: L.LatLngBoundsExpression = [[0, 0], [1000, 1000]];
    L.imageOverlay(imageUrl, bounds).addTo(map);
    map.fitBounds(bounds);
    mapRef.current = map;

    map.on("click", (e: L.LeafletMouseEvent) => {
      const x = Math.round(e.latlng.lng);
      const y = Math.round(1000 - e.latlng.lat);
      setCoords({ x, y });

      if (markerRef.current) markerRef.current.remove();

      const icon = L.divIcon({
        className: "picker-marker",
        html: `<span>📍 (${y}, ${x})</span>`,
        iconSize: [100, 24],
        iconAnchor: [50, 12],
      });

      markerRef.current = L.marker(e.latlng, { icon }).addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [imageUrl]);

  return (
    <div className="map-picker-overlay">
      <div className="map-picker-panel">
        <div className="map-picker-header">
          <span className="map-picker-label">Click on the map to pick coordinates</span>
          <button className="map-picker-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div ref={containerRef} className="map-picker-map" />
        <div className="map-picker-footer">
          {coords && (
            <span className="map-picker-coords">Selected: ({coords.y}, {coords.x})</span>
          )}
          <button
            className="prof-save-btn"
            disabled={!coords}
            onClick={() => coords && onCoordsPicked(coords)}
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
