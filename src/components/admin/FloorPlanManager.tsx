import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, CheckCircle, Image } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type FloorPlan = Tables<"floor_plans">;

export default function FloorPlanManager() {
  const [plans, setPlans] = useState<FloorPlan[]>([]);
  const [uploading, setUploading] = useState(false);
  const [planName, setPlanName] = useState("");

  const fetchPlans = useCallback(async () => {
    const { data } = await supabase.from("floor_plans").select("*").order("created_at", { ascending: false });
    if (data) setPlans(data);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !planName.trim()) return;
    setUploading(true);

    const filePath = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("floor-plans").upload(filePath, file);
    if (uploadError) {
      console.error("Upload error:", uploadError);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("floor-plans").getPublicUrl(filePath);

    await supabase.from("floor_plans").insert({
      name: planName,
      image_url: urlData.publicUrl,
    });

    setPlanName("");
    setUploading(false);
    fetchPlans();
    // Reset file input
    e.target.value = "";
  };

  const handleSetActive = async (id: string) => {
    // Deactivate all, then activate selected
    await supabase.from("floor_plans").update({ is_active: false }).neq("id", "");
    await supabase.from("floor_plans").update({ is_active: true }).eq("id", id);
    fetchPlans();
  };

  const handleDelete = async (plan: FloorPlan) => {
    // Extract file path from URL
    const url = new URL(plan.image_url);
    const pathParts = url.pathname.split("/floor-plans/");
    if (pathParts[1]) {
      await supabase.storage.from("floor-plans").remove([pathParts[1]]);
    }
    await supabase.from("floor_plans").delete().eq("id", plan.id);
    fetchPlans();
  };

  return (
    <div className="fp-manager">
      <div className="prof-header">
        <h2 className="prof-title">Floor Plan Manager</h2>
      </div>

      <div className="fp-upload-section">
        <div className="admin-field">
          <label className="admin-label">Plan Name</label>
          <input
            className="admin-input"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Third Floor Plan"
          />
        </div>
        <div className="fp-upload-row">
          <label className="fp-upload-btn">
            <Upload size={14} />
            {uploading ? "Uploading…" : "Upload Image"}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading || !planName.trim()}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>

      <div className="fp-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`fp-card ${plan.is_active ? "fp-card-active" : ""}`}>
            <div className="fp-card-img-wrap">
              <img src={plan.image_url} alt={plan.name} className="fp-card-img" />
            </div>
            <div className="fp-card-info">
              <span className="fp-card-name">{plan.name}</span>
              {plan.is_active && (
                <span className="fp-active-badge"><CheckCircle size={12} /> Active</span>
              )}
            </div>
            <div className="fp-card-actions">
              {!plan.is_active && (
                <button className="fp-set-active-btn" onClick={() => handleSetActive(plan.id)}>
                  <Image size={12} /> Set Active
                </button>
              )}
              <button className="prof-action-btn prof-delete-btn" onClick={() => handleDelete(plan)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="prof-empty">No floor plans uploaded yet.</div>
        )}
      </div>
    </div>
  );
}
