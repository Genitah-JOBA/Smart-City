import { useEffect, useState } from "react";
import { MapPin, CheckCircle } from "lucide-react";

export default function AgentSignalementsAssignes() {
  const [signalements, setSignalements] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchSignalements = async () => {
      try {
        const res = await fetch("http://localhost:8081/api/signalements", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) setSignalements(await res.json());
      } catch (error) {
        console.error(error);
      }
    };
    fetchSignalements();
  }, [token]);

  const handleResoudre = async (id) => {
    try {
      const res = await fetch(`http://localhost:8081/api/signalements/${id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "RESOLU" })
      });
      if (res.ok) {
        setSignalements(prev => prev.map(s => s.id === id ? { ...s, statut: "RESOLU" } : s));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl pt-8">
        <h1 className="text-3xl font-bold text-white mb-6">📋 Signalements assignés</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {signalements.map((s) => (
            <div key={s.id} className="bg-white/10 rounded-xl p-4">
              {s.images && s.images[0] && (
                <img src={s.images[0].url} className="w-full h-40 object-cover rounded-lg mb-3" alt="" />
              )}
              <h3 className="text-white font-bold">{s.titre}</h3>
              <p className="text-white/60 text-sm">{s.description}</p>
              <div className="flex items-center gap-2 text-white/40 text-xs mt-2">
                <MapPin size={12} />
                <span>{s.address || s.ville}</span>
              </div>
              {s.statut !== "RESOLU" && (
                <button onClick={() => handleResoudre(s.id)} className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg transition flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Marquer résolu
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}