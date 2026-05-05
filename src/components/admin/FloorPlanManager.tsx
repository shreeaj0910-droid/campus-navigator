import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, CheckCircle, Image as ImageIcon } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type FloorPlan = Tables<"floor_plans">;

export default function FloorPlanManager() {
  const [plans, setPlans] = useState<FloorPlan[]>([]);
  const [uploading, setUploading] = useState(false);
  const [planName, setPlanName] = useState("");
  const [widthMeters, setWidthMeters] = useState<number>(500);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      width_meters: widthMeters,
    });

    setPlanName("");
    setWidthMeters(500);
    setUploading(false);
    fetchPlans();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSetActive = async (id: string) => {
    await supabase.from("floor_plans").update({ is_active: false }).neq("id", "");
    await supabase.from("floor_plans").update({ is_active: true }).eq("id", id);
    fetchPlans();
  };

  const handleDelete = async (plan: FloorPlan) => {
    const url = new URL(plan.image_url);
    const pathParts = url.pathname.split("/floor-plans/");
    if (pathParts[1]) {
      await supabase.storage.from("floor-plans").remove([pathParts[1]]);
    }
    await supabase.from("floor_plans").delete().eq("id", plan.id);
    fetchPlans();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row gap-4 p-6 bg-muted/30 border border-border rounded-xl">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-foreground">Plan Name</label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="e.g. Third Floor Plan"
            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all"
          />
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-foreground">Map Width (meters)</label>
          <input
            type="number"
            value={widthMeters}
            onChange={(e) => setWidthMeters(Number(e.target.value))}
            min={10}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all"
          />
        </div>
        <div className="flex items-end pb-[2px]">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !planName.trim()}
            className="h-[46px] px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {uploading ? (
              <span className="animate-pulse">Uploading...</span>
            ) : (
              <>
                <Upload size={18} /> Upload Image
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`flex flex-col bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${
              plan.is_active ? "border-primary ring-1 ring-primary shadow-md shadow-primary/10" : "border-border hover:border-muted-foreground/50 shadow-sm"
            }`}
          >
            <div className="h-48 bg-muted overflow-hidden relative">
              <img 
                src={plan.image_url} 
                alt={plan.name} 
                className="w-full h-full object-cover" 
              />
              {plan.is_active && (
                <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                  <CheckCircle size={14} /> Active
                </div>
              )}
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 font-medium bg-muted inline-block px-2 py-0.5 rounded-md">
                    Scale: {plan.width_meters}m wide
                  </p>
                </div>
              </div>
              
              <div className="mt-auto pt-5 flex gap-3 border-t border-border">
                {!plan.is_active ? (
                  <button 
                    onClick={() => handleSetActive(plan.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-muted hover:bg-primary/10 text-foreground hover:text-primary rounded-xl transition-colors text-sm font-semibold"
                  >
                    <ImageIcon size={16} /> Set Active
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-2 text-muted-foreground text-sm font-semibold">
                    Currently Displayed
                  </div>
                )}
                
                <button 
                  onClick={() => handleDelete(plan)}
                  className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-xl transition-colors"
                  aria-label="Delete plan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {plans.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-muted/20">
            <ImageIcon size={48} className="mb-4 opacity-20" />
            <p className="font-medium">No floor plans uploaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
