import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Users, Map, LayoutDashboard, Route } from "lucide-react";
import ProfessorManager from "@/components/admin/ProfessorManager";
import FloorPlanManager from "@/components/admin/FloorPlanManager";
import ThemeToggle from "@/components/ThemeToggle";
import type { Session } from "@supabase/supabase-js";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<"professors" | "floorplans" | "rooms" | "routes">("professors");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const navItems = [
    { id: "professors", label: "Professors", icon: Users },
    { id: "floorplans", label: "Floor Maps", icon: Map },
    { id: "rooms", label: "Manage Rooms", icon: LayoutDashboard },
    { id: "routes", label: "Manage Routes", icon: Route },
  ] as const;

  if (!session) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-card border-r border-border shadow-sm z-10 flex-shrink-0">
        <div className="p-6 pb-4 border-b border-border flex items-center justify-between">
          <div className="overflow-hidden">
            <h2 className="text-xl font-bold text-foreground truncate">Admin</h2>
            <p className="text-xs text-muted-foreground mt-1 truncate" title={session.user.email}>
              {session.user.email}
            </p>
          </div>
          <div className="flex-shrink-0 ml-2 scale-90">
            <ThemeToggle />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-medium text-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-6xl mx-auto p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
          </header>

          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 min-h-[500px]">
            {activeTab === "professors" && <ProfessorManager />}
            {activeTab === "floorplans" && <FloorPlanManager />}
            {activeTab === "rooms" && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                <LayoutDashboard size={48} className="mb-4 opacity-20" />
                <h3 className="text-xl font-semibold mb-2">Manage Rooms</h3>
                <p>Room management interface coming soon.</p>
              </div>
            )}
            {activeTab === "routes" && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                <Route size={48} className="mb-4 opacity-20" />
                <h3 className="text-xl font-semibold mb-2">Manage Routes</h3>
                <p>Route graph management interface coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
