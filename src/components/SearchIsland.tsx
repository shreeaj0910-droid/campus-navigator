import { useState, useRef, useEffect } from "react";
import { MapPin, Navigation, Sparkles } from "lucide-react";
import { rooms } from "@/lib/campusData";
import { supabase } from "@/integrations/supabase/client";

interface TimetableEntry {
  id: string;
  subject_name: string;
  time: string; // "HH:MM" format
  room_number: string;
}

interface SearchIslandProps {
  isGPSLocked?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  onCalculateRoute?: (startId: string, endId: string) => void;
}

export default function SearchIsland({
  isGPSLocked = false,
  latitude,
  longitude,
  onCalculateRoute,
}: SearchIslandProps) {
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [selectedOriginId, setSelectedOriginId] = useState<string | null>(null);

  const [selectedDestination, setSelectedDestination] = useState("");
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);

  const [activeDropdown, setActiveDropdown] = useState<"origin" | "destination" | null>(null);
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [smartRouteStatus, setSmartRouteStatus] = useState<"idle" | "found" | "none">("idle");

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter valid routable rooms (no hallways, junctions, stairs)
  const availableRooms = rooms.filter(
    (room) =>
      !room.id.startsWith("h") &&
      !["junction", "stairA", "stairB"].includes(room.id)
  );

  // Fetch timetable from Supabase on mount for smart routing
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const { data } = await (supabase as any)
          .from("student_timetable")
          .select("*")
          .order("time", { ascending: true });
        if (data) setTimetableData(data);
      } catch {
        // Silently fail — smart route button will show "No classes found"
      }
    };
    fetchTimetable();
  }, []);

  // Close dropdown when clicking outside the whole card
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Smart Route Logic ──
  // Converts "HH:MM" string to total minutes from midnight
  const toMinutes = (t: string): number => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const handleSmartRoute = () => {
    if (timetableData.length === 0) {
      setSmartRouteStatus("none");
      setActiveDropdown(null);
      return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Find a class currently happening (within a 90-minute window)
    let matched: TimetableEntry | null = null;

    // Try to find a class that is currently in session or starting next
    const upcoming = timetableData
      .filter((cls) => toMinutes(cls.time) >= currentMinutes)
      .sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

    const ongoing = timetableData.find((cls) => {
      const start = toMinutes(cls.time);
      return currentMinutes >= start && currentMinutes <= start + 90;
    });

    matched = ongoing ?? upcoming[0] ?? null;

    if (!matched) {
      // All classes are done for today — pick the first one (for demo fallback)
      matched = timetableData[0];
    }

    if (matched) {
      const displayText = `${matched.subject_name} – ${matched.room_number}`;
      setSelectedDestination(displayText);
      // Use room_number as the destination ID for the graph
      // Try to match it against a real campus room label, fallback to ID
      const matchedRoom = availableRooms.find(
        (r) =>
          r.label.toLowerCase().includes(matched!.room_number.toLowerCase()) ||
          r.id.toLowerCase() === matched!.room_number.toLowerCase()
      );
      setSelectedDestinationId(matchedRoom?.id ?? matched.room_number);
      setSmartRouteStatus("found");
    } else {
      setSmartRouteStatus("none");
    }

    setActiveDropdown(null);
  };

  const handleOriginGPS = () => {
    if (isGPSLocked && latitude != null && longitude != null) {
      setSelectedOrigin("📍 My Current Location");
      setSelectedOriginId("__GPS__");
    }
    setActiveDropdown(null);
  };

  const handleOriginRoom = (roomId: string, roomLabel: string) => {
    setSelectedOrigin(roomLabel);
    setSelectedOriginId(roomId);
    setActiveDropdown(null);
  };

  const handleDestinationRoom = (roomId: string, roomLabel: string) => {
    setSelectedDestination(roomLabel);
    setSelectedDestinationId(roomId);
    setSmartRouteStatus("idle");
    setActiveDropdown(null);
  };

  // Only valid room IDs (not GPS token) can trigger routing
  const canCalculate =
    selectedOriginId != null &&
    selectedOriginId !== "__GPS__" &&
    selectedDestinationId != null;

  const handleCalculate = () => {
    if (canCalculate && onCalculateRoute) {
      onCalculateRoute(selectedOriginId!, selectedDestinationId!);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-[68px] left-1/2 -translate-x-1/2 w-11/12 max-w-md z-[60] bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-xl flex flex-col"
    >
      <div className="relative flex flex-col gap-3">
        {/* Dotted Line connector */}
        <div className="absolute left-3.5 top-8 bottom-8 border-l-2 border-dotted border-slate-600 z-0 pointer-events-none" />

        {/* ── Origin Row ── */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 flex-shrink-0 z-10">
            <MapPin size={14} className="text-cyan-400" />
          </div>
          <div
            className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700/50 px-3 py-2.5 cursor-pointer hover:bg-slate-800 transition-colors"
            onClick={() =>
              setActiveDropdown(activeDropdown === "origin" ? null : "origin")
            }
          >
            <input
              type="text"
              placeholder="Choose starting point..."
              value={selectedOrigin}
              readOnly
              className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-200 cursor-pointer placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* ── Origin Dropdown ── */}
        {activeDropdown === "origin" && (
          <div className="absolute top-[54px] left-10 right-0 bg-slate-900 border border-slate-700/60 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col z-[70] max-h-[260px]">
            {/* GPS Option */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOriginGPS}
              disabled={!isGPSLocked}
              className={`flex-shrink-0 flex items-center gap-2 w-full px-4 py-3 text-left transition-colors border-b border-slate-700/60 ${
                isGPSLocked
                  ? "hover:bg-slate-800 cursor-pointer"
                  : "cursor-not-allowed opacity-60"
              }`}
            >
              <span
                className={`font-semibold text-sm ${
                  isGPSLocked
                    ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                    : "text-slate-500"
                }`}
              >
                {isGPSLocked ? "📍 Use My Current Location" : "⏳ Locating GPS signal..."}
              </span>
            </button>
            {/* Manual rooms */}
            <div className="overflow-y-auto">
              {availableRooms.map((room) => (
                <button
                  key={room.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleOriginRoom(room.id, room.label)}
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-slate-800 transition-colors border-b border-slate-700/30 last:border-b-0"
                >
                  {room.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Destination Row ── */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 flex-shrink-0 z-10">
            <Navigation size={14} className="text-purple-500" />
          </div>
          <div
            className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700/50 px-3 py-2.5 cursor-pointer hover:bg-slate-800 transition-colors"
            onClick={() =>
              setActiveDropdown(
                activeDropdown === "destination" ? null : "destination"
              )
            }
          >
            <input
              type="text"
              placeholder="Choose destination..."
              value={selectedDestination}
              readOnly
              className={`bg-transparent border-none outline-none w-full text-sm font-medium cursor-pointer placeholder:text-slate-400 ${
                smartRouteStatus === "found" ? "text-purple-300" : "text-slate-200"
              }`}
            />
          </div>
        </div>

        {/* ── Destination Dropdown ── */}
        {activeDropdown === "destination" && (
          <div className="absolute top-[114px] left-10 right-0 bg-slate-900 border border-slate-700/60 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col z-[70] max-h-[280px]">
            
            {/* 🌟 Smart Route Button */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSmartRoute}
              className="flex-shrink-0 flex items-center gap-2.5 w-full px-4 py-3.5 text-left transition-all bg-purple-900/40 hover:bg-purple-800/60 border-b border-purple-700/40 shadow-[inset_0_0_20px_rgba(147,51,234,0.1)] hover:shadow-[inset_0_0_25px_rgba(147,51,234,0.2)]"
            >
              <Sparkles size={15} className="text-purple-300 flex-shrink-0" />
              <span className="text-purple-200 font-semibold text-sm">
                📅 Auto-Route to Current Class
              </span>
            </button>

            {/* Manual rooms */}
            <div className="overflow-y-auto">
              {availableRooms.map((room) => (
                <button
                  key={room.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleDestinationRoom(room.id, room.label)}
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-slate-800 transition-colors border-b border-slate-700/30 last:border-b-0"
                >
                  {room.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Smart Route Feedback Banner ── */}
      {smartRouteStatus === "none" && (
        <div className="mt-3 px-3 py-2 bg-red-900/30 border border-red-700/40 rounded-xl text-red-300 text-xs text-center">
          No upcoming classes found in your timetable.
        </div>
      )}
      {smartRouteStatus === "found" && (
        <div className="mt-3 px-3 py-2 bg-purple-900/30 border border-purple-700/40 rounded-xl text-purple-300 text-xs text-center flex items-center justify-center gap-1.5">
          <Sparkles size={12} />
          Auto-routed to your current / next class!
        </div>
      )}

      {/* ── Calculate Route Button ── only shown when TWO real rooms are selected */}
      {canCalculate && (
        <button
          onClick={handleCalculate}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl mt-3 transition-all w-full shadow-[0_0_15px_rgba(147,51,234,0.6)] hover:shadow-[0_0_25px_rgba(147,51,234,0.8)]"
        >
          Calculate Route →
        </button>
      )}
    </div>
  );
}
