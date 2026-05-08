import { useState, useEffect, useRef } from "react";
import { 
  User, Lock, Eye, EyeOff, Edit2, X, Check, AlertCircle,
  MapPin, Clock, MessageCircle, Share2, MoreHorizontal, 
  Construction, Lightbulb, Trash2, Droplets, TreePine, 
  Shield, HelpCircle, AlertTriangle, PlayCircle, CheckCircle2,
  ChevronLeft, ChevronRight, Image, Road, Trash
} from "lucide-react";

// ✅ COMPOSANT INPUT AVEC VALIDATION
const ValidatedInput = ({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  placeholder, 
  required = true,
  minLength,
  pattern,
  errorMessage,
  onValidChange,
  className = "",
  showPasswordToggle = false,
  onTogglePassword
}) => {
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(type === "password");
  const inputRef = useRef(null);

  const validate = (val) => {
    if (required && !val.trim()) {
      return "Ce champ est requis";
    }
    if (minLength && val.length < minLength) {
      return `Minimum ${minLength} caractères`;
    }
    if (pattern && !pattern.test(val)) {
      return errorMessage || "Format invalide";
    }
    return "";
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    const validationError = validate(newValue);
    setError(validationError);
    onChange(newValue);
    if (onValidChange) {
      onValidChange(validationError === "");
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const validationError = validate(value);
    setError(validationError);
    
    // ✅ Si le champ est invalide, on empêche la perte de focus
    if (validationError && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 10);
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
    if (onTogglePassword) onTogglePassword();
  };

  const isValid = !error && value.trim() !== "";
  const currentType = showPasswordToggle ? (showPassword ? "text" : "password") : type;

  return (
    <div className="mb-3">
      <label className="text-white/80 text-xs font-medium block mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type={currentType}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setTouched(true)}
          className={`w-full bg-gray-700/50 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 transition-all ${
            showPasswordToggle ? 'pr-10' : 'pr-8'
          } ${
            touched && error 
              ? "border-red-500 focus:ring-red-500/20" 
              : isValid && touched
              ? "border-emerald-500 focus:ring-emerald-500/20"
              : "border-gray-600 focus:border-emerald-500 focus:ring-emerald-500/20"
          } ${className}`}
          placeholder={placeholder}
        />
        {touched && error && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
        )}
        {touched && isValid && !error && !showPasswordToggle && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
        )}
        {showPasswordToggle && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {touched && error && (
        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
};

export default function Profil() {
  const [userInfo, setUserInfo] = useState({ 
    nom: "", 
    email: "", 
    role: "" 
  });
  const [signalements, setSignalements] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedImages, setSelectedImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // États de validation
  const [isNomValid, setIsNomValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);
  
  const token = localStorage.getItem("token");
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchCurrentUser();
  }, [token]);

  useEffect(() => {
    if (currentUserId) {
      fetchSignalements();
    }
  }, [currentUserId]);

  const fetchUserProfile = async () => {
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8081/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo({
          nom: data.nom || data.name || "Utilisateur",
          email: data.email || data.sub || "",
          role: data.role || "CITOYEN"
        });
        setFormData({
          nom: data.nom || data.name || "Utilisateur",
          email: data.email || data.sub || "",
        });
      } else {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserInfo({
            nom: payload.nom || payload.name || payload.sub?.split('@')[0] || "Utilisateur",
            email: payload.sub || payload.email || "",
            role: payload.role || "CITOYEN"
          });
          setFormData({
            nom: payload.nom || payload.name || payload.sub?.split('@')[0] || "Utilisateur",
            email: payload.sub || payload.email || "",
          });
        } catch (error) {
          console.error("Erreur décodage token:", error);
        }
      }
    } catch (error) {
      console.error("Erreur récupération profil:", error);
    }
  };

  const fetchSignalements = async () => {
    if (!token) return;

    try {
      const response = await fetch("http://localhost:8081/api/signalements", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const mesSignalements = data.filter(s => s.utilisateur?.id === currentUserId);
        const signalementsTries = mesSignalements.sort((a, b) => {
          const dateA = new Date(a.dateCreation);
          const dateB = new Date(b.dateCreation);
          return dateB - dateA;
        });
        setSignalements(signalementsTries);
      } else {
        setSignalements([]);
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
      setSignalements([]);
    }
  };

  const fetchCurrentUser = async () => {
    if (!token) return;
    try {
      const response = await fetch("http://localhost:8081/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setCurrentUserId(userData.id);
      }
    } catch (error) {
      console.error("Erreur récupération utilisateur:", error);
    }
  };

  const validateNom = (value) => {
    if (!value.trim()) return "Le nom est requis";
    if (/\d/.test(value)) return "Le nom ne doit pas contenir de chiffres";
    const nameRegex = /^[a-zA-ZÀ-ÿ\s-]+$/;
    if (!nameRegex.test(value)) return "Le nom ne doit contenir que des lettres, espaces ou tirets";
    if (value.length < 2) return "Le nom doit contenir au moins 2 caractères";
    return null;
  };

  const validateEmail = (value) => {
    if (!value.trim()) return "L'email est requis";
    if (!value.toLowerCase().endsWith("@gmail.com")) {
      return "L'email doit être une adresse @gmail.com";
    }
    return null;
  };

  const handleUpdateProfile = async () => {
    if (!isNomValid || !isEmailValid) {
      setMessage({ type: "error", text: "Veuillez corriger les erreurs avant de valider" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8081/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nom: formData.nom,
          email: formData.email
        })
      });

      if (response.ok) {
        setUserInfo({ ...userInfo, nom: formData.nom, email: formData.email });
        setMessage({ type: "success", text: "Profil mis à jour !" });
        setIsEditing(false);
      } else {
        const error = await response.text();
        setMessage({ type: "error", text: error || "Erreur lors de la mise à jour" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (!isCurrentPasswordValid || !isNewPasswordValid || !isConfirmPasswordValid) {
      setMessage({ type: "error", text: "Veuillez corriger les erreurs avant de valider" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8081/api/auth/change-password", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Mot de passe changé !" });
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setIsCurrentPasswordValid(false);
        setIsNewPasswordValid(false);
        setIsConfirmPasswordValid(false);
      } else {
        const error = await response.text();
        setMessage({ type: "error", text: error || "Erreur lors du changement" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleDeleteSignalement = async (id) => {
    try {
      const response = await fetch(`http://localhost:8081/api/signalements/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setMessage({ type: "success", text: "Signalement supprimé !" });
        fetchSignalements();
      } else {
        setMessage({ type: "error", text: "Erreur lors de la suppression" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setShowDeleteConfirm(null);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImages) return;
      if (e.key === 'Escape') closeImageViewer();
      else if (e.key === 'ArrowLeft') prevImage();
      else if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImages, currentImageIndex]);

  const getRoleLabel = (role) => {
    const roles = {
      'ADMIN': 'Administrateur',
      'AGENT': 'Agent Municipal',
      'CITOYEN': 'Citoyen',
      'CITIZEN': 'Citoyen'
    };
    return roles[role] || role;
  };

  const categories = [
    { id: "VOIRIE", name: "Voirie", icon: Road },
    { id: "ECLAIRAGE", name: "Éclairage", icon: Lightbulb },
    { id: "DECHETS", name: "Déchets", icon: Trash },
    { id: "EAU", name: "Eau", icon: Droplets }
  ];

  const getTypeIcon = (type) => {
    const category = categories.find(c => c.id === type);
    return category?.icon || MapPin;
  };

  const getTypeColor = (type) => {
    if (type === "VOIRIE") return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    if (type === "ECLAIRAGE") return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (type === "DECHETS") return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (type === "EAU") return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  const getTypeLabel = (type) => {
    const category = categories.find(c => c.id === type);
    return category?.name || type;
  };

  const getStatusColor = (statut) => {
    const colors = {
      'EN_ATTENTE': 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      'EN_COURS': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      'RESOLU': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      'TRAITE': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
    };
    return colors[statut] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  const getStatusIcon = (statut) => {
    const icons = {
      'EN_ATTENTE': AlertTriangle,
      'EN_COURS': PlayCircle,
      'RESOLU': CheckCircle2,
      'TRAITE': CheckCircle2
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

  const getFullAddress = (signalement) => {
    if (signalement.address && signalement.address.length > 10) {
      return signalement.address;
    }
    const parts = [];
    if (signalement.address && signalement.address !== signalement.ville) parts.push(signalement.address);
    if (signalement.ville) parts.push(signalement.ville);
    if (signalement.commune && signalement.commune !== signalement.ville) parts.push(`District de ${signalement.commune}`);
    if (parts.length > 0) return parts.join(', ');
    return signalement.address || signalement.ville || signalement.commune || "Localisation inconnue";
  };

  const isProfileFormValid = isNomValid && isEmailValid;
  const isPasswordFormValid = isCurrentPasswordValid && isNewPasswordValid && isConfirmPasswordValid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="sticky top-0 z-30 bg-[#242526] border-b border-gray-700/50 shadow-lg">
        <div className="container mx-auto max-w-3xl px-4 py-3">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-400" />
            Mon profil
          </h1>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-6">
        {message.text && (
          <div className={`mb-4 p-3 rounded-xl ${
            message.type === 'success' 
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Section Profil */}
        <div className="bg-[#242526] rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
          
          <div className="px-6 pb-6">
            <div className="flex flex-row items-end justify-between -mt-12">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 border-4 border-[#242526] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-3xl font-bold">
                    {userInfo.nom?.[0]?.toUpperCase() || userInfo.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="pb-2">
                  <h2 className="text-xl font-bold text-white">{userInfo.nom}</h2>
                  <p className="text-emerald-400 text-sm">{getRoleLabel(userInfo.role)}</p>
                  <p className="text-gray-400 text-sm">{userInfo.email}</p>
                </div>
              </div>
              
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2 text-sm mb-2"
                >
                  <Edit2 size={16} />
                  Modifier profil
                </button>
              )}
            </div>

            {isEditing && (
              <div className="space-y-3 mt-4">
                <ValidatedInput
                  label="Nom complet"
                  value={formData.nom}
                  onChange={(val) => {
                    setFormData({ ...formData, nom: val });
                    const error = validateNom(val);
                    setIsNomValid(!error);
                  }}
                  placeholder="Votre nom"
                  required={true}
                  minLength={2}
                  errorMessage="Le nom doit contenir au moins 2 caractères"
                  onValidChange={(valid) => setIsNomValid(valid)}
                />

                <ValidatedInput
                  label="Email"
                  value={formData.email}
                  onChange={(val) => {
                    setFormData({ ...formData, email: val });
                    const error = validateEmail(val);
                    setIsEmailValid(!error);
                  }}
                  type="email"
                  placeholder="votre@email.com"
                  required={true}
                  pattern={/^[^\s@]+@[^\s@]+\.[^\s@]+$/}
                  errorMessage="L'email doit être une adresse @gmail.com"
                  onValidChange={(valid) => setIsEmailValid(valid)}
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isLoading || !isProfileFormValid}
                    className={`flex-1 font-semibold py-2 rounded-lg transition text-sm ${
                      !isProfileFormValid || isLoading
                        ? 'bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isLoading ? "Chargement..." : "Enregistrer"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ nom: userInfo.nom, email: userInfo.email });
                      setIsNomValid(true);
                      setIsEmailValid(true);
                    }}
                    className="px-4 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Sécurité */}
        <div className="bg-[#242526] rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={20} className="text-emerald-400" />
                <h2 className="font-semibold text-white">Sécurité</h2>
              </div>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                >
                  Changer mot de passe
                </button>
              )}
            </div>
          </div>
          
          {showPasswordForm ? (
            <div className="p-4 space-y-3">
              <ValidatedInput
                label="Mot de passe actuel"
                value={passwordData.currentPassword}
                onChange={(val) => {
                  setPasswordData({ ...passwordData, currentPassword: val });
                  setIsCurrentPasswordValid(val.length >= 6);
                }}
                type="password"
                placeholder="••••••••"
                required={true}
                minLength={6}
                errorMessage="Le mot de passe doit contenir au moins 6 caractères"
                onValidChange={(valid) => setIsCurrentPasswordValid(valid)}
                showPasswordToggle={true}
              />

              <ValidatedInput
                label="Nouveau mot de passe"
                value={passwordData.newPassword}
                onChange={(val) => {
                  setPasswordData({ ...passwordData, newPassword: val });
                  setIsNewPasswordValid(val.length >= 6);
                }}
                type="password"
                placeholder="••••••••"
                required={true}
                minLength={6}
                errorMessage="Le mot de passe doit contenir au moins 6 caractères"
                onValidChange={(valid) => setIsNewPasswordValid(valid)}
                showPasswordToggle={true}
              />

              <ValidatedInput
                label="Confirmer le mot de passe"
                value={passwordData.confirmPassword}
                onChange={(val) => {
                  setPasswordData({ ...passwordData, confirmPassword: val });
                  setIsConfirmPasswordValid(val.length >= 6 && val === passwordData.newPassword);
                }}
                type="password"
                placeholder="••••••••"
                required={true}
                minLength={6}
                errorMessage={passwordData.confirmPassword !== passwordData.newPassword 
                  ? "Les mots de passe ne correspondent pas" 
                  : "Le mot de passe doit contenir au moins 6 caractères"}
                onValidChange={(valid) => setIsConfirmPasswordValid(valid)}
                showPasswordToggle={true}
              />

              <div className="flex gap-2">
                <button
                  onClick={handleChangePassword}
                  disabled={isLoading || !isPasswordFormValid}
                  className={`flex-1 font-semibold py-2 rounded-lg transition text-sm ${
                    !isPasswordFormValid || isLoading
                      ? 'bg-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isLoading ? "Chargement..." : "Changer"}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    setIsCurrentPasswordValid(false);
                    setIsNewPasswordValid(false);
                    setIsConfirmPasswordValid(false);
                  }}
                  className="px-4 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="bg-gray-700/30 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Mot de passe</p>
                <p className="text-white">••••••••</p>
              </div>
            </div>
          )}
        </div>

        {/* Section Mes signalements */}
        <div className="bg-[#242526] rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <h2 className="font-semibold text-white">Mes signalements</h2>
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                {signalements.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-700/50">
            {signalements.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-300">Aucun signalement</p>
                <p className="text-gray-500 text-sm mt-1">Vous n'avez pas encore fait de signalement</p>
              </div>
            ) : (
              signalements.map((s) => {
                const TypeIcon = getTypeIcon(s.type);
                const StatusIcon = getStatusIcon(s.statut);
                const hasImages = s.images && s.images.length > 0;
                const fullAddress = getFullAddress(s);
                
                return (
                  <article key={s.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white font-bold">
                          {(s.utilisateur?.nom?.[0] || userInfo.nom?.[0] || 'C').toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white text-sm">
                              {s.utilisateur?.nom || userInfo.nom || 'Moi'}
                            </h3>
                            <span className="text-gray-500 text-xs">•</span>
                            <div className="flex items-center gap-1 max-w-[300px]">
                              <MapPin size={10} className="text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-400 truncate" title={fullAddress}>
                                {fullAddress}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock size={10} className="text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {getRelativeTime(s.dateCreation)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${getTypeColor(s.type)}`}>
                        <TypeIcon size={12} />
                        {getTypeLabel(s.type)}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${getStatusColor(s.statut)}`}>
                        <StatusIcon size={12} />
                        {getStatusText(s.statut)}
                      </span>
                      {hasImages && (
                        <span className="text-xs text-gray-400 bg-gray-700/50 px-2.5 py-1.5 rounded-full flex items-center gap-1">
                          <Image size={12} />
                          {s.images.length} photo{s.images.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <h4 className="text-white font-semibold mb-1">{s.titre || 'Sans titre'}</h4>
                    <p className="text-gray-300 text-sm mb-3">{s.description || 'Aucune description'}</p>

                    {hasImages && (
                      <div className={`grid gap-1 mb-3 ${
                        s.images.length === 1 ? 'grid-cols-1' :
                        s.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                      }`}>
                        {s.images.slice(0, 4).map((img, index) => (
                          <div 
                            key={index}
                            className={`relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer group ${
                              s.images.length === 3 && index === 0 ? 'row-span-2' : ''
                            }`}
                            onClick={() => openImageViewer(s.images, index)}
                          >
                            <img 
                              src={img.url} 
                              className={`w-full object-cover transition-transform group-hover:scale-105 ${
                                s.images.length === 1 ? 'h-64' : 'h-48'
                              }`}
                              alt={`${s.titre} - image ${index + 1}`}
                              onError={(e) => {
                                e.target.src = "https://placehold.co/600x400/242526/808080?text=Image+non+disponible";
                              }}
                            />
                            {s.images.length > 4 && index === 3 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-xl font-bold">+{s.images.length - 4}</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-around pt-2 border-t border-gray-700/50">
                      <button className="flex items-center gap-2 py-2 text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                        <MessageCircle size={16} />
                        <span>Commenter</span>
                      </button>
                      <button className="flex items-center gap-2 py-2 text-gray-400 hover:text-emerald-400 transition-colors text-sm">
                        <Share2 size={16} />
                        <span>Partager</span>
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(s.id)}
                        className="flex items-center gap-2 py-2 text-gray-400 hover:text-red-400 transition-colors text-sm"
                      >
                        <Trash2 size={16} />
                        <span>Supprimer</span>
                      </button>
                    </div>

                    {showDeleteConfirm === s.id && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-[#242526] rounded-xl p-6 max-w-sm w-full mx-4 border border-gray-700">
                          <div className="text-center">
                            <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Trash2 size={28} className="text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Supprimer le signalement</h3>
                            <p className="text-gray-400 text-sm mb-6">
                              Êtes-vous sûr de vouloir supprimer "{s.titre}" ? Cette action est irréversible.
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => handleDeleteSignalement(s.id)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Lightbox */}
      {selectedImages && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeImageViewer}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10" onClick={closeImageViewer}>
            <X size={24} />
          </button>
          <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1.5 rounded-full z-10">
            {currentImageIndex + 1} / {selectedImages.length}
          </div>
          {currentImageIndex > 0 && (
            <button className="absolute left-4 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
              <ChevronLeft size={32} />
            </button>
          )}
          {currentImageIndex < selectedImages.length - 1 && (
            <button className="absolute right-4 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
              <ChevronRight size={32} />
            </button>
          )}
          <img src={selectedImages[currentImageIndex]?.url} className="max-w-[90vw] max-h-[90vh] object-contain" alt={`Image ${currentImageIndex + 1}`} onClick={(e) => e.stopPropagation()} />
          {selectedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-xl backdrop-blur-sm z-10">
              {selectedImages.map((img, index) => (
                <button key={index} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }} className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-emerald-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}>
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