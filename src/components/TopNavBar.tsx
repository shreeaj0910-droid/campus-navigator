import { useState, useEffect } from "react";
import { LogOut, ShieldAlert, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import UniversalLoginModal from "./UniversalLoginModal";

const ADMIN_EMAIL = "shreearjun21@gmail.com";

interface TopNavBarProps {
  onNavigateAdmin: () => void;
  onNavigateTimetable: () => void;
}

export default function TopNavBar({ onNavigateAdmin, onNavigateTimetable }: TopNavBarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Listen to live Supabase auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleLoginSuccess = (role: "admin" | "student") => {
    if (role === "admin") {
      onNavigateAdmin();
    } else {
      onNavigateTimetable();
    }
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-[60] px-6 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
            <span className="text-cyan-400 text-xs font-black">G</span>
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-cyan-400">Garuda</span>
            <span className="text-white"> Nav</span>
          </span>
        </div>

        {/* Right-side Auth Controls */}
        <div className="flex items-center gap-3">
          {!user ? (
            // ── Not logged in ──
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-full transition-all shadow-[0_0_12px_rgba(147,51,234,0.4)] hover:shadow-[0_0_20px_rgba(147,51,234,0.6)]"
            >
              Login
            </button>
          ) : isAdmin ? (
            // ── Admin ──
            <>
              <button
                onClick={onNavigateAdmin}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-400 hover:text-red-300 text-sm font-semibold rounded-full transition-all"
              >
                <ShieldAlert size={14} />
                Admin Panel
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-sm font-semibold rounded-full transition-all"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            // ── Student ──
            <>
              <button
                onClick={onNavigateTimetable}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-400 hover:text-cyan-300 text-sm font-semibold rounded-full transition-all"
              >
                <BookOpen size={14} />
                My Timetable
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-sm font-semibold rounded-full transition-all"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Login Modal */}
      {showModal && (
        <UniversalLoginModal
          onClose={() => setShowModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}
