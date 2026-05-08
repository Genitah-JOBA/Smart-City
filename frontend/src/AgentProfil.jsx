import { useState, useEffect, useRef } from "react";
import { User, Mail, Shield, Save, Lock, Eye, EyeOff, Edit2, X, Check, AlertCircle, CheckCircle, Info } from "lucide-react";

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
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);
  const [inputType, setInputType] = useState(type);

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

  const handleBlur = (e) => {
    setTouched(true);
    const validationError = validate(value);
    setError(validationError);
    
    // ✅ Si le champ est invalide, on empêche la perte de focus
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

export default function Profil() {
  const [userInfo, setUserInfo] = useState({ 
    nom: "", 
    email: "", 
    role: "" 
  });
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
  const [messageBox, setMessageBox] = useState({ show: false, type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  
  // États de validation
  const [isNomValid, setIsNomValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  
  // États de validation des mots de passe
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState(false);
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);
  const [isPasswordFormValid, setIsPasswordFormValid] = useState(false);
  
  const token = localStorage.getItem("token");

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
    setIsFormValid(isNomValid && isEmailValid);
  }, [isNomValid, isEmailValid]);

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
      const response = await fetch("http://localhost:8081/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
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
      } else if (response.status === 403) {
        showMessage("error", "Session expirée. Redirection vers la connexion...");
        setTimeout(() => handleLogout(), 2000);
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

  const handleUpdateProfile = async () => {
    if (!isFormValid) {
      showMessage("error", "Veuillez corriger les erreurs avant de valider");
      return;
    }

    setIsLoading(true);
    hideMessage();

    const emailChanged = formData.email !== userInfo.email;

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
        const data = await response.json();
        
        if (emailChanged && data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userEmail", formData.email);
          localStorage.setItem("userNom", formData.nom);
          
          setUserInfo({
            ...userInfo,
            nom: formData.nom,
            email: formData.email
          });
          
          showMessage("success", "✅ Profil mis à jour avec succès ! Votre session a été actualisée.");
          setIsEditing(false);
          
          setTimeout(() => {
            fetchUserProfile();
          }, 500);
          
        } else if (!emailChanged) {
          setUserInfo({
            ...userInfo,
            nom: formData.nom
          });
          localStorage.setItem("userNom", formData.nom);
          showMessage("success", "✅ Profil mis à jour avec succès !");
          setIsEditing(false);
        }
      } else if (response.status === 403) {
        showMessage("error", "Session expirée. Veuillez vous reconnecter.");
        setTimeout(() => handleLogout(), 2000);
      } else {
        const error = await response.text();
        showMessage("error", error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      showMessage("error", "Erreur réseau, veuillez réessayer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!isPasswordFormValid) {
      showMessage("error", "Veuillez corriger les erreurs avant de valider");
      return;
    }

    setIsLoading(true);
    hideMessage();

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
        showMessage("error", error || "Erreur lors du changement de mot de passe");
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
      'ADMIN': 'Administrateur',
      'AGENT': 'Agent Municipal',
      'CITOYEN': 'Citoyen',
      'CITIZEN': 'Citoyen'
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
          Mon profil
        </h1>

        <div className="space-y-6">
          {/* Informations du profil */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Informations personnelles</h2>
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
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-xs mb-1">Nom complet</p>
                {isEditing ? (
                  <ValidatedInput
                    label=""
                    value={formData.nom}
                    onChange={(val) => {
                      setFormData({ ...formData, nom: val });
                      setIsNomValid(validateNom(val));
                    }}
                    placeholder="Votre nom"
                    required={true}
                    minLength={2}
                    errorMessage="Le nom doit contenir au moins 2 caractères"
                    onValidChange={(valid) => setIsNomValid(valid)}
                    className="mt-0"
                  />
                ) : (
                  <p className="text-white text-lg">{userInfo.nom}</p>
                )}
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-xs mb-1">Adresse email</p>
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
                    errorMessage="Email invalide (exemple: nom@domaine.com)"
                    onValidChange={(valid) => setIsEmailValid(valid)}
                    className="mt-0"
                  />
                ) : (
                  <p className="text-white text-lg">{userInfo.email}</p>
                )}
              </div>

              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-xs mb-1">Rôle non modifiable</p>
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
                      Enregistrer
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ nom: userInfo.nom, email: userInfo.email });
                    setIsNomValid(true);
                    setIsEmailValid(true);
                  }}
                  className="px-6 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Annuler
                </button>
              </div>
            )}
          </div>

          {/* Section Changement de mot de passe */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                Sécurité
              </h2>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                >
                  Changer le mot de passe
                </button>
              )}
            </div>

            {showPasswordForm ? (
              <div className="space-y-4">
                {/* Mot de passe actuel */}
                <ValidatedInput
                  label="Mot de passe actuel"
                  value={passwordData.currentPassword}
                  onChange={(val) => {
                    setPasswordData({ ...passwordData, currentPassword: val });
                    setIsCurrentPasswordValid(validatePassword(val));
                  }}
                  type="password"
                  placeholder="••••••••"
                  required={true}
                  minLength={6}
                  errorMessage="Le mot de passe doit contenir au moins 6 caractères"
                  onValidChange={(valid) => setIsCurrentPasswordValid(valid)}
                  showPasswordToggle={true}
                />

                {/* Nouveau mot de passe */}
                <ValidatedInput
                  label="Nouveau mot de passe"
                  value={passwordData.newPassword}
                  onChange={(val) => {
                    setPasswordData({ ...passwordData, newPassword: val });
                    setIsNewPasswordValid(validateNewPassword(val));
                  }}
                  type="password"
                  placeholder="•••••••• (minimum 6 caractères)"
                  required={true}
                  minLength={6}
                  errorMessage="Le mot de passe doit contenir au moins 6 caractères"
                  onValidChange={(valid) => setIsNewPasswordValid(valid)}
                  showPasswordToggle={true}
                />

                {/* Confirmation mot de passe */}
                <ValidatedInput
                  label="Confirmer le mot de passe"
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
                        Changer le mot de passe
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
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-sm">Mot de passe</p>
                <p className="text-white text-lg">••••••••</p>
                <p className="text-white/40 text-xs mt-1">Dernière modification : Jamais</p>
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