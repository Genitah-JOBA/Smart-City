import { useEffect, useState } from "react";
import { 
  Camera, MapPin, Send, Trash2, Edit2, X, Shield, Road, 
  Lightbulb, Trash, Droplets, Search, Filter, Calendar, User,
  Clock, CheckCircle, RefreshCw, Maximize2, ChevronLeft, ChevronRight
} from "lucide-react";

export default function Signaler() {
  const [signalements, setSignalements] = useState([]);
  const [filteredSignalements, setFilteredSignalements] = useState([]);
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
  const [editingId, setEditingId] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [manualLocation, setManualLocation] = useState(false);
  
  // État pour le modal de détail
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // États pour le filtrage
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("TOUS");
  const [filterStatus, setFilterStatus] = useState("TOUS");
  const [showFilters, setShowFilters] = useState(false);
  
  // Récupérer l'utilisateur connecté
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // État pour annuler les modifications
  const [originalFormData, setOriginalFormData] = useState(null);

  const [availableCities, setAvailableCities] = useState([
    "Antananarivo", "Antsirabe", "Fianarantsoa", "Mahajanga", "Toamasina", 
    "Toliara", "Antsiranana", "Ambatondrazaka", "Ambanja", "Ambovombe",
    "Ampefy", "Andapa", "Anjozorobe", "Ankazobe", "Antalaha", "Antanifotsy",
    "Arivonimamo", "Belo Tsiribihina", "Betafo", "Betioky", "Brickaville",
    "Fandriana", "Farafangana", "Hell-Ville", "Ihosy", "Ikongo", "Imerintsiatosika",
    "Manakara", "Mananjary", "Mandritsara", "Manjakandriana", "Maroantsetra",
    "Marolambo", "Miandrivazo", "Miarinarivo", "Moramanga", "Morombe", "Morondava",
    "Nosy Be", "Sambava", "Soanierana Ivongo", "Talata Volonondry", "Tsiroanomandidy",
    "Vangaindrano", "Vatomandry", "Vohémar", "Vohipeno", "Vondrozo"
  ]);

  const categories = [
    { id: "VOIRIE", name: "Voirie / Routes", icon: Road, color: "from-green-800 to-green-700", iconColor: "text-green-400" },
    { id: "ECLAIRAGE", name: "Éclairage Public", icon: Lightbulb, color: "from-green-600 to-green-500", iconColor: "text-green-400" },
    { id: "DECHETS", name: "Déchets / Propreté", icon: Trash, color: "from-teal-600 to-teal-500", iconColor: "text-teal-400" },
    { id: "EAU", name: "Eau / Assainissement", icon: Droplets, color: "from-green-400 to-green-300", iconColor: "text-green-400" }
  ];

  const getAddressFromCoordinates = async (lat, lng) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr&countrycodes=mg`,
        { headers: { 'User-Agent': 'SmartCityApp/1.0' } }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const ville = data.address.city || data.address.town || data.address.village || data.address.suburb || "";
        const commune = data.address.county || data.address.district || "";
        const quartier = data.address.road || data.address.neighbourhood || "";
        const region = data.address.state || "";
        
        let fullAddress = "";
        if (quartier) fullAddress += quartier;
        if (ville) fullAddress += fullAddress ? ", " + ville : ville;
        if (commune) fullAddress += fullAddress ? " (" + commune + ")" : commune;
        if (region && !ville) fullAddress += fullAddress ? ", " + region : region;
        
        const isFianarantsoaArea = lat < -20 && lat > -22.5 && lng > 45 && lng < 48;
        
        let finalAddress = fullAddress;
        let finalVille = ville;
        
        if (isFianarantsoaArea && (ville.toLowerCase().includes("antananarivo") || ville.toLowerCase().includes("tananarive"))) {
          finalVille = "Fianarantsoa";
          finalAddress = quartier ? `${quartier}, Fianarantsoa` : `Fianarantsoa, Madagascar`;
        } else if (!finalAddress || finalAddress.length < 5) {
          finalAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        
        return { fullAddress: finalAddress, ville: finalVille, commune: commune };
      }
      
      return { fullAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, ville: "", commune: "" };
    } catch (error) {
      console.error("Erreur de géocodage:", error);
      return { fullAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, ville: "", commune: "" };
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'titre':
        if (!value.trim()) return "Le titre est requis";
        if (value.length < 3) return "Le titre doit contenir au moins 3 caractères";
        if (value.length > 100) return "Le titre ne doit pas dépasser 100 caractères";
        return null;
      case 'description':
        if (!value.trim()) return "La description est requise";
        if (value.length < 10) return "La description doit contenir au moins 10 caractères";
        if (value.length > 500) return "La description ne doit pas dépasser 500 caractères";
        return null;
      case 'imageUrl':
        if (value && !value.match(/^https?:\/\/.+\..+/)) {
          return "L'URL de l'image n'est pas valide";
        }
        return null;
      default:
        return null;
    }
  };

  const validateImages = () => images.length === 0 ? "Au moins une image est obligatoire" : null;

  const handleFieldChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const validateForm = () => {
    const newErrors = {
      titre: validateField('titre', formData.titre),
      description: validateField('description', formData.description),
      images: validateImages()
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(e => e);
  };

  // Récupérer les infos de l'utilisateur connecté
  const fetchCurrentUser = async () => {
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

  const fetchSignalements = async () => {
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

  useEffect(() => { 
    if (token) {
      fetchSignalements();
      fetchCurrentUser();
    }
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

  const getGeolocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const addressData = await getAddressFromCoordinates(pos.coords.latitude, pos.coords.longitude);
        setFormData({ 
          ...formData, 
          latitude: pos.coords.latitude.toString(), 
          longitude: pos.coords.longitude.toString(),
          address: addressData.fullAddress,
          ville: addressData.ville,
          commune: addressData.commune
        });
        if (errors.position) setErrors({ ...errors, position: null });
      },
      (error) => {
        setMessage("Impossible de détecter votre position.");
        setIsSuccess(false);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
      }
    );
  };

  const addImage = () => {
    if (formData.imageUrl) {
      if (!errors.imageUrl) {
        setImages([...images, { url: formData.imageUrl }]);
        setFormData({ ...formData, imageUrl: "" });
        if (errors.images) setErrors({ ...errors, images: null });
      }
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, idx) => idx !== index);
    setImages(newImages);
    if (newImages.length === 0) setErrors({ ...errors, images: "Au moins une image est obligatoire" });
  };

  const confirmDelete = (id) => {
    setDeleteConfirmId(id);
    setMessage("Êtes-vous sûr de vouloir supprimer ce signalement ?");
    setIsSuccess(false);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`http://localhost:8081/api/signalements/${deleteConfirmId}`, { 
        method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSignalements();
        if (editingId === deleteConfirmId) {
          handleCancelEdit();
        }
        setMessage("Signalement supprimé avec succès !");
        setIsSuccess(true);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
      }
    } catch (error) { console.error(error); }
    finally { setDeleteConfirmId(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage("Veuillez corriger les erreurs");
      setIsSuccess(false);
      setShowModal(true);
      setTimeout(() => setShowModal(false), 3000);
      return;
    }

    const method = editingId ? "PUT" : "POST";
    const url = `http://localhost:8081/api/signalements${editingId ? `/${editingId}` : ''}`;
    const payload = {
      titre: formData.titre, description: formData.description, type: formData.type,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      address: formData.address || formData.ville, ville: formData.ville,
      commune: formData.commune, statut: "EN_ATTENTE",
      images: images.map(img => ({ url: img.url }))
    };

    try {
      const res = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        handleCancelEdit();
        fetchSignalements();
        setMessage(editingId ? "Signalement modifié !" : "Signalement créé !");
        setIsSuccess(true);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
      }
    } catch (error) { console.error(error); }
  };

  const handleEdit = (signalement) => {
    if (signalement.utilisateur?.id !== currentUserId && currentUserRole !== "ADMIN") {
      setMessage("Vous n'êtes pas autorisé à modifier ce signalement");
      setIsSuccess(false);
      setShowModal(true);
      setTimeout(() => setShowModal(false), 2000);
      return;
    }
    
    // Sauvegarder les données originales pour pouvoir annuler
    setOriginalFormData({
      titre: formData.titre,
      description: formData.description,
      type: formData.type,
      latitude: formData.latitude,
      longitude: formData.longitude,
      address: formData.address,
      ville: formData.ville,
      commune: formData.commune,
      imageUrl: formData.imageUrl
    });
    setOriginalImages([...images]);
    
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
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    if (originalFormData) {
      setFormData(originalFormData);
      setImages(originalImages || []);
      setOriginalFormData(null);
      setOriginalImages([]);
    } else {
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
    setErrors({});
    setManualLocation(false);
  };

  const canDelete = (signalement) => {
    return currentUserRole === "ADMIN" || signalement.utilisateur?.id === currentUserId;
  };

  const canEdit = (signalement) => {
    return signalement.utilisateur?.id === currentUserId;
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

  // Navigation dans le carrousel classique
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

  const token = localStorage.getItem("token");
  const selectedCategory = categories.find(c => c.id === formData.type);
  const [originalImages, setOriginalImages] = useState([]);

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

      {/* Modal de détail du signalement avec carrousel classique */}
      {showDetailModal && selectedSignalement && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-modal-pop custom-scrollbar">
            
            {/* Carrousel classique */}
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
                <span className={`text-xs px-3 py-1 rounded-full ${
                  selectedSignalement.statut === 'EN_ATTENTE' 
                    ? 'bg-amber-500/20 text-amber-300' 
                    : 'bg-green-500/20 text-green-300'
                }`}>
                  {selectedSignalement.statut === 'EN_ATTENTE' ? '⏳ En attente' : '✅ Traité'}
                </span>
              </div>

              {/* Titre */}
              <h2 className="text-2xl font-bold text-white">{selectedSignalement.titre}</h2>
              
              {/* Description complète */}
              <div>
                <h3 className="text-white/70 text-sm font-medium mb-2">📝 Description</h3>
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
              
              {/* Boutons d'action */}
              {(canEdit(selectedSignalement) || canDelete(selectedSignalement)) && (
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  {canEdit(selectedSignalement) && (
                    <button 
                      onClick={() => {
                        closeDetailModal();
                        handleEdit(selectedSignalement);
                      }} 
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition"
                    >
                      <Edit2 size={16} /> Modifier
                    </button>
                  )}
                  {canDelete(selectedSignalement) && (
                    <button 
                      onClick={() => {
                        closeDetailModal();
                        confirmDelete(selectedSignalement.id);
                      }} 
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition"
                    >
                      <Trash2 size={16} /> Supprimer
                    </button>
                  )}
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
        
        {/* Formulaire de signalement */}
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/30 overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-500" />
          
          <div className="relative p-6 md:p-10">
            <div className="absolute inset-0 z-0" style={{ backgroundImage: `url('/Image/Smart.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">{editingId ? "Modifier le signalement" : "Nouveau signalement"}</h2>
                <p className="text-white/60 text-sm">Signalez un problème à Madagascar</p>
              </div>

              <div>
                <input type="text" placeholder="Titre du signalement *" value={formData.titre || ""} onChange={(e) => handleFieldChange('titre', e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500" />
                {errors.titre && <p className="text-red-400 text-xs mt-1">{errors.titre}</p>}
              </div>

              {/* Catégories */}
              <div className="grid grid-cols-4 gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = formData.type === category.id;
                  return (
                    <button key={category.id} type="button" onClick={() => setFormData({...formData, type: category.id})} className={`p-3 rounded-xl transition ${isSelected ? `bg-gradient-to-r ${category.color} text-white shadow-lg` : 'bg-white/10 border border-white/20 text-white/70'}`}>
                      <div className="flex flex-col items-center gap-1">
                        <Icon size={20} />
                        <span className="text-xs">{category.name.split(' ')[0]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <textarea placeholder="Description détaillée *" value={formData.description || ""} onChange={(e) => handleFieldChange('description', e.target.value)} rows="3" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500" />
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
              </div>

              {/* Localisation */}
              <div className="space-y-3">
                <label className="text-white/80 text-sm">📍 Localisation *</label>
                <button type="button" onClick={getGeolocation} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition">
                  <MapPin size={16} /> Utiliser ma position GPS
                </button>
                {formData.address && (
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-emerald-400 text-sm">Adresse détectée :</p>
                    <p className="text-white text-sm">{formData.address}</p>
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="flex gap-2">
                <input type="text" placeholder="URL de l'image" value={formData.imageUrl || ""} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50" />
                <button type="button" onClick={addImage} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 rounded-xl transition">Ajouter</button>
              </div>
              {errors.images && <p className="text-red-400 text-xs">{errors.images}</p>}

              {images.length > 0 && (
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img src={img.url} className="w-20 h-20 object-cover rounded-lg" alt="" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><X size={12} className="text-white" /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                  <Send size={18}/> {editingId ? "Mettre à jour" : "Envoyer"}
                </button>
                
                {/* Bouton Annuler qui apparaît en mode édition */}
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-600/50 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Annuler
                  </button>
                )}
              </div>
            </form>
          </div>
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

              <div className="mb-4">
                <label className="text-white/70 text-xs font-medium block mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                  Statut
                </label>
                <div className="flex gap-3">
                  <button onClick={() => setFilterStatus("TOUS")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 ${filterStatus === "TOUS" ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg scale-[1.02]' : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'}`} style={{ borderRadius: '50% 10% 50% 10% / 10% 50% 10% 50%' }}>
                    <Filter size={14} className="text-white" />
                    <span className="text-sm font-medium">Tous</span>
                  </button>
                  <button onClick={() => setFilterStatus("EN_ATTENTE")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 ${filterStatus === "EN_ATTENTE" ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg scale-[1.02]' : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'}`} style={{ borderRadius: '50% 10% 50% 10% / 10% 50% 10% 50%' }}>
                    <Clock size={14} className="text-white" />
                    <span className="text-sm font-medium">En attente</span>
                  </button>
                  <button onClick={() => setFilterStatus("RESOLU")} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 ${filterStatus === "RESOLU" ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg scale-[1.02]' : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'}`} style={{ borderRadius: '50% 10% 50% 10% / 10% 50% 10% 50%' }}>
                    <CheckCircle size={14} className="text-white" />
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
                
                return (
                  <div key={s.id} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/30 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
                    {/* Image avec bouton "Voir plus" au survol */}
                    {s.images && s.images[0] && (
                      <div className="relative h-48 overflow-hidden" onClick={() => openDetailModal(s)}>
                        <img src={s.images[0].url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={s.titre} />
                        {/* Overlay et bouton Voir plus au survol */}
                        <div className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                          <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
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
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          s.statut === 'EN_ATTENTE' 
                            ? 'bg-amber-500/20 text-amber-300' 
                            : 'bg-green-500/20 text-green-300'
                        }`}>
                          {s.statut === 'EN_ATTENTE' ? '⏳ En attente' : '✅ Traité'}
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

      {/* Styles personnalisés pour le scroll */}
      <style jsx>{`
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
        
        /* Custom scrollbar moderne */
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
        
        /* Appliquer le scroll personnalisé à toute la page */
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.4);
          border-radius: 10px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.6);
        }
      `}</style>
    </div>
  );
}