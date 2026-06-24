import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Smartphone, Building2, Shield, ArrowRight, Eye, EyeOff, UserPlus, LogIn, Sparkles, Rocket, Zap, Award, Loader2, Phone, Home } from "lucide-react";

export default function Auth() {
  // État pour basculer entre login et register
  const [isLogin, setIsLogin] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState("right");
  
  // États communs
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // États spécifiques à l'inscription
  const [nom, setNom] = useState("");
  const [role, setRole] = useState("CITIZEN");
  const [domaine, setDomaine] = useState("");
  const [metier, setMetier] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🔥 OPTIMISÉ : Vérification de connexion au chargement
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    
    // Si déjà connecté, rediriger immédiatement
    if (token && userRole && !isRedirecting) {
      if (userRole === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (userRole === "AGENT") {
        navigate("/agent/signalements-assignes", { replace: true });
      } else {
        navigate("/signalements", { replace: true });
      }
    }
  }, []);

  const toggleMode = () => {
    setAnimationDirection(isLogin ? "left" : "right");
    setIsAnimating(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setErrors({});
      setMessage("");
      setEmail("");
      setMotDePasse("");
      setNom("");
      setDomaine("");
      setMetier("");
      setTelephone("");
      setAdresse("");
      setShowPassword(false);
      setIsAnimating(false);
    }, 500);
  };

  const redirectToDashboard = (role) => {
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    setShowModal(false);
    
    // Redirection immédiate sans délai
    if (role === "ADMIN") {
      navigate("/admin/dashboard", { replace: true });
    } else if (role === "AGENT") {
      navigate("/agent/signalements-assignes", { replace: true });
    } else {
      navigate("/signalements", { replace: true });
    }
  };

  // ⭐ UNE SEULE DÉCLARATION DE roles
  const roles = [
    { id: "CITIZEN", label: "Citoyen", icon: Smartphone, color: "from-emerald-600 to-teal-500", description: "Signalez des problèmes dans votre quartier" },
    { id: "AGENT", label: "Agent Municipal", icon: Building2, color: "from-green-600 to-green-400", description: "Gérez et résolvez les signalements" },
  ];

  // ⭐ LISTE DES DOMAINES AVEC DECHETS (au lieu de PROPRETE)
  const domaines = [
    { id: "VOIRIE", label: "Voirie et infrastructures", icon: "🛣️", description: "Routes, trottoirs, nids-de-poule" },
    { id: "ECLAIRAGE", label: "Éclairage public", icon: "💡", description: "Lampadaires, éclairage urbain" },
    { id: "DECHETS", label: "Déchets et Propreté", icon: "🗑️", description: "Collecte des déchets, nettoyage" },
    { id: "ESPACES_VERTS", label: "Espaces verts", icon: "🌳", description: "Parcs, jardins, arbres" },
    { id: "TRANSPORTS", label: "Transports et mobilité", icon: "🚌", description: "Transports en commun, stationnement" },
    { id: "SECURITE", label: "Sécurité et prévention", icon: "👮", description: "Sécurité publique, prévention" },
    { id: "URBANISME", label: "Urbanisme", icon: "🏗️", description: "Aménagement urbain, construction" },
  ];

  // ⭐ MÉTIERS PAR DOMAINE AVEC DECHETS
  const metiersParDomaine = {
    VOIRIE: [
      { id: "AGENT_VOIRIE", label: "Agent de voirie", icon: "🛠️", description: "Réparation nids-de-poule, entretien chaussées" },
      { id: "TECHNICIEN_GENIE_CIVIL", label: "Technicien génie civil", icon: "🏗️", description: "Inspection ponts, tunnels, ouvrages d'art" },
      { id: "CHEF_CHANTIER_VOIRIE", label: "Chef de chantier voirie", icon: "📋", description: "Coordination travaux routiers" },
      { id: "AGENT_SIGNALISATION", label: "Agent de signalisation", icon: "🚦", description: "Pose et entretien panneaux, feux tricolores" }
    ],
    ECLAIRAGE: [
      { id: "TECHNICIEN_ECLAIRAGE", label: "Technicien éclairage", icon: "💡", description: "Réparation lampadaires, entretien du réseau" },
      { id: "INGENIEUR_ECLAIRAGE", label: "Ingénieur éclairage urbain", icon: "📐", description: "Conception schéma d'éclairage, optimisation énergétique" },
      { id: "AGENT_MAINTENANCE_ELEC", label: "Agent maintenance électrique", icon: "⚡", description: "Dépannage pannes électriques" }
    ],
    DECHETS: [
      { id: "AGENT_COLLECTE", label: "Agent de collecte", icon: "🚛", description: "Ramassage ordures ménagères" },
      { id: "TECHNICIEN_NETTOIEMENT", label: "Technicien nettoiement", icon: "🧹", description: "Nettoyage rues, espaces publics" },
      { id: "RESPONSABLE_DECHETTERIE", label: "Responsable déchetterie", icon: "♻️", description: "Gestion des déchèteries" },
      { id: "AGENT_TRI", label: "Agent de tri", icon: "🗑️", description: "Centre de tri des déchets" },
      { id: "COORDINATEUR_PROPRETE", label: "Coordinateur propreté", icon: "📊", description: "Planification tournées" }
    ],
    ESPACES_VERTS: [
      { id: "JARDINIER_MUNICIPAL", label: "Jardinier municipal", icon: "🌿", description: "Entretien parcs, jardins, massifs" },
      { id: "ELAGUEUR", label: "Élagueur", icon: "🌳", description: "Taille et entretien arbres" },
      { id: "TECHNICIEN_ESPACES_VERTS", label: "Technicien espaces verts", icon: "🏡", description: "Aménagement paysager" },
      { id: "PAYSAGISTE_URBAIN", label: "Paysagiste urbain", icon: "🎨", description: "Conception espaces verts" },
      { id: "AGENT_ARROSAGE", label: "Agent arrosage", icon: "💧", description: "Gestion système d'irrigation" }
    ],
    TRANSPORTS: [
      { id: "AGENT_REGULATION", label: "Agent de régulation", icon: "🚦", description: "Gestion trafic, feux, bouchons" },
      { id: "CONTROLEUR_TRANSPORT", label: "Contrôleur transport", icon: "🎫", description: "Contrôle bus, tramway, métro" },
      { id: "TECHNICIEN_STATIONNEMENT", label: "Technicien stationnement", icon: "🅿️", description: "Gestion parkings, horodateurs" },
      { id: "AGENT_MOBILITE_DOUCE", label: "Agent mobilité douce", icon: "🚲", description: "Entretien pistes cyclables, bornes vélos" }
    ],
    SECURITE: [
      { id: "AGENT_SECURITE_URBAINE", label: "Agent de sécurité urbaine", icon: "👮", description: "Surveillance quartiers" },
      { id: "POLICE_MUNICIPALE", label: "Police municipale", icon: "👮‍♂️", description: "Maintien ordre public, verbalisation" },
      { id: "AGENT_MEDIATEUR", label: "Agent médiateur", icon: "🤝", description: "Gestion conflits de quartier" },
      { id: "COORDINATEUR_VIDEO", label: "Coordinateur vidéoprotection", icon: "📹", description: "Supervision caméras" }
    ],
    URBANISME: [
      { id: "URBANISTE", label: "Urbaniste", icon: "🏙️", description: "Planification urbaine" },
      { id: "ARCHITECTE_CONSEIL", label: "Architecte conseil", icon: "🏛️", description: "Conseil en architecture" },
      { id: "TECHNICIEN_URBANISME", label: "Technicien urbanisme", icon: "📐", description: "Instruction permis de construire" },
      { id: "CHARGE_MISSION_URBAIN", label: "Chargé de mission urbain", icon: "📋", description: "Projets d'aménagement" }
    ]
  };

  // ⭐ Validation du téléphone (10 chiffres, commence par 032/033/034/037/038)
  const validatePhone = (phone) => {
    if (!phone) return "Le numéro de téléphone est obligatoire";
    const phoneRegex = /^(032|033|034|037|038)\d{7}$/;
    if (!phoneRegex.test(phone)) {
      return "Le téléphone doit commencer par 032, 033, 034, 037 ou 038 et contenir exactement 10 chiffres";
    }
    return null;
  };

  // ⭐ Validation de l'adresse (minimum 6 caractères, lettres, chiffres et espaces uniquement)
  const validateAddress = (address) => {
    if (!address) return "L'adresse est obligatoire";
    if (address.length < 6) return "L'adresse doit contenir au moins 6 caractères";
    const addressRegex = /^[a-zA-Z0-9\s]+$/;
    if (!addressRegex.test(address)) {
      return "L'adresse ne doit contenir que des lettres, chiffres et espaces (pas de caractères spéciaux)";
    }
    return null;
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  
  if (isRedirecting || isLoading) return;
  
  setMessage("");
  let newErrors = {};

  if (!email.toLowerCase().endsWith("@gmail.com")) {
    newErrors.email = "L'email doit impérativement être une adresse @gmail.com";
  }
  if (motDePasse.length < 6) {
    newErrors.motDePasse = "Le mot de passe doit contenir plus de 6 caractères.";
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setErrors({});
  setIsLoading(true);

  try {
    const response = await fetch("http://localhost:8081/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motDePasse }),
    });

    if (!response.ok) {
      throw new Error("Email ou mot de passe incorrect");
    }

    const token = await response.text();
    
    // ⭐ Stocker le token IMMÉDIATEMENT
    localStorage.setItem("token", token);
    
    // ⭐ Décoder le token pour obtenir les infos sans appel API
    let userId = null;
    let userNom = email.split('@')[0];
    let userRole = "CITIZEN";
    let userDomaine = null;
    let userMetier = null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId || payload.id || payload.sub;
      userRole = payload.role || "CITIZEN";
      userDomaine = payload.domaine;
      userMetier = payload.metier;
      console.log("📦 Payload du token:", payload);
    } catch (e) {
      console.error("Erreur décodage token:", e);
    }
    
    const normalizedRole = userRole.toUpperCase();
    
    console.log("✅ Rôle depuis token:", normalizedRole);
    
    // Stocker toutes les infos
    localStorage.setItem("userRole", normalizedRole);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userNom", userNom);
    if (userDomaine) localStorage.setItem("userDomaine", userDomaine);
    if (userMetier) localStorage.setItem("userMetier", userMetier);
    
    localStorage.setItem("user", JSON.stringify({
      id: userId,
      nom: userNom,
      email: email,
      role: normalizedRole,
      domaine: userDomaine,
      metier: userMetier
    }));

    setIsSuccess(true);
    setMessage(`Connexion réussie ! Bienvenue ${userNom}`);
    setShowModal(true);
    
    // ⭐ Redirection après un court délai
    setTimeout(() => {
      if (normalizedRole === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (normalizedRole === "AGENT") {
        navigate("/agent/signalements-assignes", { replace: true });
      } else {
        navigate("/signalements", { replace: true });
      }
    }, 500);
    
  } catch (error) {
    setIsSuccess(false);
    setMessage(error.message);
    setShowModal(true);
  } finally {
    setIsLoading(false);
  }
};

  // Gestion de l'inscription OPTIMISÉE avec validations renforcées
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setMessage("");
    let newErrors = {};

    if (/\d/.test(nom)) {
      newErrors.nom = "Le nom ne doit pas contenir de chiffres.";
    }
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!nameRegex.test(nom)) {
      newErrors.nom = "Le nom ne doit contenir que des lettres, espaces ou tirets.";
    }
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      newErrors.email = "L'email doit impérativement être une adresse @gmail.com";
    }
    if (motDePasse.length < 6) {
      newErrors.motDePasse = "Le mot de passe doit contenir plus de 6 caractères.";
    }
    
    // ⭐ Validation du téléphone (obligatoire)
    const phoneError = validatePhone(telephone);
    if (phoneError) {
      newErrors.telephone = phoneError;
    }
    
    // ⭐ Validation de l'adresse (obligatoire)
    const addressError = validateAddress(adresse);
    if (addressError) {
      newErrors.adresse = addressError;
    }
    
    // Validation du domaine pour les agents
    if (role === "AGENT" && !domaine) {
      newErrors.domaine = "Veuillez sélectionner votre domaine d'intervention";
    }
    
    // Validation du métier pour les agents
    if (role === "AGENT" && domaine && !metier) {
      newErrors.metier = "Veuillez sélectionner votre métier";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const requestBody = { 
        nom, 
        email, 
        motDePasse, 
        role,
        telephone: telephone,
        adresse: adresse,
        domaine: role === "AGENT" ? domaine : null,
        metier: role === "AGENT" && metier ? metier : null
      };
      
      console.log("📤 Envoi inscription:", requestBody);

      const response = await fetch("http://localhost:8081/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 409) {
        const errorMsg = await response.text();
        throw new Error(errorMsg);
      }

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || "Une erreur est survenue");
      }

      setIsSuccess(true);
      setMessage("Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.");
      setShowModal(true);
      setNom(""); 
      setEmail(""); 
      setMotDePasse("");
      setRole("CITIZEN");
      setDomaine("");
      setMetier("");
      setTelephone("");
      setAdresse("");
      
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.message);
      setShowModal(true);
    } finally {
      setIsLoading(false);
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

  // Validation mot de passe
  const validatePassword = (e) => {
    if (motDePasse !== "" && motDePasse.length < 6) {
      setErrors(prev => ({ ...prev, motDePasse: "Le mot de passe doit contenir plus de 6 caractères." }));
      setTimeout(() => e.target.focus(), 0);
    } else {
      setErrors(prev => ({ ...prev, motDePasse: null }));
    }
  };

  // ⭐ Validation en temps réel du téléphone
  const validatePhoneField = (e) => {
    const value = e.target.value;
    if (value !== "") {
      const phoneRegex = /^(032|033|034|037|038)\d{7}$/;
      if (!phoneRegex.test(value)) {
        setErrors(prev => ({ ...prev, telephone: "Le téléphone doit commencer par 032, 033, 034, 037 ou 038 et contenir exactement 10 chiffres" }));
      } else {
        setErrors(prev => ({ ...prev, telephone: null }));
      }
    } else {
      setErrors(prev => ({ ...prev, telephone: "Le numéro de téléphone est obligatoire" }));
    }
  };

  // ⭐ Validation en temps réel de l'adresse
  const validateAddressField = (e) => {
    const value = e.target.value;
    if (value !== "") {
      if (value.length < 6) {
        setErrors(prev => ({ ...prev, adresse: "L'adresse doit contenir au moins 6 caractères" }));
      } else {
        const addressRegex = /^[a-zA-Z0-9\s]+$/;
        if (!addressRegex.test(value)) {
          setErrors(prev => ({ ...prev, adresse: "L'adresse ne doit contenir que des lettres, chiffres et espaces" }));
        } else {
          setErrors(prev => ({ ...prev, adresse: null }));
        }
      }
    } else {
      setErrors(prev => ({ ...prev, adresse: "L'adresse est obligatoire" }));
    }
  };

  const getFormAnimationClass = () => {
    if (!isAnimating) return "animate-form-enter";
    return animationDirection === "right" ? "animate-form-exit-right" : "animate-form-exit-left";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Étoiles filantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full animate-shooting-star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400/40 rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 6}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`
            }}
          />
        ))}
      </div>

      {/* Cercle lumineux en arrière-plan */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-500/5 blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-400/5 blur-2xl animate-pulse-slow animation-delay-1000" />

      {/* Message Box */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-[90%] sm:max-w-sm w-full shadow-2xl transform animate-modal-pop">
            <div className="text-center">
              <div className={`mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'} animate-scale`}>
                {isSuccess ? <Award className="w-7 h-7 sm:w-8 sm:h-8" /> : <div className="text-2xl font-bold animate-shake">!</div>}
              </div>
              <h3 className={`text-lg sm:text-xl font-bold mb-2 ${isSuccess ? 'text-slate-900' : 'text-red-600'}`}>
                {isSuccess ? "Félicitations !" : "Oups !"}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mb-6 break-words">{message}</p>
              <button
                onClick={() => {
                  if (isSuccess) {
                    const userRole = localStorage.getItem("userRole");
                    if (userRole) {
                      if (userRole === "ADMIN") {
                        navigate("/admin/dashboard", { replace: true });
                      } else if (userRole === "AGENT") {
                        navigate("/agent/signalements-assignes", { replace: true });
                      } else {
                        navigate("/signalements", { replace: true });
                      }
                    } else {
                      setShowModal(false);
                      setAnimationDirection("right");
                      setIsAnimating(true);
                      setTimeout(() => {
                        setIsLogin(true);
                        setIsAnimating(false);
                      }, 500);
                    }
                  } else {
                    setShowModal(false);
                  }
                }}
                className={`w-full py-2.5 sm:py-3 rounded-xl font-bold text-white transition-all shadow-lg text-sm sm:text-base hover-lift ${
                  isSuccess 
                    ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                    : 'bg-slate-800 hover:bg-slate-900 shadow-slate-950/20'
                }`}
              >
                {isSuccess ? "Continuer" : "Fermer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-5 sm:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px sm:30px 30px'
        }} />
      </div>

      {/* Container principal */}
      <div className="relative w-full max-w-full sm:max-w-xl md:max-w-4xl lg:max-w-5xl bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/30 overflow-hidden mx-2 sm:mx-4 perspective-1000">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-500 animate-shimmer" />
        
        <div className="flex flex-col md:grid md:grid-cols-2 gap-0 min-h-[600px]">
          
          {/* Left Side - Branding & Info */}
          <div className="relative p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900/50 to-slate-800/50">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6 sm:mb-8 md:mb-10 animate-float-slow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse-glow">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="relative">
                  <h1 className="text-xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-white via-white to-emerald-400 bg-clip-text text-transparent">
                      SmartCity
                    </span>
                  </h1>
                  <p className="text-emerald-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Plateforme citoyenne</p>
                </div>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                  Rejoignez la<br />
                  <span className="text-emerald-400">révolution urbaine</span>
                </h2>
                <p className="text-slate-100/90 text-xs sm:text-sm leading-relaxed max-w-sm">
                  Participez activement à l'amélioration de votre ville en signalant les problèmes et en contribuant à une communauté plus responsable.
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-6 sm:mt-8 space-y-2 sm:space-y-3 bg-white/5 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 text-white/90 group cursor-pointer">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] sm:text-xs font-medium group-hover:translate-x-1 transition-transform duration-300">Signalement en temps réel</span>
              </div>
              <div className="flex items-center gap-3 text-white/90 group cursor-pointer">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse animation-delay-300" />
                <span className="text-[10px] sm:text-xs font-medium group-hover:translate-x-1 transition-transform duration-300 delay-100">Suivi des interventions</span>
              </div>
              <div className="flex items-center gap-3 text-white/90 group cursor-pointer">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse animation-delay-600" />
                <span className="text-[10px] sm:text-xs font-medium group-hover:translate-x-1 transition-transform duration-300 delay-200">Impact communautaire</span>
              </div>
            </div>
          </div>

          {/* Right Side - Formulaire */}
          <div className="relative p-6 sm:p-8 md:p-10 flex items-center justify-center ring-1 ring-emerald-500/50 min-h-[600px]">
            <div className="absolute inset-0 z-0" style={{ backgroundImage: `url('/Image/Smart.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
            </div>

            <div className={`relative z-10 w-full transition-all duration-500 ${getFormAnimationClass()}`}>
              
              {/* Formulaire de Connexion */}
              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-full mb-3">
                      <LogIn className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 text-xs font-medium">ACCÈS</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">CONNEXION</h3>
                    <p className="text-white/60 text-sm">Connectez-vous pour accéder à votre compte</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/80 text-xs font-medium">Email</label>
                    <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                      <input
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={validateEmail}
                        onFocus={() => setFocusedField('email')}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm backdrop-blur-md"
                        required
                        disabled={isLoading}
                      />
                      {errors.email && <p className="text-red-400 text-xs mt-1 animate-shake">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/80 text-xs font-medium">Mot de passe</label>
                    <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={motDePasse}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        onBlur={validatePassword}
                        onFocus={() => setFocusedField('password')}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all pr-10 text-sm backdrop-blur-md"
                        required
                        disabled={isLoading}
                      />
                      {errors.motDePasse && <p className="text-red-400 text-xs mt-1 animate-shake">{errors.motDePasse}</p>}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-all"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-base group disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Connexion en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Se connecter</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-white/60 text-xs">
                    Pas encore de compte ?{" "}
                    <button type="button" onClick={toggleMode} className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-all inline-flex items-center gap-1">
                      Inscrivez-vous
                      <Sparkles className="w-3 h-3" />
                    </button>
                  </p>
                </form>
              ) : (
                /* Formulaire d'Inscription */
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center gap-2 bg-emerald-500/20 px-4 py-2 rounded-full mb-3">
                      <UserPlus className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 text-xs font-medium">NOUVEAU</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">INSCRIPTION</h3>
                    <p className="text-white/60 text-sm">Créez votre compte en quelques secondes</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/80 text-xs font-medium">Nom complet</label>
                    <input
                      type="text"
                      placeholder="Jean Dupont"
                      value={nom}
                      onChange={(e) => setNom(e.target.value.replace(/[0-9]/g, ""))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm backdrop-blur-md"
                      required
                      disabled={isLoading}
                    />
                    {errors.nom && <p className="text-red-400 text-xs mt-1 animate-shake">{errors.nom}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/80 text-xs font-medium">Email</label>
                    <input
                      type="email"
                      placeholder="jean@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={validateEmail}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm backdrop-blur-md"
                      required
                      disabled={isLoading}
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1 animate-shake">{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/80 text-xs font-medium">Mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={motDePasse}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        onBlur={validatePassword}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all pr-10 text-sm backdrop-blur-md"
                        required
                        disabled={isLoading}
                      />
                      {errors.motDePasse && <p className="text-red-400 text-xs mt-1 animate-shake">{errors.motDePasse}</p>}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-all"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* ⭐ Numéro de téléphone (OBLIGATOIRE avec validation) */}
                  <div className="space-y-1">
                    <label className="text-white/80 text-xs font-medium flex items-center gap-2">
                      <Phone size={14} />
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      placeholder="0321234567"
                      value={telephone}
                      onChange={(e) => {
                        setTelephone(e.target.value);
                        validatePhoneField(e);
                      }}
                      onBlur={validatePhoneField}
                      className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all text-sm backdrop-blur-md ${
                        errors.telephone ? "border-red-500 focus:ring-red-500/50" : "border-white/20 focus:border-emerald-500 focus:ring-emerald-500/50"
                      }`}
                      required
                      disabled={isLoading}
                    />
                    {errors.telephone && <p className="text-red-400 text-xs mt-1 animate-shake">{errors.telephone}</p>}
                    <p className="text-white/30 text-[10px]">Format: 0321234567 (10 chiffres, commence par 032, 033, 034, 037 ou 038)</p>
                  </div>

                  {/* ⭐ Adresse complète (OBLIGATOIRE avec validation) */}
                  <div className="space-y-1">
                    <label className="text-white/80 text-xs font-medium flex items-center gap-2">
                      <Home size={14} />
                      Adresse complète *
                    </label>
                    <textarea
                      placeholder="Ex: 0203 AR 0180 Antanimalandy centre MAHAJANGA I"
                      value={adresse}
                      onChange={(e) => {
                        setAdresse(e.target.value);
                        validateAddressField(e);
                      }}
                      onBlur={validateAddressField}
                      rows={2}
                      className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all text-sm backdrop-blur-md resize-none ${
                        errors.adresse ? "border-red-500 focus:ring-red-500/50" : "border-white/20 focus:border-emerald-500 focus:ring-emerald-500/50"
                      }`}
                      required
                      disabled={isLoading}
                    />
                    {errors.adresse && <p className="text-red-400 text-xs mt-1 animate-shake">{errors.adresse}</p>}
                    <p className="text-white/30 text-[10px]">Minimum 6 caractères, uniquement lettres, chiffres et espaces</p>
                  </div>

                  {/* Sélection du rôle */}
                  <div className="space-y-2">
                    <label className="text-white/80 text-xs font-medium text-center block">Type de compte</label>
                    <div className="flex justify-center gap-3">
                      {roles.map((r) => {
                        const Icon = r.icon;
                        const isSelected = role === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              if (!isLoading) {
                                setRole(r.id);
                                if (r.id === "CITIZEN") {
                                  setDomaine("");
                                  setMetier("");
                                }
                              }
                            }}
                            disabled={isLoading}
                            className={`relative py-2 px-4 rounded-xl transition-all duration-300 flex-1 transform hover:scale-105 ${
                              isSelected 
                                ? `bg-gradient-to-r ${r.color} shadow-lg text-white font-bold` 
                                : `bg-white/5 hover:bg-white/10 border border-white/20 text-white/70`
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <Icon className={`w-5 h-5 mx-auto mb-1 transition-all ${isSelected ? 'scale-110' : ''}`} />
                            <span className="text-xs font-medium">{r.label}</span>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-emerald-400 text-xs text-center">
                      {role === "CITIZEN" ? "👤 Signalez des problèmes dans votre quartier" : "🏢 Gérez et résolvez les signalements citoyens"}
                    </p>
                  </div>

                  {/* Sélection du domaine (visible seulement pour AGENT) */}
                  {role === "AGENT" && (
                    <div className="space-y-2 animate-slide-in-right">
                      <label className="text-white/80 text-xs font-medium text-center block">
                        🏢 Domaine d'intervention
                      </label>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {domaines.map((d) => {
                          const isSelected = domaine === d.id;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                if (!isLoading) {
                                  setDomaine(d.id);
                                  setMetier("");
                                }
                              }}
                              disabled={isLoading}
                              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left ${
                                isSelected
                                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg border border-emerald-400/50"
                                  : "bg-white/5 hover:bg-white/10 border border-white/20"
                              } disabled:opacity-50 disabled:cursor-not-allowed group`}
                            >
                              <span className="text-2xl">{d.icon}</span>
                              <div className="flex-1">
                                <div className={`font-semibold text-sm ${isSelected ? "text-white" : "text-white/90"}`}>
                                  {d.label}
                                </div>
                                <div className={`text-xs ${isSelected ? "text-emerald-200" : "text-white/50"}`}>
                                  {d.description}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {errors.domaine && (
                        <p className="text-red-400 text-xs mt-1 animate-shake text-center">{errors.domaine}</p>
                      )}
                    </div>
                  )}

                  {/* Sélection du métier (visible seulement si domaine sélectionné) */}
                  {role === "AGENT" && domaine && metiersParDomaine[domaine] && (
                    <div className="space-y-2 animate-slide-in-right">
                      <label className="text-white/80 text-xs font-medium text-center block">
                        👨‍💼 Votre métier
                      </label>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {metiersParDomaine[domaine].map((m) => {
                          const isSelected = metier === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => !isLoading && setMetier(m.id)}
                              disabled={isLoading}
                              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left ${
                                isSelected
                                  ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg border border-blue-400/50"
                                  : "bg-white/5 hover:bg-white/10 border border-white/20"
                              } disabled:opacity-50 disabled:cursor-not-allowed group`}
                            >
                              <span className="text-2xl">{m.icon}</span>
                              <div className="flex-1">
                                <div className={`font-semibold text-sm ${isSelected ? "text-white" : "text-white/90"}`}>
                                  {m.label}
                                </div>
                                <div className={`text-xs ${isSelected ? "text-blue-200" : "text-white/50"}`}>
                                  {m.description}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {errors.metier && (
                        <p className="text-red-400 text-xs mt-1 animate-shake text-center">{errors.metier}</p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-base group disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Inscription en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Créer mon compte</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-white/60 text-xs">
                    Déjà un compte ?{" "}
                    <button type="button" onClick={toggleMode} className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-all inline-flex items-center gap-1">
                      Connectez-vous
                      <Zap className="w-3 h-3" />
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes formExitRight {
          0% { transform: translateX(0) rotateY(0deg); opacity: 1; }
          100% { transform: translateX(100%) rotateY(-30deg); opacity: 0; }
        }
        @keyframes formExitLeft {
          0% { transform: translateX(0) rotateY(0deg); opacity: 1; }
          100% { transform: translateX(-100%) rotateY(30deg); opacity: 0; }
        }
        @keyframes formEnter {
          0% { transform: translateX(0) rotateY(30deg); opacity: 0; }
          100% { transform: translateX(0) rotateY(0deg); opacity: 1; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(-100px) translateX(50px); opacity: 0; }
        }
        @keyframes shootingStar {
          0% { transform: translateX(0) translateY(0) rotate(45deg); opacity: 1; }
          100% { transform: translateX(-200px) translateY(200px) rotate(45deg); opacity: 0; }
        }
        @keyframes modalPop {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .perspective-1000 { perspective: 1000px; }
        .animate-slide-in-left { animation: slideInLeft 0.6s ease-out; }
        .animate-slide-in-right { animation: slideInRight 0.6s ease-out; }
        .animate-float-particle { animation: floatParticle 8s ease-in-out infinite; }
        .animate-shooting-star { animation: shootingStar 3s linear infinite; }
        .animate-modal-pop { animation: modalPop 0.3s ease-out; }
        .animate-form-exit-right { animation: formExitRight 0.5s ease-out forwards; }
        .animate-form-exit-left { animation: formExitLeft 0.5s ease-out forwards; }
        .animate-form-enter { animation: formEnter 0.5s ease-out; }
        .animate-pulse-slow { animation: pulse 3s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse 2s ease-in-out infinite; }
        .animate-float-slow { animation: float 4s ease-in-out infinite; }
        .animate-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); background-size: 200% 100%; animation: shimmer 2s infinite; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .animate-scale { animation: scale 0.3s ease-out; }
        .animate-ping { animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
        
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-1000 { animation-delay: 1s; }
        
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2); }
        
        @keyframes scale {
          0% { transform: scale(0.8); }
          100% { transform: scale(1); }
        }
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }

        /* Styles pour le scrollbar personnalisé */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.8);
        }
      `}</style>
    </div>
  );
}