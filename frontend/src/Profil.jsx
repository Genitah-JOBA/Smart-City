import { API_URL } from "./config/api";
import { useState, useEffect, useRef } from "react";
import { 
  User, Lock, Eye, EyeOff, Edit2, X, Check, AlertCircle,
  MapPin, Clock, MessageCircle, Share2, MoreHorizontal, 
  Construction, Lightbulb, Trash2, Droplets, TreePine, 
  Shield, HelpCircle, AlertTriangle, XCircle, PlayCircle, CheckCircle2,
  ChevronLeft, ChevronRight, Image, Road, Trash, Home,
  Award, Calendar, Bell, Settings, LogOut, Star, Heart
} from "lucide-react";
import { useI18n } from "./context/AppContext";

// ✅ COMPOSANT INPUT AVEC VALIDATION - Style modernisé
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
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(type === "password");
  const inputRef = useRef(null);

  const validate = (val) => {
    if (required && !val.trim()) {
      return t("val.required");
    }
    if (minLength && val.length < minLength) {
      return `Minimum ${minLength}`;
    }
    if (pattern && !pattern.test(val)) {
      return errorMessage || t("val.invalidFormat");
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
    <div className="mb-4">
      <label className="text-gray-300 text-xs font-medium block mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type={currentType}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setTouched(true)}
          className={`w-full bg-white/5 border-2 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 transition-all ${
            showPasswordToggle ? 'pr-12' : 'pr-10'
          } ${
            touched && error 
              ? "border-rose-500 focus:ring-rose-500/20" 
              : isValid && touched
              ? "border-emerald-500 focus:ring-emerald-500/20"
              : "border-white/10 focus:border-white/30 focus:ring-white/10"
          } ${className}`}
          placeholder={placeholder}
        />
        {touched && error && (
          <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
        )}
        {touched && isValid && !error && !showPasswordToggle && (
          <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
        )}
        {showPasswordToggle && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {touched && error && (
        <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1.5">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
};

export default function Profil() {
  const { t } = useI18n();
  const [userInfo, setUserInfo] = useState({ 
    nom: "", 
    email: "", 
    role: "",
    adresse: ""
  });
  const [signalements, setSignalements] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    adresse: ""
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
  
  const [isNomValid, setIsNomValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isAdresseValid, setIsAdresseValid] = useState(false);
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);
  
  const token = localStorage.getItem("token");
  const [currentUserId, setCurrentUserId] = useState(null);

  const validateAdresse = (value) => {
    if (!value.trim()) return t("val.addressRequired");
    if (value.length < 4) return t("val.addressMin4");
    return null;
  };

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
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo({
          nom: data.nom || data.name || "Utilisateur",
          email: data.email || data.sub || "",
          role: data.role || "CITOYEN",
          adresse: data.adresse || ""
        });
        setFormData({
          nom: data.nom || data.name || "Utilisateur",
          email: data.email || data.sub || "",
          adresse: data.adresse || ""
        });
        setIsAdresseValid(!!data.adresse && data.adresse.length >= 4);
      } else {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserInfo({
            nom: payload.nom || payload.name || payload.sub?.split('@')[0] || "Utilisateur",
            email: payload.sub || payload.email || "",
            role: payload.role || "CITOYEN",
            adresse: payload.adresse || ""
          });
          setFormData({
            nom: payload.nom || payload.name || payload.sub?.split('@')[0] || "Utilisateur",
            email: payload.sub || payload.email || "",
            adresse: payload.adresse || ""
          });
          setIsAdresseValid(!!payload.adresse && payload.adresse.length >= 4);
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
      const response = await fetch(`${API_URL}/api/signalements`, {
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
      const response = await fetch(`${API_URL}/api/auth/me`, {
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
    if (!value.trim()) return t("val.nameRequired");
    if (/\d/.test(value)) return t("val.nameNoDigits");
    const nameRegex = /^[a-zA-ZÀ-ÿ\s-]+$/;
    if (!nameRegex.test(value)) return t("val.nameLetters");
    if (value.length < 2) return t("val.nameMin2");
    return null;
  };

  const validateEmail = (value) => {
    if (!value.trim()) return t("val.emailRequired");
    if (!value.toLowerCase().endsWith("@gmail.com")) {
      return t("val.emailGmail");
    }
    return null;
  };

  const handleUpdateProfile = async () => {
    if (!isNomValid || !isEmailValid || !isAdresseValid) {
      setMessage({ type: "error", text: t("prof.fixErrors") });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nom: formData.nom,
          email: formData.email,
          adresse: formData.adresse
        })
      });

      if (response.ok) {
        setUserInfo({ ...userInfo, nom: formData.nom, email: formData.email, adresse: formData.adresse });
        setMessage({ type: "success", text: t("prof.updated") });
        setIsEditing(false);
      } else {
        const error = await response.text();
        setMessage({ type: "error", text: error || "Erreur lors de la mise à jour" });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("prof.networkError") });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (!isCurrentPasswordValid || !isNewPasswordValid || !isConfirmPasswordValid) {
      setMessage({ type: "error", text: t("prof.fixErrors") });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
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
        setMessage({ type: "success", text: t("prof.passwordChanged") });
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
      setMessage({ type: "error", text: t("prof.networkError") });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleDeleteSignalement = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/signalements/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setMessage({ type: "success", text: t("prof.reportDeleted") });
        fetchSignalements();
      } else {
        setMessage({ type: "error", text: "Erreur lors de la suppression" });
      }
    } catch (error) {
      setMessage({ type: "error", text: t("prof.networkError") });
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
    { id: "VOIRIE", name: t("type.VOIRIE"), icon: Road },
    { id: "ECLAIRAGE", name: t("type.ECLAIRAGE"), icon: Lightbulb },
    { id: "DECHETS", name: t("type.DECHETS"), icon: Trash },
    { id: "EAU", name: t("type.EAU"), icon: Droplets }
  ];

  const getTypeIcon = (type) => {
    const category = categories.find(c => c.id === type);
    return category?.icon || MapPin;
  };

  const getTypeColor = (type) => {
    if (type === "VOIRIE") return 'text-orange-400 bg-orange-500/20';
    if (type === "ECLAIRAGE") return 'text-yellow-400 bg-yellow-500/20';
    if (type === "DECHETS") return 'text-rose-400 bg-rose-500/20';
    if (type === "EAU") return 'text-blue-400 bg-blue-500/20';
    return 'text-gray-400 bg-gray-500/20';
  };

  const getTypeLabel = (type) => {
    const category = categories.find(c => c.id === type);
    return category?.name || type;
  };

  const getStatusColor = (statut) => {
    const colors = {
      'EN_ATTENTE': 'text-amber-400 bg-amber-500/20',
      'EN_COURS': 'text-blue-400 bg-blue-500/20',
      'RESOLU': 'text-emerald-400 bg-emerald-500/20',
      'TRAITE': 'text-emerald-400 bg-emerald-500/20',
      'REJETE': 'text-red-400 bg-red-500/20'
    };
    return colors[statut] || 'text-gray-400 bg-gray-500/20';
  };

  const getStatusIcon = (statut) => {
    const icons = {
      'EN_ATTENTE': AlertTriangle,
      'EN_COURS': PlayCircle,
      'RESOLU': CheckCircle2,
      'TRAITE': CheckCircle2,
      'REJETE': XCircle
    };
    return icons[statut] || AlertTriangle;
  };

  const getStatusText = (statut) => {
    const label = t(`status.${statut}`);
    return label === `status.${statut}` ? statut : label;
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return t("feed.recently");
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return t("prof.justNow");
    if (diffInSeconds < 3600) return t("time.minutes").replace("{n}", Math.floor(diffInSeconds / 60));
    if (diffInSeconds < 86400) return t("time.hours").replace("{n}", Math.floor(diffInSeconds / 3600));
    if (diffInSeconds < 604800) return t("time.days").replace("{n}", Math.floor(diffInSeconds / 86400));
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
    return signalement.address || signalement.ville || signalement.commune || t("prof.unknownLocation");
  };

  const isProfileFormValid = isNomValid && isEmailValid && isAdresseValid;
  const isPasswordFormValid = isCurrentPasswordValid && isNewPasswordValid && isConfirmPasswordValid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a]">
      {/* Header modernisé */}
      <header className="sticky top-0 z-30 bg-[#1a1a2e]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 shadow-lg shadow-emerald-500/20">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{t("prof.title")}</h1>
                <p className="text-xs text-gray-400">{t("prof.subtitle")}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-6">
        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl backdrop-blur-sm ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' 
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          </div>
        )}

        {/* Section Profil - Style modernisé */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1e32] to-[#16162a] border border-white/5 shadow-2xl mb-6">
          {/* Décoration */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative p-6">
            {/* En-tête avec dégradé */}
            <div className="h-20 -mx-6 -mt-6 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-emerald-500/20 rounded-t-3xl"></div>
            
            <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between -mt-12">
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 border-2 border-white/10">
                    <span className="text-white text-3xl font-bold">
                      {userInfo.nom?.[0]?.toUpperCase() || userInfo.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-[#1e1e32]">
                    <Award size={12} className="text-white" />
                  </div>
                </div>
                <div className="pb-1">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {userInfo.nom}
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-medium">
                      {getRoleLabel(userInfo.role)}
                    </span>
                  </h2>
                  <p className="text-gray-400 text-sm">{userInfo.email}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin size={12} className="text-gray-500" />
                    <p className="text-gray-500 text-xs">{userInfo.adresse || t("prof.addressNotSet")}</p>
                  </div>
                </div>
              </div>
              
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-3 md:mt-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all hover:border-white/20"
                >
                  <Edit2 size={15} />
                  {t("prof.edit")}
                </button>
              )}
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/5">
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-white">{signalements.length}</div>
                <p className="text-xs text-gray-400">{t("prof.reports")}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-emerald-400">
                  {signalements.filter(s => s.statut === "RESOLU" || s.statut === "TRAITE").length}
                </div>
                <p className="text-xs text-gray-400">{t("feed.resolved")}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-amber-400">
                  {signalements.filter(s => s.statut === "EN_ATTENTE").length}
                </div>
                <p className="text-xs text-gray-400">{t("status.EN_ATTENTE")}</p>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="space-y-3">
                  <ValidatedInput
                    label={t("prof.fullName")}
                    value={formData.nom}
                    onChange={(val) => {
                      setFormData({ ...formData, nom: val });
                      const error = validateNom(val);
                      setIsNomValid(!error);
                    }}
                    placeholder={t("prof.yourName")}
                    required={true}
                    minLength={2}
                    errorMessage={t("val.nameMin2")}
                    onValidChange={(valid) => setIsNomValid(valid)}
                  />

                  <ValidatedInput
                    label={t("prof.email")}
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
                    errorMessage={t("val.emailGmail")}
                    onValidChange={(valid) => setIsEmailValid(valid)}
                  />

                  <ValidatedInput
                    label={t("prof.fullAddress")}
                    value={formData.adresse}
                    onChange={(val) => {
                      setFormData({ ...formData, adresse: val });
                      const error = validateAdresse(val);
                      setIsAdresseValid(!error);
                    }}
                    placeholder={t("prof.yourAddress")}
                    required={true}
                    minLength={4}
                    errorMessage={t("val.addressMin4")}
                    onValidChange={(valid) => setIsAdresseValid(valid)}
                  />

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={isLoading || !isProfileFormValid}
                      className={`flex-1 font-medium py-3 rounded-xl transition text-sm ${
                        !isProfileFormValid || isLoading
                          ? 'bg-white/5 cursor-not-allowed text-gray-500'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                      }`}
                    >
                      {isLoading ? t("prof.loading") : t("prof.save")}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({ 
                          nom: userInfo.nom, 
                          email: userInfo.email,
                          adresse: userInfo.adresse
                        });
                        setIsNomValid(true);
                        setIsEmailValid(true);
                        setIsAdresseValid(!!userInfo.adresse && userInfo.adresse.length >= 4);
                      }}
                      className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Sécurité - Style modernisé */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1e32] to-[#16162a] border border-white/5 shadow-2xl mb-6">
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20">
                  <Lock size={18} className="text-emerald-400" />
                </div>
                <h2 className="font-semibold text-white">{t("prof.security")}</h2>
              </div>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="text-sm text-emerald-400 hover:text-emerald-300 font-medium px-4 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                >
                  {t("prof.change")}
                </button>
              )}
            </div>
            
            {showPasswordForm ? (
              <div className="space-y-3">
                <ValidatedInput
                  label={t("prof.currentPassword")}
                  value={passwordData.currentPassword}
                  onChange={(val) => {
                    setPasswordData({ ...passwordData, currentPassword: val });
                    setIsCurrentPasswordValid(val.length >= 6);
                  }}
                  type="password"
                  placeholder="••••••••"
                  required={true}
                  minLength={6}
                  errorMessage={t("val.passwordMin6")}
                  onValidChange={(valid) => setIsCurrentPasswordValid(valid)}
                  showPasswordToggle={true}
                />

                <ValidatedInput
                  label={t("prof.newPassword")}
                  value={passwordData.newPassword}
                  onChange={(val) => {
                    setPasswordData({ ...passwordData, newPassword: val });
                    setIsNewPasswordValid(val.length >= 6);
                  }}
                  type="password"
                  placeholder="••••••••"
                  required={true}
                  minLength={6}
                  errorMessage={t("val.passwordMin6")}
                  onValidChange={(valid) => setIsNewPasswordValid(valid)}
                  showPasswordToggle={true}
                />

                <ValidatedInput
                  label={t("prof.confirmPassword")}
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
                    ? t("prof.passwordMismatch")
                    : t("val.passwordMin6")}
                  onValidChange={(valid) => setIsConfirmPasswordValid(valid)}
                  showPasswordToggle={true}
                />

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={isLoading || !isPasswordFormValid}
                    className={`flex-1 font-medium py-3 rounded-xl transition text-sm ${
                      !isPasswordFormValid || isLoading
                        ? 'bg-white/5 cursor-not-allowed text-gray-500'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    {isLoading ? t("prof.loading") : t("prof.change")}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      setIsCurrentPasswordValid(false);
                      setIsNewPasswordValid(false);
                      setIsConfirmPasswordValid(false);
                    }}
                    className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <Lock size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">{t("prof.password")}</p>
                  <p className="text-white font-medium">••••••••</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Mes signalements - Style modernisé */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1e32] to-[#16162a] border border-white/5 shadow-2xl">
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="font-semibold text-white">{t("prof.myReports")}</h2>
                <span className="bg-white/10 text-gray-300 text-xs px-3 py-1 rounded-full font-medium">
                  {signalements.length}
                </span>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {signalements.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-300 font-medium">Aucun signalement</p>
                  <p className="text-gray-500 text-sm mt-1">Vous n'avez pas encore fait de signalement</p>
                </div>
              ) : (
                signalements.map((s) => {
                  const TypeIcon = getTypeIcon(s.type);
                  const StatusIcon = getStatusIcon(s.statut);
                  const hasImages = s.images && s.images.length > 0;
                  const fullAddress = getFullAddress(s);
                  
                  return (
                    <article key={s.id} className="py-5 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-emerald-500/20">
                          {(s.utilisateur?.nom?.[0] || userInfo.nom?.[0] || 'C').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-white text-sm">
                                  {s.utilisateur?.nom || userInfo.nom || 'Moi'}
                                </span>
                                <span className="text-gray-500 text-xs">•</span>
                                <div className="flex items-center gap-1 max-w-[200px]">
                                  <MapPin size={10} className="text-gray-400 flex-shrink-0" />
                                  <span className="text-xs text-gray-400 truncate" title={fullAddress}>
                                    {fullAddress}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Clock size={10} className="text-gray-500" />
                                <span className="text-xs text-gray-500">
                                  {getRelativeTime(s.dateCreation)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${getTypeColor(s.type)}`}>
                              <TypeIcon size={11} />
                              {getTypeLabel(s.type)}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(s.statut)}`}>
                              <StatusIcon size={11} />
                              {getStatusText(s.statut)}
                            </span>
                            {hasImages && (
                              <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Image size={11} />
                                {s.images.length}
                              </span>
                            )}
                          </div>

                          <h4 className="text-white font-semibold text-sm mt-2">{s.titre || 'Sans titre'}</h4>
                          <p className="text-gray-400 text-sm">{s.description || 'Aucune description'}</p>

                          {hasImages && (
                            <div className={`grid gap-1.5 mt-3 ${
                              s.images.length === 1 ? 'grid-cols-1' :
                              s.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                            }`}>
                              {s.images.slice(0, 4).map((img, index) => (
                                <div 
                                  key={index}
                                  className={`relative bg-gray-800 rounded-xl overflow-hidden cursor-pointer group ${
                                    s.images.length === 3 && index === 0 ? 'row-span-2' : ''
                                  }`}
                                  onClick={() => openImageViewer(s.images, index)}
                                >
                                  <img 
                                    src={img.url} 
                                    className={`w-full object-cover transition-transform group-hover:scale-105 ${
                                      s.images.length === 1 ? 'h-56' : 'h-40'
                                    }`}
                                    alt={`${s.titre} - image ${index + 1}`}
                                    onError={(e) => {
                                      e.target.src = "https://placehold.co/600x400/1e1e32/64748b?text=Image";
                                    }}
                                  />
                                  {s.images.length > 4 && index === 3 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                      <span className="text-white text-lg font-bold">+{s.images.length - 4}</span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                            <button className="flex items-center gap-1.5 py-1 text-gray-400 hover:text-emerald-400 transition-colors text-xs">
                              <MessageCircle size={14} />
                              <span>{t("feed.comment")}</span>
                            </button>
                            <button className="flex items-center gap-1.5 py-1 text-gray-400 hover:text-emerald-400 transition-colors text-xs">
                              <Share2 size={14} />
                              <span>{t("feed.share")}</span>
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(s.id)}
                              className="flex items-center gap-1.5 py-1 text-gray-400 hover:text-rose-400 transition-colors text-xs ml-auto"
                            >
                              <Trash2 size={14} />
                              <span>{t("sig.delete")}</span>
                            </button>
                          </div>

                          {showDeleteConfirm === s.id && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                              <div className="bg-[#1e1e32] rounded-3xl p-6 max-w-sm w-full mx-4 border border-white/10 shadow-2xl">
                                <div className="text-center">
                                  <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={28} className="text-rose-400" />
                                  </div>
                                  <h3 className="text-xl font-bold text-white mb-2">{t("prof.deleteReportTitle")}</h3>
                                  <p className="text-gray-400 text-sm mb-6">
                                    {t("prof.deleteConfirm").replace("{title}", s.titre)}
                                  </p>
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => setShowDeleteConfirm(null)}
                                      className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 font-medium"
                                    >
                                      {t("common.cancel")}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSignalement(s.id)}
                                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium transition-all shadow-lg shadow-rose-500/20"
                                    >
                                      {t("sig.delete")}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox modernisée */}
      {selectedImages && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeImageViewer}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10" onClick={closeImageViewer}>
            <X size={24} />
          </button>
          <div className="absolute top-4 left-4 text-white text-sm bg-white/10 px-4 py-2 rounded-full z-10 backdrop-blur-sm">
            {currentImageIndex + 1} / {selectedImages.length}
          </div>
          {currentImageIndex > 0 && (
            <button className="absolute left-4 text-white hover:text-gray-300 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
              <ChevronLeft size={32} />
            </button>
          )}
          {currentImageIndex < selectedImages.length - 1 && (
            <button className="absolute right-4 text-white hover:text-gray-300 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
              <ChevronRight size={32} />
            </button>
          )}
          <img src={selectedImages[currentImageIndex]?.url} className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl" alt={`Image ${currentImageIndex + 1}`} onClick={(e) => e.stopPropagation()} />
          {selectedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-xl backdrop-blur-sm z-10">
              {selectedImages.map((img, index) => (
                <button key={index} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }} className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-emerald-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}>
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