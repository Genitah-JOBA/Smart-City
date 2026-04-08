import { useEffect, useState } from "react";
import { Activity, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function AgentDashboard() {
  const [stats, setStats] = useState({ total: 0, enCours: 0, resolus: 0 });
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:8081/api/signalements", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats({
            total: data.length,
            enCours: data.filter(s => s.statut === "EN_ATTENTE").length,
            resolus: data.filter(s => s.statut === "RESOLU").length
          });
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl pt-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Agent</h1>
        <p className="text-white/60 mb-6">Bienvenue dans votre espace de travail</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-white/60 text-sm">Total signalements</div>
          </div>
          <div className="bg-white/10 rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white">{stats.enCours}</div>
            <div className="text-white/60 text-sm">En cours</div>
          </div>
          <div className="bg-white/10 rounded-xl p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-white">{stats.resolus}</div>
            <div className="text-white/60 text-sm">Résolus</div>
          </div>
        </div>
      </div>
    </div>
  );
}