import { useEffect, useState } from "react";
import { 
  MapPin, CheckCircle, Clock, PlayCircle, AlertTriangle,
  Image as ImageIcon, ChevronLeft, ChevronRight, X, Eye
} from "lucide-react";

export default function AgentSignalementsAssignes() {
  const [signalements, setSignalements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("TOUS"); // TOUS, EN_ATTENTE, EN_COURS, RESOLU
  const [selectedImages, setSelectedImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
      } finally {
        setIsLoading(false);
      }
    };
    fetchSignalements();
  }, [token]);

  // Filtrer les signalements selon le statut
  const filteredSignalements = signalements.filter(s => {
    if (filter === "TOUS") return true;
    if (filter === "EN_ATTENTE") return s.statut === "EN_ATTENTE";
    if (filter === "EN_COURS") return s.statut === "EN_COURS";
    if (filter === "RESOLU") return s.statut === "RESOLU";
    return true;
  });

  // Statistiques
  const stats = {
    total: signalements.length,
    enAttente: signalements.filter(s => s.statut === "EN_ATTENTE").length,
    enCours: signalements.filter(s => s.statut === "EN_COURS").length,
    resolus: signalements.filter(s => s.statut === "RESOLU").length
  };

  // Changer le statut à EN_COURS
  const handlePrendreEnCharge = async (id) => {
    try {
      const res = await fetch(`http://localhost:8081/api/signalements/${id}/statut`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ statut: "EN_COURS" })
      });
      if (res.ok) {
        setSignalements(prev => prev.map(s => 
          s.id === id ? { ...s, statut: "EN_COURS" } : s
        ));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Changer le statut à RESOLU
  const handleResoudre = async (id) => {
    try {
      const res = await fetch(`http://localhost:8081/api/signalements/${id}/statut`, {
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
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Gestion de la galerie d'images
  const openImageViewer = (images, startIndex = 0) => {
    setSelectedImages(images);
    setCurrentImageIndex(startIndex);
  };

  const closeImageViewer = () => {
    setSelectedImages(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedImages && currentImageIndex < selectedImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImages) return;
      if (e.key === 'Escape') closeImageViewer();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImages, currentImageIndex]);

  // Obtenir la couleur du statut
  const getStatusColor = (statut) => {
    const colors = {
      'EN_ATTENTE': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      'EN_COURS': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'RESOLU': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    };
    return colors[statut] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  // Obtenir le libellé du statut
  const getStatusLabel = (statut) => {
    const labels = {
      'EN_ATTENTE': 'En attente',
      'EN_COURS': 'En cours',
      'RESOLU': 'Résolu'
    };
    return labels[statut] || statut;
  };

  // Obtenir l'icône du statut
  const getStatusIcon = (statut) => {
    const icons = {
      'EN_ATTENTE': AlertTriangle,
      'EN_COURS': Clock,
      'RESOLU': CheckCircle
    };
    return icons[statut] || AlertTriangle;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des signalements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl pt-8">
        {/* En-tête */}
        <div className=" items-center justify-between text-center mb-6">
          <h1 className="text-3xl font-bold text-white">-- SIGNALEMENTS ASSIGNES --</h1>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-white/50 text-xs">Total</div>
          </div>
          <div className="bg-amber-500/20 rounded-xl p-4 text-center border border-amber-500/30">
            <div className="text-2xl font-bold text-amber-300">{stats.enAttente}</div>
            <div className="text-amber-300/70 text-xs">En attente</div>
          </div>
          <div className="bg-blue-500/20 rounded-xl p-4 text-center border border-blue-500/30">
            <div className="text-2xl font-bold text-blue-300">{stats.enCours}</div>
            <div className="text-blue-300/70 text-xs">En cours</div>
          </div>
          <div className="bg-emerald-500/20 rounded-xl p-4 text-center border border-emerald-500/30">
            <div className="text-2xl font-bold text-emerald-300">{stats.resolus}</div>
            <div className="text-emerald-300/70 text-xs">Résolus</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {["TOUS", "EN_ATTENTE", "EN_COURS", "RESOLU"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {f === "TOUS" ? "Tous" : 
               f === "EN_ATTENTE" ? "En attente" :
               f === "EN_COURS" ? "En cours" : "Résolus"}
            </button>
          ))}
        </div>
        
        {/* Grille des signalements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSignalements.length === 0 ? (
            <div className="col-span-full bg-white/10 rounded-xl p-12 text-center">
              <p className="text-white/60">Aucun signalement dans cette catégorie</p>
            </div>
          ) : (
            filteredSignalements.map((s) => {
              const StatusIcon = getStatusIcon(s.statut);
              
              return (
                <div key={s.id} className="bg-[#242526] backdrop-blur-xl rounded-xl overflow-hidden border border-white/20 hover:shadow-xl transition-shadow">
                  {/* Section photo */}
                  {s.images && s.images.length > 0 ? (
                    <div className="relative">
                      <div 
                        className="relative h-48 cursor-pointer group"
                        onClick={() => openImageViewer(s.images, 0)}
                      >
                        <img 
                          src={s.images[0].url} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          alt={s.titre}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x300/1e293b/64748b?text=Image+non+disponible";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                        </div>
                      </div>
                      
                      {/* Indicateur de nombre d'images */}
                      {s.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <ImageIcon size={12} />
                          +{s.images.length - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-700/50 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-500" />
                    </div>
                  )}

                  {/* Contenu */}
                  <div className="p-4">
                    {/* Statut */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium mb-3 ${getStatusColor(s.statut)}`}>
                      <StatusIcon size={14} />
                      {getStatusLabel(s.statut)}
                    </div>

                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                      {s.titre || "Sans titre"}
                    </h3>
                    
                    <p className="text-white/60 text-sm mb-3 line-clamp-2">
                      {s.description || "Aucune description fournie"}
                    </p>
                    
                    {/* Localisation */}
                    <div className="flex items-center gap-2 text-white/40 text-xs mb-4">
                      <MapPin size={12} />
                      <span>{s.address || s.ville || s.commune || "Localisation non spécifiée"}</span>
                    </div>

                    {/* Actions selon le statut */}
                    <div className="flex gap-2">
                      {s.statut === "EN_ATTENTE" && (
                        <button 
                          onClick={() => handlePrendreEnCharge(s.id)} 
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <PlayCircle size={16} />
                          Prendre en charge
                        </button>
                      )}
                      
                      {(s.statut === "EN_ATTENTE" || s.statut === "EN_COURS") && (
                        <button 
                          onClick={() => handleResoudre(s.id)} 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <CheckCircle size={16} />
                          Marquer résolu
                        </button>
                      )}

                      {s.statut === "RESOLU" && (
                        <div className="flex-1 bg-emerald-500/20 text-emerald-300 py-2.5 rounded-lg text-center text-sm font-medium border border-emerald-500/30">
                          ✓ Signalement résolu
                        </div>
                      )}
                    </div>

                    {/* Miniatures des autres images */}
                    {s.images && s.images.length > 1 && (
                      <div className="flex gap-1 mt-3">
                        {s.images.slice(1, 4).map((img, index) => (
                          <div 
                            key={index}
                            className="w-12 h-12 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openImageViewer(s.images, index + 1)}
                          >
                            <img src={img.url} className="w-full h-full object-cover" alt="" />
                          </div>
                        ))}
                        {s.images.length > 4 && (
                          <div 
                            className="w-12 h-12 rounded-lg bg-gray-700/50 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
                            onClick={() => openImageViewer(s.images, 1)}
                          >
                            <span className="text-white/60 text-xs">+{s.images.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Visionneuse d'images (Lightbox) */}
      {selectedImages && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeImageViewer}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10"
            onClick={closeImageViewer}
          >
            <X size={24} />
          </button>

          <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1.5 rounded-full z-10">
            {currentImageIndex + 1} / {selectedImages.length}
          </div>

          {currentImageIndex > 0 && (
            <button 
              className="absolute left-4 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {currentImageIndex < selectedImages.length - 1 && (
            <button 
              className="absolute right-4 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <ChevronRight size={32} />
            </button>
          )}

          <img 
            src={selectedImages[currentImageIndex]?.url} 
            className="max-w-[90vw] max-h-[90vh] object-contain"
            alt={`Image ${currentImageIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Miniatures */}
          {selectedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-xl backdrop-blur-sm">
              {selectedImages.map((img, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}