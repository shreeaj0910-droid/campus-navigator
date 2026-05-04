import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Users, Map } from "lucide-react";
import ProfessorManager from "@/components/admin/ProfessorManager";
import FloorPlanManager from "@/components/admin/FloorPlanManager";
import type { Session } from "@supabase/supabase-js";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"professors" | "floorplans">("professors");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/admin");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/admin");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  if (loading) return <div className="admin-loading">Loading…</div>;
  if (!session) return null;

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="topbar-brand">
          <span className="topbar-name">Admin Dashboard</span>
        </div>
        <div className="admin-topbar-actions">
          <span className="admin-user-email">{session.user.email}</span>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "professors" ? "admin-tab-active" : ""}`}
          onClick={() => setActiveTab("professors")}
        >
          <Users size={14} /> Professors
        </button>
        <button
          className={`admin-tab ${activeTab === "floorplans" ? "admin-tab-active" : ""}`}
          onClick={() => setActiveTab("floorplans")}
        >
          <Map size={14} /> Floor Plans
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "professors" && <ProfessorManager />}
        {activeTab === "floorplans" && <FloorPlanManager />}
      </div>
    </div>
  );
}
