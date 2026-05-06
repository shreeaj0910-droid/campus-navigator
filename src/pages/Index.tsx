import { useState, useEffect } from "react";
import CampusMap from "@/components/CampusMap";
import SearchIsland from "@/components/SearchIsland";
import RouteDetails from "@/components/RouteDetails";
import FloorIsland from "@/components/FloorIsland";
import TopNavBar from "@/components/TopNavBar";
import StudentDashboard from "@/components/StudentDashboard";
import { AdminPanel } from "@/components/AdminPanel";
import { rooms } from "@/lib/campusData";
import { aStar } from "@/lib/graph";
import { useCampusGPS } from "@/hooks/useCampusGPS";

type AppView = "map" | "student" | "admin";

const Index = () => {
  const [startId, setStartId] = useState<string | null>(null);
  const [endId, setEndId]     = useState<string | null>(null);
  const [path, setPath]       = useState<string[] | null | undefined>(undefined);
  const [activeFloor, setActiveFloor] = useState(0);
  const [view, setView] = useState<AppView>("map");

  const { isGPSLocked, latitude, longitude } = useCampusGPS();

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
  };

  const calculateDistance = () => {
    if (!path || path.length < 2) return 0;
    let dist = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const n1 = rooms.find(r => r.id === path[i]);
      const n2 = rooms.find(r => r.id === path[i + 1]);
      if (n1 && n2) {
        dist += Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
      }
    }
    return dist;
  };

  // ── Render Admin Panel over everything ──
  if (view === "admin") {
    return (
      <>
        <TopNavBar
          onNavigateAdmin={() => setView("admin")}
          onNavigateTimetable={() => setView("student")}
        />
        <div className="pt-14">
          <AdminPanel />
        </div>
      </>
    );
  }

  // ── Render Student Dashboard over everything ──
  if (view === "student") {
    return (
      <>
        <TopNavBar
          onNavigateAdmin={() => setView("admin")}
          onNavigateTimetable={() => setView("student")}
        />
        <div className="pt-14">
          <StudentDashboard onNavigate={() => setView("map")} />
        </div>
      </>
    );
  }

  // ── Default: Full-screen Map view ──
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* TopNavBar — always visible over the map */}
      <TopNavBar
        onNavigateAdmin={() => setView("admin")}
        onNavigateTimetable={() => setView("student")}
      />

      {/* Search Island — pushed down below navbar (top-16) */}
      <SearchIsland
        isGPSLocked={isGPSLocked}
        latitude={latitude}
        longitude={longitude}
        onCalculateRoute={(start, end) => {
          setStartId(start);
          setEndId(end);
        }}
      />

      <FloorIsland activeFloor={activeFloor} setActiveFloor={setActiveFloor} />

      <RouteDetails path={path} distanceUnits={calculateDistance()} onClear={handleReset} />

      {/* Full Screen Map Layer */}
      <main className="absolute inset-0 z-0">
        <CampusMap
          startId={startId}
          endId={endId}
          path={path ?? null}
          onRoomClick={() => {}}
        />
      </main>

      {/* Legend floating bottom-left to avoid FloorIsland */}
      <div className="absolute bottom-6 left-4 z-50 flex gap-4 p-3 bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-lg text-xs font-mono">
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
