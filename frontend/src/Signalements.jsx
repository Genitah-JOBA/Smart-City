import { useEffect, useState } from "react";
import { MapPin, Trash2, Edit2, Shield } from "lucide-react";

export default function Signalements() {
  const [signalements, setSignalements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    type: "VOIRIE",
    latitude: "",
    longitude: "",
    address: "",
    ville: "",
    commune: "",
    imageUrl: ""
  });
  const [images, setImages] = useState([]);

  const token = localStorage.getItem("token");

  const fetchSignalements = async () => {
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8081/api/signalements", {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSignalements(data);
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
    }
  };

  useEffect(() => { 
    if (token) {
      fetchSignalements(); 
    }
  }, []);

  const confirmDelete = (id) => {
    setDeleteConfirmId(id);
    setMessage("Êtes-vous sûr de vouloir supprimer ce signalement ?");
    setIsSuccess(false);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    if (!token) {
      setMessage("Token manquant, veuillez vous reconnecter");
      setIsSuccess(false);
      setShowModal(true);
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:8081/api/signalements/${deleteConfirmId}`, { 
        method: "DELETE", 
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (res.ok) {
        fetchSignalements();
        if (editingId === deleteConfirmId) {
          setEditingId(null);
          setFormData({
            titre: "",
            description: "",
            type: "VOIRIE",
            latitude: "",
            longitude: "",
            address: "",
            ville: "",
            commune: "",
            imageUrl: ""
          });
          setImages([]);
        }
        setMessage("Signalement supprimé avec succès !");
        setIsSuccess(true);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
      } else {
        setMessage("Erreur lors de la suppression");
        setIsSuccess(false);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
      }
    } catch (error) {
      setMessage("Erreur réseau, veuillez réessayer");
      setIsSuccess(false);
      setShowModal(true);
      setTimeout(() => setShowModal(false), 2000);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleEdit = (signalement) => {
    setEditingId(signalement.id);
    setFormData({
      titre: signalement.titre || "",
      description: signalement.description || "",
      type: signalement.type || "VOIRIE",
      latitude: signalement.latitude?.toString() || "",
      longitude: signalement.longitude?.toString() || "",
      address: signalement.address || "",
      ville: signalement.ville || "",
      commune: signalement.commune || "",
      imageUrl: ""
    });
    setImages(signalement.images || []);
    window.scrollTo(0, 0);
    // Alerter l'utilisateur que la modification est en cours de développement
    setMessage("Fonctionnalité de modification en cours de développement");
    setIsSuccess(false);
    setShowModal(true);
    setTimeout(() => setShowModal(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Message Box */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-[90%] sm:max-w-sm w-full shadow-2xl transform animate-in zoom-in-95 duration-300 mx-4">
            <div className="text-center">
              <div className={`mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 ${
                isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
              }`}>
                {isSuccess ? (
                  <Shield className="w-7 h-7 sm:w-8 sm:h-8" />
                ) : deleteConfirmId ? (
                  <div className="text-2xl font-bold">?</div>
                ) : (
                  <div className="text-2xl font-bold">!</div>
                )}
              </div>
              
              <h3 className={`text-lg sm:text-xl font-bold mb-2 ${
                isSuccess ? 'text-slate-900' : deleteConfirmId ? 'text-amber-600' : 'text-red-600'
              }`}>
                {isSuccess ? "Succès !" : deleteConfirmId ? "Confirmation" : "Information"}
              </h3>
              
              <p className="text-slate-600 text-xs sm:text-sm mb-6 break-words">
                {message}
              </p>

              {deleteConfirmId ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setDeleteConfirmId(null);
                      setShowModal(false);
                    }}
                    className="flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all text-sm sm:text-base"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg text-sm sm:text-base"
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowModal(false)}
                  className={`w-full py-2.5 sm:py-3 rounded-xl font-bold text-white transition-all shadow-lg text-sm sm:text-base ${
                    isSuccess 
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                      : 'bg-slate-800 hover:bg-slate-900 shadow-slate-950/20'
                  }`}
                >
                  Fermer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Pattern overlay */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl">
        
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            📋 Signalements citoyens
          </h1>
          <p className="text-white/60 text-sm">
            Consultez tous les problèmes signalés par la communauté
          </p>
        </div>

        {/* Liste des signalements */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Tous les signalements</h3>
            <span className="bg-emerald-600/30 text-emerald-300 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
              {signalements.length} signalement(s)
            </span>
          </div>
          
          {signalements.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/30 p-12 text-center">
              <p className="text-white/70 text-lg">Aucun signalement pour le moment</p>
              <p className="text-white/50 text-sm mt-2">Soyez le premier à signaler un problème !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {signalements.map((s) => (
                <div key={s.id} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/30 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                  {s.images && s.images[0] && (
                    <div className="relative h-48 overflow-hidden">
                      <img src={s.images[0].url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" alt={s.titre} />
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold bg-emerald-600/30 text-emerald-300 px-3 py-1 rounded-full backdrop-blur-sm">
                        {s.type}
                      </span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm ${
                        s.statut === 'EN_ATTENTE' 
                          ? 'bg-amber-600/30 text-amber-300' 
                          : 'bg-green-600/30 text-green-300'
                      }`}>
                        {s.statut === 'EN_ATTENTE' ? '⏳ En attente' : '✅ Traité'}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white line-clamp-1">{s.titre}</h4>
                    <p className="text-white/70 text-sm line-clamp-2">{s.description}</p>
                    <div className="flex items-start gap-2 text-white/60 text-xs">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">
                        { s.address || s.ville || (s.latitude && s.longitude ? `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}` : "Position non définie")}
                      </span>
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t border-white/20">
                      <button 
                        onClick={() => handleEdit(s)} 
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-white/10 p-2 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={18}/>
                      </button>
                      <button 
                        onClick={() => confirmDelete(s.id)} 
                        className="text-red-400 hover:text-red-300 hover:bg-white/10 p-2 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}