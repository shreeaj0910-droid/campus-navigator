import React from 'react';
import { supabase } from '@/integrations/supabase/client';

export const LoginScreen = () => {
  const handleLogin = async () => {
    // This is just a placeholder action. In a real app, you'd use a form.
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Campus Navigator</h1>
        <p className="text-slate-400 mb-8 text-center">Please sign in to access the platform.</p>
        <button 
          onClick={handleLogin}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg shadow-cyan-900/50"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
