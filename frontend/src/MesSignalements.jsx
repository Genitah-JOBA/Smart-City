import { useEffect, useState } from "react";
import { MapPin, Trash2, Edit2 } from "lucide-react";

export default function MesSignalements() {
  const [signalements, setSignalements] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUserSignalements = async () => {
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
      }
    };
    if (token) fetchUserSignalements();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-4xl pt-8">
        <h1 className="text-3xl font-bold text-white mb-6">📋 Mes signalements</h1>
        {signalements.length === 0 ? (
          <div className="bg-white/10 rounded-2xl p-12 text-center">
            <p className="text-white/70">Vous n'avez aucun signalement</p>
          </div>
        ) : (
          <div className="space-y-4">
            {signalements.map(s => (
              <div key={s.id} className="bg-white/10 rounded-xl p-4">
                <h3 className="text-white font-bold">{s.titre}</h3>
                <p className="text-white/60 text-sm">{s.description}</p>
                <div className="flex items-center gap-2 text-white/40 text-xs mt-2">
                  <MapPin size={12} />
                  <span>{s.address || s.ville || "Position non définie"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}