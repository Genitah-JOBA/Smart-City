import { useState, useEffect } from "react";
import { User, Mail, Shield, Save } from "lucide-react";

export default function Profil() {
  const [userInfo, setUserInfo] = useState({ email: "", role: "" });
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo({
          email: payload.sub,
          role: payload.role || "Citoyen"
        });
      } catch (error) {
        console.error(error);
      }
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-2xl pt-8">
        <h1 className="text-3xl font-bold text-white mb-6">👤 Mon profil</h1>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{userInfo.email?.split('@')[0] || "Utilisateur"}</h2>
              <p className="text-emerald-400">{userInfo.role}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Mail className="text-emerald-400" size={20} />
              <div>
                <p className="text-white/50 text-xs">Email</p>
                <p className="text-white">{userInfo.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Shield className="text-emerald-400" size={20} />
              <div>
                <p className="text-white/50 text-xs">Rôle</p>
                <p className="text-white">{userInfo.role}</p>
              </div>
            </div>
          </div>

          <button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
            <Save size={18}/> Modifier le profil
          </button>
        </div>
      </div>
    </div>
  );
}