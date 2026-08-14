import { useEffect, useState } from "react";
import { MapPin, CheckCircle, Clock } from "lucide-react";
import { useI18n } from "./context/AppContext";
import MessageBox from "./components/MessageBox";

export default function SignalementsResolus() {
  const { t } = useI18n();
  const [signalements, setSignalements] = useState([]);
  const [msg, setMsg] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchSignalements = async () => {
      try {
        const res = await fetch("http://localhost:8081/api/signalements", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSignalements(data);
        }
      } catch (error) {
        console.error(error);
        setMsg({ type: "error", text: t("agent.cantReachServer") });
      }
    };
    if (token) fetchSignalements();
  }, [token]);

  const handleResoudre = async (id) => {
    try {
      const res = await fetch(`http://localhost:8081/api/signalements/${id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ statut: "RESOLU" })
      });
      if (res.ok) {
        setSignalements(prev => prev.map(s =>
          s.id === id ? { ...s, statut: "RESOLU" } : s
        ));
        setMsg({ type: "success", text: t("agent.reportResolved") });
      } else {
        setMsg({ type: "error", text: t("common.genericError") });
      }
    } catch (error) {
      console.error(error);
      setMsg({ type: "error", text: t("agent.cantReachServer") });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <MessageBox message={msg} onClose={() => setMsg(null)} />
      <div className="container mx-auto max-w-6xl pt-8">
        <h1 className="text-3xl font-bold text-white mb-6">📋 Gestion des signalements</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {signalements.map((s) => (
            <div key={s.id} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/30 overflow-hidden">
              {s.images && s.images[0] && (
                <img src={s.images[0].url} className="w-full h-48 object-cover" alt={s.titre} />
              )}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold bg-emerald-600/30 text-emerald-300 px-3 py-1 rounded-full">
                    {s.type}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    s.statut === 'RESOLU' 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {s.statut === 'RESOLU' ? '✅ Résolu' : '⏳ En attente'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{s.titre}</h3>
                <p className="text-white/70 text-sm mt-2">{s.description}</p>
                <div className="flex items-center gap-2 text-white/50 text-xs mt-3">
                  <MapPin size={12} />
                  <span>{s.address || s.ville || "Position non définie"}</span>
                </div>
                {s.statut !== 'RESOLU' && (
                  <button
                    onClick={() => handleResoudre(s.id)}
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Marquer comme résolu
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}