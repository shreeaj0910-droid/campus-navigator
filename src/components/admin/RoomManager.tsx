import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Edit2, Trash2, Plus, X, Search } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Room = Tables<"rooms">;

export default function RoomManager() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    label: "",
    type: "classroom",
    floor_level: 1,
    x: 500,
    y: 500,
  });

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("rooms").select("*").order("label");
    if (error) toast.error("Failed to load rooms");
    if (data) setRooms(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData({ id: "", label: "", type: "classroom", floor_level: 1, x: 500, y: 500 });
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      id: room.id,
      label: room.label,
      type: room.type,
      floor_level: room.floor_level,
      x: room.x,
      y: room.y,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.label.trim()) {
      toast.error("ID and Label are required.");
      return;
    }

    try {
      if (editingRoom) {
        const { error } = await supabase.from("rooms").update({
          label: formData.label,
          type: formData.type,
          floor_level: formData.floor_level,
          x: formData.x,
          y: formData.y,
        }).eq("id", editingRoom.id);
        if (error) throw error;
        toast.success("Room updated successfully!");
      } else {
        const { error } = await supabase.from("rooms").insert(formData);
        if (error) throw error;
        toast.success("Room created successfully!");
      }
      closeModal();
      fetchRooms();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room? This may break connected routes.")) return;
    try {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
      toast.success("Room deleted.");
      fetchRooms();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredRooms = rooms.filter(r => 
    r.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search rooms by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all shadow-sm"
          />
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Room
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Label</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Floor</th>
                <th className="px-6 py-4">Coordinates (X, Y)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground animate-pulse">
                    Loading rooms...
                  </td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No rooms found.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{room.id}</td>
                    <td className="px-6 py-4 text-foreground">{room.label}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border
                        ${room.type === 'classroom' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                          room.type === 'lab' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 
                          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}
                      >
                        {room.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{room.floor_level}</td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      {room.x}, {room.y}
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(room)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(room.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">
                {editingRoom ? "Edit Room" : "Add New Room"}
              </h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Room ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRoom} // Primary key shouldn't be edited easily
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g. r101"
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-foreground disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Label (Name)</label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g. Room 101"
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  >
                    <option value="classroom">Classroom</option>
                    <option value="lab">Lab</option>
                    <option value="facility">Facility</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Floor Level</label>
                  <input
                    type="number"
                    required
                    value={formData.floor_level}
                    onChange={(e) => setFormData({ ...formData, floor_level: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Map X Coordinate (0-1000)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={1000}
                    value={formData.x}
                    onChange={(e) => setFormData({ ...formData, x: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Map Y Coordinate (0-1000)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={1000}
                    value={formData.y}
                    onChange={(e) => setFormData({ ...formData, y: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-foreground bg-muted hover:bg-muted/80 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                >
                  {editingRoom ? "Save Changes" : "Create Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
