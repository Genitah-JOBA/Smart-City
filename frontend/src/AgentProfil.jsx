import { API_URL } from "./config/api";
import { useState, useEffect, useRef } from "react";
import { User, Mail, Shield, Save, Lock, Eye, EyeOff, Edit2, X, Check, AlertCircle, CheckCircle, Info, Briefcase, MapPin, Wrench, Building2, Lightbulb, Trash2, TreePine, Bus, ShieldCheck, Palette, Home, Phone } from "lucide-react";
import { useI18n } from "./context/AppContext";

// ✅ COMPOSANT MESSAGEBOX MODERNE
const MessageBox = ({ type, message, onClose, autoClose = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose > 0 && type !== 'error') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, type, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-emerald-500/90',
      borderColor: 'border-emerald-400',
      textColor: 'text-white',
      shadow: 'shadow-emerald-500/30'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-500/90',
      borderColor: 'border-red-400',
      textColor: 'text-white',
      shadow: 'shadow-red-500/30'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-500/90',
      borderColor: 'border-blue-400',
      textColor: 'text-white',
      shadow: 'shadow-blue-500/30'
    }
  };

  const Icon = config[type]?.icon || Info;
  const currentConfig = config[type] || config.info;

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-modal-pop ${isVisible ? 'opacity-100' : 'opacity-0 transition-opacity duration-300'}`}>
      <div className={`${currentConfig.bgColor} backdrop-blur-md ${currentConfig.shadow} border ${currentConfig.borderColor} rounded-xl shadow-2xl max-w-md w-[90vw] sm:w-full`}>
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0">
            <Icon className={`w-5 h-5 ${currentConfig.textColor} animate-scale`} />
          </div>
          <div className="flex-1">
            <p className={`${currentConfig.textColor} text-sm font-medium`}>{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {type !== 'error' && autoClose > 0 && (
          <div className="h-1 bg-white/30 rounded-b-xl overflow-hidden">
            <div 
              className="h-full bg-white animate-progress-bar"
              style={{ animationDuration: `${autoClose}ms` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

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
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);
  const [inputType, setInputType] = useState(type);

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

  const handleBlur = (e) => {
    setTouched(true);
    const validationError = validate(value);
    setError(validationError);
    
    if (validationError) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);
    }
  };

  const togglePasswordVisibility = () => {
    setInputType(inputType === "password" ? "text" : "password");
    if (onTogglePassword) onTogglePassword();
  };

  const isValid = !error && value.trim() !== "";

  return (
    <div className="mb-4">
      <label className="text-white/70 text-sm mb-1 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type={showPasswordToggle ? inputType : type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full bg-white/10 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 transition-all ${
            showPasswordToggle ? 'pr-16' : 'pr-8'
          } ${
            touched && error 
              ? "border-red-500 focus:ring-red-500/50" 
              : isValid && touched
              ? "border-emerald-500 focus:ring-emerald-500/50"
              : "border-white/20 focus:border-emerald-500 focus:ring-emerald-500/50"
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
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
          >
            {inputType === "password" ? <EyeOff size={18} /> : <Eye size={18} />}
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

// ✅ SÉLECTEUR DE DOMAINE
const DomaineSelector = ({ value, onChange, label, onValidChange }) => {
  const { t } = useI18n();
  const domaines = [
    { id: "VOIRIE", label: t("type.VOIRIE"), icon: MapPin, description: t("dom.VOIRIE.desc") },
    { id: "ECLAIRAGE", label: t("type.ECLAIRAGE"), icon: Lightbulb, description: t("dom.ECLAIRAGE.desc") },
    { id: "PROPRETE", label: t("type.PROPRETE"), icon: Trash2, description: t("dom.DECHETS.desc") },
    { id: "ESPACES_VERTS", label: t("type.ESPACES_VERTS"), icon: TreePine, description: t("dom.ESPACES_VERTS.desc") },
    { id: "TRANSPORTS", label: t("type.TRANSPORTS"), icon: Bus, description: t("dom.TRANSPORTS.desc") },
    { id: "SECURITE", label: t("type.SECURITE"), icon: ShieldCheck, description: t("dom.SECURITE.desc") },
    { id: "URBANISME", label: t("type.URBANISME"), icon: Building2, description: t("dom.URBANISME.desc") },
  ];

  const selectedDomaine = domaines.find(d => d.id === value);

  const handleChange = (id) => {
    onChange(id);
    if (onValidChange) onValidChange(true);
  };

  return (
    <div className="mb-4">
      <label className="text-white/70 text-sm mb-2 block">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {domaines.map((domaine) => {
          const Icon = domaine.icon;
          const isSelected = value === domaine.id;
          return (
            <button
              key={domaine.id}
              type="button"
              onClick={() => handleChange(domaine.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isSelected
                  ? "bg-emerald-600/40 border border-emerald-400 shadow-lg shadow-emerald-500/20"
                  : "bg-white/5 border border-white/20 hover:bg-white/10"
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? "text-emerald-400" : "text-white/60"}`} />
              <span className={`text-xs font-medium ${isSelected ? "text-emerald-300" : "text-white/70"}`}>
                {domaine.label}
              </span>
            </button>
          );
        })}
      </div>
      {selectedDomaine && (
        <p className="text-white/40 text-xs mt-2">{selectedDomaine.description}</p>
      )}
    </div>
  );
};

// ✅ SÉLECTEUR DE MÉTIER
const MetierSelector = ({ domaine, value, onChange, label, onValidChange }) => {
  const { t } = useI18n();
  const metiersParDomaine = {
    VOIRIE: [
      { id: "AGENT_VOIRIE", label: t("met.AGENT_VOIRIE.label"), icon: Wrench },
      { id: "TECHNICIEN_GENIE_CIVIL", label: t("met.TECHNICIEN_GENIE_CIVIL.label"), icon: Building2 },
      { id: "CHEF_CHANTIER_VOIRIE", label: t("met.CHEF_CHANTIER_VOIRIE.label"), icon: Briefcase },
      { id: "AGENT_SIGNALISATION", label: t("met.AGENT_SIGNALISATION.label"), icon: MapPin },
    ],
    ECLAIRAGE: [
      { id: "TECHNICIEN_ECLAIRAGE", label: t("met.TECHNICIEN_ECLAIRAGE.label"), icon: Lightbulb },
      { id: "INGENIEUR_ECLAIRAGE", label: t("met.INGENIEUR_ECLAIRAGE.label"), icon: Wrench },
      { id: "AGENT_MAINTENANCE_ELEC", label: t("met.AGENT_MAINTENANCE_ELEC.label"), icon: Shield },
    ],
    PROPRETE: [
      { id: "AGENT_COLLECTE", label: t("met.AGENT_COLLECTE.label"), icon: Trash2 },
      { id: "TECHNICIEN_NETTOIEMENT", label: t("met.TECHNICIEN_NETTOIEMENT.label"), icon: Wrench },
      { id: "RESPONSABLE_DECHETTERIE", label: t("met.RESPONSABLE_DECHETTERIE.label"), icon: Briefcase },
    ],
    ESPACES_VERTS: [
      { id: "JARDINIER_MUNICIPAL", label: t("met.JARDINIER_MUNICIPAL.label"), icon: TreePine },
      { id: "ELAGUEUR", label: t("met.ELAGUEUR.label"), icon: Wrench },
      { id: "PAYSAGISTE_URBAIN", label: t("met.PAYSAGISTE_URBAIN.label"), icon: Palette },
    ],
    TRANSPORTS: [
      { id: "AGENT_REGULATION", label: t("met.AGENT_REGULATION.label"), icon: Bus },
      { id: "CONTROLEUR_TRANSPORT", label: t("met.CONTROLEUR_TRANSPORT.label"), icon: Shield },
      { id: "TECHNICIEN_STATIONNEMENT", label: t("met.TECHNICIEN_STATIONNEMENT.label"), icon: MapPin },
    ],
    SECURITE: [
      { id: "AGENT_SECURITE_URBAINE", label: t("met.AGENT_SECURITE_URBAINE.label"), icon: ShieldCheck },
      { id: "POLICE_MUNICIPALE", label: t("met.POLICE_MUNICIPALE.label"), icon: Shield },
      { id: "AGENT_MEDIATEUR", label: t("met.AGENT_MEDIATEUR.label"), icon: Wrench },
    ],
    URBANISME: [
      { id: "URBANISTE", label: t("met.URBANISTE.label"), icon: Building2 },
      { id: "ARCHITECTE_CONSEIL", label: t("met.ARCHITECTE_CONSEIL.label"), icon: Palette },
      { id: "TECHNICIEN_URBANISME", label: t("met.TECHNICIEN_URBANISME.label"), icon: Wrench },
    ],
  };

  const metiers = metiersParDomaine[domaine] || [];
  const selectedMetier = metiers.find(m => m.id === value);

  const handleChange = (id) => {
    onChange(id);
    if (onValidChange) onValidChange(true);
  };

  if (!domaine || metiers.length === 0) return null;

  return (
    <div className="mb-4">
      <label className="text-white/70 text-sm mb-2 block">{label}</label>
      <div className="grid grid-cols-1 gap-2">
        {metiers.map((metier) => {
          const Icon = metier.icon;
          const isSelected = value === metier.id;
          return (
            <button
              key={metier.id}
              type="button"
              onClick={() => handleChange(metier.id)}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                isSelected
                  ? "bg-blue-600/40 border border-blue-400 shadow-lg shadow-blue-500/20"
                  : "bg-white/5 border border-white/20 hover:bg-white/10"
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? "text-blue-400" : "text-white/60"}`} />
              <span className={`text-sm ${isSelected ? "text-blue-300" : "text-white/80"}`}>
                {metier.label}
              </span>
              {isSelected && <Check className="ml-auto w-4 h-4 text-blue-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function Profil() {
  const { t } = useI18n();
  const [userInfo, setUserInfo] = useState({ 
    nom: "", 
    email: "", 
    role: "",
    domaine: "",
    metier: "",
    adresse: "",
    telephone: ""  // ⭐ AJOUTÉ
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    domaine: "",
    metier: "",
    adresse: "",
    telephone: ""  // ⭐ AJOUTÉ
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [messageBox, setMessageBox] = useState({ show: false, type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  
  // États de validation
  const [isNomValid, setIsNomValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isDomaineValid, setIsDomaineValid] = useState(false);
  const [isMetierValid, setIsMetierValid] = useState(false);
  const [isAdresseValid, setIsAdresseValid] = useState(false);
  const [isTelephoneValid, setIsTelephoneValid] = useState(false);  // ⭐ AJOUTÉ
  const [isFormValid, setIsFormValid] = useState(false);
  
  // États de validation des mots de passe
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);
  const [isPasswordFormValid, setIsPasswordFormValid] = useState(false);
  
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  const showMessage = (type, text) => {
    setMessageBox({ show: true, type, text });
  };

  const hideMessage = () => {
    setMessageBox({ show: false, type: "", text: "" });
  };

  useEffect(() => {
    fetchUserProfile();
  }, [token]);

  // Vérifier si le formulaire profil est valide
  useEffect(() => {
    let formValid = isNomValid && isEmailValid && isAdresseValid && isTelephoneValid;
    
    // Pour les agents en mode édition, domaine et métier sont obligatoires
    if (userRole === "AGENT" && isEditing) {
      formValid = formValid && isDomaineValid && isMetierValid;
    }
    
    setIsFormValid(formValid);
  }, [isNomValid, isEmailValid, isAdresseValid, isTelephoneValid, isDomaineValid, isMetierValid, userRole, isEditing]);

  // Vérifier si le formulaire mot de passe est valide
  useEffect(() => {
    setIsPasswordFormValid(
      isCurrentPasswordValid && 
      isNewPasswordValid && 
      isConfirmPasswordValid &&
      passwordData.newPassword === passwordData.confirmPassword
    );
  }, [isCurrentPasswordValid, isNewPasswordValid, isConfirmPasswordValid, passwordData.newPassword, passwordData.confirmPassword]);

  const fetchUserProfile = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        const hasDomaine = !!data.domaine;
        const hasMetier = !!data.metier;
        const hasAdresse = !!data.adresse && data.adresse.length >= 4;
        const hasTelephone = !!data.telephone && data.telephone.length >= 10;  // ⭐ AJOUTÉ
        
        setUserInfo({
          nom: data.nom || data.name || "Utilisateur",
          email: data.email || data.sub || "",
          role: data.role || "CITOYEN",
          domaine: data.domaine || "",
          metier: data.metier || "",
          adresse: data.adresse || "",
          telephone: data.telephone || ""  // ⭐ AJOUTÉ
        });
        setFormData({
          nom: data.nom || data.name || "Utilisateur",
          email: data.email || data.sub || "",
          domaine: data.domaine || "",
          metier: data.metier || "",
          adresse: data.adresse || "",
          telephone: data.telephone || ""  // ⭐ AJOUTÉ
        });
        
        // Initialiser les états de validation
        setIsNomValid(true);
        setIsEmailValid(true);
        setIsAdresseValid(hasAdresse);
        setIsTelephoneValid(hasTelephone);  // ⭐ AJOUTÉ
        setIsDomaineValid(hasDomaine);
        setIsMetierValid(hasMetier);
        
      } else if (response.status === 403) {
        showMessage("error", "Session expirée. Redirection vers la connexion...");
        setTimeout(() => handleLogout(), 2000);
      } else {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const hasDomaine = !!payload.domaine;
          const hasMetier = !!payload.metier;
          const hasAdresse = !!payload.adresse && payload.adresse.length >= 4;
          const hasTelephone = !!payload.telephone && payload.telephone.length >= 10;  // ⭐ AJOUTÉ
          
          setUserInfo({
            nom: payload.nom || payload.name || payload.sub?.split('@')[0] || "Utilisateur",
            email: payload.sub || payload.email || "",
            role: payload.role || "CITOYEN",
            domaine: payload.domaine || "",
            metier: payload.metier || "",
            adresse: payload.adresse || "",
            telephone: payload.telephone || ""  // ⭐ AJOUTÉ
          });
          setFormData({
            nom: payload.nom || payload.name || payload.sub?.split('@')[0] || "Utilisateur",
            email: payload.sub || payload.email || "",
            domaine: payload.domaine || "",
            metier: payload.metier || "",
            adresse: payload.adresse || "",
            telephone: payload.telephone || ""  // ⭐ AJOUTÉ
          });
          
          setIsNomValid(true);
          setIsEmailValid(true);
          setIsAdresseValid(hasAdresse);
          setIsTelephoneValid(hasTelephone);  // ⭐ AJOUTÉ
          setIsDomaineValid(hasDomaine);
          setIsMetierValid(hasMetier);
          
        } catch (error) {
          console.error("Erreur décodage token:", error);
        }
      }
    } catch (error) {
      console.error("Erreur récupération profil:", error);
    }
  };

  // Validation adresse
  const validateAdresse = (adresse) => {
    if (!adresse.trim()) return t("val.addressRequired");
    if (adresse.length < 4) return t("val.addressMin4");
    return null;
  };

  // ⭐ Validation téléphone
  const validateTelephone = (telephone) => {
    if (!telephone.trim()) return t("val.phoneRequired");
    const phoneRegex = /^(032|033|034|037|038)\d{7}$/;
    if (!phoneRegex.test(telephone)) {
      return t("val.phoneFormat");
    }
    return null;
  };

  const handleUpdateProfile = async () => {
    if (!isFormValid) {
      showMessage("error", t("prof.fixErrors"));
      return;
    }

    setIsLoading(true);
    hideMessage();

    const emailChanged = formData.email !== userInfo.email;

    // Corps de la requête avec domaine, métier, adresse et téléphone
    const requestBody = {
      nom: formData.nom,
      email: formData.email,
      adresse: formData.adresse,
      telephone: formData.telephone  // ⭐ AJOUTÉ
    };

    // Si l'utilisateur est un agent, inclure domaine et métier
    if (userRole === "AGENT") {
      requestBody.domaine = formData.domaine;
      requestBody.metier = formData.metier;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (emailChanged && data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userEmail", formData.email);
          localStorage.setItem("userNom", formData.nom);
          if (formData.domaine) localStorage.setItem("userDomaine", formData.domaine);
          if (formData.metier) localStorage.setItem("userMetier", formData.metier);
          if (formData.adresse) localStorage.setItem("userAdresse", formData.adresse);
          if (formData.telephone) localStorage.setItem("userTelephone", formData.telephone);  // ⭐ AJOUTÉ
          
          setUserInfo({
            ...userInfo,
            nom: formData.nom,
            email: formData.email,
            domaine: formData.domaine,
            metier: formData.metier,
            adresse: formData.adresse,
            telephone: formData.telephone  // ⭐ AJOUTÉ
          });
          
          showMessage("success", "Profil mis à jour avec succès ! Votre session a été actualisée.");
          setIsEditing(false);
          
          setTimeout(() => {
            fetchUserProfile();
          }, 500);
          
        } else if (!emailChanged) {
          setUserInfo({
            ...userInfo,
            nom: formData.nom,
            domaine: formData.domaine,
            metier: formData.metier,
            adresse: formData.adresse,
            telephone: formData.telephone  // ⭐ AJOUTÉ
          });
          localStorage.setItem("userNom", formData.nom);
          if (formData.domaine) localStorage.setItem("userDomaine", formData.domaine);
          if (formData.metier) localStorage.setItem("userMetier", formData.metier);
          if (formData.adresse) localStorage.setItem("userAdresse", formData.adresse);
          if (formData.telephone) localStorage.setItem("userTelephone", formData.telephone);  // ⭐ AJOUTÉ
          showMessage("success", "Profil mis à jour avec succès !");
          setIsEditing(false);
        }
      } else if (response.status === 403) {
        showMessage("error", "Session expirée. Veuillez vous reconnecter.");
        setTimeout(() => handleLogout(), 2000);
      } else {
        const error = await response.text();
        showMessage("error", error || t("prof.updateError"));
      }
    } catch (error) {
      showMessage("error", "Erreur réseau, veuillez réessayer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!isPasswordFormValid) {
      showMessage("error", t("prof.fixErrors"));
      return;
    }

    setIsLoading(true);
    hideMessage();

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
        showMessage("success", "🔒 Mot de passe changé avec succès !");
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setIsCurrentPasswordValid(false);
        setIsNewPasswordValid(false);
        setIsConfirmPasswordValid(false);
      } else if (response.status === 403) {
        showMessage("error", "Session expirée. Veuillez vous reconnecter.");
        setTimeout(() => handleLogout(), 2000);
      } else {
        const error = await response.text();
        showMessage("error", error || t("prof.passwordChangeError"));
      }
    } catch (error) {
      showMessage("error", "Erreur réseau, veuillez réessayer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const getRoleLabel = (role) => {
    const roles = {
      'ADMIN': t("roleFull.admin"),
      'AGENT': t("auth.agent"),
      'CITOYEN': t("role.citizen"),
      'CITIZEN': t("role.citizen")
    };
    return roles[role] || role;
  };

  // Validation email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validation nom
  const validateNom = (nom) => {
    return nom.trim().length >= 2;
  };

  // Validation mot de passe (non vide)
  const validatePassword = (pwd) => {
    return pwd.trim().length > 0;
  };

  // Validation nouveau mot de passe (>= 6 caractères)
  const validateNewPassword = (pwd) => {
    return pwd.length >= 6;
  };

  // Validation confirmation mot de passe
  const validateConfirmPassword = (pwd) => {
    return pwd.length >= 6 && pwd === passwordData.newPassword;
  };

  const isAgent = userRole === "AGENT";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {messageBox.show && (
        <MessageBox
          type={messageBox.type}
          message={messageBox.text}
          onClose={hideMessage}
          autoClose={messageBox.type === 'error' ? 0 : 4000}
        />
      )}

      <div className="container mx-auto max-w-3xl pt-8">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <User className="w-8 h-8 text-emerald-400" />
          {t("prof.title")}
        </h1>

        <div className="space-y-6">
          {/* Informations du profil */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">{t("prof.personalInfo")}</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-emerald-400 hover:text-emerald-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {userInfo.nom?.[0]?.toUpperCase() || userInfo.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{userInfo.nom}</h3>
                <p className="text-emerald-400">{getRoleLabel(userInfo.role)}</p>
                {isAgent && userInfo.domaine && (
                  <p className="text-white/50 text-sm mt-1 flex items-center gap-1">
                    <Briefcase size={12} />
                    {userInfo.domaine} • {userInfo.metier?.replace(/_/g, ' ').toLowerCase()}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-xs mb-1">{t("prof.fullName")}</p>
                {isEditing ? (
                  <ValidatedInput
                    label=""
                    value={formData.nom}
                    onChange={(val) => {
                      setFormData({ ...formData, nom: val });
                      setIsNomValid(validateNom(val));
                    }}
                    placeholder={t("prof.yourName")}
                    required={true}
                    minLength={2}
                    errorMessage={t("val.nameMin2")}
                    onValidChange={(valid) => setIsNomValid(valid)}
                    className="mt-0"
                  />
                ) : (
                  <p className="text-white text-lg">{userInfo.nom}</p>
                )}
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-xs mb-1">{t("auth.email")}</p>
                {isEditing ? (
                  <ValidatedInput
                    label=""
                    value={formData.email}
                    onChange={(val) => {
                      setFormData({ ...formData, email: val });
                      setIsEmailValid(validateEmail(val));
                    }}
                    type="email"
                    placeholder="votre@email.com"
                    required={true}
                    pattern={/^[^\s@]+@[^\s@]+\.[^\s@]+$/}
                    errorMessage={t("val.emailInvalid")}
                    onValidChange={(valid) => setIsEmailValid(valid)}
                    className="mt-0"
                  />
                ) : (
                  <p className="text-white text-lg">{userInfo.email}</p>
                )}
              </div>

              {/* ⭐ CHAMP ADRESSE (OBLIGATOIRE) */}
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-xs mb-1 flex items-center gap-2">
                  <Home size={14} />
                  {t("auth.address")} *
                </p>
                {isEditing ? (
                  <ValidatedInput
                    label=""
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
                    className="mt-0"
                  />
                ) : (
                  <p className="text-white text-lg">{userInfo.adresse || t("prof.notProvided")}</p>
                )}
              </div>

              {/* ⭐ CHAMP TÉLÉPHONE (OBLIGATOIRE) */}
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-xs mb-1 flex items-center gap-2">
                  <Phone size={14} />
                  {t("prof.phone")} *
                </p>
                {isEditing ? (
                  <ValidatedInput
                    label=""
                    value={formData.telephone}
                    onChange={(val) => {
                      setFormData({ ...formData, telephone: val });
                      const error = validateTelephone(val);
                      setIsTelephoneValid(!error);
                    }}
                    type="tel"
                    placeholder="0321234567"
                    required={true}
                    minLength={10}
                    pattern={/^(032|033|034|037|038)\d{7}$/}
                    errorMessage={t("val.phoneFormat")}
                    onValidChange={(valid) => setIsTelephoneValid(valid)}
                    className="mt-0"
                  />
                ) : (
                  <p className="text-white text-lg">{userInfo.telephone || t("prof.notProvided")}</p>
                )}
              </div>

              {/* Section Domaine et Métier - Visible seulement pour les agents */}
              {isAgent && (
                <>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-white/50 text-xs mb-3 flex items-center gap-2">
                      <Building2 size={14} />
                      {t("auth.interventionDomain")}
                    </p>
                    {isEditing ? (
                      <DomaineSelector
                        value={formData.domaine}
                        onChange={(val) => {
                          setFormData({ ...formData, domaine: val, metier: "" });
                          setIsDomaineValid(true);
                          setIsMetierValid(false);
                        }}
                        onValidChange={(valid) => setIsDomaineValid(valid)}
                        label=""
                      />
                    ) : (
                      <p className="text-white text-lg flex items-center gap-2">
                        {userInfo.domaine ? (
                          <>
                            {userInfo.domaine === "VOIRIE" && <MapPin size={20} className="text-emerald-400" />}
                            {userInfo.domaine === "ECLAIRAGE" && <Lightbulb size={20} className="text-emerald-400" />}
                            {userInfo.domaine === "PROPRETE" && <Trash2 size={20} className="text-emerald-400" />}
                            {userInfo.domaine === "ESPACES_VERTS" && <TreePine size={20} className="text-emerald-400" />}
                            {userInfo.domaine === "TRANSPORTS" && <Bus size={20} className="text-emerald-400" />}
                            {userInfo.domaine === "SECURITE" && <ShieldCheck size={20} className="text-emerald-400" />}
                            {userInfo.domaine === "URBANISME" && <Building2 size={20} className="text-emerald-400" />}
                            {userInfo.domaine}
                          </>
                        ) : (
                          <span className="text-white/40">{t("agent.notDefined")}</span>
                        )}
                      </p>
                    )}
                  </div>

                  {formData.domaine && isEditing && (
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-white/50 text-xs mb-3 flex items-center gap-2">
                        <Wrench size={14} />
                        Métier
                      </p>
                      <MetierSelector
                        domaine={formData.domaine}
                        value={formData.metier}
                        onChange={(val) => {
                          setFormData({ ...formData, metier: val });
                          setIsMetierValid(true);
                        }}
                        onValidChange={(valid) => setIsMetierValid(valid)}
                        label=""
                      />
                    </div>
                  )}

                  {!isEditing && userInfo.metier && (
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-white/50 text-xs mb-1 flex items-center gap-2">
                        <Wrench size={14} />
                        Métier
                      </p>
                      <p className="text-white text-lg flex items-center gap-2">
                        {userInfo.metier?.replace(/_/g, ' ').toLowerCase()}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-xs mb-1">{t("prof.roleNotEditable")}</p>
                <p className="text-white text-lg">{getRoleLabel(userInfo.role)}</p>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateProfile}
                  disabled={isLoading || !isFormValid}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={18} />
                      {t("prof.save")}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ 
                      nom: userInfo.nom, 
                      email: userInfo.email,
                      domaine: userInfo.domaine,
                      metier: userInfo.metier,
                      adresse: userInfo.adresse,
                      telephone: userInfo.telephone  // ⭐ AJOUTÉ
                    });
                    setIsNomValid(true);
                    setIsEmailValid(true);
                    setIsAdresseValid(!!userInfo.adresse && userInfo.adresse.length >= 4);
                    setIsTelephoneValid(!!userInfo.telephone && userInfo.telephone.length >= 10);  // ⭐ AJOUTÉ
                    setIsDomaineValid(!!userInfo.domaine);
                    setIsMetierValid(!!userInfo.metier);
                  }}
                  className="px-6 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  {t("common.cancel")}
                </button>
              </div>
            )}
          </div>

          {/* Section Changement de mot de passe */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                {t("prof.security")}
              </h2>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                >
                  {t("admin.changePassword")}
                </button>
              )}
            </div>

            {showPasswordForm ? (
              <div className="space-y-4">
                <ValidatedInput
                  label={t("prof.currentPassword")}
                  value={passwordData.currentPassword}
                  onChange={(val) => {
                    setPasswordData({ ...passwordData, currentPassword: val });
                    setIsCurrentPasswordValid(validatePassword(val));
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
                    setIsNewPasswordValid(validateNewPassword(val));
                  }}
                  type="password"
                  placeholder={`•••••••• (${t("prof.min6")})`}
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
                    const isValid = validateConfirmPassword(val);
                    setIsConfirmPasswordValid(isValid);
                  }}
                  type="password"
                  placeholder="••••••••"
                  required={true}
                  minLength={6}
                  errorMessage={passwordData.confirmPassword !== passwordData.newPassword 
                    ? "Les mots de passe ne correspondent pas" 
                    : "Ce champ est requis"}
                  onValidChange={(valid) => setIsConfirmPasswordValid(valid)}
                  showPasswordToggle={true}
                />

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={isLoading || !isPasswordFormValid}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        {t("admin.changePassword")}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      setIsCurrentPasswordValid(false);
                      setIsNewPasswordValid(false);
                      setIsConfirmPasswordValid(false);
                    }}
                    className="px-6 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-sm">{t("auth.password")}</p>
                <p className="text-white text-lg">••••••••</p>
                <p className="text-white/40 text-xs mt-1">{t("prof.lastModified")} {t("prof.never")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modal-pop {
          0% {
            transform: translate(-50%, -20px) scale(0.9);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes progress-bar {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
        @keyframes scale {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-modal-pop {
          animation: modal-pop 0.3s ease-out;
        }
        .animate-progress-bar {
          animation: progress-bar linear forwards;
        }
        .animate-scale {
          animation: scale 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}