import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Smartphone, Building2, Shield, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [role, setRole] = useState("CITIZEN");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    let newErrors = {};

    // 1. Contrôle Nom : Pas de chiffres
    if (/\d/.test(nom)) {
      newErrors.nom = "Le nom ne doit pas contenir de chiffres.";
    }

    // 2. Contrôle Email : Doit finir par @gmail.com
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      newErrors.email = "L'email doit impérativement être une adresse @gmail.com";
    }

    // 3. Contrôle Mot de passe : > 6 caractères
    if (motDePasse.length < 6) {
      newErrors.motDePasse = "Le mot de passe doit contenir plus de 6 caractères.";
    }

    // Si des erreurs existent, on bloque l'envoi
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Le curseur reste ici, l'envoi est stoppé
    }

    setErrors({}); // On vide les erreurs si tout est OK

    try {
      const response = await fetch("http://localhost:8081/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, motDePasse, role }),
      });

      if (response.status === 409) {
        const errorMsg = await response.text();
        throw new Error(errorMsg);
      }

      const serverResponseText = await response.text();

      if (!response.ok) {
        throw new Error(serverResponseText || "Une erreur est survenue");
      }

      setIsSuccess(true);
      setMessage("Votre compte a été créé avec succès !");
      setShowModal(true);
      setNom(""); setEmail(""); setMotDePasse("");
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.message);
      setShowModal(true);
    }
  };

  const validateEmail = (e) => {
    if (email !== "" && !email.toLowerCase().endsWith("@gmail.com")) {
      setErrors(prev => ({ ...prev, email: "L'email doit se terminer par @gmail.com" }));
      setTimeout(() => e.target.focus(), 0);
    } else {
      setErrors(prev => ({ ...prev, email: null }));
    }
  };

  const validatePassword = (e) => {
    if (motDePasse !== "" && motDePasse.length < 6) {
      setErrors(prev => ({ ...prev, motDePasse: "Le mot de passe doit être > 6 caractères" }));
      setTimeout(() => e.target.focus(), 0);
    } else {
      setErrors(prev => ({ ...prev, motDePasse: null }));
    }
  };

  const roles = [
    { id: "CITIZEN", label: "Citoyen", icon: Smartphone, color: "from-blue-500 to-cyan-500" },
    { id: "AGENT", label: "Agent Municipal", icon: Building2, color: "from-emerald-500 to-teal-500" },
    { id: "ADMIN", label: "Administrateur", icon: Shield, color: "from-purple-500 to-pink-500" },
  ];

  const [errors, setErrors] = useState({});

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Message Box */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl transform animate-in zoom-in-95 duration-300">
            <div className="text-center">
              {/* Icône dynamique (Check ou Erreur) */}
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {isSuccess ? <Shield className="w-8 h-8" /> : <div className="text-2xl font-bold">!</div>}
              </div>
              
              <h3 className={`text-xl font-bold mb-2 ${isSuccess ? 'text-slate-900' : 'text-red-600'}`}>
                {isSuccess ? "Félicitations !" : "Oups !"}
              </h3>
              
              <p className="text-slate-600 text-sm mb-6">
                {message}
              </p>

              <button
                onClick={() => setShowModal(false)}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                  isSuccess 
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                    : 'bg-slate-800 hover:bg-slate-900 shadow-slate-950/20'
                }`}
              >
                {isSuccess ? "Continuer" : "Réessayer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* Main Form Container */}
      <div className="relative w-full max-w-5xl bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
        
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left Side - Branding & Info */}
          <div className="relative p-8 md:p-10 flex flex-col justify-between overflow-hidden min-h-full">
            
            {/* Contenu (Z-index pour passer au-dessus de l'image) */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-10">
                {/* Logo avec rappel du vert nature de l'image */}
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">SmartCity</h1>
                  <p className="text-emerald-400 text-xs font-medium uppercase tracking-wider">Plateforme citoyenne</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-extrabold text-white leading-tight">
                  Rejoignez la<br />
                  <span className="text-emerald-400">révolution urbaine</span>
                </h2>
                <p className="text-slate-100/90 text-sm leading-relaxed max-w-sm">
                  Participez activement à l'amélioration de votre ville en signalant les problèmes et en contribuant à une communauté plus responsable.
                </p>
              </div>
            </div>

            {/* Liste à puces ergonomique */}
            <div className="relative z-10 mt-8 space-y-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-medium">Signalement en temps réel</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-medium">Suivi des interventions</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-xs font-medium">Impact communautaire</span>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="relative p-8 md:p-10 overflow-y-auto min-h-full">
            <div 
              className="absolute inset-0 z-0"
              style={{ 
                backgroundImage: `url('/Image/Smart.jpg')`, // Vérifie bien le nom du fichier
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* OVERLAY : Indispensable pour l'ergonomie. 
                  Il assombrit l'image pour que le texte blanc soit lisible */}
              <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" />
            </div>

            {/* FORMULAIRE (z-10 pour être au-dessus de l'image) */}
            <form onSubmit={handleRegister} className="relative z-10 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Inscription</h3>
                <p className="text-white/80 text-sm">Créez votre compte en quelques secondes</p>
              </div>

              {/* Name Input */}
              <div className="space-y-1">
                <label className="text-white/80 text-xs font-medium">Nom complet</label>
                <div className={`relative transition-all duration-300 ${focusedField === 'nom' ? 'scale-[1.02]' : ''}`}>
                  <input
                    type="text"
                    placeholder="Jean Dupont"
                    value={nom}
                    onChange={(e) => setNom(e.target.value.replace(/[0-9]/g, ""))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/70 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm backdrop-blur-md"
                    required
                  />
                  {errors.nom && <p className="text-red-400 text-[10px] mt-1">{errors.nom}</p>}
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="text-white/80 text-xs font-medium">Email</label>
                <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                  <input
                    type="email"
                    placeholder="jean@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={validateEmail}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/70 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm backdrop-blur-md"
                    required
                  />
                  {errors.email && (
                    <p className="text-red-400 text-[11px] mt-1 font-semibold animate-pulse">
                      ⚠️ {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-white/80 text-xs font-medium">Mot de passe</label>
                <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    onBlur={validatePassword}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/70 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all pr-12 text-sm backdrop-blur-md"
                    required
                  />
                  {errors.motDePasse && (
                    <p className="text-red-400 text-[11px] mt-1 font-semibold animate-pulse">
                      ⚠️ {errors.motDePasse}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="text-white/80 text-xs font-medium">Type de compte</label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`relative py-2 rounded-xl transition-all ${
                          isSelected 
                            ? `bg-emerald-600 shadow-lg scale-105 text-white` 
                            : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'
                        }`}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-0.5" />
                        <span className="text-[11px] font-medium">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button - Couleur Emeraude pour rappeler la nature */}
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Créer mon compte <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-center text-white/80 text-xs">
                Déjà un compte ?{" "}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline">
                  Se connecter
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}