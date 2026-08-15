import { API_URL } from "./config/api";
import { useState, useEffect, useRef } from "react";
import { User, Lock, Save, Eye, EyeOff, Edit2, X, Check, Shield, Award, Crown, Sparkles, Moon, Star, AlertCircle } from "lucide-react";
import { useI18n } from "./context/AppContext";

export default function Profil() {
  const { t } = useI18n();
  const [userInfo, setUserInfo] = useState({ 
    id: "",
    nom: "", 
    email: "", 
    role: "" 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const [avatarHover, setAvatarHover] = useState(false);
  
  // États d'erreur pour les champs
  const [nomError, setNomError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  // Refs pour les champs
  const nomInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const currentPasswordInputRef = useRef(null);
  const newPasswordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  
  const token = localStorage.getItem("token");

  // ✅ Validation du nom (≥ 2 lettres, pas de chiffres, pas de caractères spéciaux)
  const validateNom = (value) => {
    if (!value.trim()) return t("val.nameRequired");
    if (/\d/.test(value)) return t("val.nameNoDigits");
    const nameRegex = /^[a-zA-ZÀ-ÿ\s-]+$/;
    if (!nameRegex.test(value)) return t("val.nameLetters");
    if (value.length < 2) return t("val.nameMin2");
    return "";
  };

  // ✅ Validation de l'email
  const validateEmail = (value) => {
    if (!value.trim()) return t("val.emailRequired");
    if (!value.toLowerCase().endsWith("@gmail.com")) {
      return t("val.emailGmail");
    }
    const localPart = value.toLowerCase().replace("@gmail.com", "");
    if (localPart.length === 0) return "Veuillez saisir un email valide";
    if (/\s/.test(localPart)) return t("val.emailNoSpaces");
    return "";
  };

  // ✅ Validation mot de passe (≥ 6 caractères)
  const validatePassword = (value) => {
    if (!value || value.trim() === "") return t("val.passwordRequired");
    if (value.length < 6) return t("val.passwordMin6");
    return "";
  };

  // ✅ Validation confirmation mot de passe
  const validateConfirmPassword = (value) => {
    if (!value || value.trim() === "") return "La confirmation est requise";
    if (value !== passwordData.newPassword) return "Les mots de passe ne correspondent pas";
    if (value.length < 6) return t("val.passwordMin6");
    return "";
  };

  // ✅ Gestion des changements avec validation immédiate
  const handleNomChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, nom: value });
    setNomError(validateNom(value));
  };

  const handleNomBlur = () => {
    const error = validateNom(formData.nom);
    setNomError(error);
    if (error) {
      setTimeout(() => nomInputRef.current?.focus(), 10);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, email: value });
    setEmailError(validateEmail(value));
  };

  const handleEmailBlur = () => {
    const error = validateEmail(formData.email);
    setEmailError(error);
    if (error) {
      setTimeout(() => emailInputRef.current?.focus(), 10);
    }
  };

  // ✅ Gestion des mots de passe avec blocage
  const handleCurrentPasswordChange = (e) => {
    const value = e.target.value;
    setPasswordData({ ...passwordData, currentPassword: value });
    const error = validatePassword(value);
    setCurrentPasswordError(error);
  };

  const handleCurrentPasswordBlur = () => {
    const error = validatePassword(passwordData.currentPassword);
    setCurrentPasswordError(error);
    if (error && currentPasswordInputRef.current) {
      setTimeout(() => currentPasswordInputRef.current.focus(), 10);
    }
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setPasswordData({ ...passwordData, newPassword: value });
    const error = validatePassword(value);
    setNewPasswordError(error);
    
    // Revalider la confirmation si elle existe déjà
    if (passwordData.confirmPassword) {
      const confirmError = validateConfirmPassword(passwordData.confirmPassword);
      setConfirmPasswordError(confirmError);
    }
  };

  const handleNewPasswordBlur = () => {
    const error = validatePassword(passwordData.newPassword);
    setNewPasswordError(error);
    if (error && newPasswordInputRef.current) {
      setTimeout(() => newPasswordInputRef.current.focus(), 10);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setPasswordData({ ...passwordData, confirmPassword: value });
    const error = validateConfirmPassword(value);
    setConfirmPasswordError(error);
  };

  const handleConfirmPasswordBlur = () => {
    const error = validateConfirmPassword(passwordData.confirmPassword);
    setConfirmPasswordError(error);
    if (error && confirmPasswordInputRef.current) {
      setTimeout(() => confirmPasswordInputRef.current.focus(), 10);
    }
  };

  // Vérifier si le formulaire de profil est valide
  const isProfileFormValid = () => {
    return nomError === "" && emailError === "" && formData.nom.trim() !== "" && formData.email.trim() !== "";
  };

  // Vérifier si le formulaire de mot de passe est valide
  const isPasswordFormValid = () => {
    const isCurrentValid = passwordData.currentPassword.length >= 6;
    const isNewValid = passwordData.newPassword.length >= 6;
    const isConfirmValid = passwordData.confirmPassword === passwordData.newPassword && passwordData.confirmPassword.length >= 6;
    
    return isCurrentValid && isNewValid && isConfirmValid;
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      console.warn("Aucun token trouvé");
      setMessage({ type: "error", text: "Veuillez vous reconnecter" });
    }
  }, [token]);

  const fetchUserProfile = async () => {
    if (!token) return;

    console.log("🔍 Récupération du profil...");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      console.log("📡 Statut réponse:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Données reçues:", data);
        
        setUserInfo({
          id: data.id || "",
          nom: data.nom || "Utilisateur",
          email: data.email || "",
          role: data.role || "CITOYEN"
        });
        setFormData({
          nom: data.nom || "Utilisateur",
          email: data.email || "",
        });
      } else if (response.status === 401 || response.status === 403) {
        console.error("❌ Token invalide");
        localStorage.removeItem("token");
        setMessage({ type: "error", text: "Session expirée, veuillez vous reconnecter" });
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        const error = await response.text();
        console.error("❌ Erreur:", error);
        setMessage({ type: "error", text: "Erreur lors du chargement du profil" });
      }
    } catch (error) {
      console.error("❌ Erreur réseau:", error);
      setMessage({ type: "error", text: "Impossible de contacter le serveur" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!isProfileFormValid()) {
      setMessage({ type: "error", text: "Veuillez corriger les erreurs avant de valider" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return;
    }

    console.log("✏️ Mise à jour profil:", { nom: formData.nom, email: formData.email });
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/api/auth/update-profile`, {
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

      console.log("📡 Réponse mise à jour:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Mise à jour réussie:", data);
        
        setUserInfo({
          ...userInfo,
          nom: formData.nom,
          email: formData.email
        });
        
        setMessage({ type: "success", text: "Profil mis à jour avec succès !" });
        setIsEditing(false);
        
        setTimeout(() => {
          fetchUserProfile();
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error("❌ Erreur backend:", response.status, errorText);
        setMessage({ type: "error", text: errorText || "Erreur lors de la mise à jour" });
      }
    } catch (error) {
      console.error("❌ Erreur réseau:", error);
      setMessage({ type: "error", text: "Erreur réseau, veuillez réessayer" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!isPasswordFormValid()) {
      setMessage({ type: "error", text: "Veuillez corriger les erreurs avant de valider" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return;
    }

    console.log("🔒 Changement de mot de passe");
    setIsLoading(true);
    setMessage({ type: "", text: "" });

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

      console.log("📡 Réponse changement mot de passe:", response.status);

      if (response.ok) {
        console.log("✅ Mot de passe changé avec succès");
        setMessage({ type: "success", text: "Mot de passe changé avec succès !" });
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setCurrentPasswordError("");
        setNewPasswordError("");
        setConfirmPasswordError("");
      } else {
        const errorText = await response.text();
        console.error("❌ Erreur:", errorText);
        setMessage({ type: "error", text: errorText || "Erreur lors du changement de mot de passe" });
      }
    } catch (error) {
      console.error("❌ Erreur réseau:", error);
      setMessage({ type: "error", text: "Erreur réseau, veuillez réessayer" });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'ADMIN': return <Crown className="w-5 h-5 text-indigo-400" />;
      case 'AGENT': return <Shield className="w-5 h-5 text-sky-400" />;
      default: return <Award className="w-5 h-5 text-emerald-400" />;
    }
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

  const getRoleGradient = (role) => {
    switch(role) {
      case 'ADMIN': return 'from-indigo-500 to-purple-500';
      case 'AGENT': return 'from-sky-500 to-blue-500';
      default: return 'from-emerald-500 to-teal-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 animate-twinkle">
          <Star className="w-4 h-4 text-white/20 fill-white/10" />
        </div>
        <div className="absolute top-40 right-20 animate-twinkle-delay">
          <Star className="w-3 h-3 text-white/20 fill-white/10" />
        </div>
        <div className="absolute bottom-20 left-1/4 animate-twinkle-slow">
          <Star className="w-5 h-5 text-white/20 fill-white/10" />
        </div>
        <div className="absolute top-1/3 right-1/3 animate-twinkle">
          <Star className="w-3 h-3 text-white/20 fill-white/10" />
        </div>
        
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl animate-pulse delay-3000"></div>
        
        <div className="absolute top-1/4 right-1/4 w-64 h-64 border border-white/5 rounded-full blur-xl animate-spin-slow"></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 border border-white/5 rounded-full blur-xl animate-spin-slow-reverse"></div>
      </div>

      <div className="container mx-auto max-w-4xl pt-8 relative z-10">
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl rounded-full px-6 py-2 mb-4 border border-white/10 shadow-xl">
            <Moon className="w-5 h-5 text-indigo-400" />
            <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
            <span className="text-white/80 font-medium">{t("admin.personalSpace")}</span>
          </div>
        </div>
        
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl transform transition-all duration-500 animate-slide-in-right backdrop-blur-xl ${
            message.type === 'success' 
              ? 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-300' 
              : 'bg-red-500/20 border border-red-400/30 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              <p className="font-medium">{message.text}</p>
            </div>
          </div>
        )}

        {isLoading && !userInfo.nom && (
          <div className="text-center text-white py-8">
            <div className="inline-block">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
              </div>
            </div>
            <p className="mt-4 text-white/60">{t("prof.loading")}</p>
          </div>
        )}

        {userInfo.nom && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Profile Card */}
            <div className="group relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <User className="w-6 h-6 text-indigo-400" />
                    {t("prof.personalInfo")}
                  </h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="group relative px-4 py-2 bg-white/10 backdrop-blur-xl hover:bg-white/20 rounded-xl text-white font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-white/20"
                    >
                      <span className="flex items-center gap-2">
                        <Edit2 size={16} className="group-hover:rotate-12 transition-transform" />
                        {t("prof.edit")}
                      </span>
                    </button>
                  )}
                </div>

                {/* Avatar Section */}
                <div className="flex items-center gap-6 mb-8">
                  <div 
                    className="relative group"
                    onMouseEnter={() => setAvatarHover(true)}
                    onMouseLeave={() => setAvatarHover(false)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${getRoleGradient(userInfo.role)} rounded-full blur-xl opacity-60 transition-all duration-300 ${avatarHover ? 'scale-110' : 'scale-100'}`}></div>
                    <div className={`relative w-28 h-28 bg-gradient-to-br ${getRoleGradient(userInfo.role)} rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${avatarHover ? 'scale-110' : 'scale-100'} border-2 border-white/20`}>
                      <span className="text-white text-4xl font-bold">
                        {userInfo.nom?.[0]?.toUpperCase() || userInfo.email?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    {avatarHover && (
                      <div className="absolute -top-2 -right-2 animate-bounce">
                        <Sparkles className="w-6 h-6 text-sky-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-1">{userInfo.nom}</h3>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(userInfo.role)}
                      <span className="text-white/70 font-medium">{getRoleLabel(userInfo.role)}</span>
                    </div>
                  </div>
                </div>

                {/* Info Fields avec validation */}
                <div className="space-y-4">
                  <div className="group/field relative">
                    <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover/field:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 group-hover/field:border-white/20 transition-all">
                      <p className="text-white/50 text-xs mb-1 font-medium">{t("admin.fullNameCaps")}</p>
                      {isEditing ? (
                        <>
                          <input
                            ref={nomInputRef}
                            type="text"
                            value={formData.nom}
                            onChange={handleNomChange}
                            onBlur={handleNomBlur}
                            className={`w-full bg-white/10 border text-white text-lg focus:outline-none focus:ring-2 rounded-lg px-3 py-2 placeholder-white/30 ${
                              nomError 
                                ? "border-red-500 focus:ring-red-500/50" 
                                : "border-white/20 focus:border-indigo-500/50 focus:ring-indigo-500/30"
                            }`}
                            placeholder={t("prof.yourName")}
                          />
                          {nomError && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {nomError}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-white text-lg font-medium">{userInfo.nom}</p>
                      )}
                    </div>
                  </div>

                  <div className="group/field relative">
                    <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover/field:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 group-hover/field:border-white/20 transition-all">
                      <p className="text-white/50 text-xs mb-1 font-medium">{t("admin.emailCaps")}</p>
                      {isEditing ? (
                        <>
                          <input
                            ref={emailInputRef}
                            type="email"
                            value={formData.email}
                            onChange={handleEmailChange}
                            onBlur={handleEmailBlur}
                            className={`w-full bg-white/10 border text-white text-lg focus:outline-none focus:ring-2 rounded-lg px-3 py-2 placeholder-white/30 ${
                              emailError 
                                ? "border-red-500 focus:ring-red-500/50" 
                                : "border-white/20 focus:border-indigo-500/50 focus:ring-indigo-500/30"
                            }`}
                            placeholder="votre@email.com"
                          />
                          {emailError && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {emailError}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-white text-lg">{userInfo.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="group/field relative">
                    <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover/field:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                      <p className="text-white/50 text-xs mb-1 font-medium">{t("admin.roleCaps")}</p>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(userInfo.role)}
                        <p className="text-white text-lg font-medium">{getRoleLabel(userInfo.role)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-8 animate-fade-in">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={isLoading || !isProfileFormValid()}
                      className={`flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
                        (!isProfileFormValid() || isLoading) 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:from-indigo-600 hover:to-purple-600 transform hover:scale-105"
                      }`}
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
                        setFormData({ nom: userInfo.nom, email: userInfo.email });
                        setNomError("");
                        setEmailError("");
                      }}
                      className="px-6 bg-white/10 backdrop-blur-xl hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 border border-white/20"
                    >
                      <X size={18} />
                      {t("common.cancel")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Security Card */}
            <div className="group relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden shadow-2xl">
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Lock className="w-6 h-6 text-indigo-400" />
                    {t("prof.security")}
                  </h2>
                  {!showPasswordForm && (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="px-4 py-2 bg-white/10 backdrop-blur-xl hover:bg-white/20 rounded-xl text-white font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-white/20"
                    >
                      {t("admin.changePassword")}
                    </button>
                  )}
                </div>

                {showPasswordForm ? (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="text-white/70 text-sm mb-2 block font-medium">{t("prof.currentPassword")}</label>
                      <div className="relative group/input">
                        <input
                          ref={currentPasswordInputRef}
                          type={showPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={handleCurrentPasswordChange}
                          onBlur={handleCurrentPasswordBlur}
                          className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all pr-12 ${
                            currentPasswordError 
                              ? "border-red-500 focus:ring-red-500/30" 
                              : "border-white/20 focus:border-indigo-500/50 focus:ring-indigo-500/30"
                          }`}
                          placeholder={`•••••••• (${t("prof.min6")})`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {currentPasswordError && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {currentPasswordError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-white/70 text-sm mb-2 block font-medium">{t("prof.newPassword")}</label>
                      <div className="relative group/input">
                        <input
                          ref={newPasswordInputRef}
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={handleNewPasswordChange}
                          onBlur={handleNewPasswordBlur}
                          className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all pr-12 ${
                            newPasswordError 
                              ? "border-red-500 focus:ring-red-500/30" 
                              : "border-white/20 focus:border-indigo-500/50 focus:ring-indigo-500/30"
                          }`}
                          placeholder={`•••••••• (${t("prof.min6")})`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {newPasswordError && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {newPasswordError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-white/70 text-sm mb-2 block font-medium">{t("prof.confirmPassword")}</label>
                      <div className="relative group/input">
                        <input
                          ref={confirmPasswordInputRef}
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={handleConfirmPasswordChange}
                          onBlur={handleConfirmPasswordBlur}
                          className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 transition-all pr-12 ${
                            confirmPasswordError 
                              ? "border-red-500 focus:ring-red-500/30" 
                              : "border-white/20 focus:border-indigo-500/50 focus:ring-indigo-500/30"
                          }`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {confirmPasswordError && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {confirmPasswordError}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleChangePassword}
                        disabled={isLoading || !isPasswordFormValid()}
                        className={`flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
                          (!isPasswordFormValid() || isLoading) 
                            ? "opacity-50 cursor-not-allowed" 
                            : "hover:from-indigo-600 hover:to-purple-600 transform hover:scale-105"
                        }`}
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Save size={18} />
                            Changer
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                          setCurrentPasswordError("");
                          setNewPasswordError("");
                          setConfirmPasswordError("");
                        }}
                        className="px-6 bg-white/10 backdrop-blur-xl hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105 border border-white/20"
                      >
                        <X size={18} />
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className="w-5 h-5 text-indigo-400" />
                      <p className="text-white/60 text-sm font-medium">{t("auth.password")}</p>
                    </div>
                    <p className="text-white text-lg font-mono">••••••••</p>
                    <p className="text-white/30 text-xs mt-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {t("admin.encrypted")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        @keyframes twinkle-delay {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.3); }
        }
        @keyframes twinkle-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.6s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
        .animate-slide-in-right { animation: slide-in-right 0.4s ease-out; }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
        .animate-twinkle-delay { animation: twinkle-delay 4s ease-in-out infinite; }
        .animate-twinkle-slow { animation: twinkle-slow 5s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-spin-slow-reverse { animation: spin-slow-reverse 15s linear infinite; }
      `}</style>
    </div>
  );
}