import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CampusMap from "@/components/CampusMap";
import { Room } from "@/lib/campusData";
import { aStar } from "@/lib/graph";

const Index = () => {
  const navigate = useNavigate();
  const [startId, setStartId] = useState<string | null>(null);
  const [endId, setEndId]     = useState<string | null>(null);
  const [path, setPath]       = useState<string[] | null | undefined>(undefined);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const handleRoomClick = useCallback((room: Room) => {
    setSelectedRoom(room);
  }, []);

  const handleSetStart = (id: string) => setStartId(id);
  const handleSetEnd   = (id: string) => setEndId(id);

  const handleFindPath = () => {
    if (!startId || !endId) return;
    const result = aStar(startId, endId);
    setPath(result);
  };

  const handleReset = () => {
    setStartId(null);
    setEndId(null);
    setPath(undefined);
    setSelectedRoom(null);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Full Screen Map Layer */}
      <main className="absolute inset-0 z-0">
        <CampusMap
          startId={startId}
          endId={endId}
          path={path ?? null}
          onRoomClick={handleRoomClick}
        />
      </main>

      {/* Temporary Admin Login Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => navigate('/admin')}
          className="px-3 py-2 bg-red-500 text-white rounded-md text-sm font-medium shadow-md hover:bg-red-600 transition-colors"
        >
          Admin Login
        </button>
      </div>

      {/* Legend floating bottom right */}
      <div className="absolute bottom-6 right-4 z-50 flex gap-4 p-3 bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-lg text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[hsl(185,90%,55%)] shadow-[0_0_5px_hsl(185,90%,55%/0.7)]" />
          <span className="text-muted-foreground hidden sm:inline">Room</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[hsl(120,80%,50%)] shadow-[0_0_5px_hsl(120,80%,50%/0.7)]" />
          <span className="text-muted-foreground hidden sm:inline">Start</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[hsl(0,85%,60%)] shadow-[0_0_5px_hsl(0,85%,60%/0.7)]" />
          <span className="text-muted-foreground hidden sm:inline">End</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-[2px] bg-[hsl(0,85%,60%)] rounded-full shadow-[0_0_5px_hsl(0,85%,60%/0.7)]" />
          <span className="text-muted-foreground hidden sm:inline">Path</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
