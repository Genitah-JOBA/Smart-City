import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  MapPin, Home, AlertTriangle, User, LogOut, Menu, X, 
  Shield, Bell, Settings, PlusCircle, LayoutDashboard, 
  ClipboardList, Wrench, Users, BarChart3, ChevronDown,
  CheckCircle, Clock, MessageSquare, Loader2, UserCheck
} from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // États pour les notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  // Détecter le scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
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
        setUserId(payload.userId || payload.id);
        const role = localStorage.getItem("userRole") || payload.role || "CITIZEN";
        setUserRole(role.toUpperCase());
      } catch (error) {
        console.error("Erreur décodage token:", error);
        setUserName("Utilisateur");
        setUserRole("CITIZEN");
      }
    }
  }, [token]);

  // 🔥 Récupérer les notifications depuis le backend
  const fetchNotifications = async () => {
    if (!token) return;
    
    setIsLoadingNotifications(true);
    try {
      const response = await fetch("http://localhost:8081/api/notifications", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Erreur récupération notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // 🔥 Marquer une notification comme lue
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:8081/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, estLu: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erreur marquage lecture:", error);
    }
  };

  // 🔥 Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      await fetch("http://localhost:8081/api/notifications/read-all", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, estLu: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  // 🔥 Recharger les notifications périodiquement
  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // toutes les 30s
      return () => clearInterval(interval);
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
    setShowUserMenu(false);
  };

  // Obtenir l'icône selon le type de notification
  const getNotificationIcon = (type) => {
    switch(type) {
      case "NOUVEAU_SIGNALEMENT": return <AlertTriangle size={16} className="text-amber-400" />;
      case "SIGNALEMENT_TRAITE": return <CheckCircle size={16} className="text-emerald-400" />;
      case "ASSIGNATION": return <UserCheck size={16} className="text-blue-400" />;
      default: return <Bell size={16} className="text-emerald-400" />;
    }
  };

  // Navigation selon le rôle
  const getNavLinks = () => {
    const role = userRole;
    if (role === "ADMIN") {
      return [
        { path: "/admin/problemes", name: "Dashboard", icon: LayoutDashboard },
        { path: "/admin/signalements", name: "Signalements", icon: ClipboardList },
        { path: "/admin/utilisateurs", name: "Utilisateurs", icon: Users },
        { path: "/admin/statistiques", name: "Statistiques", icon: BarChart3 },
        { path: "/admin/profil", name: "Profil", icon: User },
      ];
    } else if (role === "AGENT") {
      return [
        { path: "/agent/dashboard", name: "Dashboard", icon: LayoutDashboard },
        { path: "/agent/signalements-assignes", name: "Mes signalements", icon: AlertTriangle },
        { path: "/agent/interventions", name: "Interventions", icon: Wrench },
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

  const getPageTitle = () => {
    const role = userRole;
    if (role === "ADMIN") return "Administration";
    if (role === "AGENT") return "Espace Agent";
    return "SmartCity";
  };

  // Fermer les menus au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) setShowUserMenu(false);
      if (showNotifications && !event.target.closest('.notifications-menu')) setShowNotifications(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu, showNotifications]);

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
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-slate-900">Déconnexion</h3>
              <p className="text-slate-600 text-xs sm:text-sm mb-6">Êtes-vous sûr de vouloir vous déconnecter ?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all">Annuler</button>
                <button onClick={handleLogout} className="flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg">Déconnexion</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-slate-900/80 backdrop-blur-2xl shadow-2xl border-b border-white/10" : "bg-slate-900/90"}`}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to={userRole === "ADMIN" ? "/admin/problemes" : userRole === "AGENT" ? "/agent/dashboard" : "/signalements"} className="group relative flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-xl group-hover:scale-105 transition">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="relative">
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-white via-white to-emerald-400 bg-clip-text text-transparent">SmartCity</span>
                </h1>
                <p className="text-[9px] text-emerald-400/70 font-medium tracking-wider absolute -bottom-3">{getPageTitle()}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full p-1 border border-white/10">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.path} to={link.path} className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isActive(link.path) ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
                    <Icon size={16} />
                    <span className="text-sm font-medium">{link.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Info & Actions */}
            <div className="hidden md:flex items-center gap-4">
              
              {/* 🔥 NOTIFICATIONS AVEC BACKEND */}
              <div className="relative notifications-menu">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white animate-pulse px-1">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Dropdown notifications */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-white/10 flex justify-between items-center">
                      <h3 className="text-white font-semibold">Notifications</h3>
                      {notifications.length > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-emerald-400 hover:text-emerald-300">
                          Tout marquer lu
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {isLoadingNotifications ? (
                        <div className="p-4 text-center">
                          <Loader2 size={24} className="animate-spin text-emerald-400 mx-auto" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={32} className="text-white/20 mx-auto mb-2" />
                          <p className="text-white/40 text-sm">Aucune notification</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.signalementId) {
                                // Rediriger selon le rôle
                                if (userRole === "AGENT") navigate("/agent/signalements-assignes");
                                else if (userRole === "ADMIN") navigate("/admin/signalements");
                                else navigate("/mes-signalements");
                              }
                              setShowNotifications(false);
                            }}
                            className={`p-3 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${!notif.estLu ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {getNotificationIcon(notif.type)}
                              <div className="flex-1">
                                <p className="text-white/80 text-sm font-medium">{notif.title}</p>
                                <p className="text-white/60 text-xs mt-0.5">{notif.message}</p>
                                <p className="text-white/30 text-[10px] mt-1">{new Date(notif.dateCreation).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative user-menu">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 pl-3 border-l border-white/20 hover:opacity-80 transition">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-white/50" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-white/10 bg-white/5">
                      <p className="text-white text-sm font-medium capitalize">{userName || "Utilisateur"}</p>
                      <p className="text-emerald-400 text-xs">
                        {userRole === "ADMIN" ? "Administrateur" : userRole === "AGENT" ? "Agent terrain" : "Citoyen"}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link to={userRole === "ADMIN" ? "/admin/profil" : userRole === "AGENT" ? "/agent/profil" : "/profil"} onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                        <User size={16} /> Mon profil
                      </Link>
                      <button onClick={openLogoutModal} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                        <LogOut size={16} /> Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden relative w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition">
              {isOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden fixed inset-x-0 top-16 bg-slate-900/95 backdrop-blur-2xl border-b border-white/10 transition-all duration-400 overflow-hidden shadow-2xl ${isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="p-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive(link.path) ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
                  <Icon size={20} />
                  <span className="font-medium">{link.name}</span>
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
                  <p className="text-emerald-400 text-xs">{userRole === "ADMIN" ? "Administrateur" : userRole === "AGENT" ? "Agent" : "Citoyen"}</p>
                </div>
              </div>
              <button onClick={openLogoutModal} className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition border border-red-500/20">
                <LogOut size={18} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="h-16"></div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes scale { 0% { transform: scale(0.8); } 100% { transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-modal-pop { animation: modal-pop 0.3s ease-out; }
        .animate-scale { animation: scale 0.3s ease-out; }
      `}</style>
    </>
  );
}