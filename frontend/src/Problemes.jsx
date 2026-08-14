import { useEffect, useState } from "react";
import { MapPin, Trash2, Edit2, User, Calendar } from "lucide-react";
import { useI18n } from "./context/AppContext";
import MessageBox from "./components/MessageBox";

export default function Problemes() {
  const { t } = useI18n();
  const [signalements, setSignalements] = useState([]);
  const [stats, setStats] = useState({ total: 0, enAttente: 0, resolus: 0 });
  const [msg, setMsg] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8081/api/signalements", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSignalements(data);
          setStats({
            total: data.length,
            enAttente: data.filter(s => s.statut === 'EN_ATTENTE').length,
            resolus: data.filter(s => s.statut === 'RESOLU').length
          });
        }
      } catch (error) {
        console.error(error);
        setMsg({ type: "error", text: t("agent.cantReachServer") });
      }
    };
    if (token) fetchData();
  }, [token]);

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce signalement ?")) {
      try {
        const res = await fetch(`http://localhost:8081/api/signalements/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          setSignalements(prev => prev.filter(s => s.id !== id));
          setMsg({ type: "success", text: t("sig.deletedOk") });
        } else {
          setMsg({ type: "error", text: t("common.genericError") });
        }
      } catch (error) {
        console.error(error);
        setMsg({ type: "error", text: t("agent.cantReachServer") });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <MessageBox message={msg} onClose={() => setMsg(null)} />
      <div className="container mx-auto max-w-6xl pt-8">
        <h1 className="text-3xl font-bold text-white mb-2">📊 Administration</h1>
        <p className="text-white/60 mb-6">Gestion des signalements citoyens</p>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-emerald-400">{stats.total}</div>
            <div className="text-white/60 text-sm">Total signalements</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">{stats.enAttente}</div>
            <div className="text-white/60 text-sm">En attente</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.resolus}</div>
            <div className="text-white/60 text-sm">Résolus</div>
          </div>
        </div>

        {/* Liste des signalements */}
        <div className="bg-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-white/60 text-sm">ID</th>
                  <th className="px-4 py-3 text-left text-white/60 text-sm">Titre</th>
                  <th className="px-4 py-3 text-left text-white/60 text-sm">Type</th>
                  <th className="px-4 py-3 text-left text-white/60 text-sm">Statut</th>
                  <th className="px-4 py-3 text-left text-white/60 text-sm">Localisation</th>
                  <th className="px-4 py-3 text-left text-white/60 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {signalements.map((s) => (
                  <tr key={s.id} className="border-b border-white/10 hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-white text-sm">{s.id}</td>
                    <td className="px-4 py-3 text-white text-sm">{s.titre}</td>
                    <td className="px-4 py-3 text-white/70 text-sm">{s.type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        s.statut === 'RESOLU' 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {s.statut === 'RESOLU' ? 'Résolu' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-sm">{s.ville || "N/A"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 transition">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}