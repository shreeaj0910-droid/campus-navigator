import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit2, Save, X, MapPin } from "lucide-react";
import AdminMapPicker from "./AdminMapPicker";
import type { Tables } from "@/integrations/supabase/types";

type Professor = Tables<"professors">;

export default function ProfessorManager() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [form, setForm] = useState({
    name: "",
    room_number: "",
    coord_x: 0,
    coord_y: 0,
    status: "available" as string,
    current_location: "",
  });

  const fetchProfessors = useCallback(async () => {
    const { data } = await supabase.from("professors").select("*").order("name");
    if (data) setProfessors(data);
  }, []);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  const resetForm = () => {
    setForm({ name: "", room_number: "", coord_x: 0, coord_y: 0, status: "available", current_location: "" });
    setShowForm(false);
    setEditingId(null);
    setShowMapPicker(false);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.room_number.trim()) return;
    const payload = {
      name: form.name,
      room_number: form.room_number,
      coord_x: form.coord_x,
      coord_y: form.coord_y,
      status: form.status,
      current_location: form.current_location || null,
    };

    if (editingId) {
      await supabase.from("professors").update(payload).eq("id", editingId);
    } else {
      await supabase.from("professors").insert(payload);
    }
    resetForm();
    fetchProfessors();
  };

  const handleEdit = (p: Professor) => {
    setForm({
      name: p.name,
      room_number: p.room_number,
      coord_x: p.coord_x,
      coord_y: p.coord_y,
      status: p.status,
      current_location: p.current_location || "",
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("professors").delete().eq("id", id);
    fetchProfessors();
  };

  const handleToggleStatus = async (p: Professor) => {
    const newStatus = p.status === "available" ? "busy" : "available";
    await supabase.from("professors").update({ status: newStatus }).eq("id", p.id);
    fetchProfessors();
  };

  const handleMapClick = (coords: { x: number; y: number }) => {
    setForm((f) => ({ ...f, coord_x: coords.x, coord_y: coords.y }));
    setShowMapPicker(false);
  };

  return (
    <div className="prof-manager">
      <div className="prof-header">
        <h2 className="prof-title">Professor Database</h2>
        <button className="prof-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={14} /> Add Professor
        </button>
      </div>

      {showForm && (
        <div className="prof-form">
          <div className="prof-form-grid">
            <div className="admin-field">
              <label className="admin-label">Name</label>
              <input
                className="admin-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Dr. Sharma"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Room Number</label>
              <input
                className="admin-input"
                value={form.room_number}
                onChange={(e) => setForm((f) => ({ ...f, room_number: e.target.value }))}
                placeholder="FE-401"
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Status</label>
              <select
                className="admin-input"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
              </select>
            </div>
            <div className="admin-field">
              <label className="admin-label">Current Location (if busy)</label>
              <input
                className="admin-input"
                value={form.current_location}
                onChange={(e) => setForm((f) => ({ ...f, current_location: e.target.value }))}
                placeholder="In a meeting at Lab B"
              />
            </div>
          </div>

          <div className="prof-coords-row">
            <div className="admin-field">
              <label className="admin-label">Coord Y</label>
              <input
                type="number"
                className="admin-input"
                value={form.coord_y}
                onChange={(e) => setForm((f) => ({ ...f, coord_y: Number(e.target.value) }))}
              />
            </div>
            <div className="admin-field">
              <label className="admin-label">Coord X</label>
              <input
                type="number"
                className="admin-input"
                value={form.coord_x}
                onChange={(e) => setForm((f) => ({ ...f, coord_x: Number(e.target.value) }))}
              />
            </div>
            <button className="prof-pick-btn" onClick={() => setShowMapPicker(true)}>
              <MapPin size={14} /> Pick on Map
            </button>
          </div>

          {showMapPicker && (
            <div className="map-picker-container">
              <AdminMapPicker onCoordsPicked={handleMapClick} onClose={() => setShowMapPicker(false)} />
            </div>
          )}

          <div className="prof-form-actions">
            <button className="prof-save-btn" onClick={handleSave}>
              <Save size={14} /> {editingId ? "Update" : "Save"}
            </button>
            <button className="prof-cancel-btn" onClick={resetForm}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="prof-table-wrap">
        <table className="prof-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Room</th>
              <th>Coords (y, x)</th>
              <th>Status</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {professors.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.room_number}</td>
                <td className="prof-coords">{p.coord_y}, {p.coord_x}</td>
                <td>
                  <button
                    className={`prof-status-badge ${p.status === "available" ? "status-available" : "status-busy"}`}
                    onClick={() => handleToggleStatus(p)}
                    title="Click to toggle"
                  >
                    {p.status}
                  </button>
                </td>
                <td className="prof-location">{p.current_location || "—"}</td>
                <td className="prof-actions">
                  <button className="prof-action-btn" onClick={() => handleEdit(p)} title="Edit">
                    <Edit2 size={13} />
                  </button>
                  <button className="prof-action-btn prof-delete-btn" onClick={() => handleDelete(p.id)} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
            {professors.length === 0 && (
              <tr><td colSpan={6} className="prof-empty">No professors added yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
