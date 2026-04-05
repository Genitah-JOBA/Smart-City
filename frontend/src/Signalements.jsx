import { useEffect, useState } from "react";
import { Camera, MapPin, Send, Trash2, Edit2, X } from "lucide-react";

export default function Signalements() {
  const [signalements, setSignalements] = useState([]);
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    type: "VOIRIE",
    latitude: "",
    longitude: "",
    imageUrl: ""
  });
  const [images, setImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const token = localStorage.getItem("token");

  const fetchSignalements = async () => {
    if (!token) {
      console.error("Aucun token trouvé, veuillez vous connecter");
      return;
    }

    const res = await fetch("http://localhost:8081/api/signalements", {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });

    console.log("Response status:", res.status);
    
    if (res.ok) {
      const data = await res.json();
      setSignalements(data);
    }
  };

  useEffect(() => { 
    if (token) {
      fetchSignalements(); 
    }
  }, []);

  const getGeolocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setFormData({ ...formData, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    });
  };

  const addImage = () => {
    if (formData.imageUrl) {
      setImages([...images, { url: formData.imageUrl }]);
      setFormData({ ...formData, imageUrl: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      console.error("Token manquant, impossible d'envoyer");
      return;
    }

    const method = editingId ? "PUT" : "POST";
    const url = editingId 
      ? `http://localhost:8081/api/signalements/${editingId}`
      : "http://localhost:8081/api/signalements";

    const cleanFormData = {
      titre: formData.titre,
      description: formData.description,
      type: formData.type,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      statut: "EN_ATTENTE"
    };

    const payload = {
      ...cleanFormData,
      images: images.map(img => ({ url: img.url }))
    };

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFormData({ 
          titre: "", 
          description: "", 
          type: "VOIRIE", 
          latitude: "", 
          longitude: "", 
          imageUrl: "" 
        });
        setImages([]);
        setEditingId(null);
        fetchSignalements();
      } else {
        const errorText = await res.text();
        console.error("Erreur lors de l'envoi:", res.status, errorText);
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
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
      imageUrl: ""
    });
    setImages(signalement.images || []);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce signalement ?")) return;
    if (!token) return;
    
    try {
      const res = await fetch(`http://localhost:8081/api/signalements/${id}`, { 
        method: "DELETE", 
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (res.ok) {
        fetchSignalements();
        if (editingId === id) {
          setEditingId(null);
          setFormData({
            titre: "",
            description: "",
            type: "VOIRIE",
            latitude: "",
            longitude: "",
            imageUrl: ""
          });
          setImages([]);
        }
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Pattern overlay */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl">
        
        {/* Formulaire de signalement */}
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/30 overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-500" />
          
          <div className="relative p-6 sm:p-8 md:p-10">
            <div 
              className="absolute inset-0 z-0"
              style={{ 
                backgroundImage: `url('/Image/Smart.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-4 sm:space-y-5">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {editingId ? " Modifier le signalement" : "Nouveau signalement"}
                </h2>
                <p className="text-white/80 text-xs sm:text-sm">
                  Signalez un problème dans votre quartier
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-white/80 text-xs font-medium">Titre du signalement</label>
                  <div className={`transition-all duration-300 ${focusedField === 'titre' ? 'scale-[1.01]' : ''}`}>
                    <input
                      type="text" 
                      placeholder="Ex: Nid-de-poule dangereux" 
                      value={formData.titre || ""} 
                      required
                      onChange={(e) => setFormData({...formData, titre: e.target.value})}
                      onFocus={() => setFocusedField('titre')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/70 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm backdrop-blur-md"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-white/80 text-xs font-medium">Catégorie</label>
                  <select 
                    value={formData.type || "VOIRIE"}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm backdrop-blur-md"
                  >
                    <option value="VOIRIE" className="bg-emerald-400">Voirie / Routes</option>
                    <option value="ECLAIRAGE" className="bg-emerald-400">Éclairage Public</option>
                    <option value="DECHETS" className="bg-emerald-400">Déchets / Propreté</option>
                    <option value="EAU" className="bg-emerald-400">Eau / Assainissement</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-white/80 text-xs font-medium">Description</label>
                <textarea
                  placeholder="Décrivez précisément le problème..." 
                  value={formData.description || ""} 
                  required
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/70 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm backdrop-blur-md h-28 resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-4 items-center bg-emerald-600/20 backdrop-blur-sm p-4 rounded-xl border border-emerald-500/30">
                <button 
                  type="button" 
                  onClick={getGeolocation} 
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-[1.02] text-sm"
                >
                  <MapPin size={16} /> 
                  {formData.latitude ? "📍 Position détectée" : "📍 Ma position"}
                </button>
                <span className="text-white/70 text-xs">
                  Lat: {formData.latitude || '0'} | Long: {formData.longitude || '0'}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-white/80 text-xs font-medium">Images</label>
                <div className="flex gap-3">
                  <input
                    type="text" 
                    placeholder="URL de l'image" 
                    value={formData.imageUrl || ""}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/70 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm backdrop-blur-md"
                  />
                  <button 
                    type="button" 
                    onClick={addImage} 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm"
                  >
                    <Camera size={18}/> Ajouter
                  </button>
                </div>
                
                {images.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative group flex-shrink-0">
                        <img src={img.url} className="w-20 h-20 object-cover rounded-lg border-2 border-white/30 shadow-lg" alt="Preview" />
                        <button 
                          type="button"
                          onClick={() => setImages(images.filter((_, idx) => idx !== i))} 
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg"
                        >
                          <X size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 text-base"
              >
                <Send size={18}/> 
                {editingId ? "Mettre à jour" : "Envoyer le signalement"}
              </button>
              
              {editingId && (
                <button 
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      titre: "",
                      description: "",
                      type: "VOIRIE",
                      latitude: "",
                      longitude: "",
                      imageUrl: ""
                    });
                    setImages([]);
                  }}
                  className="w-full bg-gray-600/50 hover:bg-gray-600 text-white font-bold py-2.5 rounded-xl transition-all backdrop-blur-sm text-sm"
                >
                  Annuler la modification
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Liste des signalements */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">📋 Tous les signalements</h3>
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
                    <p className="text-white/70 text-sm line-clamp-3">{s.description}</p>
                    <div className="flex justify-end gap-3 pt-3 border-t border-white/20">
                      <button 
                        onClick={() => handleEdit(s)} 
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-white/10 p-2 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={18}/>
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)} 
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