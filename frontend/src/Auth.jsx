import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Smartphone, Building2, Shield, ArrowRight, Eye, EyeOff, UserPlus, LogIn, Sparkles, Rocket, Zap, Award } from "lucide-react";

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
  const navigate = useNavigate();
  
  // États spécifiques à l'inscription
  const [nom, setNom] = useState("");
  const [role, setRole] = useState("CITIZEN");
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // REMPLACEZ TOUT le useEffect de vérification par celui-ci :
  useEffect(() => {
    const justLoggedIn = localStorage.getItem("justLoggedIn");
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    
    // Si on vient de se connecter, on laisse handleLogin gérer la redirection
    if (justLoggedIn === "true") {
      return;
    }
    
    // Si l'utilisateur est déjà connecté et qu'on n'est PAS en train de rediriger
    if (token && userRole && !isRedirecting) {
      const timeoutId = setTimeout(() => {
        // Vérification supplémentaire pour éviter les redirections multiples
        if (!isRedirecting) {
          if (userRole === "ADMIN") {
            navigate("/admin/dashboard", { replace: true });
          } else if (userRole === "AGENT") {
            navigate("/agent/signalements-resolus", { replace: true });
          } else {
            navigate("/signalements", { replace: true });
          }
        }
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [navigate, isRedirecting]);

  // Fonction pour basculer entre login et register avec animation spectaculaire
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
      setShowPassword(false);
      setIsAnimating(false);
    }, 500);
  };

  // Fonction pour décoder le token JWT
  const decodeToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error("Erreur décodage token:", error);
      return null;
    }
  };

  // Fonction pour récupérer le rôle de l'utilisateur depuis le backend
  const fetchUserRole = async (token, email) => {
    try {
      const response = await fetch("http://localhost:8081/api/auth/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        return userData.role || userData.role?.toUpperCase() || "CITIZEN";
      }
    } catch (error) {
      console.error("Erreur récupération rôle:", error);
    }
    
    const decoded = decodeToken(token);
    return decoded?.role || decoded?.roles?.[0] || "CITIZEN";
  };

  // Validation email
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

  // Fonction de redirection après connexion
  const redirectToDashboard = (role) => {
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    setShowModal(false);
    
    setTimeout(() => {
      if (role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "AGENT") {
        navigate("/agent/signalements-resolus", { replace: true });
      } else {
        navigate("/signalements", { replace: true });
      }
    }, 100);
  };

  // Gestion de la connexion
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Empêcher les soumissions multiples
    if (isRedirecting) return;
    
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
      
      // IMPORTANT : Définir le flag AVANT de stocker le token
      localStorage.setItem("justLoggedIn", "true");
      localStorage.setItem("token", token);
      
      const userRole = await fetchUserRole(token, email);
      const normalizedRole = userRole.toUpperCase();
      localStorage.setItem("userRole", normalizedRole);

      setIsSuccess(true);
      setMessage(`Connexion réussie ! Bienvenue ${email.split('@')[0]}`);
      setShowModal(true);
      setEmail(""); 
      setMotDePasse("");

      // Redirection après 2 secondes
      setTimeout(() => {
        // Nettoyer le flag juste avant la redirection
        localStorage.removeItem("justLoggedIn");
        redirectToDashboard(normalizedRole);
      }, 2000);
      
    } catch (error) {
      // En cas d'erreur, nettoyer le flag
      localStorage.removeItem("justLoggedIn");
      setIsSuccess(false);
      setMessage(error.message);
      setShowModal(true);
    }
  };

  // Gestion de l'inscription
  const handleRegister = async (e) => {
    e.preventDefault();
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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

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
      setMessage("Votre compte a été créé avec succès ! Redirection vers la page de connexion...");
      setShowModal(true);
      setNom(""); 
      setEmail(""); 
      setMotDePasse("");
      
      setTimeout(() => {
        setShowModal(false);
        // Basculer vers le formulaire de connexion
        setAnimationDirection("right");
        setIsAnimating(true);
        setTimeout(() => {
          setIsLogin(true);
          setIsAnimating(false);
        }, 500);
      }, 2000);
      
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.message);
      setShowModal(true);
    }
  };

  const roles = [
    { id: "CITIZEN", label: "Citoyen", icon: Smartphone, color: "from-emerald-600 to-teal-500", description: "Signalez des problèmes dans votre quartier" },
    { id: "AGENT", label: "Agent Municipal", icon: Building2, color: "from-green-600 to-green-400", description: "Gérez et résolvez les signalements" },
  ];

  // Classes d'animation spectaculaires
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

      {/* Message Box - MODIFIÉ : Pas de fermeture automatique pour le succès */}
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
                  if (isSuccess && !isRedirecting) {
                    // Pour le succès de connexion, on redirige
                    const userRole = localStorage.getItem("userRole");
                    if (userRole) {
                      redirectToDashboard(userRole);
                    } else {
                      setShowModal(false);
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
                {isSuccess ? (isRedirecting ? "Redirection..." : "Continuer") : "Réessayer"}
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

      {/* Container principal avec effet 3D */}
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

          {/* Right Side - Formulaire avec transition 3D spectaculaire */}
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
                      />
                      {errors.motDePasse && <p className="text-red-400 text-xs mt-1 animate-shake">{errors.motDePasse}</p>}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-all"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-base group"
                  >
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
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
                      />
                      {errors.motDePasse && <p className="text-red-400 text-xs mt-1 animate-shake">{errors.motDePasse}</p>}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-all"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
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
                            onClick={() => setRole(r.id)}
                            className={`relative py-2 px-4 rounded-xl transition-all duration-300 flex-1 transform hover:scale-105 ${
                              isSelected 
                                ? `bg-gradient-to-r ${r.color} shadow-lg text-white font-bold` 
                                : `bg-white/5 hover:bg-white/10 border border-white/20 text-white/70`
                            }`}
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

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-base group"
                  >
                    <span>Créer mon compte</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
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

      {/* Styles CSS pour les animations spectaculaires */}
      <style jsx>{`
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
      `}</style>
    </div>
  );
}