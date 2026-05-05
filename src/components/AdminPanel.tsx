import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Map, Activity, TerminalSquare, LogOut, ShieldAlert, LayoutDashboard, Component, Route } from 'lucide-react';

// Import and alias the components as requested
import ManageRoomsEditor from './admin/RoomManager';
import ManageRoutesDrawer from './admin/RouteManager';

export const AdminPanel = () => {
  const [activeView, setActiveView] = useState<"dashboard" | "rooms" | "routes">("dashboard");

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
                Garuda Crew Admin - Map Management
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
          <button 
            onClick={() => setActiveView("dashboard")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
              activeView === "dashboard" ? "bg-slate-800 text-white shadow-md border border-slate-700" : "bg-transparent text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveView("rooms")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
              activeView === "rooms" ? "bg-cyan-600/20 text-cyan-400 shadow-[0_0_15px_rgba(8,145,178,0.2)] border border-cyan-500/30" : "bg-transparent text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30"
            }`}
          >
            <Component size={18} /> Edit Rooms
          </button>
          <button 
            onClick={() => setActiveView("routes")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
              activeView === "routes" ? "bg-emerald-600/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-emerald-500/30" : "bg-transparent text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30"
            }`}
          >
            <Route size={18} /> Edit Routes
          </button>
        </div>

        {activeView === "dashboard" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">System Dashboard</h2>
              <p className="text-slate-400">Monitor and manage the Garuda Crew navigation infrastructure.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Manage Map Nodes */}
              <div className="group relative bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden shadow-lg shadow-black/50 hover:shadow-cyan-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center mb-5 group-hover:border-cyan-500/30 transition-colors shadow-inner">
                    <Map className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 tracking-wide">Manage Map Nodes</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Update node coordinates, modify existing paths, and adjust routing weights for the campus map algorithm.
                  </p>
                  <button 
                    onClick={() => setActiveView("rooms")}
                    className="text-cyan-400 text-sm font-semibold hover:text-cyan-300 flex items-center gap-1 uppercase tracking-wider transition-colors"
                  >
                    Launch Editor &rarr;
                  </button>
                </div>
              </div>

              {/* Card 2: Live User Traffic */}
              <div className="group relative bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden shadow-lg shadow-black/50 hover:shadow-emerald-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center mb-5 group-hover:border-emerald-500/30 transition-colors shadow-inner">
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 tracking-wide">Live User Traffic</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Monitor real-time navigation requests, active sessions, and identify popular routes or bottlenecks.
                  </p>
                  <button className="text-emerald-400 text-sm font-semibold hover:text-emerald-300 flex items-center gap-1 uppercase tracking-wider transition-colors">
                    View Analytics &rarr;
                  </button>
                </div>
              </div>

              {/* Card 3: System Error Logs */}
              <div className="group relative bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-red-500/50 transition-all duration-300 overflow-hidden shadow-lg shadow-black/50 hover:shadow-red-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center mb-5 group-hover:border-red-500/30 transition-colors shadow-inner">
                    <TerminalSquare className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 tracking-wide">System Error Logs</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Review pathfinding failures, missing node reports, unhandled exceptions, and application diagnostics.
                  </p>
                  <button className="text-red-400 text-sm font-semibold hover:text-red-300 flex items-center gap-1 uppercase tracking-wider transition-colors">
                    Open Logs &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Embedded Components */}
        {activeView === "rooms" && (
          <div className="bg-slate-900/50 rounded-2xl border border-cyan-900/50 overflow-hidden shadow-2xl shadow-black p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
            <ManageRoomsEditor />
          </div>
        )}

        {activeView === "routes" && (
          <div className="bg-slate-900/50 rounded-2xl border border-emerald-900/50 overflow-hidden shadow-2xl shadow-black p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
            <ManageRoutesDrawer />
          </div>
        )}

      </main>
    </div>
  );
};
