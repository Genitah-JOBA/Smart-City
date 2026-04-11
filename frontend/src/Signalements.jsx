import { useEffect, useState } from "react";
import { 
  MapPin, Clock, MessageCircle, Share2, MoreHorizontal, 
  Construction, Lightbulb, Trash2, Droplets, TreePine, 
  Shield, HelpCircle, X, ChevronLeft, ChevronRight, Image,
  BarChart3, TrendingUp, CheckCircle2, Clock4, Activity,
  AlertTriangle, PlayCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Signalements() {
  const [signalements, setSignalements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showStats, setShowStats] = useState(true);
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchSignalements = async () => {
    if (!token) {
      setIsLoading(false);
      navigate("/auth", { replace: true });
      return;
    }

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
      } else if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        navigate("/auth", { replace: true });
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (!token) {
      navigate("/auth", { replace: true });
      return;
    }
    fetchSignalements(); 
  }, []);

  // Calcul des statistiques avec EN_COURS
  const stats = {
    total: signalements.length,
    enAttente: signalements.filter(s => s.statut === 'EN_ATTENTE').length,
    enCours: signalements.filter(s => s.statut === 'EN_COURS').length,
    resolus: signalements.filter(s => s.statut === 'RESOLU' || s.statut === 'TRAITE').length,
    parType: signalements.reduce((acc, s) => {
      const type = s.type || 'AUTRE';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}),
    parVille: signalements.reduce((acc, s) => {
      const ville = s.ville || s.commune || 'Non spécifié';
      acc[ville] = (acc[ville] || 0) + 1;
      return acc;
    }, {}),
    dernierMois: signalements.filter(s => {
      const date = new Date(s.dateCreation || s.createdAt || s.dateSignalement);
      const now = new Date();
      const diffDays = (now - date) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    }).length
  };

  // Taux de résolution
  const tauxResolution = stats.total > 0 
    ? Math.round((stats.resolus / stats.total) * 100) 
    : 0;

  // Taux de prise en charge
  const tauxPriseEnCharge = stats.total > 0 
    ? Math.round(((stats.enCours + stats.resolus) / stats.total) * 100) 
    : 0;

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

  // Navigation avec les flèches du clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImages) return;
      
      if (e.key === 'Escape') {
        closeImageViewer();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImages, currentImageIndex]);

  // Formater la date relative (style Facebook)
  const getRelativeTime = (dateString) => {
    if (!dateString) return "Récemment";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Obtenir l'icône selon le type (Lucide icons)
  const getTypeIcon = (type) => {
    const icons = {
      'VOIRIE': Construction,
      'ECLAIRAGE': Lightbulb,
      'DECHETS': Trash2,
      'EAU': Droplets,
      'ESPACES_VERTS': TreePine,
      'SECURITE': Shield,
      'AUTRE': HelpCircle
    };
    return icons[type] || MapPin;
  };

  // Obtenir la couleur du type
  const getTypeColor = (type) => {
    const colors = {
      'VOIRIE': 'text-orange-400 bg-orange-500/20 border-orange-500/30',
      'ECLAIRAGE': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      'DECHETS': 'text-red-400 bg-red-500/20 border-red-500/30',
      'EAU': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      'ESPACES_VERTS': 'text-green-400 bg-green-500/20 border-green-500/30',
      'SECURITE': 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      'AUTRE': 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    };
    return colors[type] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  // Obtenir le libellé du type
  const getTypeLabel = (type) => {
    const labels = {
      'VOIRIE': 'Voirie',
      'ECLAIRAGE': 'Éclairage',
      'DECHETS': 'Déchets',
      'EAU': 'Eau',
      'ESPACES_VERTS': 'Espaces verts',
      'SECURITE': 'Sécurité',
      'AUTRE': 'Autre'
    };
    return labels[type] || type;
  };

  // Obtenir la couleur du statut
  const getStatusColor = (statut) => {
    const colors = {
      'EN_ATTENTE': 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      'EN_COURS': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      'RESOLU': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      'TRAITE': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
    };
    return colors[statut] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  // Obtenir l'icône du statut
  const getStatusIcon = (statut) => {
    const icons = {
      'EN_ATTENTE': AlertTriangle,
      'EN_COURS': PlayCircle,
      'RESOLU': CheckCircle2,
      'TRAITE': CheckCircle2
    };
    return icons[statut] || AlertTriangle;
  };

  // Obtenir le texte du statut
  const getStatusText = (statut) => {
    const texts = {
      'EN_ATTENTE': 'En attente',
      'EN_COURS': 'En cours',
      'RESOLU': 'Résolu',
      'TRAITE': 'Traité'
    };
    return texts[statut] || statut;
  };

  // Afficher le loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#18191A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des signalements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header style Facebook */}
      <header className="sticky top-0 z-30 bg-[#242526] border-b border-gray-700/50 shadow-lg">
        <div className="container mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-400" />
              Signalements <span className="text-blue-400 text-lg font-normal ml-2">Communauté</span>
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-700 transition-colors"
              >
                <BarChart3 size={14} />
                {showStats ? 'Masquer stats' : 'Voir stats'}
              </button>
              <span className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1.5 rounded-full">
                {signalements.length} publication{signalements.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Fil d'actualité */}
      <main className="container mx-auto max-w-3xl px-4 py-6">
        {/* Section Statistiques / Vue globale */}
        {showStats && signalements.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Titre section */}
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Vue globale</h2>
            </div>

            {/* Cartes statistiques principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#242526] rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Total</span>
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-gray-500 text-xs mt-1">signalements</p>
              </div>

              <div className="bg-[#242526] rounded-xl p-4 border border-amber-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">En attente</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-400">{stats.enAttente}</p>
                <p className="text-gray-500 text-xs mt-1">à traiter</p>
              </div>

              <div className="bg-[#242526] rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">En cours</span>
                  <PlayCircle className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-400">{stats.enCours}</p>
                <p className="text-gray-500 text-xs mt-1">en traitement</p>
              </div>

              <div className="bg-[#242526] rounded-xl p-4 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Résolus</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-400">{stats.resolus}</p>
                <p className="text-gray-500 text-xs mt-1">traités</p>
              </div>
            </div>

            {/* Deuxième ligne de stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#242526] rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Taux de prise en charge</span>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-400">{tauxPriseEnCharge}%</p>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    style={{ width: `${tauxPriseEnCharge}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#242526] rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Taux de résolution</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-400">{tauxResolution}%</p>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                    style={{ width: `${tauxResolution}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Répartition par type */}
            <div className="bg-[#242526] rounded-xl p-4 border border-gray-700/30">
              <h3 className="text-gray-300 text-sm font-medium mb-3">Répartition par catégorie</h3>
              <div className="space-y-2">
                {Object.entries(stats.parType).map(([type, count]) => {
                  const TypeIcon = getTypeIcon(type);
                  const percentage = Math.round((count / stats.total) * 100);
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${getTypeColor(type)} bg-opacity-20`}>
                        <TypeIcon size={14} />
                      </div>
                      <span className="text-gray-300 text-sm flex-1">{getTypeLabel(type)}</span>
                      <span className="text-gray-400 text-sm">{count}</span>
                      <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-gray-500 text-xs w-10 text-right">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top villes */}
            {Object.keys(stats.parVille).length > 0 && (
              <div className="bg-[#242526] rounded-xl p-4 border border-gray-700/30">
                <h3 className="text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
                  <MapPin size={14} className="text-blue-400" />
                  Villes les plus actives
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.parVille)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([ville, count]) => (
                      <span 
                        key={ville}
                        className="bg-gray-700/50 text-gray-300 px-3 py-1.5 rounded-full text-sm flex items-center gap-1"
                      >
                        {ville}
                        <span className="bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded-full text-xs ml-1">
                          {count}
                        </span>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Liste des signalements */}
        <div className="space-y-4">
          {signalements.length === 0 ? (
            <div className="bg-[#242526] rounded-xl p-12 text-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-300 text-lg font-medium mb-2">Aucun signalement</p>
              <p className="text-gray-500 text-sm">Soyez le premier à signaler un problème dans votre quartier !</p>
            </div>
          ) : (
            signalements.map((s) => {
              const TypeIcon = getTypeIcon(s.type);
              const StatusIcon = getStatusIcon(s.statut);
              
              return (
                <article key={s.id} className="bg-[#242526] rounded-xl shadow-lg overflow-hidden">
                  {/* En-tête du post */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {(s.citoyen?.nom?.[0] || s.utilisateur?.nom?.[0] || 'C').toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white">
                              {s.citoyen?.nom || s.utilisateur?.nom || 'Citoyen anonyme'}
                            </h3>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} />
                              {getRelativeTime(s.dateCreation || s.createdAt || s.dateSignalement)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={12} />
                              {s.ville || s.commune || s.address || s.localisation || 'Localisation'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-300 p-1 rounded-full hover:bg-gray-700/50 transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Contenu du post */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${getTypeColor(s.type)}`}>
                        <TypeIcon size={14} />
                        {getTypeLabel(s.type)}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${getStatusColor(s.statut)}`}>
                        <StatusIcon size={14} />
                        {getStatusText(s.statut)}
                      </span>
                      {s.images && s.images.length > 0 && (
                        <span className="text-xs text-gray-400 bg-gray-700/50 px-2.5 py-1.5 rounded-full flex items-center gap-1">
                          <Image size={12} />
                          {s.images.length} photo{s.images.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    <h2 className="text-xl font-bold text-white mb-2">
                      {s.titre || 'Sans titre'}
                    </h2>
                    
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">
                      {s.description || 'Aucune description fournie'}
                    </p>
                  </div>

                  {/* Images du post */}
                  {s.images && s.images.length > 0 && (
                    <div className={`grid gap-1 ${
                      s.images.length === 1 ? 'grid-cols-1' :
                      s.images.length === 2 ? 'grid-cols-2' :
                      s.images.length === 3 ? 'grid-cols-2' :
                      'grid-cols-2'
                    }`}>
                      {s.images.slice(0, 4).map((img, index) => (
                        <div 
                          key={index}
                          className={`relative bg-black/30 cursor-pointer group ${
                            s.images.length === 3 && index === 0 ? 'row-span-2' : ''
                          }`}
                          onClick={() => openImageViewer(s.images, index)}
                        >
                          <img 
                            src={img.url} 
                            className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                            alt={`${s.titre} - image ${index + 1}`}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/400x300/242526/808080?text=Image+non+disponible";
                            }}
                          />
                          {s.images.length > 4 && index === 3 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-2xl font-bold">+{s.images.length - 4}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions style Facebook */}
                  <div className="px-2 py-1 border-t border-gray-700/50 flex items-center justify-around">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-gray-400 hover:bg-gray-700/30 rounded-lg transition-colors text-sm font-medium">
                      <MessageCircle size={18} />
                      <span>Commenter</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-gray-400 hover:bg-gray-700/30 rounded-lg transition-colors text-sm font-medium">
                      <Share2 size={18} />
                      <span>Partager</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

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
                  <img src={img.url} className="w-full h-full object-cover" alt={`Miniature ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}