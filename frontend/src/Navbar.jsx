import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  MapPin, Home, AlertTriangle, User, LogOut, Menu, X, 
  Shield, Bell, Settings, PlusCircle, LayoutDashboard, 
  ClipboardList, Wrench, Users, BarChart3, ChevronDown,
  CheckCircle, Clock, MessageSquare, Loader2, UserCheck,
  Share2, ChevronRight
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
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Récupération des infos users
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

  // Récupération des notifications
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
      console.error("Erreur notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:8081/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, lu: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Erreur markAsRead:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("http://localhost:8081/api/notifications/read-all", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Erreur markAllAsRead:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case "NOUVEAU_SIGNALEMENT": return <AlertTriangle size={16} className="text-amber-400" />;
      case "SIGNALEMENT_TRAITE": return <CheckCircle size={16} className="text-emerald-400" />;
      case "ASSIGNATION": return <UserCheck size={16} className="text-blue-400" />;
      case "PARTAGE_SIGNALEMENT": return <Share2 size={16} className="text-purple-400" />;
      default: return <Bell size={16} className="text-emerald-400" />;
    }
  };

  const formatNotificationMessage = (notif) => {
    const isEmailNotification = notif.type === "EMAIL" || 
                              notif.type === "EMAIL_RECU" || 
                              notif.title === "📧 Nouvel email reçu";
  
    if (isEmailNotification) {
      let expediteur = "Quelqu'un";
      const match = notif.message.match(/^(.+?) vous a envoyé un email/);
      if (match) expediteur = match[1];
      return `${expediteur} vous a envoyé un email. Veuillez consulter votre boîte email.`;
    }
    return notif.message;
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && token) fetchNotifications();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    setIsOpen(false);
  };

  // Navigation selon le rôle
  const getNavLinks = () => {
    const role = userRole;
    if (role === "ADMIN") {
      return [
        { path: "/admin/dashboard", name: "Dashboard", icon: LayoutDashboard },
        { path: "/admin/signalement", name: "Signalements", icon: ClipboardList },
        { path: "/admin/profil", name: "Profil", icon: User },
      ];
    } else if (role === "AGENT") {
      return [
        { path: "/agent/dashboard", name: "Dashboard", icon: LayoutDashboard },
        { path: "/agent/signalements-assignes", name: "Signalements", icon: AlertTriangle },
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
      {/* Modal de déconnexion */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-red-100 text-red-600">
                <LogOut className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Déconnexion</h3>
              <p className="text-gray-600 text-sm mb-6">Êtes-vous sûr de vouloir vous déconnecter ?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition">Annuler</button>
                <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition">Déconnexion</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar principale */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-slate-900/95 backdrop-blur-xl shadow-2xl border-b border-white/10" 
          : "bg-slate-900/90 border-b border-white/5"
      }`}>
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Logo - Version responsive */}
            <Link 
              to={userRole === "ADMIN" ? "/admin/dashboard" : userRole === "AGENT" ? "/agent/dashboard" : "/signalements"} 
              className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 rounded-lg blur-md opacity-50"></div>
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
              <div className="hidden xs:block">
                <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">SmartCity</span>
                </h1>
                <p className="text-[8px] sm:text-[9px] text-emerald-400/70 font-medium -mt-0.5">{getPageTitle()}</p>
              </div>
            </Link>

            {/* Navigation Desktop - visible sur tablette et desktop */}
            <div className="hidden sm:flex items-center gap-1 md:gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link 
                    key={link.path} 
                    to={link.path} 
                    className={`relative flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-all duration-200 ${
                      active 
                        ? "text-emerald-400 bg-emerald-500/10" 
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                    <span className="text-xs md:text-sm font-medium whitespace-nowrap">{link.name}</span>
                    {active && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-4 md:w-5 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"></div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Actions utilisateur Desktop */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Notifications */}
              <div className="relative notifications-menu">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) fetchNotifications();
                  }}
                  className="relative p-1.5 sm:p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
                >
                  <Bell size={18} className="sm:w-[20px] sm:h-[20px]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white px-1">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-800/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-white/10 flex justify-between items-center">
                      <h3 className="text-white font-semibold text-sm">Notifications</h3>
                      <div className="flex gap-2">
                        <button onClick={fetchNotifications} className="text-xs text-emerald-400 hover:text-emerald-300">Rafraîchir</button>
                        {notifications.length > 0 && (
                          <button onClick={markAllAsRead} className="text-xs text-emerald-400 hover:text-emerald-300">Tout lire</button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {isLoadingNotifications ? (
                        <div className="p-4 text-center"><Loader2 size={24} className="animate-spin text-emerald-400 mx-auto" /></div>
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
                              setShowNotifications(false);
                            }}
                            className={`p-3 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${!notif.lu ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {getNotificationIcon(notif.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-white/80 text-xs sm:text-sm font-medium truncate">{notif.title}</p>
                                <p className="text-white/60 text-xs mt-0.5 line-clamp-2">{formatNotificationMessage(notif)}</p>
                                <p className="text-white/30 text-[10px] mt-1">{new Date(notif.dateCreation).toLocaleString()}</p>
                              </div>
                              {!notif.lu && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Menu utilisateur */}
              <div className="relative user-menu">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)} 
                  className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-white/20 hover:opacity-80 transition"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full blur-md opacity-50"></div>
                    <div className="relative w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                  <span className="hidden md:inline text-white/80 text-sm font-medium capitalize">{userName || "Utilisateur"}</span>
                  <ChevronDown size={14} className="text-white/60 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-white/10 bg-white/5">
                      <p className="text-white text-sm font-medium capitalize truncate">{userName || "Utilisateur"}</p>
                      <p className="text-emerald-400 text-xs">
                        {userRole === "ADMIN" ? "Administrateur" : userRole === "AGENT" ? "Agent terrain" : "Citoyen"}
                      </p>
                    </div>
                    <div className="p-1">
                      <button onClick={openLogoutModal} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition text-sm">
                        <LogOut size={16} /> Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton menu mobile */}
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="sm:hidden relative w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
              >
                {isOpen ? <X size={16} className="text-white" /> : <Menu size={16} className="text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Mobile - Overlay style */}
        <div className={`fixed inset-x-0 top-14 bottom-0 bg-slate-900/98 backdrop-blur-xl transition-all duration-300 z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}>
          <div className="flex flex-col h-full overflow-y-auto p-4">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link 
                    key={link.path} 
                    to={link.path} 
                    onClick={() => setIsOpen(false)} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      active 
                        ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400" 
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium flex-1">{link.name}</span>
                    {active && <ChevronRight size={16} className="text-emerald-400" />}
                  </Link>
                );
              })}
            </div>
            
            <div className="pt-6 mt-4 border-t border-white/10">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full blur-md opacity-50"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium capitalize">{userName || "Citoyen"}</p>
                  <p className="text-emerald-400 text-xs">
                    {userRole === "ADMIN" ? "Administrateur" : userRole === "AGENT" ? "Agent terrain" : "Citoyen"}
                  </p>
                </div>
              </div>
              <button 
                onClick={openLogoutModal} 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition border border-red-500/20"
              >
                <LogOut size={18} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Espace pour compenser la navbar fixe */}
      <div className="h-14 sm:h-16"></div>

      <style jsx>{`
        @keyframes slide-in {
          from { width: 0; opacity: 0; }
          to { width: 1rem; opacity: 1; }
        }
        @media (min-width: 768px) {
          @keyframes slide-in {
            from { width: 0; opacity: 0; }
            to { width: 1.25rem; opacity: 1; }
          }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (min-width: 480px) {
          .xs\\:block {
            display: block;
          }
        }
      `}</style>
    </>
  );
}