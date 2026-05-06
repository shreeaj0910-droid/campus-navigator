import { useState, useRef, useEffect } from "react";
import { MapPin, Navigation } from "lucide-react";
import { rooms } from "@/lib/campusData";

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
  onCalculateRoute
}: SearchIslandProps) {
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [selectedOriginId, setSelectedOriginId] = useState("");
  
  const [selectedDestination, setSelectedDestination] = useState("");
  const [selectedDestinationId, setSelectedDestinationId] = useState("");

  const [activeDropdown, setActiveDropdown] = useState<"origin" | "destination" | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const availableRooms = rooms.filter(room => 
    !room.id.startsWith("h") && 
    !["junction", "stairA", "stairB"].includes(room.id)
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOriginGPS = () => {
    if (isGPSLocked && latitude && longitude) {
      setSelectedOrigin("My Current Location");
      setSelectedOriginId("GPS"); // Represents GPS coordinates
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
    setActiveDropdown(null);
  };

  const handleCalculate = () => {
    if (onCalculateRoute && selectedOriginId && selectedDestinationId) {
      onCalculateRoute(selectedOriginId, selectedDestinationId);
    }
  };

  return (
    <div ref={containerRef} className="absolute top-4 left-1/2 -translate-x-1/2 w-11/12 max-w-md z-[60] bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-xl flex flex-col">
      <div className="relative flex flex-col gap-3">
        {/* Dotted Line connector */}
        <div className="absolute left-3.5 top-8 bottom-8 border-l-2 border-dotted border-slate-600 z-0"></div>

        {/* Origin Row */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 flex-shrink-0 z-10">
            <MapPin size={14} className="text-cyan-400" />
          </div>
          <div 
            className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700/50 px-3 py-2.5 cursor-pointer hover:bg-slate-800 transition-colors"
            onClick={() => setActiveDropdown(activeDropdown === "origin" ? null : "origin")}
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

        {/* Origin Dropdown */}
        {activeDropdown === "origin" && (
          <div className="absolute top-[50px] left-10 right-0 bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-700/50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200 max-h-[250px] z-50">
            <button 
              onClick={handleOriginGPS}
              disabled={!isGPSLocked}
              className={`flex-shrink-0 flex items-center gap-3 w-full p-3 text-left transition-colors ${
                isGPSLocked ? "hover:bg-slate-800/80 cursor-pointer" : "opacity-70 cursor-not-allowed"
              }`}
            >
              <span className={`font-semibold text-sm tracking-wide ${isGPSLocked ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-slate-500"}`}>
                {isGPSLocked ? "📍 Use My Current Location" : "Locating GPS signal..."}
              </span>
            </button>
            <div className="border-t border-slate-700 flex-shrink-0"></div>
            <div className="overflow-y-auto">
              {availableRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleOriginRoom(room.id, room.label)}
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-slate-800 transition-colors border-b border-slate-700/30 last:border-b-0"
                >
                  {room.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Destination Row */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 flex-shrink-0 z-10">
            <Navigation size={14} className="text-purple-500" />
          </div>
          <div 
            className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700/50 px-3 py-2.5 cursor-pointer hover:bg-slate-800 transition-colors"
            onClick={() => setActiveDropdown(activeDropdown === "destination" ? null : "destination")}
          >
            <input
              type="text"
              placeholder="Choose destination..."
              value={selectedDestination}
              readOnly
              className="bg-transparent border-none outline-none w-full text-sm font-medium text-slate-200 cursor-pointer placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Destination Dropdown */}
        {activeDropdown === "destination" && (
          <div className="absolute top-[106px] left-10 right-0 bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-700/50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200 max-h-[250px] z-50">
            <div className="overflow-y-auto">
              {availableRooms.map((room) => (
                <button
                  key={room.id}
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

      {/* Calculate Route Button */}
      {selectedOriginId && selectedDestinationId && (
        <button
          onClick={handleCalculate}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl mt-4 transition-all w-full shadow-[0_0_15px_rgba(147,51,234,0.6)]"
        >
          Calculate Route
        </button>
      )}
    </div>
  );
}
