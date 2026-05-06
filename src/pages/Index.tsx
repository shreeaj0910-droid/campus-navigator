import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CampusMap from "@/components/CampusMap";
import SearchIsland from "@/components/SearchIsland";
import RouteDetails from "@/components/RouteDetails";
import RoomPicker from "@/components/RoomPicker";
import FloorIsland from "@/components/FloorIsland";
import { Room, rooms } from "@/lib/campusData";
import { aStar } from "@/lib/graph";
import { useCampusGPS } from "@/hooks/useCampusGPS";

import ThemeToggle from "@/components/ThemeToggle";

const Index = () => {
  const navigate = useNavigate();
  const [startId, setStartId] = useState<string | null>(null);
  const [endId, setEndId]     = useState<string | null>(null);
  const [path, setPath]       = useState<string[] | null | undefined>(undefined);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeFloor, setActiveFloor] = useState(0);
  
  const { isGPSLocked, latitude, longitude } = useCampusGPS();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"start" | "end">("start");

  const handleRoomClick = useCallback((room: Room) => {
    setSelectedRoom(room);
  }, []);

  const openPicker = (mode: "start" | "end") => {
    setPickerMode(mode);
    setPickerOpen(true);
  };

  const handleSelectRoom = (roomId: string) => {
    if (pickerMode === "start") {
      setStartId(roomId);
    } else {
      setEndId(roomId);
    }
  };

  useEffect(() => {
    if (startId && endId) {
      const result = aStar(startId, endId);
      setPath(result);
    } else {
      setPath(undefined);
    }
  }, [startId, endId]);

  const handleReset = () => {
    setStartId(null);
    setEndId(null);
    setPath(undefined);
    setSelectedRoom(null);
  };

  const calculateDistance = () => {
    if (!path || path.length < 2) return 0;
    let dist = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const n1 = rooms.find(r => r.id === path[i]);
      const n2 = rooms.find(r => r.id === path[i+1]);
      if (n1 && n2) {
        dist += Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
      }
    }
    return dist;
  };

  const startRoomName = startId ? rooms.find(r => r.id === startId)?.label : undefined;
  const endRoomName = endId ? rooms.find(r => r.id === endId)?.label : undefined;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <SearchIsland 
        isGPSLocked={isGPSLocked}
        latitude={latitude}
        longitude={longitude}
        onCalculateRoute={(start, end) => {
          console.log("Calculating route from", start, "to", end);
          setStartId(start);
          setEndId(end);
        }}
      />
      <FloorIsland activeFloor={activeFloor} setActiveFloor={setActiveFloor} />
      
      {/* Theme Toggle placed right below the search island */}
      <div className="absolute top-[150px] right-4 z-50">
        <ThemeToggle />
      </div>

      <RouteDetails path={path} distanceUnits={calculateDistance()} onClear={handleReset} />

      <RoomPicker 
        open={pickerOpen} 
        onOpenChange={setPickerOpen} 
        onSelectRoom={handleSelectRoom} 
        title={pickerMode === "start" ? "Choose starting point" : "Choose destination"}
      />

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
