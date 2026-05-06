import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "shreearjun21@gmail.com";

interface UniversalLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (role: "admin" | "student") => void;
}

export default function UniversalLoginModal({ onClose, onLoginSuccess }: UniversalLoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw authError;

      const role = data.user?.email === ADMIN_EMAIL ? "admin" : "student";
      onLoginSuccess(role);
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-500";

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-7 text-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign In</h2>
          <p className="text-slate-400 text-sm mt-1">Access your campus navigator account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-2.5 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300 ml-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@university.edu"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300 ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 mt-2 rounded-xl text-black font-bold text-sm transition-all duration-300 ${
              isLoading
                ? "bg-cyan-700 cursor-wait opacity-70"
                : "bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.4)] hover:shadow-[0_0_24px_rgba(34,211,238,0.6)]"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Authenticating...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
