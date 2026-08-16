import { API_URL } from "./config/api";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, MapPin } from "lucide-react";
import { useI18n } from "./context/AppContext";

export default function ResetPassword() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // La page reste en mode sombre
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    return () => {
      root.classList.remove("dark", "light");
      root.classList.add(localStorage.getItem("theme") || "dark");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError(t("reset.invalidLink"));
      return;
    }
    if (password.length < 6) {
      setError(t("val.passwordMin6"));
      return;
    }
    if (password !== confirm) {
      setError(t("reset.mismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        setTimeout(() => navigate("/auth", { replace: true }), 2500);
      } else {
        setError(data.error || t("reset.error"));
      }
    } catch {
      setError(t("reset.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">SmartCity</span>
        </div>

        {done ? (
          <div className="text-center space-y-3">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">{t("reset.successTitle")}</h2>
            <p className="text-white/60 text-sm">{t("reset.successMsg")}</p>
            <Link to="/auth" className="inline-block mt-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium">
              {t("reset.backToLogin")}
            </Link>
          </div>
        ) : !token ? (
          <div className="text-center space-y-3">
            <AlertTriangle className="w-14 h-14 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">{t("reset.invalidLink")}</h2>
            <Link to="/auth" className="inline-block mt-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium">
              {t("reset.backToLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-white">{t("reset.title")}</h2>
              <p className="text-white/50 text-sm">{t("reset.subtitle")}</p>
            </div>

            <div className="space-y-1">
              <label className="text-white/70 text-xs font-medium flex items-center gap-2">
                <Lock size={14} className="text-emerald-400" /> {t("reset.newPassword")}
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border-2 border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none text-sm"
                  required
                  disabled={loading}
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-white/70 text-xs font-medium flex items-center gap-2">
                <Lock size={14} className="text-emerald-400" /> {t("reset.confirmPassword")}
              </label>
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border-2 border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none text-sm"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertTriangle size={12} /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3 rounded-xl transition disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("reset.submit")}
            </button>

            <div className="text-center">
              <Link to="/auth" className="text-white/40 hover:text-white/70 text-xs">{t("reset.backToLogin")}</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
