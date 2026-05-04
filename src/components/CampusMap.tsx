import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { rooms, Room } from "@/lib/campusData";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Professor = Tables<"professors">;

interface CampusMapProps {
  startId: string | null;
  endId: string | null;
  path: string[] | null;
  onRoomClick?: (room: Room) => void;
}

export default function CampusMap({ startId, endId, path, onRoomClick }: CampusMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const profMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const pathLineRef = useRef<L.Polyline | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [activeFloorPlan, setActiveFloorPlan] = useState<string>("/blueprint.jpg");
  const [imageRatio, setImageRatio] = useState<number>(1);

  // Helper to align relative coordinates to the actual aspect ratio
  const toLatLng = (x: number, y: number): L.LatLngExpression => {
    return [(1000 - y) * imageRatio, x] as L.LatLngExpression;
  };

  // Fetch active floor plan and get its natural aspect ratio
  useEffect(() => {
    (async () => {
      let imageUrl = "/blueprint.jpg";
      const { data } = await supabase
        .from("floor_plans")
        .select("image_url")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (data?.image_url) imageUrl = data.image_url;
      setActiveFloorPlan(imageUrl);

      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalHeight / img.naturalWidth;
        setImageRatio(ratio);
      };
      img.src = imageUrl;
    })();
  }, []);

  // Fetch professors & subscribe to realtime
  useEffect(() => {
    const fetchProfessors = async () => {
      const { data } = await supabase.from("professors").select("*");
      if (data) setProfessors(data);
    };
    fetchProfessors();

    const channel = supabase
      .channel("professors-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "professors" }, () => {
        fetchProfessors();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Init map once the image ratio is calculated
  useEffect(() => {
    if (!containerRef.current) return;

    // Cleanup if re-running due to ratio change
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markersRef.current.clear();
      profMarkersRef.current.clear();
      if (pathLineRef.current) pathLineRef.current = null;
    }

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -3,
      maxZoom: 3,
      zoomSnap: 0.1,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 100,
      attributionControl: false,
      zoomControl: false, // Re-adding at bottom-left to avoid Search Island
    });

    L.control.zoom({ position: "bottomleft" }).addTo(map);

    const bounds: L.LatLngBoundsExpression = [[0, 0], [1000 * imageRatio, 1000]];
    overlayRef.current = L.imageOverlay(activeFloorPlan, bounds).addTo(map);
    map.fitBounds(bounds, { padding: [20, 20] });
    mapRef.current = map;

    // Add room markers
    for (const room of rooms) {
      const isHall = room.id.startsWith("h") || room.id === "junction" || room.id === "stairA" || room.id === "stairB";
      if (isHall) continue;

      const icon = L.divIcon({
        className: "room-marker-icon",
        html: `<span>${room.label}</span>`,
        iconSize: [72, 22],
        iconAnchor: [36, 11],
      });

      const marker = L.marker(toLatLng(room.x, room.y), { icon })
        .addTo(map)
        .on("click", () => onRoomClick?.(room));

      markersRef.current.set(room.id, marker);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageRatio, activeFloorPlan]);

  // Update professor markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old professor markers
    for (const marker of profMarkersRef.current.values()) {
      marker.remove();
    }
    profMarkersRef.current.clear();

    // Add professor markers
    for (const prof of professors) {
      if (!prof.coord_x && !prof.coord_y) continue;

      const isAvailable = prof.status === "available";
      const icon = L.divIcon({
        className: `prof-marker-icon ${isAvailable ? "prof-available" : "prof-busy"}`,
        html: `<span>${prof.name}</span>`,
        iconSize: [90, 24],
        iconAnchor: [45, 12],
      });

      const popupContent = `
        <div style="font-family: 'Space Mono', monospace; font-size: 11px;">
          <strong>${prof.name}</strong><br/>
          Room: ${prof.room_number}<br/>
          Status: <span style="color: ${isAvailable ? '#4ade80' : '#ef4444'}">${prof.status}</span>
          ${prof.current_location ? `<br/>Location: ${prof.current_location}` : ""}
        </div>
      `;

      const marker = L.marker(toLatLng(prof.coord_x, prof.coord_y), { icon })
        .addTo(map)
        .bindPopup(popupContent);

      profMarkersRef.current.set(prof.id, marker);
    }
  }, [professors, imageRatio]);

  // Update marker styles based on start/end selection
  useEffect(() => {
    for (const [id, marker] of markersRef.current.entries()) {
      const el = marker.getElement();
      if (!el) continue;
      el.classList.remove("start", "end");
      if (id === startId) el.classList.add("start");
      if (id === endId)   el.classList.add("end");
    }
  }, [startId, endId]);

  // Draw / clear path
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pathLineRef.current) {
      pathLineRef.current.remove();
      pathLineRef.current = null;
    }

    if (!path || path.length < 2) return;

    const roomMap = new Map(rooms.map((r) => [r.id, r]));
    const latLngs = path.map((id) => {
      const r = roomMap.get(id)!;
      return toLatLng(r.x, r.y);
    });

    const line = L.polyline(latLngs, {
      color: "#3b82f6", // Vibrant blue
      weight: 8,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round",
      className: "path-animated path-glow",
    }).addTo(map);

    pathLineRef.current = line;
    map.flyToBounds(line.getBounds(), { padding: [80, 80], duration: 0.8 });
  }, [path, imageRatio]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "hsl(220 45% 4%)" }}
    />
  );
}
