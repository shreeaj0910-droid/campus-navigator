import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/admin/dashboard");
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-header">
          <Lock size={28} className="admin-login-icon" />
          <h1 className="admin-login-title">{isSignUp ? "Create Account" : "Admin Access"}</h1>
          <p className="admin-login-subtitle">Campus Navigation System</p>
        </div>

        {error && <div className="admin-login-error">{error}</div>}

        <div className="admin-field">
          <label className="admin-label">Email</label>
          <div className="admin-input-wrap">
            <Mail size={14} className="admin-input-icon" />
            <input
              type="email"
              className="admin-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@campus.edu"
              required
            />
          </div>
        </div>

        <div className="admin-field">
          <label className="admin-label">Password</label>
          <div className="admin-input-wrap">
            <Lock size={14} className="admin-input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
            <button
              type="button"
              className="admin-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <button type="submit" className="admin-submit-btn" disabled={loading}>
          {loading ? "Please wait…" : isSignUp ? "Create Account" : "Sign In"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            style={{
              background: "none",
              border: "none",
              color: "hsl(var(--primary))",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
        </div>
      </form>
    </div>
  );
}