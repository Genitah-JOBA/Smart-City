import { useEffect, useState } from "react";
import { 
  Camera, MapPin, Send, Trash2, Edit2, X, Shield, Road, 
  Lightbulb, Trash, Droplets, Search, Filter, Calendar, User,
  Clock, CheckCircle, RefreshCw, Maximize2, ChevronLeft, ChevronRight,
  AlertTriangle, PlayCircle, Loader, Navigation2, Building2, Home, Target, LocateFixed, CheckCircle as CheckCircleIcon
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
    ville: "Fianarantsoa",
    commune: "",
    quartier: "",
    fokontany: "",
    lieuDit: "",
    rue: "",
    imageUrl: ""
  });
  const [images, setImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  
  // États pour la saisie manuelle
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [manualQuartier, setManualQuartier] = useState("");
  const [manualRue, setManualRue] = useState("");
  const [manualVille, setManualVille] = useState("");
  
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
  const [originalImages, setOriginalImages] = useState([]);

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

  const getStatusIcon = (statut) => {
    const icons = {
      'EN_ATTENTE': AlertTriangle,
      'EN_COURS': PlayCircle,
      'RESOLU': CheckCircle,
      'TRAITE': CheckCircle
    };
    return icons[statut] || AlertTriangle;
  };

  const getStatusText = (statut) => {
    const texts = {
      'EN_ATTENTE': 'En attente',
      'EN_COURS': 'En cours',
      'RESOLU': 'Résolu',
      'TRAITE': 'Traité'
    };
    return texts[statut] || statut;
  };

  const getStatusBadgeStyle = (statut) => {
    const styles = {
      'EN_ATTENTE': 'bg-amber-500/20 text-amber-300',
      'EN_COURS': 'bg-blue-500/20 text-blue-300',
      'RESOLU': 'bg-green-500/20 text-green-300'
    };
    return styles[statut] || 'bg-gray-500/20 text-gray-300';
  };

  // Fonction pour extraire le quartier à partir des données Nominatim
  const extractQuartierInfo = (data) => {
    const quartierKeywords = [
      '67ha', '67 hectares', 'Isotry', 'Tsaralalana', 'Mahamasina',
      'Andravoahangy', 'Ambohijatovo', 'Anosy', 'Ampefiloha',
      'Ankorondrano', 'Ivandry', 'Manakara', 'Faravohitra',
      'Tsianolondroa', 'Ambatomaro', 'Tanambao', 'Ambalavao', 'Andrainjato',
      'Soanierana', 'Ambondrona', 'Ambohipolo'
    ];
    
    let quartier = "";
    let fokontany = "";
    let lieuDit = "";
    
    const searchFields = [
      { field: data.address.neighbourhood, type: "quartier" },
      { field: data.address.suburb, type: "quartier" },
      { field: data.address.village, type: "lieuDit" },
      { field: data.address.hamlet, type: "lieuDit" },
      { field: data.address.locality, type: "lieuDit" }
    ];
    
    for (const { field, type } of searchFields) {
      if (field) {
        if (type === "quartier") {
          for (const keyword of quartierKeywords) {
            if (field.toLowerCase().includes(keyword.toLowerCase())) {
              quartier = keyword;
              break;
            }
          }
          if (!quartier) fokontany = field;
        } else if (type === "lieuDit" && !lieuDit) {
          lieuDit = field;
        }
      }
    }
    
    return { quartier, fokontany, lieuDit };
  };

  // Fonction de géocodage inverse améliorée avec quartier
  const getDetailedAddressFromCoordinates = async (lat, lng) => {
    setIsLoadingAddress(true);
    try {
      const isFianarantsoaArea = lat >= -22.5 && lat <= -20.5 && lng >= 46.5 && lng <= 47.8;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1&accept-language=fr`,
        { headers: { 'User-Agent': 'SmartCityApp/1.0' } }
      );
      const data = await response.json();
      
      console.log("📍 Données Nominatim détaillées:", data);
      
      if (data && data.address) {
        const addr = data.address;
        const quartierInfo = extractQuartierInfo(data);
        
        let ville = addr.city || addr.town || addr.village || "";
        let rue = addr.road || addr.pedestrian || "";
        
        if (isFianarantsoaArea && (!ville || ville.toLowerCase().includes("antananarivo"))) {
          ville = "Fianarantsoa";
        }
        
        const addressParts = [];
        if (quartierInfo.quartier) addressParts.push(quartierInfo.quartier);
        if (rue) addressParts.push(rue);
        if (quartierInfo.lieuDit) addressParts.push(`(${quartierInfo.lieuDit})`);
        if (ville) addressParts.push(ville);
        
        const fullAddress = addressParts.length > 0 ? addressParts.join(", ") + ", Madagascar" : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        return {
          fullAddress,
          ville: ville || "Fianarantsoa",
          commune: addr.county || addr.district || addr.city_district || "",
          quartier: quartierInfo.quartier || addr.neighbourhood || addr.suburb || "",
          fokontany: quartierInfo.fokontany || "",
          lieuDit: quartierInfo.lieuDit || addr.hamlet || addr.locality || "",
          rue: rue,
          latitude: lat,
          longitude: lng
        };
      }
      
      return {
        fullAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        ville: "Fianarantsoa",
        commune: "Fianarantsoa",
        quartier: "",
        fokontany: "",
        lieuDit: "",
        rue: ""
      };
    } catch (error) {
      console.error("Erreur de géocodage:", error);
      return {
        fullAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        ville: "Fianarantsoa",
        commune: "Fianarantsoa",
        quartier: "",
        fokontany: "",
        lieuDit: "",
        rue: ""
      };
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Fonction de géolocalisation améliorée avec précision maximale
  const getGeolocation = () => {
    setIsGettingLocation(true);
    setLocationAccuracy(null);
    
    if (!navigator.geolocation) {
      setMessage("La géolocalisation n'est pas supportée par votre navigateur.");
      setIsSuccess(false);
      setShowModal(true);
      setTimeout(() => setShowModal(false), 3000);
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const accuracy = pos.coords.accuracy;
        setLocationAccuracy(accuracy);
        
        const addressData = await getDetailedAddressFromCoordinates(
          pos.coords.latitude,
          pos.coords.longitude
        );
        
        setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
          address: addressData.fullAddress,
          ville: addressData.ville,
          commune: addressData.commune,
          quartier: addressData.quartier,
          fokontany: addressData.fokontany,
          lieuDit: addressData.lieuDit,
          rue: addressData.rue
        }));
        
        let successMessage = `✓ Position détectée avec précision ${Math.round(accuracy)}m`;
        if (addressData.quartier) successMessage += `\n📍 Quartier: ${addressData.quartier}`;
        if (addressData.rue) successMessage += `\n🏠 Rue: ${addressData.rue}`;
        
        setMessage(successMessage);
        setIsSuccess(true);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
        
        if (errors.position) setErrors({ ...errors, position: null });
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Impossible de détecter votre position.";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Accès à la localisation refusé. Veuillez autoriser la géolocalisation.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Position indisponible. Vérifiez votre connexion GPS.";
            break;
          case error.TIMEOUT:
            errorMessage = "Délai dépassé. Veuillez réessayer.";
            break;
          default:
            errorMessage = "Erreur de géolocalisation.";
        }
        setMessage(errorMessage);
        setIsSuccess(false);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  // Fonctions pour la saisie manuelle
  const activateManualMode = () => {
    setIsManualLocation(true);
    if (formData.address) {
      setManualAddress(formData.address);
    }
    if (formData.quartier) {
      setManualQuartier(formData.quartier);
    }
    if (formData.rue) {
      setManualRue(formData.rue);
    }
    if (formData.ville) {
      setManualVille(formData.ville);
    }
  };

  const reactivateGpsMode = () => {
    setIsManualLocation(false);
    setManualAddress("");
    setManualQuartier("");
    setManualRue("");
    setManualVille("");
    setFormData(prev => ({
      ...prev,
      address: "",
      quartier: "",
      rue: "",
      ville: "Fianarantsoa"
    }));
  };

  const updateManualAddress = () => {
    let fullAddress = "";
    if (manualQuartier) fullAddress += manualQuartier;
    if (manualRue) fullAddress += fullAddress ? `, ${manualRue}` : manualRue;
    if (manualVille) fullAddress += fullAddress ? `, ${manualVille}` : manualVille;
    if (!fullAddress && manualAddress) fullAddress = manualAddress;
    if (!fullAddress) fullAddress = "Fianarantsoa";
    fullAddress += ", Madagascar";
    
    setFormData(prev => ({
      ...prev,
      address: fullAddress,
      quartier: manualQuartier,
      rue: manualRue,
      ville: manualVille || "Fianarantsoa",
      latitude: "",
      longitude: ""
    }));
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
        s.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.quartier?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const addImage = () => {
    if (formData.imageUrl && formData.imageUrl.trim()) {
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
    const token = localStorage.getItem("token");
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
        setMessage("✓ Signalement supprimé avec succès !");
        setIsSuccess(true);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
      }
    } catch (error) { console.error(error); }
    finally { setDeleteConfirmId(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    if (!validateForm()) {
      setMessage("Veuillez corriger les erreurs");
      setIsSuccess(false);
      setShowModal(true);
      setTimeout(() => setShowModal(false), 3000);
      return;
    }

    const method = editingId ? "PUT" : "POST";
    const url = `http://localhost:8081/api/signalements${editingId ? `/${editingId}` : ''}`;
    
    let fullAddress = "";
    if (formData.quartier) fullAddress += formData.quartier;
    if (formData.fokontany && formData.fokontany !== formData.quartier) {
      fullAddress += fullAddress ? `, ${formData.fokontany}` : formData.fokontany;
    }
    if (formData.rue) fullAddress += fullAddress ? `, ${formData.rue}` : formData.rue;
    if (formData.lieuDit) fullAddress += fullAddress ? ` (${formData.lieuDit})` : formData.lieuDit;
    if (formData.ville) fullAddress += fullAddress ? `, ${formData.ville}` : formData.ville;
    
    if (!fullAddress) fullAddress = formData.address || formData.ville || "Fianarantsoa";
    fullAddress += ", Madagascar";
    
    const payload = {
      titre: formData.titre,
      description: formData.description,
      type: formData.type,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      address: fullAddress,
      ville: formData.quartier ? `${formData.quartier}, ${formData.ville || "Fianarantsoa"}` : (formData.ville || "Fianarantsoa"),
      commune: formData.commune || "Fianarantsoa",
      quartier: formData.quartier || "",
      fokontany: formData.fokontany || "",
      lieuDit: formData.lieuDit || "",
      rue: formData.rue || "",
      statut: "EN_ATTENTE",
      images: images.map(img => ({ url: img.url }))
    };

    console.log("📤 Payload envoyé:", payload);

    try {
      const res = await fetch(url, { 
        method, 
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Content-Type": "application/json" 
        }, 
        body: JSON.stringify(payload) 
      });
      if (res.ok) {
        handleCancelEdit();
        fetchSignalements();
        setMessage(editingId ? "✓ Signalement modifié avec succès !" : "✓ Signalement créé avec succès !");
        setIsSuccess(true);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
      } else {
        const errorData = await res.json();
        setMessage(`Erreur: ${errorData.message || "Une erreur est survenue"}`);
        setIsSuccess(false);
        setShowModal(true);
      }
    } catch (error) { 
      console.error(error);
      setMessage("Erreur de connexion au serveur");
      setIsSuccess(false);
      setShowModal(true);
    }
  };

  const handleEdit = (signalement) => {
    if (signalement.utilisateur?.id !== currentUserId && currentUserRole !== "ADMIN") {
      setMessage("Vous n'êtes pas autorisé à modifier ce signalement");
      setIsSuccess(false);
      setShowModal(true);
      setTimeout(() => setShowModal(false), 2000);
      return;
    }
    
    setOriginalFormData({
      titre: formData.titre,
      description: formData.description,
      type: formData.type,
      latitude: formData.latitude,
      longitude: formData.longitude,
      address: formData.address,
      ville: formData.ville,
      commune: formData.commune,
      quartier: formData.quartier,
      fokontany: formData.fokontany,
      lieuDit: formData.lieuDit,
      rue: formData.rue,
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
      ville: signalement.ville || "Fianarantsoa",
      commune: signalement.commune || "",
      quartier: signalement.quartier || "",
      fokontany: signalement.fokontany || "",
      lieuDit: signalement.lieuDit || "",
      rue: signalement.rue || "",
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
        ville: "Fianarantsoa",
        commune: "",
        quartier: "",
        fokontany: "",
        lieuDit: "",
        rue: "",
        imageUrl: ""
      });
      setImages([]);
    }
    setErrors({});
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

  const openDetailModal = (signalement) => {
    setSelectedSignalement(signalement);
    setCurrentImageIndex(0);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedSignalement(null);
    setShowDetailModal(false);
    setCurrentImageIndex(0);
  };

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
                {isSuccess ? "Succès" : deleteConfirmId ? "Confirmation" : "Information"}
              </h3>
              <p className="text-slate-600 text-sm mb-6 whitespace-pre-line">{message}</p>
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
            
            {selectedSignalement.images && selectedSignalement.images.length > 0 && (
              <div className="relative h-64 md:h-96 overflow-hidden rounded-t-2xl bg-slate-900/50">
                <img 
                  src={selectedSignalement.images[currentImageIndex].url} 
                  className="w-full h-full object-contain transition-opacity duration-300" 
                  alt={`Image ${currentImageIndex + 1}`} 
                />
                
                {selectedSignalement.images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition text-white z-20">
                      <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition text-white z-20">
                      <ChevronRight size={24} />
                    </button>
                    
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
                
                <button onClick={closeDetailModal} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition text-white z-20">
                  <X size={20} />
                </button>
              </div>
            )}
            
            <div className="p-6 space-y-4">
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
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${getStatusColor(selectedSignalement.statut)}`}>
                  {(() => {
                    const StatusIcon = getStatusIcon(selectedSignalement.statut);
                    return <StatusIcon size={12} />;
                  })()}
                  {getStatusText(selectedSignalement.statut)}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white">{selectedSignalement.titre}</h2>
              
              <div>
                <h3 className="text-white/70 text-sm font-medium mb-2">Description</h3>
                <p className="text-white/80 text-sm leading-relaxed">{selectedSignalement.description}</p>
              </div>
              
              {/* Section localisation détaillée */}
              <div>
                <h3 className="text-white/70 text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin size={14} />
                  Localisation détaillée
                </h3>
                <div className="bg-white/5 rounded-lg p-3 space-y-2">
                  {selectedSignalement.quartier && (
                    <div className="flex items-start gap-2">
                      <Building2 size={14} className="text-emerald-400 mt-0.5" />
                      <div>
                        <span className="text-white/40 text-xs">Quartier</span>
                        <p className="text-white text-sm">{selectedSignalement.quartier}</p>
                      </div>
                    </div>
                  )}
                  {selectedSignalement.rue && (
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-emerald-400 mt-0.5" />
                      <div>
                        <span className="text-white/40 text-xs">Rue/Route</span>
                        <p className="text-white text-sm">{selectedSignalement.rue}</p>
                      </div>
                    </div>
                  )}
                  {selectedSignalement.lieuDit && (
                    <div className="flex items-start gap-2">
                      <Home size={14} className="text-emerald-400 mt-0.5" />
                      <div>
                        <span className="text-white/40 text-xs">Lieu-dit</span>
                        <p className="text-white text-sm">{selectedSignalement.lieuDit}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-emerald-400 mt-0.5" />
                    <div>
                      <span className="text-white/40 text-xs">Ville/Commune</span>
                      <p className="text-white text-sm">{selectedSignalement.ville || selectedSignalement.commune || "Fianarantsoa"}</p>
                    </div>
                  </div>
                  {selectedSignalement.latitude && selectedSignalement.longitude && (
                    <div className="flex items-start gap-2 pt-2 border-t border-white/10">
                      <Target size={14} className="text-blue-400 mt-0.5" />
                      <div>
                        <span className="text-white/40 text-xs">Coordonnées GPS</span>
                        <p className="text-white/60 text-xs font-mono">
                          {parseFloat(selectedSignalement.latitude).toFixed(6)}, {parseFloat(selectedSignalement.longitude).toFixed(6)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
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
              
              {(canEdit(selectedSignalement) || canDelete(selectedSignalement)) && (
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  {canEdit(selectedSignalement) && (
                    <button onClick={() => { closeDetailModal(); handleEdit(selectedSignalement); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition">
                      <Edit2 size={16} /> Modifier
                    </button>
                  )}
                  {canDelete(selectedSignalement) && (
                    <button onClick={() => { closeDetailModal(); confirmDelete(selectedSignalement.id); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-400 hover:bg-red-500 text-white transition">
                      <Trash2 size={16} /> Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="relative z-10 container mx-auto max-w-6xl">
        
        {/* Formulaire de signalement */}
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/30 overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-500" />
          
          <div className="relative p-6 md:p-10">
            <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                  {editingId ? <Edit2 size={24} className="text-emerald-400" /> : <Camera size={24} className="text-emerald-400" />}
                  {editingId ? "Modifier le signalement" : "Nouveau signalement"}
                </h2>
                <p className="text-white/60 text-sm">Signalez un problème à Madagascar</p>
              </div>

              <div>
                <input 
                  type="text" 
                  placeholder="Titre du signalement *" 
                  value={formData.titre || ""} 
                  onChange={(e) => handleFieldChange('titre', e.target.value)} 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500" 
                />
                {errors.titre && <p className="text-red-400 text-xs mt-1">{errors.titre}</p>}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = formData.type === category.id;
                  return (
                    <button 
                      key={category.id} 
                      type="button" 
                      onClick={() => setFormData({...formData, type: category.id})} 
                      className={`p-3 rounded-xl transition ${isSelected ? `bg-gradient-to-r ${category.color} text-white shadow-lg` : 'bg-white/10 border border-white/20 text-white/70'}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Icon size={20} />
                        <span className="text-xs">{category.name.split(' ')[0]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <textarea 
                  placeholder="Description détaillée *" 
                  value={formData.description || ""} 
                  onChange={(e) => handleFieldChange('description', e.target.value)} 
                  rows="3" 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500" 
                />
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
              </div>

              {/* Localisation avec saisie manuelle */}
              <div className="space-y-3">
                <label className="text-white/80 text-sm flex items-center gap-2">
                  <LocateFixed size={16} className="text-emerald-400" />
                  Localisation précise *
                </label>
                
                {!isManualLocation ? (
                  <>
                    <button 
                      type="button" 
                      onClick={getGeolocation}
                      disabled={isGettingLocation}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Détection en cours...
                        </>
                      ) : (
                        <>
                          <LocateFixed size={18} />
                          Détecter ma position GPS
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={activateManualMode}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-medium py-2 rounded-xl transition"
                    >
                      <MapPin size={16} />
                      Saisir manuellement l'adresse
                    </button>
                  </>
                ) : (
                  <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-xl p-4 border border-amber-500/30">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-amber-400 text-sm flex items-center gap-2 font-medium">
                        <MapPin size={16} />
                        Saisie manuelle de l'adresse :
                      </p>
                      <button
                        type="button"
                        onClick={reactivateGpsMode}
                        className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1"
                      >
                        <LocateFixed size={12} />
                        Réactiver GPS
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Quartier *</label>
                        <input
                          type="text"
                          placeholder="Ex: Soanierana, 67ha, Isotry..."
                          value={manualQuartier}
                          onChange={(e) => setManualQuartier(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Rue / Route</label>
                        <input
                          type="text"
                          placeholder="Nom de la rue ou route"
                          value={manualRue}
                          onChange={(e) => setManualRue(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Ville *</label>
                        <input
                          type="text"
                          placeholder="Ex: Fianarantsoa, Antananarivo..."
                          value={manualVille}
                          onChange={(e) => setManualVille(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Adresse complète (optionnel)</label>
                        <textarea
                          placeholder="Description complète de l'adresse..."
                          value={manualAddress}
                          onChange={(e) => setManualAddress(e.target.value)}
                          rows="2"
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={updateManualAddress}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <CheckCircleIcon size={16} />
                        Valider l'adresse
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Affichage de la localisation détectée ou saisie */}
                {formData.address && !isManualLocation && (
                  <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 rounded-xl p-4 border border-emerald-500/30">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-emerald-400 text-sm flex items-center gap-2 font-medium">
                        <MapPin size={16} />
                        Localisation détectée :
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            latitude: "",
                            longitude: "",
                            address: "",
                            commune: "",
                            quartier: "",
                            fokontany: "",
                            lieuDit: "",
                            rue: ""
                          });
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Effacer
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {formData.quartier && (
                        <div className="flex items-start gap-2">
                          <Building2 size={14} className="text-emerald-400 mt-0.5" />
                          <div>
                            <span className="text-white/40 text-[10px]">Quartier</span>
                            <p className="text-white text-sm font-medium">{formData.quartier}</p>
                          </div>
                        </div>
                      )}
                      
                      {formData.rue && (
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-emerald-400 mt-0.5" />
                          <div>
                            <span className="text-white/40 text-[10px]">Rue/Route</span>
                            <p className="text-white text-sm">{formData.rue}</p>
                          </div>
                        </div>
                      )}
                      
                      {formData.lieuDit && (
                        <div className="flex items-start gap-2">
                          <Home size={14} className="text-emerald-400 mt-0.5" />
                          <div>
                            <span className="text-white/40 text-[10px]">Lieu-dit</span>
                            <p className="text-white text-sm">{formData.lieuDit}</p>
                          </div>
                        </div>
                      )}
                      
                      {formData.fokontany && (
                        <div className="flex items-start gap-2">
                          <Navigation2 size={14} className="text-emerald-400 mt-0.5" />
                          <div>
                            <span className="text-white/40 text-[10px]">Fokontany</span>
                            <p className="text-white text-sm">{formData.fokontany}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-blue-400 mt-0.5" />
                        <div>
                          <span className="text-white/40 text-[10px]">Ville/Commune</span>
                          <p className="text-white text-sm">{formData.ville} {formData.commune && `(${formData.commune})`}</p>
                        </div>
                      </div>
                      
                      {formData.latitude && formData.longitude && (
                        <div className="flex items-start gap-2 pt-2 border-t border-white/10">
                          <Target size={14} className="text-blue-400 mt-0.5" />
                          <div>
                            <span className="text-white/40 text-[10px]">Coordonnées GPS</span>
                            <p className="text-white/60 text-xs font-mono">
                              {parseFloat(formData.latitude).toFixed(6)}°, {parseFloat(formData.longitude).toFixed(6)}°
                              {locationAccuracy && <span className="ml-2 text-emerald-400">(précision: ±{Math.round(locationAccuracy)}m)</span>}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Affichage de l'adresse saisie manuellement */}
                {formData.address && isManualLocation && (
                  <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-xl p-4 border border-amber-500/30">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-amber-400 text-sm flex items-center gap-2 font-medium">
                        <MapPin size={16} />
                        Adresse saisie :
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            address: "",
                            quartier: "",
                            rue: "",
                            ville: "Fianarantsoa"
                          });
                          setManualAddress("");
                          setManualQuartier("");
                          setManualRue("");
                          setManualVille("");
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Effacer
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {formData.quartier && (
                        <div className="flex items-start gap-2">
                          <Building2 size={14} className="text-amber-400 mt-0.5" />
                          <div>
                            <span className="text-white/40 text-[10px]">Quartier</span>
                            <p className="text-white text-sm font-medium">{formData.quartier}</p>
                          </div>
                        </div>
                      )}
                      
                      {formData.rue && (
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-amber-400 mt-0.5" />
                          <div>
                            <span className="text-white/40 text-[10px]">Rue/Route</span>
                            <p className="text-white text-sm">{formData.rue}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-blue-400 mt-0.5" />
                        <div>
                          <span className="text-white/40 text-[10px]">Ville</span>
                          <p className="text-white text-sm">{formData.ville}</p>
                        </div>
                      </div>
                      
                      {formData.address && (
                        <div className="flex items-start gap-2 pt-2 border-t border-white/10">
                          <Target size={14} className="text-blue-400 mt-0.5" />
                          <div>
                            <span className="text-white/40 text-[10px]">Adresse complète</span>
                            <p className="text-white/60 text-xs">{formData.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="space-y-3">
                <label className="text-white/80 text-sm flex items-center gap-2">
                  <Camera size={16} className="text-emerald-400" />
                  Images *
                  <span className="text-white/40 text-xs">(au moins 1 image requise)</span>
                </label>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="URL de l'image" 
                    value={formData.imageUrl || ""} 
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500"
                  />
                  <button 
                    type="button" 
                    onClick={addImage} 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 rounded-xl transition"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
              
              {errors.images && <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertTriangle size={12} /> {errors.images}
              </p>}

              {images.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {images.map((img, i) => (
                    <div key={i} className="relative flex-shrink-0 group">
                      <img src={img.url} className="w-20 h-20 object-cover rounded-lg border border-white/20" alt={`Image ${i+1}`} />
                      <button 
                        type="button" 
                        onClick={() => removeImage(i)} 
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] transform duration-200"
                >
                  <Send size={18}/> {editingId ? "Mettre à jour" : "Envoyer le signalement"}
                </button>
                
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
                placeholder="Rechercher par titre, description, quartier ou localisation..."
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
                    className={`group relative flex flex-col items-center gap-2 p-3 transition-all duration-300 rounded-xl ${filterType === "TOUS" ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg scale-[1.02]' : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'}`}
                  >
                    <div className={`p-2 rounded-full transition-all ${filterType === "TOUS" ? 'bg-white/20' : 'bg-white/5'}`}>
                      <Filter size={18} className={filterType === "TOUS" ? "text-white" : "text-emerald-400"} />
                    </div>
                    <span className="text-xs font-medium">Tous</span>
                  </button>
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = filterType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setFilterType(cat.id)}
                        className={`group relative flex flex-col items-center gap-2 p-3 transition-all duration-300 rounded-xl ${isSelected ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-[1.02]` : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'}`}
                      >
                        <div className={`p-2 rounded-full transition-all ${isSelected ? 'bg-white/20 scale-110' : 'bg-white/5 group-hover:scale-110'}`}>
                          <Icon size={18} className={isSelected ? "text-white" : cat.iconColor} />
                        </div>
                        <span className="text-xs font-medium text-center">{cat.name.split(' ')[0]}</span>
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
                <div className="grid grid-cols-4 gap-3">
                  <button onClick={() => setFilterStatus("TOUS")} className={`flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 rounded-xl ${filterStatus === "TOUS" ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-lg scale-[1.02]' : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'}`}>
                    <Filter size={14} />
                    <span className="text-sm font-medium">Tous</span>
                  </button>
                  <button onClick={() => setFilterStatus("EN_ATTENTE")} className={`flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 rounded-xl ${filterStatus === "EN_ATTENTE" ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg scale-[1.02]' : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'}`}>
                    <AlertTriangle size={14} />
                    <span className="text-sm font-medium">En attente</span>
                  </button>
                  <button onClick={() => setFilterStatus("EN_COURS")} className={`flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 rounded-xl ${filterStatus === "EN_COURS" ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-[1.02]' : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'}`}>
                    <PlayCircle size={14} />
                    <span className="text-sm font-medium">En cours</span>
                  </button>
                  <button onClick={() => setFilterStatus("RESOLU")} className={`flex items-center justify-center gap-2 py-3 px-4 transition-all duration-300 rounded-xl ${filterStatus === "RESOLU" ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg scale-[1.02]' : 'bg-white/5 border border-white/20 text-white/70 hover:bg-white/15'}`}>
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
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin size={18} />
              Tous les signalements
            </h3>
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
                    {s.images && s.images[0] && (
                      <div className="relative h-48 overflow-hidden" onClick={() => openDetailModal(s)}>
                        <img src={s.images[0].url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={s.titre} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <span className="text-white bg-emerald-600/80 rounded-xl px-4 py-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300">
                            Voir plus
                          </span>
                        </div>
                        {s.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/60 rounded-full px-2 py-1 text-xs text-white flex items-center gap-1">
                            <Camera size={10} />
                            {s.images.length} photos
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="p-4 space-y-2" onClick={() => openDetailModal(s)}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-r ${category?.color || 'from-emerald-500 to-green-600'}`}>
                            <Icon size={14} className="text-white" />
                          </div>
                          <span className="text-xs text-emerald-300">{category?.name.split(' ')[0] || s.type}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusBadgeStyle(s.statut)}`}>
                          <StatusIcon size={10} />
                          {getStatusText(s.statut)}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-white text-lg line-clamp-1">{s.titre}</h4>
                      
                      {s.quartier && (
                        <div className="flex items-center gap-1 text-emerald-400 text-xs">
                          <Building2 size={10} />
                          <span>{s.quartier}</span>
                        </div>
                      )}
                      
                      <p className="text-white/60 text-sm line-clamp-2">{s.description}</p>
                      
                      <div className="flex items-start gap-2 text-white/40 text-xs">
                        <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{s.rue || s.address || s.ville || "Fianarantsoa"}</span>
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
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
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