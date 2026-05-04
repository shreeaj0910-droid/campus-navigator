import { MapPin, Navigation } from "lucide-react";

interface SearchIslandProps {
  startRoomName?: string;
  endRoomName?: string;
  onOpenStart: () => void;
  onOpenEnd: () => void;
}

export default function SearchIsland({ startRoomName, endRoomName, onOpenStart, onOpenEnd }: SearchIslandProps) {
  return (
    <div className="absolute top-12 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] z-[60] bg-white dark:bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 flex gap-3 border border-gray-100 dark:border-border transition-all">
      {/* Left side icons with connecting line */}
      <div className="flex flex-col items-center justify-center pt-2 pb-2 pl-1">
        <MapPin size={18} className="text-blue-500" />
        <div className="flex-1 w-[2px] bg-gray-200 dark:bg-border my-1 rounded-full"></div>
        <Navigation size={18} className="text-red-500" />
      </div>

      {/* Input fields */}
      <div className="flex-1 flex flex-col gap-2">
        <div 
          onClick={onOpenStart}
          className="bg-gray-100 dark:bg-muted rounded-xl p-2.5 flex items-center transition-colors hover:bg-gray-200 dark:hover:bg-muted/80 cursor-pointer"
        >
          <input
            type="text"
            readOnly
            placeholder="Choose starting point..."
            value={startRoomName || ""}
            className="bg-transparent border-none outline-none w-full text-sm font-medium text-gray-900 dark:text-foreground cursor-pointer placeholder:text-gray-500 placeholder:font-normal pointer-events-none"
          />
        </div>
        <div 
          onClick={onOpenEnd}
          className="bg-gray-100 dark:bg-muted rounded-xl p-2.5 flex items-center transition-colors hover:bg-gray-200 dark:hover:bg-muted/80 cursor-pointer"
        >
          <input
            type="text"
            readOnly
            placeholder="Choose destination..."
            value={endRoomName || ""}
            className="bg-transparent border-none outline-none w-full text-sm font-medium text-gray-900 dark:text-foreground cursor-pointer placeholder:text-gray-500 placeholder:font-normal pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
