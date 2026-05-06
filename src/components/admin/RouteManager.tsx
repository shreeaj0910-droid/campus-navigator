import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  MousePointer2, GitCommit, Trash2, PlusCircle,
  Edit3, Info, Loader2, RotateCcw, Eye, EyeOff
} from "lucide-react";
import { rooms as staticRooms } from "@/lib/campusData";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type FloorPlan = Tables<"floor_plans">;
type Room = Tables<"rooms">;
type Edge = Tables<"edges">;

type ToolMode = "select" | "create_node" | "draw_route" | "delete" | "edit_node";

// Popover state for inline label input
interface NodePopover {
  x: number;       // 0-1000 map coords
  y: number;
  pxX: number;     // pixel offset within container for positioning
  pxY: number;
  editId?: string; // if set → rename existing node
}

const TOOL_CONFIG: { mode: ToolMode; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  {
    mode: "select",
    label: "Select",
    icon: <MousePointer2 size={16} />,
    description: "Click nodes or edges to inspect them",
    color: "slate",
  },
  {
    mode: "create_node",
    label: "Create Node",
    icon: <PlusCircle size={16} />,
    description: "Click anywhere on the map to create a new room/node",
    color: "cyan",
  },
  {
    mode: "draw_route",
    label: "Draw Route",
    icon: <GitCommit size={16} />,
    description: "Click two nodes to connect them with a route",
    color: "emerald",
  },
  {
    mode: "edit_node",
    label: "Edit Node",
    icon: <Edit3 size={16} />,
    description: "Click a node to rename it or move it",
    color: "yellow",
  },
  {
    mode: "delete",
    label: "Delete",
    icon: <Trash2 size={16} />,
    description: "Click a node or route to delete it",
    color: "red",
  },
];

const FLOOR_LEVELS = [0, 1, 2];

export default function RouteManager() {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [activeFloor, setActiveFloor] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [imageRatio, setImageRatio] = useState(0.75);
  const [liveCoords, setLiveCoords] = useState<{ x: number; y: number } | null>(null);
  const [statusMsg, setStatusMsg] = useState("Select a tool to begin editing.");
  const [nodePopover, setNodePopover] = useState<NodePopover | null>(null);
  const [popoverLabel, setPopoverLabel] = useState("");
  // Ref mirrors nodePopover to avoid stale closures in async callbacks
  const nodePopoverRef = useRef<NodePopover | null>(null);
  const popoverLabelRef = useRef("");

  // For draw_route: holds the first selected node
  const [routeStart, setRouteStart] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // ── Data fetching ──
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: plans }, { data: dbRooms }, { data: dbEdges }] = await Promise.all([
      supabase.from("floor_plans").select("*").order("created_at", { ascending: false }),
      supabase.from("rooms").select("*"),
      supabase.from("edges").select("*"),
    ]);

    if (plans) setFloorPlans(plans);

    if (dbRooms && dbRooms.length > 0) {
      setRooms(dbRooms);
    } else {
      // Seed from static campus data as fallback
      setRooms(staticRooms.map(r => ({
        id: r.id, label: r.label, type: r.type,
        floor_level: 0, x: r.x, y: r.y,
        created_at: new Date().toISOString(),
      })));
    }

    if (dbEdges) setEdges(dbEdges);
    setLoading(false);
  };

  // ── Active floor image ──
  // Use the most recent uploaded floor plan whose name contains the floor level,
  // or fall back to the active plan, or blueprint.jpg
  const getFloorImage = useCallback(() => {
    const floorKeywords = ["ground", "floor 1", "floor 2", "first", "second"];
    const keyword = floorKeywords[activeFloor] ?? "ground";
    const match = floorPlans.find(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.name.toLowerCase().includes(String(activeFloor))
    );
    // Fall back to the active plan, then first plan, then static file
    const active = floorPlans.find(p => p.is_active);
    return match?.image_url ?? active?.image_url ?? "/blueprint.jpg";
  }, [floorPlans, activeFloor]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setImageRatio(img.naturalWidth / img.naturalHeight);
    }
  };
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.currentTarget as HTMLImageElement).src = "/blueprint.jpg";
  };

  // ── Filtered data for active floor ──
  const visibleRooms = rooms.filter(r => r.floor_level === activeFloor);
  const visibleEdges = edges.filter(edge => {
    const r1 = rooms.find(r => r.id === edge.from_node);
    const r2 = rooms.find(r => r.id === edge.to_node);
    return r1?.floor_level === activeFloor && r2?.floor_level === activeFloor;
  });

  // ── Coordinate helper ──
  const getMapCoords = (e: React.MouseEvent<HTMLDivElement>): { x: number; y: number } => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);
    return {
      x: Math.max(0, Math.min(1000, x)),
      y: Math.max(0, Math.min(1000, y)),
    };
  };

  // ── Tool: Create Node ──
  const openNodePopover = (e: React.MouseEvent<HTMLDivElement>, editId?: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1000, Math.round(((e.clientX - rect.left) / rect.width) * 1000)));
    const y = Math.max(0, Math.min(1000, Math.round(((e.clientY - rect.top) / rect.height) * 1000)));
    const pxX = e.clientX - rect.left;
    const pxY = e.clientY - rect.top;
    const popover: NodePopover = { x, y, pxX, pxY, editId };
    nodePopoverRef.current = popover;    // always fresh
    setNodePopover(popover);
    popoverLabelRef.current = "";
    setPopoverLabel("");
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode !== "create_node") return;
    if ((e.target as HTMLElement).closest('.node-marker')) return;
    openNodePopover(e);
  };

  const commitNodeCreate = async () => {
    // Read from refs — guaranteed fresh even if state hasn't settled
    const popover = nodePopoverRef.current;
    const label = popoverLabelRef.current.trim();

    if (!popover || !label) {
      console.warn("commitNodeCreate: popover or label missing", { popover, label });
      closePopover();
      return;
    }

    const newRoom = {
      id: crypto.randomUUID(),
      label,
      type: "node",
      floor_level: activeFloor,
      x: popover.x,
      y: popover.y,
    };

    // Optimistic update — add to UI immediately
    const optimisticEntry = { ...newRoom, created_at: new Date().toISOString() };
    setRooms(prev => [...prev, optimisticEntry]);
    setStatusMsg(`Created "${label}" at (${popover.x}, ${popover.y})`);
    closePopover();
    toast.success(`Node "${label}" created.`);

    // Sync to Supabase in background
    const { error } = await supabase.from("rooms").insert(newRoom);
    if (error) {
      console.error("Supabase insert error:", error);
      toast.error(`Saved locally but Supabase failed: ${error.message}`);
    }
  };

  const closePopover = () => {
    nodePopoverRef.current = null;
    popoverLabelRef.current = "";
    setNodePopover(null);
    setPopoverLabel("");
  };

  const commitNodeRename = async () => {
    const popover = nodePopoverRef.current;
    const label = popoverLabelRef.current.trim();
    if (!popover?.editId || !label) { closePopover(); return; }
    // Optimistic update
    setRooms(prev => prev.map(r => r.id === popover.editId ? { ...r, label } : r));
    setStatusMsg(`Renamed to "${label}"`);
    closePopover();
    toast.success(`Renamed to "${label}"`);
    const { error } = await supabase.from("rooms").update({ label }).eq("id", popover.editId);
    if (error) toast.error("Rename sync failed: " + error.message);
  };

  // ── Tool: Node click handler ──
  const handleNodeClick = async (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();

    if (toolMode === "select") {
      setSelectedNodeId(room.id);
      setStatusMsg(`Selected: ${room.label} — pos (${room.x}, ${room.y}), Floor ${room.floor_level}`);
      return;
    }

    if (toolMode === "delete") {
      const connectedEdgeIds = edges.filter(e => e.from_node === room.id || e.to_node === room.id).map(e => e.id);
      const confirmMsg = connectedEdgeIds.length > 0
        ? `Delete node "${room.label}" and its ${connectedEdgeIds.length} connected route(s)?`
        : `Delete node "${room.label}"?`;
      // Use inline toast confirm instead of window.confirm
      toast(`${confirmMsg}`, {
        action: {
          label: "Yes, delete",
          onClick: async () => {
            if (connectedEdgeIds.length > 0) {
              await supabase.from("edges").delete().in("id", connectedEdgeIds);
              setEdges(prev => prev.filter(e => !connectedEdgeIds.includes(e.id)));
            }
            const { error } = await supabase.from("rooms").delete().eq("id", room.id);
            if (error) { toast.error("Delete failed: " + error.message); return; }
            setRooms(prev => prev.filter(r => r.id !== room.id));
            toast.success(`Deleted "${room.label}"`);
            setStatusMsg(`Deleted "${room.label}"`);
          }
        },
        cancel: { label: "Cancel", onClick: () => {} },
      });
      return;
    }

    if (toolMode === "edit_node") {
      setNodePopover({
        x: room.x,
        y: room.y,
        pxX: (room.x / 1000) * (mapRef.current?.offsetWidth ?? 600),
        pxY: (room.y / 1000) * (mapRef.current?.offsetHeight ?? 400),
        editId: room.id,
      });
      setPopoverLabel(room.label);
      return;
    }

    if (toolMode === "draw_route") {
      if (!routeStart) {
        setRouteStart(room.id);
        setSelectedNodeId(room.id);
        setStatusMsg(`Route start: "${room.label}" — now click the destination node`);
        return;
      }

      if (routeStart === room.id) {
        setRouteStart(null);
        setSelectedNodeId(null);
        setStatusMsg("Deselected. Click a node to start a new route.");
        return;
      }

      const startRoom = rooms.find(r => r.id === routeStart);
      if (!startRoom) { setRouteStart(null); return; }

      const alreadyExists = edges.some(
        edge =>
          (edge.from_node === routeStart && edge.to_node === room.id) ||
          (edge.from_node === room.id && edge.to_node === routeStart)
      );

      if (alreadyExists) {
        toast.error("A route already exists between these two nodes.");
        setRouteStart(null);
        setSelectedNodeId(null);
        return;
      }

      const weight = Math.round(
        Math.sqrt(Math.pow(startRoom.x - room.x, 2) + Math.pow(startRoom.y - room.y, 2))
      );
      const { data, error } = await supabase
        .from("edges")
        .insert({ from_node: routeStart, to_node: room.id, weight })
        .select()
        .single();

      if (error) { toast.error("Failed to draw route: " + error.message); }
      else if (data) {
        setEdges(prev => [...prev, data]);
        toast.success(`Route drawn (weight: ${weight})`);
        setStatusMsg(`Route created between "${startRoom.label}" and "${room.label}"`);
      }

      setRouteStart(null);
      setSelectedNodeId(null);
    }
  };

  // ── Tool: Delete Edge ──
  const handleEdgeClick = async (e: React.MouseEvent, edgeId: string) => {
    e.stopPropagation();
    if (toolMode !== "delete" && toolMode !== "select") return;

    if (toolMode === "select") {
      const edge = edges.find(e => e.id === edgeId);
      if (edge) {
        const r1 = rooms.find(r => r.id === edge.from_node)?.label ?? edge.from_node;
        const r2 = rooms.find(r => r.id === edge.to_node)?.label ?? edge.to_node;
        setStatusMsg(`Route: ${r1} → ${r2} (weight: ${edge.weight})`);
      }
      return;
    }

    toast(`Delete this route segment?`, {
      action: {
        label: "Yes, delete",
        onClick: async () => {
          const { error } = await supabase.from("edges").delete().eq("id", edgeId);
          if (error) { toast.error("Failed to delete route."); return; }
          setEdges(prev => prev.filter(e => e.id !== edgeId));
          toast.success("Route deleted.");
          setStatusMsg("Route deleted.");
        }
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  // ── Mouse move for coord radar ──
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000);
    setLiveCoords({ x: Math.max(0, Math.min(1000, x)), y: Math.max(0, Math.min(1000, y)) });
  };

  // ── Reset tool ──
  const handleToolChange = (mode: ToolMode) => {
    setToolMode(mode);
    setSelectedNodeId(null);
    setRouteStart(null);
    const cfg = TOOL_CONFIG.find(t => t.mode === mode);
    setStatusMsg(cfg?.description ?? "");
  };

  const getToolBtnClass = (cfg: typeof TOOL_CONFIG[number]) => {
    const active = toolMode === cfg.mode;
    const colors: Record<string, string> = {
      slate:   active ? "bg-slate-700 text-white border-slate-500" : "text-slate-400 border-slate-800 hover:text-white hover:border-slate-600",
      cyan:    active ? "bg-cyan-600/30 text-cyan-300 border-cyan-500" : "text-slate-400 border-slate-800 hover:text-cyan-400 hover:border-cyan-700",
      emerald: active ? "bg-emerald-600/30 text-emerald-300 border-emerald-500" : "text-slate-400 border-slate-800 hover:text-emerald-400 hover:border-emerald-700",
      yellow:  active ? "bg-yellow-600/30 text-yellow-300 border-yellow-500" : "text-slate-400 border-slate-800 hover:text-yellow-400 hover:border-yellow-700",
      red:     active ? "bg-red-600/30 text-red-300 border-red-500" : "text-slate-400 border-slate-800 hover:text-red-400 hover:border-red-700",
    };
    return `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${colors[cfg.color]}`;
  };

  const getCursor = () => {
    switch (toolMode) {
      case "create_node": return "cursor-crosshair";
      case "draw_route":  return "cursor-cell";
      case "delete":      return "cursor-not-allowed";
      case "edit_node":   return "cursor-text";
      default:            return "cursor-default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-cyan-400">
        <Loader2 className="animate-spin w-8 h-8 mr-3" /> Initializing Map Editor...
      </div>
    );
  }

  const currentFloorImage = getFloorImage();

  return (
    <div className="flex flex-col bg-slate-950 text-slate-300 font-sans" style={{ height: "calc(100vh - 180px)" }}>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-3 bg-slate-900 border-b border-slate-800 shrink-0 z-20">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">Tools</span>
        {TOOL_CONFIG.map(cfg => (
          <button key={cfg.mode} onClick={() => handleToolChange(cfg.mode)} className={getToolBtnClass(cfg)} title={cfg.description}>
            {cfg.icon} {cfg.label}
          </button>
        ))}

        <div className="h-6 w-px bg-slate-700 mx-2" />

        {/* Floor selector */}
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-1">Floor</span>
        {FLOOR_LEVELS.map(lvl => (
          <button
            key={lvl}
            onClick={() => { setActiveFloor(lvl); setRouteStart(null); setSelectedNodeId(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${
              activeFloor === lvl
                ? "bg-purple-600/30 text-purple-300 border-purple-500"
                : "text-slate-400 border-slate-800 hover:text-purple-400 hover:border-purple-700"
            }`}
          >
            {lvl === 0 ? "G" : lvl}
          </button>
        ))}

        <div className="h-6 w-px bg-slate-700 mx-2" />

        {/* Toggle labels */}
        <button
          onClick={() => setShowLabels(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-slate-800 text-slate-400 hover:text-white transition-all"
          title="Toggle node labels"
        >
          {showLabels ? <Eye size={15} /> : <EyeOff size={15} />}
          Labels
        </button>

        {/* Reset selection */}
        <button
          onClick={() => { setSelectedNodeId(null); setRouteStart(null); setStatusMsg("Selection cleared."); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-slate-800 text-slate-400 hover:text-white transition-all"
          title="Clear selection"
        >
          <RotateCcw size={15} /> Clear
        </button>
      </div>

      {/* ── Status Bar ── */}
      <div className="flex items-center gap-2 px-5 py-2 bg-slate-900/60 border-b border-slate-800/50 shrink-0 text-xs font-mono text-slate-400">
        <Info size={12} className="text-cyan-400 flex-shrink-0" />
        <span>{statusMsg}</span>
        <span className="ml-auto text-slate-600">
          Floor {activeFloor} · {visibleRooms.length} nodes · {visibleEdges.length} routes
          {routeStart && <span className="text-emerald-400 ml-4">● Drawing route from "{rooms.find(r => r.id === routeStart)?.label}"</span>}
        </span>
      </div>

      {/* ── Map Canvas ── */}
      <div className="flex-1 overflow-auto bg-slate-900/20 p-4">
        <div
          ref={containerRef}
          className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl mx-auto"
          style={{ maxWidth: 1000 }}
        >
          <div
            ref={mapRef}
            className={`relative w-full ${getCursor()}`}
            style={{ aspectRatio: imageRatio }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setLiveCoords(null)}
            onClick={handleMapClick}
          >
            {/* Floor map image */}
            <img
              key={`${activeFloor}-${currentFloorImage}`}
              src={currentFloorImage}
              alt={`Floor ${activeFloor} map`}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
              style={{ opacity: 0.85 }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />

            {/* ── SVG Edge Layer ── */}
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10">
              {visibleEdges.map(edge => {
                const r1 = rooms.find(r => r.id === edge.from_node);
                const r2 = rooms.find(r => r.id === edge.to_node);
                if (!r1 || !r2) return null;
                const x1 = (r1.x / 1000) * 100;
                const y1 = (r1.y / 1000) * 100;
                const x2 = (r2.x / 1000) * 100;
                const y2 = (r2.y / 1000) * 100;
                const midX = ((x1 + x2) / 2);
                const midY = ((y1 + y2) / 2);
                const isHovered = hoveredEdgeId === edge.id;
                const isDeleteMode = toolMode === "delete";

                return (
                  <g key={edge.id} className="pointer-events-auto">
                    {/* Wider invisible hit area */}
                    <line
                      x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                      stroke="transparent" strokeWidth="20"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredEdgeId(edge.id)}
                      onMouseLeave={() => setHoveredEdgeId(null)}
                      onClick={(e) => handleEdgeClick(e as any, edge.id)}
                    />
                    {/* Visible edge */}
                    <line
                      x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
                      stroke={isHovered ? (isDeleteMode ? "#ef4444" : "#22d3ee") : "#475569"}
                      strokeWidth={isHovered ? "4" : "2"}
                      strokeLinecap="round"
                      className="transition-all pointer-events-none"
                    />
                    {/* Weight badge at midpoint */}
                    {isHovered && (
                      <text
                        x={`${midX}%`} y={`${midY}%`}
                        textAnchor="middle" dy="-6"
                        fill={isDeleteMode ? "#ef4444" : "#22d3ee"}
                        fontSize="10" fontFamily="monospace"
                        className="pointer-events-none select-none"
                      >
                        {edge.weight}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* ── Node Layer ── */}
            {visibleRooms.map(room => {
              const isSelected = selectedNodeId === room.id || routeStart === room.id;
              const isRouteStart = routeStart === room.id;

              const nodeColor = isRouteStart
                ? "bg-emerald-400 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                : isSelected
                  ? "bg-cyan-400 border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                  : toolMode === "delete"
                    ? "bg-slate-800 border-red-500 hover:bg-red-500 hover:shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                    : toolMode === "draw_route"
                      ? "bg-slate-800 border-emerald-500 hover:bg-emerald-500 hover:scale-125 hover:shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      : "bg-slate-800 border-slate-500 hover:border-cyan-400 hover:bg-slate-700";

              return (
                <div
                  key={room.id}
                  onClick={(e) => handleNodeClick(e, room)}
                  className={`node-marker absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 transition-all cursor-pointer z-20 group ${nodeColor}`}
                  style={{ left: `${(room.x / 1000) * 100}%`, top: `${(room.y / 1000) * 100}%` }}
                >
                  {/* Label */}
                  {showLabels && (
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 text-cyan-300 font-mono text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-30 pointer-events-none shadow-lg">
                      {room.label}
                    </div>
                  )}
                  {/* Hover tooltip when labels are hidden */}
                  {!showLabels && (
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-600 text-cyan-300 font-mono text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-30 pointer-events-none shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      {room.label}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Coordinate Radar ── */}
            {liveCoords && (
              <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-sm border border-cyan-500/30 px-3 py-1.5 rounded-lg shadow-[0_0_12px_rgba(34,211,238,0.15)] pointer-events-none z-50 font-mono text-cyan-300 text-xs font-bold tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                X: {String(liveCoords.x).padStart(4, "\u00A0")} | Y: {String(liveCoords.y).padStart(4, "\u00A0")}
              </div>
            )}

            {/* ── Inline Node Popover (replaces window.prompt) ── */}
            {nodePopover && (
              <div
                className="absolute z-[80] bg-slate-900 border border-cyan-500/60 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)] p-3 w-56"
                style={{
                  left: Math.min(nodePopover.pxX, (mapRef.current?.offsetWidth ?? 600) - 230),
                  top: Math.max(nodePopover.pxY - 80, 8),
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                  {nodePopover.editId ? "Rename Node" : "New Node"}
                </p>
                <input
                  autoFocus
                  type="text"
                  value={popoverLabel}
                  onChange={(e) => {
                    popoverLabelRef.current = e.target.value; // sync ref immediately
                    setPopoverLabel(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") nodePopover.editId ? commitNodeRename() : commitNodeCreate();
                    if (e.key === "Escape") closePopover();
                  }}
                  placeholder={nodePopover.editId ? "New label..." : "e.g. Room 101"}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-cyan-400 transition-all"
                />
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => nodePopover.editId ? commitNodeRename() : commitNodeCreate()}
                    disabled={!popoverLabel.trim()}
                    className="flex-1 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black text-xs font-bold rounded-lg transition-all"
                  >
                    {nodePopover.editId ? "Rename" : "Create"}
                  </button>
                  <button
                    onClick={() => { setNodePopover(null); setPopoverLabel(""); }}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
