import { useEffect, useState } from "react";
import { Camera, MapPin, Send, Trash2, Edit2, X, Shield, Road, Lightbulb, Trash, Droplets } from "lucide-react";

export default function Signaler() {
  const [signalements, setSignalements] = useState([]);
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

  // Catégories avec leurs icônes et couleurs
  const categories = [
    { 
      id: "VOIRIE", 
      name: "Voirie / Routes", 
      icon: Road, 
      color: "from-green-800 to-green-700",
      borderColor: "border-blue-500/50",
      description: "Nids-de-poule, trottoirs endommagés, signalisation"
    },
    { 
      id: "ECLAIRAGE", 
      name: "Éclairage Public", 
      icon: Lightbulb, 
      color: "from-green-600 to-green-500",
      borderColor: "border-yellow-500/50",
      description: "Lampadaires défectueux, manque d'éclairage"
    },
    { 
      id: "DECHETS", 
      name: "Déchets / Propreté", 
      icon: Trash, 
      color: "from-teal-600 to-teal-500",
      borderColor: "border-green-500/50",
      description: "Dépôts sauvages, poubelles pleines, saleté"
    },
    { 
      id: "EAU", 
      name: "Eau / Assainissement", 
      icon: Droplets, 
      color: "from-green-400 to-green-300",
      borderColor: "border-cyan-500/50",
      description: "Canalisations bouchées, inondations, fuites d'eau"
    }
  ];

  // Fonction améliorée pour convertir les coordonnées en adresse à Madagascar
  const getAddressFromCoordinates = async (lat, lng) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr&countrycodes=mg`,
        {
          headers: {
            'User-Agent': 'SmartCityApp/1.0'
          }
        }
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
        
        return {
          fullAddress: finalAddress,
          ville: finalVille,
          commune: commune
        };
      }
      
      return {
        fullAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        ville: "",
        commune: ""
      };
    } catch (error) {
      console.error("Erreur de géocodage:", error);
      return {
        fullAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        ville: "",
        commune: ""
      };
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Validation des champs
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
      case 'ville':
        if (!value.trim() && !formData.latitude) return "La ville est requise";
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

  const validatePosition = () => {
    if (!formData.latitude || !formData.longitude || formData.latitude === "" || formData.longitude === "") {
      if (!manualLocation && !formData.ville) {
        return "La position est obligatoire. Veuillez cliquer sur 'Ma position' ou sélectionner une ville";
      }
    }
    return null;
  };

  const validateImages = () => {
    if (images.length === 0) {
      return "Au moins une image est obligatoire";
    }
    return null;
  };

  const handleFieldChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const validateForm = () => {
    const newErrors = {};
    newErrors.titre = validateField('titre', formData.titre);
    newErrors.description = validateField('description', formData.description);
    if (formData.imageUrl) {
      newErrors.imageUrl = validateField('imageUrl', formData.imageUrl);
    }
    
    const positionError = validatePosition();
    if (positionError) {
      newErrors.position = positionError;
    }
    
    const imagesError = validateImages();
    if (imagesError) {
      newErrors.images = imagesError;
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== null);
  };

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

  const getGeolocation = () => {
    setManualLocation(false);
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            
            console.log("Coordonnées détectées:", { latitude, longitude });
            
            const addressData = await getAddressFromCoordinates(latitude, longitude);
            
            console.log("Adresse convertie:", addressData);
            
            setFormData({ 
                ...formData, 
                latitude: latitude.toString(), 
                longitude: longitude.toString(),
                address: addressData.fullAddress,
                ville: addressData.ville,
                commune: addressData.commune
            });
            
            if (errors.position) {
                setErrors({ ...errors, position: null });
            }
        },
        (error) => {
            console.error("Erreur GPS:", error);
            setMessage("Impossible de détecter votre position. Veuillez sélectionner votre ville manuellement.");
            setIsSuccess(false);
            setShowModal(true);
            setManualLocation(true);
            setTimeout(() => setShowModal(false), 3000);
        }
    );
  };

  const handleVilleChange = (ville) => {
    setFormData({ 
      ...formData, 
      ville: ville,
      address: ville,
      latitude: "",
      longitude: ""
    });
    setManualLocation(true);
    if (errors.position) {
      setErrors({ ...errors, position: null });
    }
  };

  const addImage = () => {
    if (formData.imageUrl) {
      if (!errors.imageUrl) {
        setImages([...images, { url: formData.imageUrl }]);
        setFormData({ ...formData, imageUrl: "" });
        if (errors.images) {
          setErrors({ ...errors, images: null });
        }
      } else {
        setMessage(errors.imageUrl);
        setIsSuccess(false);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
      }
    } else {
      setMessage("Veuillez entrer une URL d'image");
      setIsSuccess(false);
      setShowModal(true);
      setTimeout(() => setShowModal(false), 1500);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, idx) => idx !== index);
    setImages(newImages);
    if (newImages.length === 0) {
      setErrors({ ...errors, images: "Au moins une image est obligatoire" });
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        setMessage("Veuillez corriger les erreurs dans le formulaire");
        setIsSuccess(false);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
        return;
    }

    if (!token) {
        setMessage("Token manquant, veuillez vous reconnecter");
        setIsSuccess(false);
        setShowModal(true);
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
        address: formData.address || formData.ville || "",
        ville: formData.ville || "",
        commune: formData.commune || "",
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
            const savedSignalement = await res.json();
            console.log("Signalement sauvegardé:", savedSignalement);
            
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
            setEditingId(null);
            setManualLocation(false);
            fetchSignalements();
            
            setMessage(editingId ? "Signalement modifié avec succès !" : "Signalement créé avec succès !");
            setIsSuccess(true);
            setShowModal(true);
            setTimeout(() => setShowModal(false), 2000);
        } else {
            const errorText = await res.text();
            console.error("Erreur réponse:", res.status, errorText);
            setMessage(`Erreur: ${errorText || "Une erreur est survenue"}`);
            setIsSuccess(false);
            setShowModal(true);
            setTimeout(() => setShowModal(false), 3000);
        }
    } catch (error) {
        console.error("Erreur réseau:", error);
        setMessage("Erreur réseau, veuillez réessayer");
        setIsSuccess(false);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
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
  };

  const token = localStorage.getItem("token");

  // Récupérer la catégorie sélectionnée
  const selectedCategory = categories.find(c => c.id === formData.type);

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
                {isSuccess ? "Succès !" : deleteConfirmId ? "Confirmation" : "Erreur !"}
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
                  {editingId ? " Modifier le signalement" : " Nouveau signalement"}
                </h2>
                <p className="text-white/80 text-xs sm:text-sm">
                  Signalez un problème dans votre quartier à Madagascar
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-white/80 text-xs font-medium">Titre du signalement *</label>
                <div className={`transition-all duration-300 ${focusedField === 'titre' ? 'scale-[1.01]' : ''}`}>
                  <input
                    type="text" 
                    placeholder="Ex: Nid-de-poule dangereux" 
                    value={formData.titre || ""} 
                    required
                    onChange={(e) => handleFieldChange('titre', e.target.value)}
                    onFocus={() => setFocusedField('titre')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full bg-white/10 border rounded-xl px-4 py-2.5 text-white placeholder-white/70 focus:outline-none focus:ring-2 transition-all text-sm backdrop-blur-md ${
                      errors.titre 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-white/20 focus:border-emerald-500 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>
                {errors.titre && (
                  <p className="text-red-400 text-xs mt-1">{errors.titre}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-white/80 text-xs font-medium text-center block">Catégorie *</label>
                <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = formData.type === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setFormData({...formData, type: category.id})}
                        className={`
                          relative p-2 sm:p-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02]
                          ${isSelected 
                            ? `bg-gradient-to-r ${category.color} text-white shadow-lg scale-[1.02]` 
                            : `bg-white/10 border border-white/20 text-white/70 hover:bg-white/20`
                          }
                        `}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Icon size={18} className={isSelected ? "text-white" : category.iconColor} />
                          <span className="text-[10px] sm:text-xs font-medium text-center">
                            {category.name.split(' ')[0]}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedCategory && (
                  <p className="text-emerald-300 text-xs mt-1 text-center">
                    {selectedCategory.description}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-white/80 text-xs font-medium">Description *</label>
                <textarea
                  placeholder="Décrivez précisément le problème..." 
                  value={formData.description || ""} 
                  required
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className={`w-full bg-white/10 border rounded-xl px-4 py-2.5 text-white placeholder-white/70 focus:outline-none focus:ring-2 transition-all text-sm backdrop-blur-md h-28 resize-none ${
                    errors.description 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-white/20 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                />
                {errors.description && (
                  <p className="text-red-400 text-xs mt-1">{errors.description}</p>
                )}
                <p className="text-white/50 text-xs text-right">
                  {formData.description.length}/500 caractères
                </p>
              </div>

              {/* Localisation avec option GPS ou manuelle */}
              <div className="space-y-3">
                <label className="text-white/80 text-xs font-medium">Localisation *</label>
                
                {/* Option 1: GPS */}
                <div className={`bg-emerald-600/20 backdrop-blur-sm p-4 rounded-xl border ${errors.position && !formData.ville && !formData.latitude ? 'border-red-500' : 'border-emerald-500/30'}`}>
                  <button
                    type="button" 
                    onClick={getGeolocation} 
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-all transform hover:scale-[1.02] text-sm w-full justify-center mb-3"
                    disabled={isLoadingAddress}
                  >
                    <MapPin size={16} /> 
                    {isLoadingAddress ? "Chargement..." : " Utiliser ma position GPS"}
                  </button>
                  
                  {formData.address && (
                    <div className="text-white text-sm mt-2 p-2 bg-white/10 rounded-lg">
                      <span className="text-emerald-300"> Adresse détectée :</span><br />
                      {formData.address}
                    </div>
                  )}
                </div>

                {/* Option 2: Sélection manuelle de la ville */}
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <p className="text-white/70 text-xs mb-2">Ou sélectionnez votre ville manuellement :</p>
                  <select
                    value={formData.ville || ""}
                    onChange={(e) => handleVilleChange(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm backdrop-blur-md"
                  >
                    <option value="" className="bg-slate-800">-- Sélectionnez une ville --</option>
                    {availableCities.sort().map((city) => (
                      <option key={city} value={city} className="bg-slate-800">
                        {city}
                      </option>
                    ))}
                  </select>
                  {formData.ville && (
                    <p className="text-emerald-300 text-xs mt-2">
                      ✓ Ville sélectionnée : {formData.ville}
                    </p>
                  )}
                </div>

                {errors.position && (
                  <p className="text-red-400 text-xs mt-1">{errors.position}</p>
                )}
              </div>

              {/* Images - OBLIGATOIRES */}
              <div className="space-y-2">
                <label className="text-white/80 text-xs font-medium">Images * (au moins une)</label>
                <div className={`flex gap-3 p-4 rounded-xl border ${
                  errors.images && images.length === 0 ? 'border-red-500' : 'border-white/20'
                }`}>
                  <input
                    type="text" 
                    placeholder="URL de l'image" 
                    value={formData.imageUrl || ""}
                    onChange={(e) => handleFieldChange('imageUrl', e.target.value)}
                    className={`flex-1 bg-white/10 border rounded-xl px-4 py-2.5 text-white placeholder-white/70 focus:outline-none focus:ring-2 transition-all text-sm backdrop-blur-md ${
                      errors.imageUrl 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-white/20 focus:border-emerald-500 focus:ring-emerald-500/20'
                    }`}
                  />
                  <button 
                    type="button" 
                    onClick={addImage} 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 text-sm"
                  >
                    <Camera size={18}/> Ajouter
                  </button>
                </div>
                {errors.imageUrl && (
                  <p className="text-red-400 text-xs mt-1">{errors.imageUrl}</p>
                )}
                {errors.images && images.length === 0 && (
                  <p className="text-red-400 text-xs mt-1">{errors.images}</p>
                )}
                
                {images.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 mt-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative group flex-shrink-0">
                        <img src={img.url} className="w-20 h-20 object-cover rounded-lg border-2 border-white/30 shadow-lg" alt="Preview" />
                        <button 
                          type="button"
                          onClick={() => removeImage(i)} 
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
                      address: "",
                      ville: "",
                      commune: "",
                      imageUrl: ""
                    });
                    setImages([]);
                    setErrors({});
                    setManualLocation(false);
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
            <h3 className="text-xl font-bold text-white"> Tous les signalements</h3>
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