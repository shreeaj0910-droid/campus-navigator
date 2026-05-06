import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, BookOpen, Clock, DoorOpen, PlusCircle, Loader2, LogOut } from 'lucide-react';

interface TimetableEntry {
  id: string;
  subject_name: string;
  time: string;
  room_number: string;
  created_at?: string;
}

interface StudentDashboardProps {
  onNavigate?: () => void; // optional callback to go to the campus map
}

export default function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [time, setTime] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch timetable on mount
  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('student_timetable')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTimetableData(data ?? []);
    } catch (err: any) {
      // Table may not exist yet — show empty state gracefully
      console.warn('student_timetable table not found or empty:', err.message);
      setTimetableData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !time || !roomNumber.trim()) return;

    setIsAdding(true);
    setError(null);
    try {
      const { data, error } = await (supabase as any)
        .from('student_timetable')
        .insert([{ subject_name: subjectName.trim(), time, room_number: roomNumber.trim() }])
        .select()
        .single();

      if (error) throw error;
      setTimetableData((prev) => [...prev, data]);
      setSubjectName('');
      setTime('');
      setRoomNumber('');
    } catch (err: any) {
      setError(err.message ?? 'Failed to add class. Make sure the table exists in Supabase.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('student_timetable')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTimetableData((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete entry.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const inputClass =
    'w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500';

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Student <span className="text-cyan-400">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your class timetable</p>
        </div>
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_12px_rgba(147,51,234,0.4)]"
            >
              Open Campus Map →
            </button>
          )}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left Column: Add Class Form ── */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <PlusCircle size={20} className="text-cyan-400" />
            Add a Class
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1 flex items-center gap-1.5">
                <BookOpen size={14} className="text-cyan-400" /> Subject Name
              </label>
              <input
                type="text"
                placeholder="e.g. Data Structures"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1 flex items-center gap-1.5">
                <Clock size={14} className="text-cyan-400" /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={inputClass + ' [color-scheme:dark]'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1 flex items-center gap-1.5">
                <DoorOpen size={14} className="text-cyan-400" /> Room Number
              </label>
              <input
                type="text"
                placeholder="e.g. Lab 4B"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className={`w-full py-3 rounded-xl text-black font-bold text-sm transition-all duration-300 mt-2 ${
                isAdding
                  ? 'bg-cyan-700 cursor-wait opacity-70'
                  : 'bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.4)] hover:shadow-[0_0_24px_rgba(34,211,238,0.6)]'
              }`}
            >
              {isAdding ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Adding...
                </span>
              ) : (
                '+ Add to Timetable'
              )}
            </button>
          </form>
        </div>

        {/* ── Right Column: Timetable View ── */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <Clock size={20} className="text-purple-400" />
            Current Timetable
            <span className="ml-auto text-xs font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
              {timetableData.length} class{timetableData.length !== 1 ? 'es' : ''}
            </span>
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-cyan-400" />
            </div>
          ) : timetableData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <BookOpen size={40} className="mb-3 opacity-40" />
              <p className="text-sm">No classes added yet.</p>
              <p className="text-xs mt-1 opacity-60">Add your first class using the form.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {timetableData.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-4 bg-slate-800/60 border border-slate-700/40 rounded-xl hover:border-slate-600 transition-colors group"
                >
                  {/* Time badge */}
                  <div className="flex-shrink-0 bg-cyan-400/10 border border-cyan-400/20 rounded-lg px-3 py-2 text-center min-w-[60px]">
                    <span className="text-cyan-400 font-bold text-sm block">{entry.time}</span>
                  </div>

                  {/* Subject + Room */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{entry.subject_name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">📍 {entry.room_number}</p>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="flex-shrink-0 p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove class"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
