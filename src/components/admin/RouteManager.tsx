import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MousePointer2, GitCommit } from "lucide-react";
import { rooms as staticRooms } from "@/lib/campusData";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type FloorPlan = Tables<"floor_plans">;
type Room = Tables<"rooms">;
type Edge = Tables<"edges">;

const FLOORS = [
  { level: 0, label: "Ground Floor", image: "/blueprint.jpg" },
  { level: 1, label: "Floor 1", image: "/first_floor_map.png" },
  { level: 2, label: "Floor 2", image: "/second_floor_map.png" },
];

export default function RouteManager() {
  const [activePlan, setActivePlan] = useState<FloorPlan | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  // Unified Editor State
  const [editorTab, setEditorTab] = useState<"rooms" | "routes">("routes");
  const [mode, setMode] = useState<"select" | "draw">("select");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<number>(0);
  
  const [imageRatio, setImageRatio] = useState(1);
  const [liveCoords, setLiveCoords] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: plans } = await supabase.from("floor_plans").select("*").eq("is_active", true).limit(1);
    if (plans && plans.length > 0) setActivePlan(plans[0]);

    const { data: dbRooms } = await supabase.from("rooms").select("*");
    if (dbRooms && dbRooms.length > 0) {
      setRooms(dbRooms);
    } else {
      setRooms(staticRooms.map(r => ({
        id: r.id, label: r.label, type: r.type, floor_level: 1, x: r.x, y: r.y, created_at: new Date().toISOString()
      })));
    }

    const { data: dbEdges } = await supabase.from("edges").select("*");
    if (dbEdges) setEdges(dbEdges);
    setLoading(false);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageRatio(img.naturalWidth / img.naturalHeight);
  };

  const calculateDistance = (r1: Room, r2: Room) => {
    return Math.round(Math.sqrt(Math.pow(r1.x - r2.x, 2) + Math.pow(r1.y - r2.y, 2)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);
    setLiveCoords({ 
      x: Math.max(0, Math.min(1000, x)), 
      y: Math.max(0, Math.min(1000, y)) 
    });
  };

  const handleMouseLeave = () => {
    setLiveCoords(null);
  };

  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (editorTab !== "rooms") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);
    
    const label = prompt("Enter a label for this new room/node:");
    if (!label) return;

    const newRoom = {
      id: crypto.randomUUID(),
      label,
      type: "node", // Default
      floor_level: activeFloor,
      x: Math.max(0, Math.min(1000, x)),
      y: Math.max(0, Math.min(1000, y)),
    };

    const { error } = await supabase.from("rooms").insert(newRoom);
    if (error) {
      toast.error("Failed to create room: " + error.message);
    } else {
      setRooms([...rooms, { ...newRoom, created_at: new Date().toISOString() }]);
      toast.success("Room created successfully!");
    }
  };

  const handleNodeClick = async (e: React.MouseEvent, room: Room) => {
    e.stopPropagation(); // prevent map click from triggering room creation
    
    if (editorTab === "rooms") {
      toast.info(`Room selected: ${room.label} (${room.x}, ${room.y}) on Floor ${room.floor_level}`);
      return;
    }

    if (mode === "select") return;

    if (!selectedNode) {
      setSelectedNode(room.id);
      return;
    }

    if (selectedNode === room.id) {
      setSelectedNode(null); // deselect
      return;
    }

    const startRoom = rooms.find(r => r.id === selectedNode);
    if (!startRoom) return;

    const weight = calculateDistance(startRoom, room);
    const exists = edges.some(e => 
      (e.from_node === startRoom.id && e.to_node === room.id) ||
      (e.from_node === room.id && e.to_node === startRoom.id)
    );

    if (exists) {
      toast.error("Route already exists between these rooms.");
      setSelectedNode(null);
      return;
    }

    const { data, error } = await supabase.from("edges").insert({
      from_node: startRoom.id,
      to_node: room.id,
      weight: weight
    }).select().single();

    if (error) {
      toast.error("Failed to save route: " + error.message);
    } else if (data) {
      setEdges([...edges, data]);
      toast.success("Route added successfully.");
    }
    
    setSelectedNode(null);
  };

  const handleDeleteEdge = async (e: React.MouseEvent, edgeId: string) => {
    e.stopPropagation();
    if (editorTab === "rooms" || mode === "draw") return; 
    
    if (confirm("Delete this route segment?")) {
      const { error } = await supabase.from("edges").delete().eq("id", edgeId);
      if (error) {
        toast.error("Failed to delete route.");
      } else {
        setEdges(edges.filter(e => e.id !== edgeId));
        toast.success("Route deleted.");
      }
    }
  };

  if (loading) return <div className="p-8 text-cyan-400 font-mono animate-pulse">Initializing Map Editor...</div>;

  // Filter visible nodes and edges based on activeFloor
  const visibleRooms = rooms.filter(r => r.floor_level === activeFloor);
  const visibleEdges = edges.filter(edge => {
    const r1 = rooms.find(r => r.id === edge.from_node);
    const r2 = rooms.find(r => r.id === edge.to_node);
    if (!r1 || !r2) return false;
    // Show edge only if both nodes are on the active floor (prevents clutter)
    return r1.floor_level === activeFloor && r2.floor_level === activeFloor;
  });

  const currentFloorMap = FLOORS.find(f => f.level === activeFloor)?.image || "/blueprint.jpg";

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-950 -m-6 text-slate-300 font-sans">
      
      {/* Top Control Bar */}
      <div className="p-5 border-b border-cyan-900/30 flex items-center justify-center bg-slate-950/80 backdrop-blur-md shrink-0 gap-4 shadow-xl shadow-black/40 z-20">
        <button
          onClick={() => { setEditorTab("rooms"); setSelectedNode(null); }}
          className={`px-8 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all duration-300 ${
            editorTab === "rooms" 
              ? "bg-cyan-950/40 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]" 
              : "bg-slate-900 text-slate-500 border border-slate-800 hover:bg-slate-800 hover:text-slate-300"
          }`}
        >
          Manage Rooms
        </button>
        <button
          onClick={() => { setEditorTab("routes"); setSelectedNode(null); }}
          className={`px-8 py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all duration-300 ${
            editorTab === "routes" 
              ? "bg-cyan-950/40 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]" 
              : "bg-slate-900 text-slate-500 border border-slate-800 hover:bg-slate-800 hover:text-slate-300"
          }`}
        >
          Manage Routes
        </button>
      </div>

      {/* Floor Selector */}
      <div className="flex items-center justify-center bg-slate-900 border-b border-purple-900/30 p-4 shrink-0 gap-3 shadow-md z-10">
        {FLOORS.map(floor => (
          <button
            key={floor.level}
            onClick={() => setActiveFloor(floor.level)}
            className={`px-5 py-2 rounded-md font-bold text-sm tracking-wide transition-all ${
              activeFloor === floor.level 
                ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.6)] border border-purple-500" 
                : "bg-slate-900 text-slate-400 border border-purple-900/50 hover:border-purple-500 hover:text-purple-300"
            }`}
          >
            {floor.label}
          </button>
        ))}
      </div>

      {/* Sub-tools for Routes */}
      {editorTab === "routes" && (
        <div className="flex justify-center bg-slate-900/50 p-3 border-b border-slate-800 z-10 shrink-0">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shadow-inner">
            <button
              onClick={() => { setMode("select"); setSelectedNode(null); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                mode === "select" ? "bg-slate-800 text-white shadow-sm border border-slate-700" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <MousePointer2 size={16} /> Select / Delete
            </button>
            <button
              onClick={() => setMode("draw")}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                mode === "draw" ? "bg-emerald-950/50 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <GitCommit size={16} /> Draw Route
            </button>
          </div>
        </div>
      )}

      {/* Main Map Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col relative bg-slate-900/20">
        <div 
          ref={containerRef}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-auto relative shadow-2xl"
        >
          {/* Map Container */}
          <div 
            className={`relative w-full max-w-[1000px] mx-auto my-12 rounded-lg overflow-hidden border border-slate-800/80 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-slate-900 ${editorTab === "rooms" ? "cursor-pointer" : "cursor-crosshair"}`} 
            style={{ aspectRatio: imageRatio }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleMapClick}
          >
            <img 
              src={currentFloorMap} 
              alt={`Map Floor ${activeFloor}`} 
              className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80"
              onLoad={handleImageLoad}
            />
            
            {/* SVG Edges Layer */}
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
              {visibleEdges.map(edge => {
                const r1 = rooms.find(r => r.id === edge.from_node);
                const r2 = rooms.find(r => r.id === edge.to_node);
                if (!r1 || !r2) return null;

                const x1 = (r1.x / 1000) * 100;
                const y1 = (r1.y / 1000) * 100;
                const x2 = (r2.x / 1000) * 100;
                const y2 = (r2.y / 1000) * 100;

                const isRouteMode = editorTab === "routes";

                return (
                  <line
                    key={edge.id}
                    x1={`${x1}%`}
                    y1={`${y1}%`}
                    x2={`${x2}%`}
                    y2={`${y2}%`}
                    stroke="currentColor"
                    strokeWidth="3"
                    className={`transition-all ${
                      isRouteMode ? "text-cyan-500/80 pointer-events-auto" : "text-slate-700/30 pointer-events-none"
                    } ${
                      isRouteMode && mode === "select" ? "hover:stroke-red-500 hover:stroke-[8px] hover:opacity-100 cursor-pointer drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" : ""
                    }`}
                    onClick={(e) => isRouteMode && handleDeleteEdge(e, edge.id)}
                  />
                );
              })}
            </svg>

            {/* Room Nodes Layer */}
            {visibleRooms.map((room) => {
              const isSelected = selectedNode === room.id;
              const isRouteMode = editorTab === "routes";
              
              return (
                <div
                  key={room.id}
                  onClick={(e) => handleNodeClick(e, room)}
                  className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 transition-all cursor-pointer z-20 group ${
                    isSelected 
                      ? "bg-emerald-400 border-emerald-300 ring-4 ring-emerald-500/40 scale-125 shadow-[0_0_10px_rgba(52,211,153,0.8)]" 
                      : isRouteMode && mode === "draw"
                        ? "bg-slate-900 border-cyan-500 hover:scale-150 hover:bg-cyan-500"
                        : "bg-slate-800 border-slate-500 hover:border-cyan-400 hover:bg-cyan-900"
                  }`}
                  style={{ left: `${(room.x / 1000) * 100}%`, top: `${(room.y / 1000) * 100}%` }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-30 transition-opacity">
                    {room.label}
                  </div>
                </div>
              );
            })}

            {/* Live Radar Badge */}
            {liveCoords && (
              <div className="absolute bottom-4 right-4 bg-slate-950/70 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.15)] pointer-events-none z-50 transition-opacity animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                  <span className="font-mono text-cyan-300 font-bold tracking-widest text-[13px]">
                    X: {liveCoords.x.toString().padStart(4, '\u00A0')} | Y: {liveCoords.y.toString().padStart(4, '\u00A0')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
