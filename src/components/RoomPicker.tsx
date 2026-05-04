import { Drawer } from "vaul";
import { Search, MapPin } from "lucide-react";
import { useState, useMemo } from "react";
import { rooms } from "@/lib/campusData";

interface RoomPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRoom: (roomId: string) => void;
  title: string;
}

export default function RoomPicker({ open, onOpenChange, onSelectRoom, title }: RoomPickerProps) {
  const [query, setQuery] = useState("");

  const visibleRooms = useMemo(() => {
    return rooms.filter(
      (r) => !r.id.startsWith("h") && r.id !== "junction" && r.id !== "stairA" && r.id !== "stairB"
    );
  }, []);

  const filteredRooms = useMemo(() => {
    return visibleRooms.filter(r => r.label.toLowerCase().includes(query.toLowerCase()));
  }, [query, visibleRooms]);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[70]" />
        <Drawer.Content className="bg-white dark:bg-card flex flex-col rounded-t-[24px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-[80] focus:outline-none">
          <div className="p-4 bg-white dark:bg-card rounded-t-[24px] border-b border-gray-100 dark:border-border flex-1 flex flex-col">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-muted mb-6" />
            <Drawer.Title className="font-semibold text-lg text-gray-900 dark:text-foreground mb-4 px-2">
              {title}
            </Drawer.Title>

            {/* Sticky Search Bar */}
            <div className="relative mb-4 px-2">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search for classrooms, labs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-muted text-gray-900 dark:text-foreground rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                autoFocus
              />
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto px-2 pb-6">
              {filteredRooms.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-muted-foreground">
                  No locations found.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => {
                        onSelectRoom(room.id);
                        onOpenChange(false);
                      }}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-muted transition-colors text-left"
                    >
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-full text-blue-600 dark:text-blue-400">
                        <MapPin size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-foreground">
                          {room.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-muted-foreground capitalize mt-0.5">
                          {room.type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
