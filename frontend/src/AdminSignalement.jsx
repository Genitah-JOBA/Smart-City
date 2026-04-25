import { useEffect, useState } from "react";
import { 
  Camera, MapPin, Trash2, X, Shield, Road, 
  Lightbulb, Trash, Droplets, Search, Filter, Calendar, User,
  Clock, CheckCircle, RefreshCw, ChevronLeft, ChevronRight,
  AlertTriangle, PlayCircle
} from "lucide-react";

export default function Signaler() {
  const [signalements, setSignalements] = useState([]);
  const [filteredSignalements, setFilteredSignalements] = useState([]);
  
  // États pour le modal de détail
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // États pour le filtrage
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("TOUS");
  const [filterStatus, setFilterStatus] = useState("TOUS");
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour les modals
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Récupérer l'utilisateur connecté
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const categories = [
    { id: "VOIRIE", name: "Voirie / Routes", icon: Road, color: "from-green-800 to-green-700", iconColor: "text-green-400" },
    { id: "ECLAIRAGE", name: "Éclairage Public", icon: Lightbulb, color: "from-green-600 to-green-500", iconColor: "text-green-400" },
    { id: "DECHETS", name: "Déchets / Propreté", icon: Trash, color: "from-teal-600 to-teal-500", iconColor: "text-teal-400" },
    { id: "EAU", name: "Eau / Assainissement", icon: Droplets, color: "from-green-400 to-green-300", iconColor: "text-green-400" }
  ];

  // Obtenir la couleur du statut
  const getStatusColor = (statut) => {
    const colors = {
      'EN_ATTENTE': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      'EN_COURS': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'RESOLU': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      'TRAITE': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    };
    return colors[statut] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  // Obtenir l'icône du statut
  const getStatusIcon = (statut) => {
    const icons = {
      'EN_ATTENTE': AlertTriangle,
      'EN_COURS': PlayCircle,
      'RESOLU': CheckCircle,
      'TRAITE': CheckCircle
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

  // Obtenir le style du badge de statut pour le filtre
  const getStatusBadgeStyle = (statut) => {
    const styles = {
      'EN_ATTENTE': 'bg-amber-500/20 text-amber-300',
      'EN_COURS': 'bg-blue-500/20 text-blue-300',
      'RESOLU': 'bg-green-500/20 text-green-300'
    };
    return styles[statut] || 'bg-gray-500/20 text-gray-300';
  };

  const fetchSignalements = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8081/api/signalements", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const sortedData = data.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
        setSignalements(sortedData);
        setFilteredSignalements(sortedData);
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
    }
  };

  // Récupérer les infos de l'utilisateur connecté
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch("http://localhost:8081/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUserId(userData.id);
        setCurrentUserRole(userData.role);
      }
    } catch (error) {
      console.error("Erreur récupération utilisateur:", error);
    }
  };

  useEffect(() => { 
    fetchSignalements();
    fetchCurrentUser();
  }, []);

  // Fonction de filtrage
  useEffect(() => {
    let filtered = [...signalements];
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ville?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== "TOUS") {
      filtered = filtered.filter(s => s.type === filterType);
    }
    
    if (filterStatus !== "TOUS") {
      filtered = filtered.filter(s => s.statut === filterStatus);
    }
    
    setFilteredSignalements(filtered);
  }, [searchTerm, filterType, filterStatus, signalements]);

  const confirmDelete = (id) => {
    setDeleteConfirmId(id);
    setMessage("Êtes-vous sûr de vouloir supprimer ce signalement ?");
    setIsSuccess(false);
    setShowModal(true);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`http://localhost:8081/api/signalements/${deleteConfirmId}`, { 
        method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSignalements();
        setMessage("Signalement supprimé avec succès !");
        setIsSuccess(true);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
      }
    } catch (error) { console.error(error); }
    finally { setDeleteConfirmId(null); }
  };

  const canDelete = (signalement) => {
    return currentUserRole === "ADMIN" || signalement.utilisateur?.id === currentUserId;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Ouvrir le modal de détail
  const openDetailModal = (signalement) => {
    setSelectedSignalement(signalement);
    setCurrentImageIndex(0);
    setShowDetailModal(true);
  };

  // Fermer le modal de détail
  const closeDetailModal = () => {
    setSelectedSignalement(null);
    setShowDetailModal(false);
    setCurrentImageIndex(0);
  };

  // Navigation dans le carrousel
  const nextImage = () => {
    if (selectedSignalement && selectedSignalement.images) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedSignalement.images.length);
    }
  };

  const prevImage = () => {
    if (selectedSignalement && selectedSignalement.images) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedSignalement.images.length) % selectedSignalement.images.length);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      
      {/* Modal de confirmation */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {isSuccess ? <Shield className="w-7 h-7" /> : deleteConfirmId ? <div className="text-2xl font-bold">?</div> : <div className="text-2xl font-bold">!</div>}
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isSuccess ? 'text-slate-900' : deleteConfirmId ? 'text-amber-600' : 'text-red-600'}`}>
                {isSuccess ? "Succès" : deleteConfirmId ? "Confirmation" : "Erreur"}
              </h3>
              <p className="text-slate-600 text-sm mb-6">{message}</p>
              {deleteConfirmId ? (
                <div className="flex gap-3">
                  <button onClick={() => { setDeleteConfirmId(null); setShowModal(false); }} className="flex-1 py-2 rounded-xl font-semibold bg-slate-100">Annuler</button>
                  <button onClick={handleDelete} className="flex-1 py-2 rounded-xl font-semibold text-white bg-red-500">Supprimer</button>
                </div>
              ) : (
                <button onClick={() => setShowModal(false)} className={`w-full py-2 rounded-xl font-semibold text-white ${isSuccess ? 'bg-emerald-500' : 'bg-slate-800'}`}>Fermer</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de détail du signalement avec carrousel */}
      {showDetailModal && selectedSignalement && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-modal-pop custom-scrollbar">
            
            {/* Carrousel */}
            {selectedSignalement.images && selectedSignalement.images.length > 0 && (
              <div className="relative h-64 md:h-96 overflow-hidden rounded-t-2xl bg-slate-900/50">
                <img 
                  src={selectedSignalement.images[currentImageIndex].url} 
                  className="w-full h-full object-contain transition-opacity duration-300" 
                  alt={`Image ${currentImageIndex + 1}`} 
                />
                
                {/* Flèches de navigation */}
                {selectedSignalement.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition text-white z-20"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition text-white z-20"
                    >
                      <ChevronRight size={24} />
                    </button>
                    
                    {/* Indicateurs de page */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                      {selectedSignalement.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentImageIndex 
                              ? 'bg-emerald-500 w-6' 
                              : 'bg-white/50 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                <button
                  onClick={closeDetailModal}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition text-white z-20"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            
            <div className="p-6 space-y-4">
              {/* En-tête */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl bg-gradient-to-r ${categories.find(c => c.id === selectedSignalement.type)?.color || 'from-emerald-500 to-green-600'}`}>
                    {(() => {
                      const Icon = categories.find(c => c.id === selectedSignalement.type)?.icon || Road;
                      return <Icon size={20} className="text-white" />;
                    })()}
                  </div>
                  <span className="text-emerald-400 font-medium">{selectedSignalement.type}</span>
                </div>
                {/* Statut avec icône */}
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${getStatusColor(selectedSignalement.statut)}`}>
                  {(() => {
                    const StatusIcon = getStatusIcon(selectedSignalement.statut);
                    return <StatusIcon size={12} />;
                  })()}
                  {getStatusText(selectedSignalement.statut)}
                </span>
              </div>

              {/* Titre */}
              <h2 className="text-2xl font-bold text-white">{selectedSignalement.titre}</h2>
              
              {/* Description complète */}
              <div>
                <h3 className="text-white/70 text-sm font-medium mb-2">Description</h3>
                <p className="text-white/80 text-sm leading-relaxed">{selectedSignalement.description}</p>
              </div>
              
              {/* Localisation */}
              <div>
                <h3 className="text-white/70 text-sm font-medium mb-2">📍 Localisation</h3>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white text-sm">{selectedSignalement.address || selectedSignalement.ville || "Position non définie"}</p>
                  {selectedSignalement.latitude && selectedSignalement.longitude && (
                    <p className="text-white/40 text-xs mt-1">
                      Coordonnées : {selectedSignalement.latitude.toFixed(6)}, {selectedSignalement.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Informations supplémentaires */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                    <Calendar size={12} />
                    <span>Date de publication</span>
                  </div>
                  <p className="text-white text-sm">{formatDate(selectedSignalement.dateCreation)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                    <User size={12} />
                    <span>Publié par</span>
                  </div>
                  <p className="text-white text-sm">{selectedSignalement.utilisateur?.nom || "Anonyme"}</p>
                </div>
              </div>
              
              {/* Compteur d'images */}
              {selectedSignalement.images && selectedSignalement.images.length > 1 && (
                <div className="text-center text-white/40 text-sm">
                  {currentImageIndex + 1} / {selectedSignalement.images.length}
                </div>
              )}
              
              {/* Bouton Supprimer uniquement */}
              {canDelete(selectedSignalement) && (
                <div className="flex justify-end pt-4 border-t border-white/10">
                  <button 
                    onClick={() => {
                      closeDetailModal();
                      confirmDelete(selectedSignalement.id);
                    }} 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/40 hover:bg-red-500 text-white transition"
                  >
                    <Trash2 size={16} /> Supprimer
                  </button>
                </div>
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
        
        {/* En-tête avec titre seulement */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Signalements citoyens</h1>
          <p className="text-white/60">Consultez tous les problèmes signalés par la communauté</p>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par titre, description ou localisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white hover:bg-white/20 transition flex items-center gap-2"
            >
              <Filter size={18} />
              <span className="hidden sm:inline">Filtres</span>
            </button>
          </div>
          
          {/* Panneau de filtres */}
          {showFilters && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="mb-5">
                <label className="text-white/70 text-xs font-medium block mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                  Type de problème
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <button
                    onClick={() => setFilterType("TOUS")}
                    className={`group relative flex flex-col items-center gap-2 p-3 transition-all duration-300 ${filterType === "TOUS" ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg scale-[1.02]' : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'}`}
                    style={{ borderRadius: '20px' }}
                  >
                    <div className={`p-2 rounded-full transition-all ${filterType === "TOUS" ? 'bg-white/20' : 'bg-white/5'}`}>
                      <Filter size={18} className={filterType === "TOUS" ? "text-white" : "text-emerald-400"} />
                    </div>
                    <span className="text-xs font-medium">Tous</span>
                    {filterType === "TOUS" && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />}
                  </button>
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = filterType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setFilterType(cat.id)}
                        className={`group relative flex flex-col items-center gap-2 p-3 transition-all duration-300 ${isSelected ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-[1.02]` : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'}`}
                        style={{ borderRadius: '20px' }}
                      >
                        <div className={`p-2 rounded-full transition-all ${isSelected ? 'bg-white/20 scale-110' : 'bg-white/5 group-hover:scale-110'}`}>
                          <Icon size={18} className={isSelected ? "text-white" : cat.iconColor} />
                        </div>
                        <span className="text-xs font-medium text-center">{cat.name.split(' ')[0]}</span>
                        {isSelected && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filtres de statut */}
              <div className="mb-4">
                <label className="text-white/70 text-xs font-medium block mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                  Statut
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <button 
                    onClick={() => setFilterStatus("TOUS")} 
                    className={`flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 rounded-xl ${
                      filterStatus === "TOUS" 
                        ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-lg scale-[1.02]' 
                        : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    <Filter size={14} />
                    <span className="text-sm font-medium">Tous</span>
                  </button>
                  
                  <button 
                    onClick={() => setFilterStatus("EN_ATTENTE")} 
                    className={`flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 rounded-xl ${
                      filterStatus === "EN_ATTENTE" 
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg scale-[1.02]' 
                        : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    <AlertTriangle size={14} />
                    <span className="text-sm font-medium">En attente</span>
                  </button>
                  
                  <button 
                    onClick={() => setFilterStatus("EN_COURS")} 
                    className={`flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 rounded-xl ${
                      filterStatus === "EN_COURS" 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-[1.02]' 
                        : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    <PlayCircle size={14} />
                    <span className="text-sm font-medium">En cours</span>
                  </button>
                  
                  <button 
                    onClick={() => setFilterStatus("RESOLU")} 
                    className={`flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 rounded-xl ${
                      filterStatus === "RESOLU" 
                        ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg scale-[1.02]' 
                        : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'
                    }`}
                  >
                    <CheckCircle size={14} />
                    <span className="text-sm font-medium">Résolu</span>
                  </button>
                </div>
              </div>

              {(filterType !== "TOUS" || filterStatus !== "TOUS" || searchTerm) && (
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-white/50 text-xs">{filteredSignalements.length} résultat(s) trouvé(s)</span>
                  </div>
                  <button onClick={() => { setSearchTerm(""); setFilterType("TOUS"); setFilterStatus("TOUS"); }} className="text-emerald-400 text-xs hover:text-emerald-300 transition-all duration-300 flex items-center gap-1 hover:gap-2">
                    <RefreshCw size={12} />
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Liste des signalements */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Tous les signalements</h3>
            <span className="bg-emerald-600/30 text-emerald-300 px-3 py-1 rounded-full text-sm">
              {filteredSignalements.length} signalement(s)
            </span>
          </div>
          
          {filteredSignalements.length === 0 ? (
            <div className="bg-white/10 rounded-2xl p-12 text-center">
              <p className="text-white/70">Aucun signalement trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSignalements.map((s) => {
                const category = categories.find(c => c.id === s.type);
                const Icon = category?.icon || Road;
                const StatusIcon = getStatusIcon(s.statut);
                
                return (
                  <div key={s.id} className="bg-[#242526] backdrop-blur-xl rounded-2xl border border-white/30 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
                    {/* Image avec bouton "Voir plus" au survol */}
                    {s.images && s.images[0] && (
                      <div className="relative h-48 overflow-hidden" onClick={() => openDetailModal(s)}>
                        <img src={s.images[0].url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={s.titre} />
                        {/* Overlay et bouton Voir plus au survol */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                          <span className="text-white bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                            Voir plus
                          </span>
                        </div>
                        {/* Badge multi-images */}
                        {s.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/60 rounded-full px-2 py-1 text-xs text-white flex items-center gap-1">
                            <Camera size={10} />
                            {s.images.length} photos
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Informations réduites */}
                    <div className="p-4 space-y-2" onClick={() => openDetailModal(s)}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-r ${category?.color || 'from-emerald-500 to-green-600'}`}>
                            <Icon size={14} className="text-white" />
                          </div>
                          <span className="text-xs text-emerald-300">{category?.name.split(' ')[0] || s.type}</span>
                        </div>
                        {/* Statut avec icône */}
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusBadgeStyle(s.statut)}`}>
                          <StatusIcon size={10} />
                          {getStatusText(s.statut)}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-white text-lg line-clamp-1">{s.titre}</h4>
                      <p className="text-white/60 text-sm line-clamp-2">{s.description}</p>
                      
                      <div className="flex items-start gap-2 text-white/40 text-xs">
                        <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{s.address || s.ville || "Position non définie"}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-white/40 text-xs pt-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{formatDate(s.dateCreation)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span>{s.utilisateur?.nom || "Anonyme"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Styles personnalisés */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-pop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-modal-pop { animation: modal-pop 0.3s ease-out; }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.6);
        }
        
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        *::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        *::-webkit-scrollbar-thumb {
          background: rgba(28, 221, 157, 0.4);
          border-radius: 10px;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.6);
        }
      `}</style>
    </div>
  );
}

