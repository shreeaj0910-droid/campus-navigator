import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Map, Activity, TerminalSquare, LogOut, ShieldAlert,
  LayoutDashboard, Component, Route, Layers
} from 'lucide-react';

import ManageRoomsEditor from './admin/RoomManager';
import ManageRoutesDrawer from './admin/RouteManager';
import FloorPlanManager from './admin/FloorPlanManager';
import ProfessorManager from './admin/ProfessorManager';

type AdminView = "dashboard" | "rooms" | "routes" | "floors" | "professors";

export const AdminPanel = () => {
  const [activeView, setActiveView] = useState<AdminView>("dashboard");

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems: { view: AdminView; label: string; icon: React.ReactNode; color: string }[] = [
    { view: "dashboard",  label: "Dashboard",    icon: <LayoutDashboard size={18} />, color: "slate" },
    { view: "rooms",      label: "Edit Rooms",   icon: <Component size={18} />,       color: "cyan" },
    { view: "routes",     label: "Edit Routes",  icon: <Route size={18} />,            color: "emerald" },
    { view: "floors",     label: "Floor Plans",  icon: <Layers size={18} />,           color: "purple" },
    { view: "professors", label: "Live Traffic", icon: <Activity size={18} />,         color: "yellow" },
  ];

  const getNavClass = (item: typeof navItems[number]) => {
    const active = activeView === item.view;
    const colorMap: Record<string, string> = {
      slate:   active ? "bg-slate-800 text-white border border-slate-700 shadow-md" : "",
      cyan:    active ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(8,145,178,0.2)]" : "hover:text-cyan-400 hover:bg-cyan-950/30",
      emerald: active ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "hover:text-emerald-400 hover:bg-emerald-950/30",
      purple:  active ? "bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.2)]" : "hover:text-purple-400 hover:bg-purple-950/30",
      yellow:  active ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]" : "hover:text-yellow-400 hover:bg-yellow-950/30",
    };
    return `flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
      !active ? "bg-transparent text-slate-400" : ""
    } ${colorMap[item.color]}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-cyan-500/30">
      {/* Top Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <ShieldAlert className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              <h1 className="text-xl font-bold text-white tracking-tight">
                Garuda Crew Admin
              </h1>
              <span className="px-2.5 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                Admin
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 hover:text-white hover:border-slate-700 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Toggle Controls */}
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-800/50 overflow-x-auto whitespace-nowrap">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={getNavClass(item)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {/* ── Dashboard View ── */}
        {activeView === "dashboard" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">System Dashboard</h2>
              <p className="text-slate-400">Monitor and manage the Garuda Crew navigation infrastructure.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Manage Rooms */}
              <DashCard
                icon={<Component className="w-6 h-6 text-cyan-400" />}
                iconBorder="group-hover:border-cyan-500/30"
                gradient="from-cyan-500/5"
                title="Manage Map Nodes"
                description="Update node coordinates, modify existing paths, and adjust routing weights for the campus map algorithm."
                action="Launch Editor"
                actionColor="text-cyan-400 hover:text-cyan-300"
                hoverBorder="hover:border-cyan-500/50 hover:shadow-cyan-500/10"
                onClick={() => setActiveView("rooms")}
              />

              {/* Card 2: Edit Routes */}
              <DashCard
                icon={<Route className="w-6 h-6 text-emerald-400" />}
                iconBorder="group-hover:border-emerald-500/30"
                gradient="from-emerald-500/5"
                title="Edit Routes"
                description="Draw, edit, and delete navigation paths between nodes. Adjust edge weights for optimal A* pathfinding."
                action="Open Route Editor"
                actionColor="text-emerald-400 hover:text-emerald-300"
                hoverBorder="hover:border-emerald-500/50 hover:shadow-emerald-500/10"
                onClick={() => setActiveView("routes")}
              />

              {/* Card 3: Floor Plans */}
              <DashCard
                icon={<Layers className="w-6 h-6 text-purple-400" />}
                iconBorder="group-hover:border-purple-500/30"
                gradient="from-purple-500/5"
                title="Upload Floor Plans"
                description="Upload and manage campus floor plan images. Set the active floor plan displayed on the student-facing map."
                action="Manage Floors"
                actionColor="text-purple-400 hover:text-purple-300"
                hoverBorder="hover:border-purple-500/50 hover:shadow-purple-500/10"
                onClick={() => setActiveView("floors")}
              />

              {/* Card 4: Live Traffic */}
              <DashCard
                icon={<Activity className="w-6 h-6 text-yellow-400" />}
                iconBorder="group-hover:border-yellow-500/30"
                gradient="from-yellow-500/5"
                title="Live User Traffic"
                description="Monitor professor locations and availability in real-time. Update current location and status indicators."
                action="View Live Traffic"
                actionColor="text-yellow-400 hover:text-yellow-300"
                hoverBorder="hover:border-yellow-500/50 hover:shadow-yellow-500/10"
                onClick={() => setActiveView("professors")}
              />

              {/* Card 5: System Logs (informational) */}
              <DashCard
                icon={<TerminalSquare className="w-6 h-6 text-red-400" />}
                iconBorder="group-hover:border-red-500/30"
                gradient="from-red-500/5"
                title="System Error Logs"
                description="Review pathfinding failures, missing node reports, unhandled exceptions, and application diagnostics."
                action="Open Logs"
                actionColor="text-red-400 hover:text-red-300"
                hoverBorder="hover:border-red-500/50 hover:shadow-red-500/10"
                onClick={() => setActiveView("professors")} // Reuse professors page for now
              />
            </div>
          </div>
        )}

        {/* ── Rooms Editor ── */}
        {activeView === "rooms" && (
          <div className="bg-slate-900/50 rounded-2xl border border-cyan-900/50 overflow-hidden shadow-2xl shadow-black p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
            <ManageRoomsEditor />
          </div>
        )}

        {/* ── Routes Editor ── */}
        {activeView === "routes" && (
          <div className="bg-slate-900/50 rounded-2xl border border-emerald-900/50 overflow-hidden shadow-2xl shadow-black p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
            <ManageRoutesDrawer />
          </div>
        )}

        {/* ── Floor Plans Manager ── */}
        {activeView === "floors" && (
          <div className="bg-slate-900/50 rounded-2xl border border-purple-900/50 overflow-hidden shadow-2xl shadow-black p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Floor Plan Manager</h2>
              <p className="text-slate-400 text-sm">Upload floor plan images and set which one is shown on the student map.</p>
            </div>
            <FloorPlanManager />
          </div>
        )}

        {/* ── Live Traffic (Professor Manager) ── */}
        {activeView === "professors" && (
          <div className="bg-slate-900/50 rounded-2xl border border-yellow-900/50 overflow-hidden shadow-2xl shadow-black p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
            <ProfessorManager />
          </div>
        )}

      </main>
    </div>
  );
};

// ── Reusable Dashboard Card ──
interface DashCardProps {
  icon: React.ReactNode;
  iconBorder: string;
  gradient: string;
  title: string;
  description: string;
  action: string;
  actionColor: string;
  hoverBorder: string;
  onClick: () => void;
}

function DashCard({ icon, iconBorder, gradient, title, description, action, actionColor, hoverBorder, onClick }: DashCardProps) {
  return (
    <div className={`group relative bg-slate-900/50 border border-slate-800 rounded-xl p-6 transition-all duration-300 overflow-hidden shadow-lg shadow-black/50 cursor-pointer ${hoverBorder}`} onClick={onClick}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative z-10">
        <div className={`w-12 h-12 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center mb-5 transition-colors shadow-inner ${iconBorder}`}>
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-2 tracking-wide">{title}</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">{description}</p>
        <button className={`text-sm font-semibold flex items-center gap-1 uppercase tracking-wider transition-colors ${actionColor}`}>
          {action} →
        </button>
      </div>
    </div>
  );
}
