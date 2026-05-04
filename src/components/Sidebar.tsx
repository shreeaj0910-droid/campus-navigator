import { useState, useMemo } from "react";
import { rooms, Room } from "@/lib/campusData";
import { Search, MapPin, Navigation, RotateCcw, Route } from "lucide-react";

interface SidebarProps {
  startId: string | null;
  endId: string | null;
  path: string[] | null;
  onSetStart: (id: string) => void;
  onSetEnd: (id: string) => void;
  onFindPath: () => void;
  onReset: () => void;
  selectedRoom: Room | null;
}

const typeLabel: Record<Room["type"], string> = {
  classroom: "Classroom",
  lab: "Lab",
  facility: "Facility",
};

const typeBadgeClass: Record<Room["type"], string> = {
  classroom: "badge-classroom",
  lab: "badge-lab",
  facility: "badge-facility",
};

// Only show non-corridor rooms in the sidebar
const visibleRooms = rooms.filter(
  (r) => !r.id.startsWith("h") && r.id !== "junction" && r.id !== "stairA" && r.id !== "stairB"
);

export default function Sidebar({
  startId,
  endId,
  path,
  onSetStart,
  onSetEnd,
  onFindPath,
  onReset,
  selectedRoom,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const [selectingMode, setSelectingMode] = useState<"start" | "end">("start");

  const filtered = useMemo(
    () =>
      visibleRooms.filter((r) =>
        r.label.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  const startRoom = rooms.find((r) => r.id === startId);
  const endRoom   = rooms.find((r) => r.id === endId);

  const handleRoomSelect = (id: string) => {
    if (selectingMode === "start") {
      onSetStart(id);
    } else {
      onSetEnd(id);
    }
  };

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Route className="sidebar-logo-icon" />
          <div>
            <div className="sidebar-title">CampusNav</div>
            <div className="sidebar-subtitle">A* Pathfinder</div>
          </div>
        </div>
      </div>

      {/* Route Panel */}
      <div className="route-panel">
        <div className="route-panel-title">Route Planner</div>

        {/* Mode selector */}
        <div className="mode-tabs">
          <button
            className={`mode-tab ${selectingMode === "start" ? "mode-tab-active" : ""}`}
            onClick={() => setSelectingMode("start")}
          >
            <MapPin size={13} />
            Start
          </button>
          <button
            className={`mode-tab ${selectingMode === "end" ? "mode-tab-active" : ""}`}
            onClick={() => setSelectingMode("end")}
          >
            <Navigation size={13} />
            End
          </button>
        </div>

        {/* Selected rooms */}
        <div className="route-slots">
          <div className={`route-slot ${startId ? "route-slot-filled" : ""}`}>
            <span className="route-slot-dot dot-start" />
            <span className="route-slot-text">
              {startRoom ? startRoom.label : "Select start room"}
            </span>
          </div>
          <div className="route-connector" />
          <div className={`route-slot ${endId ? "route-slot-filled" : ""}`}>
            <span className="route-slot-dot dot-end" />
            <span className="route-slot-text">
              {endRoom ? endRoom.label : "Select end room"}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="route-actions">
          <button
            className="btn-find-path"
            disabled={!startId || !endId}
            onClick={onFindPath}
          >
            <Route size={14} />
            Find Path
          </button>
          <button className="btn-reset" onClick={onReset}>
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Path result info */}
        {path && (
          <div className="path-info">
            <span className="path-info-label">Route found:</span>
            <span className="path-info-steps">{path.length} stops</span>
          </div>
        )}
        {path === null && startId && endId && (
          <div className="path-error">No path found between these rooms.</div>
        )}
      </div>

      {/* Search */}
      <div className="search-section">
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search rooms…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Room list */}
      <div className="room-list">
        {filtered.map((room) => {
          const isStart = room.id === startId;
          const isEnd   = room.id === endId;
          const inPath  = path?.includes(room.id);
          return (
            <button
              key={room.id}
              className={`room-item ${isStart ? "room-item-start" : ""} ${isEnd ? "room-item-end" : ""} ${inPath && !isStart && !isEnd ? "room-item-path" : ""}`}
              onClick={() => handleRoomSelect(room.id)}
            >
              <div className="room-item-left">
                <span className={`room-type-badge ${typeBadgeClass[room.type]}`}>
                  {typeLabel[room.type]}
                </span>
                <span className="room-name">{room.label}</span>
              </div>
              <div className="room-item-right">
                {isStart && <span className="room-pin pin-start">S</span>}
                {isEnd   && <span className="room-pin pin-end">E</span>}
                {inPath && !isStart && !isEnd && (
                  <span className="room-pin pin-path">•</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="sidebar-footer">
        Click a room to set as {selectingMode === "start" ? "start" : "destination"}
      </div>
    </aside>
  );
}
