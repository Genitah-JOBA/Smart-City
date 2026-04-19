import { useState, useEffect } from "react";
import { User, Mail, Shield, Save, Lock, Eye, EyeOff, Edit2, X, Check } from "lucide-react";

export default function Profil() {
  const [userInfo, setUserInfo] = useState({ 
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
  
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUserProfile();
  }, [token]);

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
      } else {
        // Fallback au décodage du token
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
    setIsLoading(true);
    setMessage({ type: "", text: "" });

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
        setUserInfo({
          ...userInfo,
          nom: formData.nom,
          email: formData.email
        });
        setMessage({ type: "success", text: "Profil mis à jour avec succès !" });
        setIsEditing(false);
      } else {
        const error = await response.text();
        setMessage({ type: "error", text: error || "Erreur lors de la mise à jour" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur réseau, veuillez réessayer" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Le mot de passe doit contenir au moins 6 caractères" });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

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
        setMessage({ type: "success", text: "Mot de passe changé avec succès !" });
        setShowPasswordForm(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const error = await response.text();
        setMessage({ type: "error", text: error || "Erreur lors du changement de mot de passe" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur réseau, veuillez réessayer" });
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-3xl pt-8">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <User className="w-8 h-8 text-emerald-400" />
          Mon profil
        </h1>
        
        {/* Message de succès/erreur */}
        {message.text && (
          <div className={`mb-4 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

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
              {/* Champ Nom */}
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-xs mb-1">Nom complet</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Votre nom"
                  />
                ) : (
                  <p className="text-white text-lg">{userInfo.nom}</p>
                )}
              </div>

              {/* Champ Email */}
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-xs mb-1">Adresse email</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="votre@email.com"
                  />
                ) : (
                  <p className="text-white text-lg">{userInfo.email}</p>
                )}
              </div>

              {/* Champ Rôle (non modifiable) */}
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-xs mb-1">Rôle non modifiable</p>
                <p className="text-white text-lg">{getRoleLabel(userInfo.role)}</p>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={18} />
                      Enregistrer
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ nom: userInfo.nom, email: userInfo.email });
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
                <div>
                  <label className="text-white/70 text-sm mb-1 block">Mot de passe actuel</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div>
                  <label className="text-white/70 text-sm mb-1 block">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirmation mot de passe */}
                <div>
                  <label className="text-white/70 text-sm mb-1 block">Confirmer le mot de passe</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
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
    </div>
  );
}