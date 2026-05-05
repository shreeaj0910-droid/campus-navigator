import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Map, Calendar, LogOut } from 'lucide-react';

export const StudentProfile = () => {
  const [email, setEmail] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Student Portal</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <p className="text-sm font-medium text-slate-400">
                Welcome back, <span className="text-cyan-400">{email || 'Student'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Timetable */}
          <div className="lg:col-span-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 h-full shadow-lg shadow-black/40 relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                      <Calendar className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wide">College Timetable</h2>
                  </div>
                </div>
                
                {/* Placeholder for TimetableSidebar Component */}
                <div className="bg-slate-950/50 rounded-xl p-8 border border-slate-800/80 border-dashed flex flex-col items-center justify-center min-h-[350px] text-center">
                  <Calendar className="w-12 h-12 text-slate-700 mb-4" />
                  <h3 className="text-lg font-medium text-slate-300 mb-2">Schedule Not Synced</h3>
                  <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                    This area is reserved for the <code className="text-indigo-400 bg-indigo-400/10 px-1 py-0.5 rounded">TimetableSidebar</code> component. Your daily schedule, professor details, and class locations will appear here.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Campus Map Action */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-cyan-900/50 p-8 shadow-xl shadow-cyan-900/10 flex-grow flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-cyan-700/50 transition-colors duration-300">
              
              {/* Decorative radial gradient */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10 w-full flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mb-8 shadow-inner relative group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-md"></div>
                  <Map className="w-12 h-12 text-cyan-400 relative z-10" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-4">Campus Navigator</h2>
                <p className="text-slate-400 text-sm mb-10 leading-relaxed px-2">
                  Get optimal routing directions across the campus and find your classes efficiently.
                </p>
                
                <button 
                  onClick={() => navigate('/')}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg py-4 px-6 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:-translate-y-1 border border-cyan-400/50 flex items-center justify-center gap-3"
                >
                  <Map className="w-5 h-5" />
                  Open Campus Map
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
