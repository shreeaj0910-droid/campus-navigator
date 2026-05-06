import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

interface SearchIslandProps {
  isGPSLocked?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  onSetGPSStart?: (lat: number, lng: number) => void;
  // Keep these just in case they are still passed, so we don't break types
  startRoomName?: string;
  endRoomName?: string;
  onOpenStart?: () => void;
  onOpenEnd?: () => void;
}

export default function SearchIsland({
  isGPSLocked = false,
  latitude,
  longitude,
  onSetGPSStart,
  endRoomName
}: SearchIslandProps) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGPSClick = () => {
    if (isGPSLocked && latitude && longitude && onSetGPSStart) {
      onSetGPSStart(latitude, longitude);
    }
    setIsFocused(false);
  };

  return (
    <div ref={containerRef} className="absolute top-12 left-1/2 -translate-x-1/2 w-[92%] max-w-[450px] z-[60]">
      {/* Main Search Input Pill */}
      <div 
        className="bg-slate-900/80 backdrop-blur-md rounded-full shadow-[0_0_20px_rgba(34,211,238,0.15)] border border-slate-700/50 p-1.5 flex items-center transition-all"
      >
        <Search size={20} className="text-cyan-400 ml-3 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search destination..."
          defaultValue={endRoomName || ""}
          onFocus={() => setIsFocused(true)}
          className="bg-transparent border-none outline-none w-full text-base font-medium text-slate-200 px-3 py-2.5 cursor-text placeholder:text-slate-400"
        />
      </div>

      {/* Dropdown Menu */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-slate-700/50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* GPS Action Button (First Item) */}
          <button 
            onClick={handleGPSClick}
            disabled={!isGPSLocked}
            className={`flex items-center gap-3 w-full p-4 text-left transition-colors border-b border-slate-700/50 ${
              isGPSLocked 
                ? "hover:bg-slate-800/80 cursor-pointer" 
                : "opacity-70 cursor-not-allowed"
            }`}
          >
            <span className={`font-semibold text-[15px] tracking-wide ${isGPSLocked ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-slate-500"}`}>
              {isGPSLocked ? "📍 Use My GPS Location" : "Locating GPS signal..."}
            </span>
          </button>
          
        </div>
      )}
    </div>
  );
}
