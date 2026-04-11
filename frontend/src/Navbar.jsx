import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  MapPin, Home, AlertTriangle, User, LogOut, Menu, X, 
  Shield, Bell, Settings, PlusCircle, LayoutDashboard, 
  ClipboardList, Wrench, Users, BarChart3 
} from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Détecter le scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Récupérer les infos utilisateur
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload.sub;
        setUserName(email.split('@')[0]);
        const role = localStorage.getItem("userRole") || payload.role || "CITIZEN";
        setUserRole(role.toUpperCase());
      } catch (error) {
        console.error("Erreur décodage token:", error);
        setUserName("Utilisateur");
        setUserRole("CITIZEN");
      }
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setShowLogoutModal(false);
    navigate("/auth");
  };

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  // Navigation selon le rôle
  const getNavLinks = () => {
    const role = userRole;
    
    if (role === "ADMIN") {
      return [
        { path: "/admin/problemes", name: "Dashboard", icon: LayoutDashboard },
        { path: "/admin/signalements", name: "Tous les signalements", icon: ClipboardList },
        { path: "/admin/utilisateurs", name: "Utilisateurs", icon: Users },
        { path: "/admin/statistiques", name: "Statistiques", icon: BarChart3 },
        { path: "/admin/profil", name: "Profil", icon: User },
      ];
    } else if (role === "AGENT") {
      return [
        { path: "/agent/dashboard", name: "Dashboard", icon: LayoutDashboard },
        { path: "/agent/signalements-assignes", name: "Signalements assignés", icon: AlertTriangle },
        { path: "/agent/interventions", name: "Intervention", icon: Wrench },
        { path: "/agent/profil", name: "Profil", icon: User },
      ];
    } else {
      return [
        { path: "/signalements", name: "Accueil", icon: Home },
        { path: "/signaler", name: "Signaler", icon: PlusCircle },
        { path: "/profil", name: "Profil", icon: User },
      ];
    }
  };

  const navLinks = getNavLinks();
  const isActive = (path) => location.pathname === path;

  // Notifications fictives
  const notifications = [
    { id: 1, message: "Votre signalement a été pris en charge", time: "Il y a 5 min", read: false },
    { id: 2, message: "Nouvelle mise à jour disponible", time: "Il y a 1 heure", read: false },
    { id: 3, message: "Bienvenue sur SmartCity Madagascar", time: "Il y a 2 jours", read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Obtenir le titre de la page selon le rôle
  const getPageTitle = () => {
    const role = userRole;
    if (role === "ADMIN") return "Administration";
    if (role === "AGENT") return "Espace Agent";
    return "SmartCity";
  };

  return (
    <>
      {/* Modal de confirmation de déconnexion */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-[90%] sm:max-w-sm w-full shadow-2xl transform animate-modal-pop">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 bg-red-100 text-red-600 animate-scale">
                <LogOut className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-slate-900">
                Déconnexion
              </h3>
              
              <p className="text-slate-600 text-xs sm:text-sm mb-6 break-words">
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={closeLogoutModal}
                  className="flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all text-sm sm:text-base"
                >
                  Annuler
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg text-sm sm:text-base"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar transparente et stylée */}
      <nav className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-500
        ${scrolled 
          ? "bg-slate-900/80 backdrop-blur-2xl shadow-2xl border-b border-white/10" 
          : "bg-slate-900/90 backdrop-blur-none"
        }
      `}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo animé */}
            <Link to={userRole === "ADMIN" ? "/admin/problemes" : userRole === "AGENT" ? "/agent/dashboard" : "/signalements"} className="group relative flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="relative">
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-white via-white to-emerald-400 bg-clip-text text-transparent">
                    SmartCity
                  </span>
                </h1>
                <p className="text-[9px] text-emerald-400/70 font-medium tracking-wider absolute -bottom-3">
                  {getPageTitle()}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation - Glassmorphism */}
            <div className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-full p-1 border border-white/10">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      relative flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300
                      ${isActive(link.path)
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                      }
                    `}
                  >
                    <Icon size={16} />
                    <span className="text-sm font-medium">{link.name}</span>
                    {isActive(link.path) && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* User Info & Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Notifications avec dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Dropdown notifications */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-white/10">
                      <h3 className="text-white font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div key={notif.id} className={`p-3 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${!notif.read ? 'bg-emerald-500/5' : ''}`}>
                          <p className="text-white/80 text-sm">{notif.message}</p>
                          <p className="text-white/40 text-xs mt-1">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile avec effet glass */}
              <div className="flex items-center gap-3 pl-3 border-l border-white/20">
                <div className="text-right">
                  <p className="text-white text-sm font-medium capitalize">{userName || "Citoyen"}</p>
                  <p className="text-emerald-400 text-xs font-medium">
                    {userRole === "ADMIN" ? "⚡ Administrateur" : userRole === "AGENT" ? "🛡️ Agent" : "👤 Citoyen"}
                  </p>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Bouton déconnexion stylé */}
              <button
                onClick={openLogoutModal}
                className="group relative flex items-center gap-2 px-4 py-2 rounded-full overflow-hidden transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full opacity-0 group-hover:opacity-100 transition"></div>
                <div className="absolute inset-0 border border-red-500/30 rounded-full"></div>
                <LogOut size={16} className="text-red-400 relative z-10" />
                <span className="text-sm font-medium text-red-400 relative z-10">Déconnexion</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden relative w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
            >
              {isOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Style moderne */}
        <div
          className={`
            md:hidden fixed inset-x-0 top-16 sm:top-20 bg-slate-900/95 backdrop-blur-2xl border-b border-white/10 
            transition-all duration-400 overflow-hidden shadow-2xl
            ${isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}
          `}
        >
          <div className="p-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                    ${isActive(link.path)
                      ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{link.name}</span>
                  {isActive(link.path) && (
                    <div className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                  )}
                </Link>
              );
            })}
            
            <div className="pt-4 mt-2 border-t border-white/10">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full blur-md opacity-50"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-white font-medium capitalize">{userName || "Citoyen"}</p>
                  <p className="text-emerald-400 text-xs">
                    {userRole === "ADMIN" ? "Administrateur" : userRole === "AGENT" ? "Agent" : "Citoyen"}
                  </p>
                </div>
              </div>
              
              <button
                onClick={openLogoutModal}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-300 border border-red-500/20"
              >
                <LogOut size={18} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer avec animation */}
      <div className="h-16 sm:h-20"></div>

      {/* Styles CSS pour les animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-pop {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes scale {
          0% { transform: scale(0.8); }
          100% { transform: scale(1); }
        }
        
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-modal-pop { animation: modal-pop 0.3s ease-out; }
        .animate-scale { animation: scale 0.3s ease-out; }
      `}</style>
    </>
  );
}