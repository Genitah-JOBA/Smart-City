import { useState, useEffect } from "react";
import { Link, useNavigate  } from "react-router-dom";
import { MapPin, Smartphone, Building2, Shield, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [role, setRole] = useState("CITIZEN");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    let newErrors = {};

    // Contrôle Email
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      newErrors.email = "L'email doit impérativement être une adresse @gmail.com";
    }

    // Contrôle MDP
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, motDePasse }),
      });

      if (!response.ok) {
        throw new Error("Email ou mot de passe incorrect");
      }

      const token = await response.text();
      console.log("Token reçu:", token);
      
      // ✅ STOCKER LE TOKEN DANS LOCALSTORAGE
      localStorage.setItem("token", token);
      console.log("Token stocké avec succès");

      setIsSuccess(true);
      setMessage("Connexion réussie !");
      setShowModal(true);
      setEmail(""); 
      setMotDePasse("");

      // Petit délai pour que l'utilisateur voie le message de succès
      setTimeout(() => {
        navigate("/signalement");
      }, 1500);
      
    } catch (error) {
      setMessage(error.message);
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
      setErrors(prev => ({ ...prev, motDePasse: "Ce mot de passe est trop court. Il doit être > 6 caractères" }));
      setTimeout(() => e.target.focus(), 0);
    } else {
      setErrors(prev => ({ ...prev, motDePasse: null }));
    }
  };

  const [errors, setErrors] = useState({});

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Message Box */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-[90%] sm:max-w-sm w-full shadow-2xl transform animate-in zoom-in-95 duration-300 mx-4">
            <div className="text-center">
              <div className={`mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {isSuccess ? <Shield className="w-7 h-7 sm:w-8 sm:h-8" /> : <div className="text-2xl font-bold">!</div>}
              </div>
              
              <h3 className={`text-lg sm:text-xl font-bold mb-2 ${isSuccess ? 'text-slate-900' : 'text-red-600'}`}>
                {isSuccess ? "Félicitations !" : "Oups !"}
              </h3>
              
              <p className="text-slate-600 text-xs sm:text-sm mb-6 break-words">
                {message}
              </p>

              <button
                onClick={() => setShowModal(false)}
                className={`w-full py-2.5 sm:py-3 rounded-xl font-bold text-white transition-all shadow-lg text-sm sm:text-base ${
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

      <div className="absolute inset-0 opacity-5 sm:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px sm:30px 30px'
        }} />
      </div>

      <div className="relative w-full max-w-full sm:max-w-xl md:max-w-4xl lg:max-w-5xl bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/30 overflow-hidden mx-2 sm:mx-4">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-500 bg-gradient-to-r" />
        
        <div className="flex flex-col md:grid md:grid-cols-2 gap-0">
          {/* Left Side - Branding & Info - Responsive */}
          <div className="relative p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-hidden min-h-[300px] md:min-h-full">
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6 sm:mb-8 md:mb-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-Bellota text-white tracking-widest italic font-extrabold">SmartCity</h1>
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

            <div className="relative z-10 mt-6 sm:mt-8 space-y-2 sm:space-y-3 bg-white/2 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[10px] sm:text-xs font-medium">Signalement en temps réel</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[10px] sm:text-xs font-medium">Suivi des interventions</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[10px] sm:text-xs font-medium">Impact communautaire</span>
              </div>
            </div>
          </div>

          {/* Right */}

          <div className="relative p-6 sm:p-8 text-items-center md:p-10 overflow-y-auto max-h-[60vh] md:max-h-none ring-1 ring-emerald-500">
            <div 
              className="absolute inset-0 z-0"
              style={{ 
                backgroundImage: `url('/Image/Smart.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" />
            </div>

            <form
              onSubmit={handleLogin}
              className="relative z-10 space-y-3 sm:space-y-4"
            >

              <div className="text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl text-center font-bold text-white mb-1">CONNEXION</h3>
                <p className="text-white/80 text-xs text-center sm:text-sm">Connectez-vous pour accéder à votre compte</p>
              </div>

              <div className="space-y-1">
                <label className="text-white/80 text-[10px] sm:text-xs font-medium">Email</label>
                <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.01] sm:scale-[1.02]' : ''}`}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={validateEmail}
                    onFocus={() => setFocusedField('email')}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-white placeholder-white/70 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-xs sm:text-sm backdrop-blur-md"
                    required
                  />
                  {errors.email && (
                    <p className="text-red-400 text-[9px] sm:text-[10px] mt-1 font-semibold break-words">
                      ⚠️ {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-white/80 text-[10px] sm:text-xs font-medium">Mot de passe</label>
                <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.01] sm:scale-[1.02]' : ''}`}>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    onBlur={validatePassword}
                    onFocus={() => setFocusedField('password')}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-white placeholder-white/70 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all pr-10 sm:pr-12 text-xs sm:text-sm backdrop-blur-md"
                    required
                  />
                  {errors.motDePasse && (
                    <p className="text-red-400 text-[9px] sm:text-[10px] mt-1 font-semibold">
                      ⚠️ {errors.motDePasse}
                    </p>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff size={14} className="sm:w-4 sm:h-4" /> : <Eye size={14} className="sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 sm:py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                Se connecter <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <p className="text-center text-white/80 text-[10px] sm:text-xs">
                Pas encore de compte ?{" "}
                <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline">
                  Inscrivez-vous ici
                </Link>
              </p>

              {message && (
                <p className="mt-4 text-center text-red-500">{message}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}