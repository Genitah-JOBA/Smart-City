import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  MapPin, Smartphone, Building2, Shield, ArrowRight, Eye, EyeOff, 
  UserPlus, LogIn, Sparkles, Rocket, Zap, Award, Loader2, Phone, Home,
  Road, Lightbulb, Trash2, Trees, Bus, ShieldCheck, 
  Wrench, HardHat, Clipboard, TrafficCone, Ruler, Gauge, 
  Recycle, Factory, Warehouse, BarChart,
  Sprout, Scissors, Paintbrush, Droplet,
  Train, Ticket, ParkingCircle, Bike,
  UserCog, Handshake, Video, 
  Landmark, Building,
  AlertTriangle, Compass, Flower2, Leaf, 
  Tractor, Car, TrainFront, Navigation,
  UserRound, MonitorPlay, 
  CarTaxiFront, Ship, Plane,
  Users, Globe, Star, CheckCircle, Clock, Target,
  Mail, Lock, User, Calendar, Briefcase,
  ChevronRight, Circle, Square, Triangle, 
  Activity, Heart, Shield as ShieldIcon, 
  Crown, Diamond, Gem, Feather, 
  Cloud, Sun, Moon, Sparkle
} from "lucide-react";

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
    { id: "CITIZEN", label: "Citoyen", icon: Smartphone, color: "from-emerald-600 to-teal-500", description: "Signalez des problèmes dans votre quartier", iconColor: "text-emerald-400" },
    { id: "AGENT", label: "Agent Municipal", icon: Building2, color: "from-green-600 to-green-400", description: "Gérez et résolvez les signalements", iconColor: "text-green-400" },
  ];

  // ⭐ LISTE DES DOMAINES AVEC ICÔNES
  const domaines = [
    { id: "VOIRIE", label: "Voirie et infrastructures", icon: Road, description: "Routes, trottoirs, nids-de-poule" },
    { id: "ECLAIRAGE", label: "Éclairage public", icon: Lightbulb, description: "Lampadaires, éclairage urbain" },
    { id: "DECHETS", label: "Déchets et Propreté", icon: Trash2, description: "Collecte des déchets, nettoyage" },
    { id: "ESPACES_VERTS", label: "Espaces verts", icon: Trees, description: "Parcs, jardins, arbres" },
    { id: "TRANSPORTS", label: "Transports et mobilité", icon: Bus, description: "Transports en commun, stationnement" },
    { id: "SECURITE", label: "Sécurité et prévention", icon: ShieldCheck, description: "Sécurité publique, prévention" },
    { id: "URBANISME", label: "Urbanisme", icon: Building, description: "Aménagement urbain, construction" },
  ];

  // ⭐ MÉTIERS PAR DOMAINE AVEC ICÔNES
  const metiersParDomaine = {
    VOIRIE: [
      { id: "AGENT_VOIRIE", label: "Agent de voirie", icon: Wrench, description: "Réparation nids-de-poule, entretien chaussées" },
      { id: "TECHNICIEN_GENIE_CIVIL", label: "Technicien génie civil", icon: HardHat, description: "Inspection ponts, tunnels, ouvrages d'art" },
      { id: "CHEF_CHANTIER_VOIRIE", label: "Chef de chantier voirie", icon: Clipboard, description: "Coordination travaux routiers" },
      { id: "AGENT_SIGNALISATION", label: "Agent de signalisation", icon: TrafficCone, description: "Pose et entretien panneaux, feux tricolores" }
    ],
    ECLAIRAGE: [
      { id: "TECHNICIEN_ECLAIRAGE", label: "Technicien éclairage", icon: Lightbulb, description: "Réparation lampadaires, entretien du réseau" },
      { id: "INGENIEUR_ECLAIRAGE", label: "Ingénieur éclairage urbain", icon: Ruler, description: "Conception schéma d'éclairage, optimisation énergétique" },
      { id: "AGENT_MAINTENANCE_ELEC", label: "Agent maintenance électrique", icon: Gauge, description: "Dépannage pannes électriques" }
    ],
    DECHETS: [
      { id: "AGENT_COLLECTE", label: "Agent de collecte", icon: Trash2, description: "Ramassage ordures ménagères" },
      { id: "TECHNICIEN_NETTOIEMENT", label: "Technicien nettoiement", icon: Recycle, description: "Nettoyage rues, espaces publics" },
      { id: "RESPONSABLE_DECHETTERIE", label: "Responsable déchetterie", icon: Recycle, description: "Gestion des déchèteries" },
      { id: "AGENT_TRI", label: "Agent de tri", icon: Warehouse, description: "Centre de tri des déchets" },
      { id: "COORDINATEUR_PROPRETE", label: "Coordinateur propreté", icon: BarChart, description: "Planification tournées" }
    ],
    ESPACES_VERTS: [
      { id: "JARDINIER_MUNICIPAL", label: "Jardinier municipal", icon: Sprout, description: "Entretien parcs, jardins, massifs" },
      { id: "ELAGUEUR", label: "Élagueur", icon: Scissors, description: "Taille et entretien arbres" },
      { id: "TECHNICIEN_ESPACES_VERTS", label: "Technicien espaces verts", icon: Trees, description: "Aménagement paysager" },
      { id: "PAYSAGISTE_URBAIN", label: "Paysagiste urbain", icon: Paintbrush, description: "Conception espaces verts" },
      { id: "AGENT_ARROSAGE", label: "Agent arrosage", icon: Droplet, description: "Gestion système d'irrigation" }
    ],
    TRANSPORTS: [
      { id: "AGENT_REGULATION", label: "Agent de régulation", icon: TrafficCone, description: "Gestion trafic, feux, bouchons" },
      { id: "CONTROLEUR_TRANSPORT", label: "Contrôleur transport", icon: Ticket, description: "Contrôle bus, tramway, métro" },
      { id: "TECHNICIEN_STATIONNEMENT", label: "Technicien stationnement", icon: ParkingCircle, description: "Gestion parkings, horodateurs" },
      { id: "AGENT_MOBILITE_DOUCE", label: "Agent mobilité douce", icon: Bike, description: "Entretien pistes cyclables, bornes vélos" }
    ],
    SECURITE: [
      { id: "AGENT_SECURITE_URBAINE", label: "Agent de sécurité urbaine", icon: ShieldCheck, description: "Surveillance quartiers" },
      { id: "POLICE_MUNICIPALE", label: "Police municipale", icon: UserCog, description: "Maintien ordre public, verbalisation" },
      { id: "AGENT_MEDIATEUR", label: "Agent médiateur", icon: Handshake, description: "Gestion conflits de quartier" },
      { id: "COORDINATEUR_VIDEO", label: "Coordinateur vidéoprotection", icon: Video, description: "Supervision caméras" }
    ],
    URBANISME: [
      { id: "URBANISTE", label: "Urbaniste", icon: Building, description: "Planification urbaine" },
      { id: "ARCHITECTE_CONSEIL", label: "Architecte conseil", icon: Landmark, description: "Conseil en architecture" },
      { id: "TECHNICIEN_URBANISME", label: "Technicien urbanisme", icon: Ruler, description: "Instruction permis de construire" },
      { id: "CHARGE_MISSION_URBAIN", label: "Chargé de mission urbain", icon: MapPin, description: "Projets d'aménagement" }
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

  // Composant pour les champs de formulaire stylisés
  const FormField = ({ label, icon: Icon, error, children, ...props }) => (
    <div className="space-y-1">
      <label className="text-white/80 text-xs font-medium flex items-center gap-2">
        {Icon && <Icon size={14} className="text-emerald-400" />}
        {label}
      </label>
      <div className="relative group">
        {children}
        {error && (
          <div className="absolute -bottom-5 left-0 right-0">
            <p className="text-red-400 text-xs animate-shake flex items-center gap-1">
              <AlertTriangle size={10} />
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Composant pour les boutons de sélection
  const SelectButton = ({ selected, onClick, icon: Icon, label, color, disabled, iconColor }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative py-3 px-4 rounded-xl transition-all duration-300 flex-1 transform hover:scale-105 ${
        selected 
          ? `bg-gradient-to-r ${color} shadow-lg text-white font-bold` 
          : `bg-white/5 hover:bg-white/10 border-2 border-white/10 text-white/70 hover:border-white/30`
      } disabled:opacity-50 disabled:cursor-not-allowed group`}
    >
      <div className="flex flex-col items-center gap-1">
        <Icon className={`w-5 h-5 transition-all ${selected ? 'scale-110 text-white' : iconColor || 'text-white/50'}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      {selected && (
        <>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full" />
        </>
      )}
    </button>
  );

  // Composant pour les options de domaine/métier
  const OptionCard = ({ selected, onClick, icon: Icon, label, description, color, disabled }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left ${
        selected
          ? `bg-gradient-to-r ${color} shadow-lg border-2 border-white/30`
          : "bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-white/30"
      } disabled:opacity-50 disabled:cursor-not-allowed group`}
    >
      <div className={`p-2 rounded-lg ${selected ? 'bg-white/20' : 'bg-white/5'}`}>
        <Icon className={`w-5 h-5 ${selected ? 'text-white' : 'text-emerald-400'}`} />
      </div>
      <div className="flex-1">
        <div className={`font-semibold text-sm ${selected ? "text-white" : "text-white/90"}`}>
          {label}
        </div>
        <div className={`text-xs ${selected ? "text-white/80" : "text-white/50"}`}>
          {description}
        </div>
      </div>
      {selected && (
        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
          <CheckCircle size={14} className="text-white" />
        </div>
      )}
    </button>
  );

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
                {isSuccess ? <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8" /> : <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8" />}
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
      <div className="relative w-full max-w-full sm:max-w-xl md:max-w-4xl lg:max-w-5xl bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden mx-2 sm:mx-4 perspective-1000">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 animate-shimmer" />
        
        <div className="flex flex-col md:grid md:grid-cols-2 gap-0 min-h-[650px]">
          
          {/* Left Side - Branding & Info - Style moderne */}
          <div className="relative p-8 md:p-12 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80">
            {/* Décoration géométrique */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8 md:mb-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-2xl" />
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 rotate-3 hover:rotate-0 transition-transform duration-500">
                    <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-white via-white to-emerald-400 bg-clip-text text-transparent">
                      SmartCity
                    </span>
                  </h1>
                  <p className="text-emerald-400 text-xs font-medium uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Plateforme citoyenne
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.1]">
                  Rejoignez la<br />
                  <span className="relative">
                    <span className="text-emerald-400">révolution urbaine</span>
                    <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-transparent rounded-full" />
                  </span>
                </h2>
                <p className="text-slate-300/90 text-sm leading-relaxed max-w-sm">
                  Participez activement à l'amélioration de votre ville en signalant les problèmes et en contribuant à une communauté plus responsable.
                </p>
              </div>
            </div>

            {/* Statistiques / Points clés */}
            <div className="relative z-10 mt-8 grid grid-cols-3 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              {[
                { icon: Clock, label: "Temps réel", color: "text-emerald-400" },
                { icon: Target, label: "Suivi", color: "text-teal-400" },
                { icon: Users, label: "Communauté", color: "text-emerald-400" }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-1 text-center group cursor-pointer">
                  <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform duration-300`} />
                  <span className="text-[10px] text-white/70 font-medium group-hover:text-white transition-colors duration-300">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Formulaire - Style épuré */}
          <div className="relative p-6 sm:p-8 md:p-10 flex items-center justify-center min-h-[650px]">
            <div className="absolute inset-0 z-0" style={{ backgroundImage: `url('/Image/Smart.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
            </div>

            <div className={`relative z-10 w-full max-w-md transition-all duration-500 ${getFormAnimationClass()}`}>
              
              {/* Formulaire de Connexion */}
              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/20 px-4 py-1.5 rounded-full border border-emerald-500/30">
                      <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[10px] font-bold tracking-wider">ACCÈS</span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">Connexion</h3>
                    <p className="text-white/50 text-sm">Connectez-vous pour accéder à votre compte</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/70 text-xs font-medium flex items-center gap-2">
                      <Mail size={14} className="text-emerald-400" />
                      Adresse email
                    </label>
                    <input
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={validateEmail}
                      onFocus={() => setFocusedField('email')}
                      className={`w-full bg-white/5 border-2 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none transition-all text-sm backdrop-blur-sm ${
                        errors.email 
                          ? 'border-red-500/50 focus:border-red-500' 
                          : 'border-white/10 focus:border-emerald-500/50 focus:bg-white/10'
                      }`}
                      required
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-white/70 text-xs font-medium flex items-center gap-2">
                      <Lock size={14} className="text-emerald-400" />
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={motDePasse}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        onBlur={validatePassword}
                        onFocus={() => setFocusedField('password')}
                        className={`w-full bg-white/5 border-2 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none transition-all pr-12 text-sm backdrop-blur-sm ${
                          errors.motDePasse 
                            ? 'border-red-500/50 focus:border-red-500' 
                            : 'border-white/10 focus:border-emerald-500/50 focus:bg-white/10'
                        }`}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-all p-1"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.motDePasse && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        {errors.motDePasse}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm group disabled:opacity-70 disabled:cursor-not-allowed"
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

                  <p className="text-center text-white/40 text-xs">
                    Pas encore de compte ?{" "}
                    <button type="button" onClick={toggleMode} className="text-emerald-400 hover:text-emerald-300 font-medium transition-all inline-flex items-center gap-1 hover:gap-2">
                      Inscrivez-vous
                      <Sparkles className="w-3 h-3" />
                    </button>
                  </p>
                </form>
              ) : (
                /* Formulaire d'Inscription - Style épuré */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/20 px-4 py-1.5 rounded-full border border-emerald-500/30">
                      <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-[10px] font-bold tracking-wider">INSCRIPTION</span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">Créer un compte</h3>
                    <p className="text-white/50 text-sm">Rejoignez la communauté en quelques secondes</p>
                  </div>

                  {/* Nom */}
                  <div className="space-y-1">
                    <label className="text-white/70 text-xs font-medium flex items-center gap-2">
                      <User size={14} className="text-emerald-400" />
                      Nom complet
                    </label>
                    <input
                      type="text"
                      placeholder="Jean Dupont"
                      value={nom}
                      onChange={(e) => setNom(e.target.value.replace(/[0-9]/g, ""))}
                      className={`w-full bg-white/5 border-2 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition-all text-sm backdrop-blur-sm ${
                        errors.nom 
                          ? 'border-red-500/50 focus:border-red-500' 
                          : 'border-white/10 focus:border-emerald-500/50 focus:bg-white/10'
                      }`}
                      required
                      disabled={isLoading}
                    />
                    {errors.nom && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        {errors.nom}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-white/70 text-xs font-medium flex items-center gap-2">
                      <Mail size={14} className="text-emerald-400" />
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="jean@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={validateEmail}
                      className={`w-full bg-white/5 border-2 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition-all text-sm backdrop-blur-sm ${
                        errors.email 
                          ? 'border-red-500/50 focus:border-red-500' 
                          : 'border-white/10 focus:border-emerald-500/50 focus:bg-white/10'
                      }`}
                      required
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Mot de passe */}
                  <div className="space-y-1">
                    <label className="text-white/70 text-xs font-medium flex items-center gap-2">
                      <Lock size={14} className="text-emerald-400" />
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={motDePasse}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        onBlur={validatePassword}
                        className={`w-full bg-white/5 border-2 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition-all pr-12 text-sm backdrop-blur-sm ${
                          errors.motDePasse 
                            ? 'border-red-500/50 focus:border-red-500' 
                            : 'border-white/10 focus:border-emerald-500/50 focus:bg-white/10'
                        }`}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-all p-1"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.motDePasse && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        {errors.motDePasse}
                      </p>
                    )}
                  </div>

                  {/* Téléphone */}
                  <div className="space-y-1">
                    <label className="text-white/70 text-xs font-medium flex items-center gap-2">
                      <Phone size={14} className="text-emerald-400" />
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
                      className={`w-full bg-white/5 border-2 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition-all text-sm backdrop-blur-sm ${
                        errors.telephone 
                          ? 'border-red-500/50 focus:border-red-500' 
                          : 'border-white/10 focus:border-emerald-500/50 focus:bg-white/10'
                      }`}
                      required
                      disabled={isLoading}
                    />
                    {errors.telephone && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        {errors.telephone}
                      </p>
                    )}
                    <p className="text-white/20 text-[10px]">Format: 0321234567 (10 chiffres)</p>
                  </div>

                  {/* Adresse */}
                  <div className="space-y-1">
                    <label className="text-white/70 text-xs font-medium flex items-center gap-2">
                      <Home size={14} className="text-emerald-400" />
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
                      className={`w-full bg-white/5 border-2 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none transition-all text-sm backdrop-blur-sm resize-none ${
                        errors.adresse 
                          ? 'border-red-500/50 focus:border-red-500' 
                          : 'border-white/10 focus:border-emerald-500/50 focus:bg-white/10'
                      }`}
                      required
                      disabled={isLoading}
                    />
                    {errors.adresse && (
                      <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        {errors.adresse}
                      </p>
                    )}
                  </div>

                  {/* Sélection du rôle */}
                  <div className="space-y-2">
                    <label className="text-white/70 text-xs font-medium text-center block flex items-center justify-center gap-2">
                      <Users size={14} className="text-emerald-400" />
                      Type de compte
                    </label>
                    <div className="flex gap-3">
                      {roles.map((r) => {
                        const Icon = r.icon;
                        const isSelected = role === r.id;
                        return (
                          <SelectButton
                            key={r.id}
                            selected={isSelected}
                            onClick={() => {
                              if (!isLoading) {
                                setRole(r.id);
                                if (r.id === "CITIZEN") {
                                  setDomaine("");
                                  setMetier("");
                                }
                              }
                            }}
                            icon={Icon}
                            label={r.label}
                            color={r.color}
                            iconColor={r.iconColor}
                            disabled={isLoading}
                          />
                        );
                      })}
                    </div>
                    <p className="text-emerald-400/80 text-xs text-center flex items-center justify-center gap-2">
                      {role === "CITIZEN" ? (
                        <>
                          <Smartphone size={12} />
                          Signalez des problèmes dans votre quartier
                        </>
                      ) : (
                        <>
                          <Building2 size={12} />
                          Gérez et résolvez les signalements citoyens
                        </>
                      )}
                    </p>
                  </div>

                  {/* Sélection du domaine (visible seulement pour AGENT) */}
                  {role === "AGENT" && (
                    <div className="space-y-2 animate-slide-in-right">
                      <label className="text-white/70 text-xs font-medium text-center block flex items-center justify-center gap-2">
                        <Briefcase size={14} className="text-emerald-400" />
                        Domaine d'intervention
                      </label>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {domaines.map((d) => {
                          const Icon = d.icon;
                          const isSelected = domaine === d.id;
                          return (
                            <OptionCard
                              key={d.id}
                              selected={isSelected}
                              onClick={() => {
                                if (!isLoading) {
                                  setDomaine(d.id);
                                  setMetier("");
                                }
                              }}
                              icon={Icon}
                              label={d.label}
                              description={d.description}
                              color="from-emerald-600 to-emerald-500"
                              disabled={isLoading}
                            />
                          );
                        })}
                      </div>
                      {errors.domaine && (
                        <p className="text-red-400 text-xs mt-1 text-center flex items-center justify-center gap-1">
                          <AlertTriangle size={10} />
                          {errors.domaine}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Sélection du métier (visible seulement si domaine sélectionné) */}
                  {role === "AGENT" && domaine && metiersParDomaine[domaine] && (
                    <div className="space-y-2 animate-slide-in-right">
                      <label className="text-white/70 text-xs font-medium text-center block flex items-center justify-center gap-2">
                        <Star size={14} className="text-emerald-400" />
                        Votre métier
                      </label>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {metiersParDomaine[domaine].map((m) => {
                          const Icon = m.icon;
                          const isSelected = metier === m.id;
                          return (
                            <OptionCard
                              key={m.id}
                              selected={isSelected}
                              onClick={() => !isLoading && setMetier(m.id)}
                              icon={Icon}
                              label={m.label}
                              description={m.description}
                              color="from-blue-600 to-blue-500"
                              disabled={isLoading}
                            />
                          );
                        })}
                      </div>
                      {errors.metier && (
                        <p className="text-red-400 text-xs mt-1 text-center flex items-center justify-center gap-1">
                          <AlertTriangle size={10} />
                          {errors.metier}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm group disabled:opacity-70 disabled:cursor-not-allowed"
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

                  <p className="text-center text-white/40 text-xs">
                    Déjà un compte ?{" "}
                    <button type="button" onClick={toggleMode} className="text-emerald-400 hover:text-emerald-300 font-medium transition-all inline-flex items-center gap-1 hover:gap-2">
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
        @keyframes scale {
          0% { transform: scale(0.8); }
          100% { transform: scale(1); }
        }
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
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

        /* Styles pour le scrollbar personnalisé */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.4);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.6);
        }
      `}</style>
    </div>
  );
} 