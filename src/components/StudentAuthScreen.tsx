import React, { useState } from 'react';

interface StudentAuthScreenProps {
  onLogin: () => void;
}

export default function StudentAuthScreen({ onLogin }: StudentAuthScreenProps) {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    
    // Simulate Supabase network delay for demo
    setTimeout(() => {
      setIsAuthenticating(false);
      onLogin(); // Pass auth state up to parent app
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative z-[100]">
      
      {/* Landing State: Glowing Action Button */}
      {!showLoginForm && (
        <button
          onClick={() => setShowLoginForm(true)}
          className="px-10 py-5 bg-purple-600 hover:bg-purple-500 text-white text-2xl font-bold rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(147,51,234,0.6)] hover:shadow-[0_0_50px_rgba(147,51,234,0.8)] transform hover:scale-105 animate-in fade-in zoom-in"
        >
          Student Login
        </button>
      )}

      {/* Login Modal */}
      {showLoginForm && (
        <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-slate-400">Sign in to access your campus navigator</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 block ml-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 block ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500"
              />
            </div>

            <button 
              type="submit"
              disabled={isAuthenticating}
              className={`w-full py-3.5 mt-4 rounded-xl text-black font-bold text-lg transition-all duration-300 ${
                isAuthenticating 
                  ? "bg-cyan-600 cursor-wait opacity-80" 
                  : "bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.7)]"
              }`}
            >
              {isAuthenticating ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <button 
            type="button"
            onClick={() => setShowLoginForm(false)}
            className="w-full mt-6 text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            ← Back to Start
          </button>
        </div>
      )}

    </div>
  );
}
