import { API_URL } from "./config/api";
import { useEffect, useState, useRef } from "react";
import { 
  Camera, MapPin, Send, Trash2, Edit2, X, Shield, Road, 
  Lightbulb, Trash, Droplets, Search, Filter, Calendar, User,
  Clock, CheckCircle, RefreshCw, Maximize2, ChevronLeft, ChevronRight,
  TreePine, Bus, Shield as ShieldIcon, Building2 as BuildingIcon,
  AlertTriangle, XCircle, PlayCircle, Loader, Navigation2, Building2, Home, Target, LocateFixed, CheckCircle as CheckCircleIcon,
  Grid, List, Plus, Image as ImageIcon, FolderOpen
} from "lucide-react";
import { useI18n } from "./context/AppContext";

// 📍 Quartiers/fokontany connus d'Antananarivo.
// ⚠️ Coordonnées APPROXIMATIVES (centre du quartier) — à ajuster librement.
// Le point GPS est "aimanté" vers le quartier connu le plus proche : c'est
// gratuit, hors-ligne, et robuste à l'imprécision Wi-Fi (~500 m) des ordinateurs.
// 👉 Pour ajouter/corriger : mettez-vous dans le quartier, lisez les coordonnées
//    affichées par l'app en mode GPS, puis copiez-les ici (une ligne par quartier).
const QUARTIERS_CONNUS = [
  { nom: "67ha", lat: -18.9130, lng: 47.5150 },
  { nom: "67ha Sud", lat: -18.9165, lng: 47.5140 },
  { nom: "Analakely", lat: -18.9096, lng: 47.5237 },
  { nom: "Antaninarenina", lat: -18.9086, lng: 47.5262 },
  { nom: "Isotry", lat: -18.9086, lng: 47.5175 },
  { nom: "Tsaralalàna", lat: -18.9066, lng: 47.5223 },
  { nom: "Behoririka", lat: -18.9038, lng: 47.5288 },
  { nom: "Andravoahangy", lat: -18.9018, lng: 47.5345 },
  { nom: "Ampefiloha", lat: -18.9122, lng: 47.5182 },
  { nom: "Anosy", lat: -18.9190, lng: 47.5238 },
  { nom: "Mahamasina", lat: -18.9205, lng: 47.5268 },
  { nom: "Ambohijatovo", lat: -18.9150, lng: 47.5288 },
  { nom: "Faravohitra", lat: -18.9075, lng: 47.5300 },
  { nom: "Andohalo", lat: -18.9128, lng: 47.5300 },
  { nom: "Antanimena", lat: -18.9020, lng: 47.5232 },
  { nom: "Ankorondrano", lat: -18.8790, lng: 47.5250 },
  { nom: "Andraharo", lat: -18.8730, lng: 47.5170 },
  { nom: "Ivandry", lat: -18.8640, lng: 47.5290 },
  { nom: "Ambodivona", lat: -18.8930, lng: 47.5290 },
  { nom: "Ankadifotsy", lat: -18.9000, lng: 47.5290 },
  { nom: "Soanierana", lat: -18.9240, lng: 47.5170 },
  { nom: "Anosibe", lat: -18.9280, lng: 47.5190 },
  { nom: "Ambohipo", lat: -18.9160, lng: 47.5470 },
  { nom: "Ankatso", lat: -18.9180, lng: 47.5440 },
  { nom: "Ampandrana", lat: -18.9020, lng: 47.5330 },
];

// Distance en mètres entre deux points GPS (formule de haversine).
const distanceMetres = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Renvoie le quartier connu le plus proche s'il est dans le rayon (en mètres), sinon null.
const trouverQuartierProche = (lat, lng, seuilMetres = 1500) => {
  let best = null;
  for (const q of QUARTIERS_CONNUS) {
    const d = distanceMetres(lat, lng, q.lat, q.lng);
    if (d <= seuilMetres && (!best || d < best.distance)) {
      best = { nom: q.nom, distance: d };
    }
  }
  return best;
};

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
  
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [manualQuartier, setManualQuartier] = useState("");
  const [manualRue, setManualRue] = useState("");
  const [manualVille, setManualVille] = useState("");
  
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("TOUS");
  const [filterStatus, setFilterStatus] = useState("TOUS");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const [originalFormData, setOriginalFormData] = useState(null);
  const [originalImages, setOriginalImages] = useState([]);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { t } = useI18n();

  // Anciennes valeurs de type (données historiques) -> catégorie actuelle
  const LEGACY_TYPE_ALIAS = {
    DECHETS: "PROPRETE", DECHET: "PROPRETE", ORDURES: "PROPRETE",
    ROUTE: "VOIRIE", ROUTES: "VOIRIE",
    ECLAIRAGE_PUBLIC: "ECLAIRAGE", LAMPADAIRE: "ECLAIRAGE",
    TRANSPORT: "TRANSPORTS", EAUX: "EAU",
    ESPACE_VERT: "ESPACES_VERTS", ESPACES_VERT: "ESPACES_VERTS",
  };

  const categories = [
    { id: "VOIRIE", name: t("cat.VOIRIE"), icon: Road, color: "from-orange-500 to-orange-400", iconColor: "text-orange-400" },
    { id: "ECLAIRAGE", name: t("cat.ECLAIRAGE"), icon: Lightbulb, color: "from-yellow-500 to-yellow-400", iconColor: "text-yellow-400" },
    { id: "PROPRETE", name: t("cat.PROPRETE"), icon: Trash, color: "from-red-500 to-red-400", iconColor: "text-red-400" },
    { id: "EAU", name: t("cat.EAU"), icon: Droplets, color: "from-blue-500 to-blue-400", iconColor: "text-blue-400" },
    { id: "ESPACES_VERTS", name: t("cat.ESPACES_VERTS"), icon: TreePine, color: "from-emerald-500 to-emerald-400", iconColor: "text-emerald-400" },
    { id: "TRANSPORTS", name: t("cat.TRANSPORTS"), icon: Bus, color: "from-purple-500 to-purple-400", iconColor: "text-purple-400" },
    { id: "SECURITE", name: t("cat.SECURITE"), icon: Shield, color: "from-slate-500 to-slate-400", iconColor: "text-slate-400" },
    { id: "URBANISME", name: t("cat.URBANISME"), icon: Building2, color: "from-cyan-500 to-cyan-400", iconColor: "text-cyan-400" }
  ];

  // Retrouve la catégorie d'un type, en tenant compte des anciennes valeurs.
  const resolveCat = (type) =>
    categories.find(c => c.id === type) ||
    categories.find(c => c.id === LEGACY_TYPE_ALIAS[type]);

  const getStatusColor = (statut) => {
    const colors = {
      'EN_ATTENTE': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      'EN_COURS': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      'RESOLU': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      'TRAITE': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      'REJETE': 'text-red-400 bg-red-500/10 border-red-500/20'
    };
    return colors[statut] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  };

  const getStatusIcon = (statut) => {
    const icons = {
      'EN_ATTENTE': AlertTriangle,
      'EN_COURS': PlayCircle,
      'RESOLU': CheckCircle,
      'TRAITE': CheckCircle,
      'REJETE': XCircle
    };
    return icons[statut] || AlertTriangle;
  };

  const getStatusText = (statut) => {
    const label = t(`status.${statut}`);
    return label === `status.${statut}` ? statut : label;
  };

  const getStatusBadgeStyle = (statut) => {
    const styles = {
      'EN_ATTENTE': 'bg-amber-500/10 text-amber-400',
      'EN_COURS': 'bg-blue-500/10 text-blue-400',
      'RESOLU': 'bg-emerald-500/10 text-emerald-400',
      'REJETE': 'bg-red-500/10 text-red-400'
    };
    return styles[statut] || 'bg-gray-500/10 text-gray-400';
  };

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

  // Résout une adresse à partir de coordonnées :
  // 1) essaie le backend (Google, clé côté serveur) ;
  // 2) si indisponible (204) ou erreur, retombe sur OpenStreetMap.
  const resolveAddressFromCoordinates = async (lat, lng) => {
    let base = null;

    // 1) Google via le backend (actif uniquement si une clé est configurée côté serveur)
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${API_URL}/api/geocode/reverse?lat=${lat}&lng=${lng}`,
        { headers: token ? { "Authorization": `Bearer ${token}` } : {} }
      );
      // 200 => Google a répondu ; 204 => pas de clé/échec => fallback OSM
      if (res.ok && res.status !== 204) {
        const g = await res.json();
        if (g && g.source === "google") {
          base = {
            fullAddress: g.fullAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            ville: g.ville || "Fianarantsoa",
            commune: g.commune || "",
            quartier: g.quartier || "",
            fokontany: g.fokontany || "",
            lieuDit: g.lieuDit || "",
            rue: g.rue || "",
            latitude: lat,
            longitude: lng
          };
        }
      }
    } catch (e) {
      console.warn("Géocodage Google indisponible, bascule sur OpenStreetMap:", e);
    }

    // 2) Repli OpenStreetMap (gratuit) si Google n'a rien donné
    if (!base) {
      base = await getDetailedAddressFromCoordinates(lat, lng);
    }

    // 3) "Aimantage" vers le quartier connu le plus proche (gratuit, hors-ligne,
    //    robuste à l'imprécision Wi-Fi). Il prime sur le quartier renvoyé par la carte.
    const local = trouverQuartierProche(lat, lng);
    if (local) {
      base.quartier = local.nom;
    }

    return base;
  };

  const getDetailedAddressFromCoordinates = async (lat, lng) => {
    setIsLoadingAddress(true);
    try {
      const isFianarantsoaArea = lat >= -22.5 && lat <= -20.5 && lng >= 46.5 && lng <= 47.8;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1&accept-language=fr`,
        { headers: { 'User-Agent': 'SmartCityApp/1.0' } }
      );
      const data = await response.json();
      
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
        
        const addressData = await resolveAddressFromCoordinates(
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
        
        const isPrecise = accuracy <= 100;
        let successMessage = isPrecise
          ? `✓ Position détectée (précision ±${Math.round(accuracy)}m)`
          : `⚠️ Position approximative (précision ±${Math.round(accuracy)}m)`;
        if (addressData.quartier) successMessage += `\n📍 Quartier détecté: ${addressData.quartier}`;
        if (addressData.rue) successMessage += `\n🏠 Rue: ${addressData.rue}`;
        if (!isPrecise) {
          successMessage += `\n\n${t("sig.lowPrecisionMsg")}`;
        }

        setMessage(successMessage);
        setIsSuccess(true);
        setShowModal(true);
        setTimeout(() => setShowModal(false), isPrecise ? 3000 : 7000);
        
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
        if (!value.trim()) return t("val.titleRequired");
        if (value.length < 3) return t("val.titleMin3");
        if (value.length > 100) return t("val.titleMax100");
        return null;
      case 'description':
        if (!value.trim()) return t("val.descRequired");
        if (value.length < 10) return t("val.descMin10");
        if (value.length > 500) return t("val.descMax500");
        return null;
      case 'imageUrl':
        if (value && !value.match(/^https?:\/\/.+\..+/)) {
          return t("val.imageUrlInvalid");
        }
        return null;
      default:
        return null;
    }
  };

  const validateImages = () => images.length === 0 ? t("val.imageRequired") : null;

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
      const response = await fetch(`${API_URL}/api/auth/me`, {
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
      const res = await fetch(`${API_URL}/api/signalements`, {
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

  // Couper la caméra si le composant est démonté pendant qu'elle est active
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Détecter les appareils mobiles (pour n'afficher "Prendre une photo" que sur mobile)
  useEffect(() => {
    const check = () => {
      const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
      const ua = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      setIsMobile(Boolean(coarse || ua));
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  // Compresse/redimensionne une image (max 1280px, JPEG) pour éviter des fichiers trop lourds
  const compressImage = (file, maxSize = 1280, quality = 0.7) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height >= width && height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Appelé par les inputs "appareil photo" et "galerie / fichiers"
  const handleFileSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const newOnes = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const dataUrl = await compressImage(file);
        newOnes.push({ url: dataUrl });
      }
      if (newOnes.length > 0) {
        setImages((prev) => [...prev, ...newOnes]);
        if (errors.images) setErrors({ ...errors, images: null });
      }
    } catch (err) {
      console.error(err);
      setMessage("Impossible de charger cette image. Veuillez réessayer avec une autre.");
      setIsSuccess(false);
      setShowModal(true);
    } finally {
      e.target.value = ""; // permet de re-sélectionner le même fichier
    }
  };

  // Ouvre la caméra (webcam sur ordinateur, caméra arrière sur mobile).
  // Si indisponible (pas de webcam / accès refusé), bascule sur l'explorateur.
  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      fileInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      streamRef.current = stream;
      setShowCamera(true);
      // Attacher le flux après le rendu du <video>
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 0);
    } catch (err) {
      console.error("Accès caméra impossible:", err);
      setMessage("Impossible d'accéder à la caméra (absente ou accès refusé). Ouverture de l'explorateur de fichiers…");
      setIsSuccess(false);
      setShowModal(true);
      setTimeout(() => setShowModal(false), 2500);
      fileInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const closeCamera = () => {
    stopCamera();
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const maxSize = 1280;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > h && w > maxSize) {
      h = Math.round((h * maxSize) / w);
      w = maxSize;
    } else if (h >= w && h > maxSize) {
      w = Math.round((w * maxSize) / h);
      h = maxSize;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    setImages((prev) => [...prev, { url: dataUrl }]);
    if (errors.images) setErrors({ ...errors, images: null });
    closeCamera();
  };

  const confirmDelete = (id) => {
    setDeleteConfirmId(id);
    setMessage(t("sig.deleteConfirm"));
    setIsSuccess(false);
    setShowModal(true);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`${API_URL}/api/signalements/${deleteConfirmId}`, { 
        method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSignalements();
        if (editingId === deleteConfirmId) {
          handleCancelEdit();
        }
        setMessage(t("sig.deletedOk"));
        setIsSuccess(true);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
      } else {
        setMessage(res.status === 401 || res.status === 403
          ? "Vous n'êtes pas autorisé à supprimer ce signalement."
          : "Impossible de supprimer le signalement pour le moment. Veuillez réessayer.");
        setIsSuccess(false);
        setShowModal(true);
      }
    } catch (error) {
      console.error(error);
      setMessage("Connexion au serveur impossible. Vérifiez votre connexion Internet et réessayez.");
      setIsSuccess(false);
      setShowModal(true);
    }
    finally { setDeleteConfirmId(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    if (!validateForm()) {
      setMessage(t("sig.fixErrors"));
      setIsSuccess(false);
      setShowModal(true);
      setTimeout(() => setShowModal(false), 3000);
      return;
    }

    const method = editingId ? "PUT" : "POST";
    const url = `${API_URL}/api/signalements${editingId ? `/${editingId}` : ''}`;
    
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
        setMessage(editingId ? t("sig.updatedOk") : t("sig.createdOk"));
        setIsSuccess(true);
        setShowModal(true);
        setTimeout(() => setShowModal(false), 2000);
      } else {
        if (res.status === 401 || res.status === 403) {
          setMessage("Vous n'avez pas les droits nécessaires pour effectuer cette action.");
        } else {
          setMessage(editingId
            ? "Impossible de modifier le signalement pour le moment. Veuillez réessayer."
            : "Impossible d'enregistrer votre signalement pour le moment. Veuillez réessayer.");
        }
        setIsSuccess(false);
        setShowModal(true);
      }
    } catch (error) {
      console.error(error);
      setMessage("Connexion au serveur impossible. Vérifiez votre connexion Internet et réessayez.");
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
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Module Caméra */}
      {showCamera && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-lg border border-white/10 overflow-hidden">
            <div className="relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-[70vh] object-contain"
              />
              <button
                type="button"
                onClick={closeCamera}
                className="absolute top-3 right-3 p-2 bg-black/50 rounded-full hover:bg-black/70 text-white/80 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex items-center gap-3">
              <button
                type="button"
                onClick={closeCamera}
                className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 transition font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 py-3 rounded-xl bg-blue-500/80 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-2 transition"
              >
                <Camera size={18} /> {t("sig.capture")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#1a1a2e] rounded-2xl p-6 max-w-sm w-full border border-white/10">
            <div className="text-center">
              <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {isSuccess ? <Shield className="w-7 h-7" /> : deleteConfirmId ? <div className="text-2xl font-bold">?</div> : <div className="text-2xl font-bold">!</div>}
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isSuccess ? 'text-emerald-400' : deleteConfirmId ? 'text-amber-400' : 'text-red-400'}`}>
                {isSuccess ? t("sig.success") : deleteConfirmId ? t("sig.confirmation") : t("sig.info")}
              </h3>
              <p className="text-white/60 text-sm mb-6 whitespace-pre-line">{message}</p>
              {deleteConfirmId ? (
                <div className="flex gap-3">
                  <button onClick={() => { setDeleteConfirmId(null); setShowModal(false); }} className="flex-1 py-2 rounded-xl font-semibold bg-white/5 text-white/60 hover:bg-white/10 transition">{t("common.cancel")}</button>
                  <button onClick={handleDelete} className="flex-1 py-2 rounded-xl font-semibold text-white bg-red-500/80 hover:bg-red-500 transition">{t("sig.delete")}</button>
                </div>
              ) : (
                <button onClick={() => setShowModal(false)} className={`w-full py-2 rounded-xl font-semibold text-white ${isSuccess ? 'bg-emerald-500/80 hover:bg-emerald-500' : 'bg-white/10 hover:bg-white/20'} transition`}>{t("sig.close")}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de détail */}
      {showDetailModal && selectedSignalement && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#1a1a2e] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 animate-modal-pop custom-scrollbar">
            
            {selectedSignalement.images && selectedSignalement.images.length > 0 && (
              <div className="relative h-64 md:h-96 overflow-hidden rounded-t-2xl bg-[#0f0f1a]">
                <img 
                  src={selectedSignalement.images[currentImageIndex].url} 
                  className="w-full h-full object-contain transition-opacity duration-300" 
                  alt={`Image ${currentImageIndex + 1}`} 
                />
                
                {selectedSignalement.images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition text-white/60 hover:text-white z-20">
                      <ChevronLeft size={24} />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition text-white/60 hover:text-white z-20">
                      <ChevronRight size={24} />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                      {selectedSignalement.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentImageIndex 
                              ? 'bg-blue-400 w-6' 
                              : 'bg-white/30 hover:bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                <button onClick={closeDetailModal} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition text-white/60 hover:text-white z-20">
                  <X size={20} />
                </button>
              </div>
            )}
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl bg-gradient-to-r ${resolveCat(selectedSignalement.type)?.color || 'from-emerald-500 to-green-600'}`}>
                    {(() => {
                      const Icon = resolveCat(selectedSignalement.type)?.icon || Road;
                      return <Icon size={20} className="text-white" />;
                    })()}
                  </div>
                  <span className="text-white/60 text-sm font-medium">{resolveCat(selectedSignalement.type)?.name || selectedSignalement.type}</span>
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
                <h3 className="text-white/40 text-xs font-medium mb-2 uppercase tracking-wider">{t("sig.descrTitle")}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{selectedSignalement.description}</p>
              </div>
              
              <div>
                <h3 className="text-white/40 text-xs font-medium mb-2 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={14} />
                  {t("sig.locationTitle")}
                </h3>
                <div className="bg-white/5 rounded-lg p-3 space-y-2 border border-white/5">
                  {selectedSignalement.quartier && (
                    <div className="flex items-start gap-2">
                      <Building2 size={14} className="text-blue-400 mt-0.5" />
                      <div>
                        <span className="text-white/30 text-[10px]">{t("sig.quartier")}</span>
                        <p className="text-white text-sm">{selectedSignalement.quartier}</p>
                      </div>
                    </div>
                  )}
                  {selectedSignalement.rue && (
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-blue-400 mt-0.5" />
                      <div>
                        <span className="text-white/30 text-[10px]">{t("sig.street")}</span>
                        <p className="text-white text-sm">{selectedSignalement.rue}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-blue-400 mt-0.5" />
                    <div>
                      <span className="text-white/30 text-[10px]">{t("sig.city")}</span>
                      <p className="text-white text-sm">{selectedSignalement.ville || selectedSignalement.commune || "Fianarantsoa"}</p>
                    </div>
                  </div>
                  {selectedSignalement.latitude && selectedSignalement.longitude && (
                    <div className="flex items-start gap-2 pt-2 border-t border-white/5">
                      <Target size={14} className="text-blue-400 mt-0.5" />
                      <div>
                        <span className="text-white/30 text-[10px]">{t("sig.gps")}</span>
                        <p className="text-white/40 text-xs font-mono">
                          {parseFloat(selectedSignalement.latitude).toFixed(6)}, {parseFloat(selectedSignalement.longitude).toFixed(6)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-white/30 text-[10px] uppercase tracking-wider mb-1">
                    <Calendar size={12} />
                    <span>{t("sig.date")}</span>
                  </div>
                  <p className="text-white text-sm">{formatDate(selectedSignalement.dateCreation)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-white/30 text-[10px] uppercase tracking-wider mb-1">
                    <User size={12} />
                    <span>{t("sig.author")}</span>
                  </div>
                  <p className="text-white text-sm">{selectedSignalement.utilisateur?.nom || t("sig.anonymous")}</p>
                </div>
              </div>
              
              {(canEdit(selectedSignalement) || canDelete(selectedSignalement)) && (
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  {canEdit(selectedSignalement) && (
                    <button onClick={() => { closeDetailModal(); handleEdit(selectedSignalement); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition text-sm font-medium">
                      <Edit2 size={16} /> {t("sig.edit")}
                    </button>
                  )}
                  {canDelete(selectedSignalement) && (
                    <button onClick={() => { closeDetailModal(); confirmDelete(selectedSignalement.id); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition text-sm font-medium">
                      <Trash2 size={16} /> {t("sig.delete")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto max-w-6xl px-4 py-6">
        
        {/* Formulaire de signalement */}
        <div className="relative bg-[#1a1a2e] rounded-2xl border border-white/5 overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500" />
          
          <div className="relative p-6 md:p-8">
            <form onSubmit={handleSubmit} className="relative space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                  {editingId ? <Edit2 size={22} className="text-blue-400" /> : <Camera size={22} className="text-blue-400" />}
                  {editingId ? t("sig.editTitle") : t("sig.newTitle")}
                </h2>
                <p className="text-white/30 text-sm">{t("sig.subtitle")}</p>
              </div>

              <div>
                <input 
                  type="text" 
                  placeholder={t("sig.titlePlaceholder")}
                  value={formData.titre || ""} 
                  onChange={(e) => handleFieldChange('titre', e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition" 
                />
                {errors.titre && <p className="text-red-400 text-xs mt-1">{errors.titre}</p>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = formData.type === category.id;
                  return (
                    <button 
                      key={category.id} 
                      type="button" 
                      onClick={() => setFormData({...formData, type: category.id})} 
                      className={`p-3 rounded-xl transition-all duration-300 ${
                        isSelected 
                          ? `bg-gradient-to-r ${category.color} text-white shadow-lg scale-[1.02]` 
                          : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Icon size={18} className={isSelected ? "text-white" : category.iconColor} />
                        <span className="text-[10px]">{category.name.split(' ')[0]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <textarea 
                  placeholder={t("sig.descPlaceholder")}
                  value={formData.description || ""} 
                  onChange={(e) => handleFieldChange('description', e.target.value)} 
                  rows="3" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition" 
                />
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
              </div>

              {/* Localisation */}
              <div className="space-y-3">
                <label className="text-white/40 text-xs uppercase tracking-wider flex items-center gap-2">
                  <LocateFixed size={14} className="text-blue-400" />
                  {t("sig.locLabel")}
                </label>
                
                {!isManualLocation ? (
                  <div className="space-y-2">
                    <button 
                      type="button" 
                      onClick={getGeolocation}
                      disabled={isGettingLocation}
                      className="w-full flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium py-3 rounded-xl transition border border-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          {t("sig.detecting")}
                        </>
                      ) : (
                        <>
                          <LocateFixed size={18} />
                          {t("sig.detectGps")}
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={activateManualMode}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 font-medium py-2.5 rounded-xl transition"
                    >
                      <MapPin size={16} />
                      {t("sig.manualEntry")}
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-amber-400 text-sm flex items-center gap-2 font-medium">
                        <MapPin size={16} />
                        {t("sig.manualTitle")}
                      </p>
                      <button
                        type="button"
                        onClick={reactivateGpsMode}
                        className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                      >
                        <LocateFixed size={12} />
                        GPS
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-white/40 text-[10px] uppercase tracking-wider mb-1 block">{t("sig.quartier")} *</label>
                        <input
                          type="text"
                          placeholder="Ex: Soanierana, 67ha..."
                          value={manualQuartier}
                          onChange={(e) => setManualQuartier(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                      
                      <div>
                        <label className="text-white/40 text-[10px] uppercase tracking-wider mb-1 block">{t("sig.street")}</label>
                        <input
                          type="text"
                          placeholder="Nom de la rue"
                          value={manualRue}
                          onChange={(e) => setManualRue(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                      
                      <div>
                        <label className="text-white/40 text-[10px] uppercase tracking-wider mb-1 block">{t("sig.city")} *</label>
                        <input
                          type="text"
                          placeholder="Ex: Fianarantsoa"
                          value={manualVille}
                          onChange={(e) => setManualVille(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={updateManualAddress}
                        className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-medium py-2 rounded-xl transition"
                      >
                        <CheckCircleIcon size={16} className="inline mr-2" />
                        {t("sig.validateAddress")}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Affichage localisation */}
                {formData.address && (
                  <div className={`rounded-xl p-4 border ${
                    isManualLocation 
                      ? 'bg-amber-500/5 border-amber-500/20' 
                      : 'bg-blue-500/5 border-blue-500/20'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className={`text-sm flex items-center gap-2 font-medium ${
                        isManualLocation ? 'text-amber-400' : 'text-blue-400'
                      }`}>
                        <MapPin size={14} />
                        {isManualLocation ? t("sig.entered") : t("sig.detected")}
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
                          if (isManualLocation) {
                            setManualAddress("");
                            setManualQuartier("");
                            setManualRue("");
                            setManualVille("");
                          }
                        }}
                        className="text-red-400/60 hover:text-red-400 text-[10px]"
                      >
                        {t("sig.clear")}
                      </button>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      {formData.quartier && (
                        <p className="text-white"><span className="text-white/30">{t("sig.quartier")}:</span> {formData.quartier}</p>
                      )}
                      {formData.rue && (
                        <p className="text-white"><span className="text-white/30">{t("sig.street")}:</span> {formData.rue}</p>
                      )}
                      <p className="text-white"><span className="text-white/30">{t("sig.city")}:</span> {formData.ville}</p>
                      {formData.latitude && formData.longitude && (
                        <p className="text-white/40 text-xs font-mono">
                          {parseFloat(formData.latitude).toFixed(6)}°, {parseFloat(formData.longitude).toFixed(6)}°
                          {locationAccuracy && (
                            <span className={`ml-2 ${locationAccuracy <= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              (±{Math.round(locationAccuracy)}m)
                            </span>
                          )}
                        </p>
                      )}
                      {!isManualLocation && locationAccuracy && locationAccuracy > 100 && (
                        <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                          <p className="text-amber-300/90 text-[11px] leading-snug">
                            {t("sig.lowPrecisionWarn")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="space-y-3">
                <label className="text-white/40 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Camera size={14} className="text-blue-400" />
                  {t("sig.imagesLabel")} *
                  <span className="text-white/20 text-[10px]">{t("sig.atLeastOne")}</span>
                </label>
                
                {/* Champ caché : galerie / explorateur (et repli si pas de caméra) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelected}
                  className="hidden"
                />

                {/* Appareil photo (mobile uniquement) + Galerie / Explorateur */}
                <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
                  {isMobile && (
                    <button
                      type="button"
                      onClick={openCamera}
                      className="flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium py-3 rounded-xl transition border border-blue-500/20"
                    >
                      <Camera size={18} />
                      {t("sig.takePhoto")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 font-medium py-3 rounded-xl transition border border-white/10"
                  >
                    <FolderOpen size={18} />
                    {t("sig.gallery")}
                  </button>
                </div>

                {/* Séparateur "ou via une URL" */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-white/30 text-[10px] uppercase tracking-wider">{t("sig.orUrl")}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t("sig.urlPlaceholder")}
                    value={formData.imageUrl || ""}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-5 rounded-xl transition font-medium"
                  >
                    <Plus size={18} />
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
                      <img src={img.url} className="w-20 h-20 object-cover rounded-lg border border-white/10" alt={`Image ${i+1}`} />
                      <button 
                        type="button" 
                        onClick={() => removeImage(i)} 
                        className="absolute -top-2 -right-2 bg-red-500/80 rounded-full p-1 hover:bg-red-500 transition opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 hover:from-blue-500/30 hover:to-emerald-500/30 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 border border-white/10"
                >
                  <Send size={18}/> {editingId ? t("sig.update") : t("sig.send")}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-medium py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <X size={18} /> {t("common.cancel")}
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/20 w-4 h-4" />
              <input
                type="text"
                placeholder={t("sig.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex bg-white/5 rounded-xl p-0.5 border border-white/5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid" ? 'bg-blue-500/20 text-blue-400' : 'text-white/20 hover:text-white/40'
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list" ? 'bg-blue-500/20 text-blue-400' : 'text-white/20 hover:text-white/40'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl border transition-all ${
                  showFilters 
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                    : 'bg-white/5 border-white/10 text-white/20 hover:text-white/40'
                }`}
              >
                <Filter size={16} />
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <div className="mb-5">
                <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-3">{t("sig.filterType")}</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    onClick={() => setFilterType("TOUS")}
                    className={`p-3 rounded-xl transition-all ${
                      filterType === "TOUS" 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' 
                        : 'bg-white/5 text-white/40 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Filter size={16} />
                      <span className="text-[10px]">{t("sig.all")}</span>
                    </div>
                  </button>
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = filterType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setFilterType(cat.id)}
                        className={`p-3 rounded-xl transition-all ${
                          isSelected 
                            ? `bg-gradient-to-r ${cat.color} text-white border border-transparent` 
                            : 'bg-white/5 text-white/40 hover:bg-white/10 border border-transparent'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Icon size={16} className={isSelected ? "text-white" : cat.iconColor} />
                          <span className="text-[10px]">{cat.name.split(' ')[0]}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-3">{t("sig.filterStatus")}</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {['TOUS', 'EN_ATTENTE', 'EN_COURS', 'RESOLU', 'REJETE'].map((status) => {
                    const isSelected = filterStatus === status;
                    const labels = {
                      'TOUS': t("sig.all"),
                      'EN_ATTENTE': t("status.EN_ATTENTE"),
                      'EN_COURS': t("status.EN_COURS"),
                      'RESOLU': t("status.RESOLU"),
                      'REJETE': t("status.REJETE")
                    };
                    const icons = {
                      'TOUS': Filter,
                      'EN_ATTENTE': AlertTriangle,
                      'EN_COURS': PlayCircle,
                      'RESOLU': CheckCircle,
                      'REJETE': XCircle
                    };
                    const Icon = icons[status];
                    const colors = {
                      'TOUS': 'text-blue-400 border-blue-500/20',
                      'EN_ATTENTE': 'text-amber-400 border-amber-500/20',
                      'EN_COURS': 'text-blue-400 border-blue-500/20',
                      'RESOLU': 'text-emerald-400 border-emerald-500/20',
                      'REJETE': 'text-red-400 border-red-500/20'
                    };
                    return (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
                          isSelected 
                            ? `bg-white/10 ${colors[status]} border` 
                            : 'bg-white/5 text-white/30 hover:bg-white/10 border border-transparent'
                        }`}
                      >
                        <Icon size={14} />
                        <span className="text-xs">{labels[status]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(filterType !== "TOUS" || filterStatus !== "TOUS" || searchTerm) && (
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                  <span className="text-white/30 text-xs">{filteredSignalements.length} {t("sig.results")}</span>
                  <button onClick={() => { setSearchTerm(""); setFilterType("TOUS"); setFilterStatus("TOUS"); }} className="text-blue-400/60 hover:text-blue-400 text-xs flex items-center gap-1">
                    <RefreshCw size={12} />
                    {t("sig.reset")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Liste des signalements */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderOpen size={18} className="text-blue-400" />
              {t("sig.listTitle")}
            </h3>
            <span className="bg-white/5 text-white/40 px-3 py-1 rounded-full text-xs border border-white/5">
              {filteredSignalements.length}
            </span>
          </div>
          
          {filteredSignalements.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-16 text-center border border-white/5">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/30 text-sm">{t("sig.empty")}</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            }`}>
              {filteredSignalements.map((s) => {
                const category = resolveCat(s.type);
                const Icon = category?.icon || Road;
                const StatusIcon = getStatusIcon(s.statut);
                
                return (
                  <div key={s.id} className="group bg-[#1a1a2e] rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 cursor-pointer">
                    {s.images && s.images[0] && (
                      <div className="relative h-48 overflow-hidden" onClick={() => openDetailModal(s)}>
                        <img src={s.images[0].url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={s.titre} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <span className="text-white bg-blue-500/30 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10">
                            {t("sig.seeMore")}
                          </span>
                        </div>
                        {s.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-[10px] text-white/60 flex items-center gap-1 border border-white/10">
                            <ImageIcon size={10} />
                            {s.images.length}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="p-4 space-y-2" onClick={() => openDetailModal(s)}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-r ${category?.color || 'from-emerald-500 to-green-600'}`}>
                            <Icon size={12} className="text-white" />
                          </div>
                          <span className="text-[10px] text-white/40">{category?.name.split(' ')[0] || s.type}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${getStatusBadgeStyle(s.statut)}`}>
                          <StatusIcon size={10} />
                          {getStatusText(s.statut)}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-white text-base line-clamp-1 group-hover:text-blue-400 transition-colors">{s.titre}</h4>
                      
                      {s.quartier && (
                        <div className="flex items-center gap-1 text-blue-400/60 text-[10px]">
                          <Building2 size={10} />
                          <span>{s.quartier}</span>
                        </div>
                      )}
                      
                      <p className="text-white/40 text-sm line-clamp-2">{s.description}</p>
                      
                      <div className="flex items-start gap-2 text-white/20 text-[10px]">
                        <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{s.rue || s.address || s.ville || "Fianarantsoa"}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-white/20 text-[10px] pt-1 border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <Calendar size={10} />
                          <span>{formatDate(s.dateCreation)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={10} />
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
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes modal-pop {
          0% { transform: scale(0.9) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
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
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
        
        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        *::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        *::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
}