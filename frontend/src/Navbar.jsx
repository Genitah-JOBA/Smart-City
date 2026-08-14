import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme, useI18n } from "./context/AppContext";
import { 
  MapPin, Home, AlertTriangle, User, LogOut, Menu, X, 
  Shield, Bell, Settings, PlusCircle, LayoutDashboard, 
  ClipboardList, Wrench, Users, BarChart3, ChevronDown,
  CheckCircle, Clock, MessageSquare, Loader2, UserCheck,
  Share2, ChevronRight, Brain, Sparkles, Crown,
  Search, Filter, Grid3x3, List, Sun, Moon,
  Star, Gift, Heart, Award, Gem, Flower2
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

  const { theme, toggleTheme } = useTheme();
  const { t, lang, setLang, languages } = useI18n();

  // Fermer le menu mobile lors du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Bloquer le scroll quand le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  const extractSignalementId = (notif) => {
    if (notif.signalementId) return notif.signalementId;
    if (notif.lien) {
      const match = notif.lien.match(/\/signalement\/(\d+)/);
      if (match) return parseInt(match[1]);
    }
    if (notif.message) {
      const match = notif.message.match(/#(\d+)/);
      if (match) return parseInt(match[1]);
    }
    if (notif.title) {
      const match = notif.title.match(/#(\d+)/);
      if (match) return parseInt(match[1]);
    }
    return null;
  };

  const handleNotificationClick = async (notif) => {
    console.log("🔔 Notification cliquée:", notif);
    
    try {
      const response = await fetch(`http://localhost:8081/api/notifications/${notif.id}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notif.id ? { ...n, lu: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Erreur markAsRead:", error);
    }
    
    setShowNotifications(false);
    
    let signalementId = notif.signalementId;
    if (!signalementId && notif.message) {
      const match = notif.message.match(/#(\d+)/);
      if (match) signalementId = match[1];
    }
    if (!signalementId && notif.title) {
      const match = notif.title.match(/#(\d+)/);
      if (match) signalementId = match[1];
    }
    if (!signalementId && notif.lien) {
      const match = notif.lien.match(/\/(\d+)/);
      if (match) signalementId = match[1];
    }
    
    console.log("📌 signalementId extrait:", signalementId);
    
    if (signalementId) {
      navigate(`/signalement/${signalementId}`);
    } else {
      const role = localStorage.getItem("userRole");
      if (role === "ADMIN") {
        navigate("/admin/signalement");
      } else if (role === "AGENT") {
        navigate("/agent/signalements-assignes");
      } else {
        navigate("/signalements");
      }
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

  // Extrait le titre du signalement depuis le message (« … », "…", ou après ": ")
  const extractTitreFromMessage = (msg) => {
    if (!msg) return null;
    let m = msg.match(/«\s*(.+?)\s*»/);
    if (m) return m[1].trim();
    m = msg.match(/"([^"]+)"/);
    if (m) return m[1].trim();
    const idx = msg.lastIndexOf(": ");
    if (idx !== -1) return msg.slice(idx + 2).trim();
    return null;
  };

  // Traduit une notification à l'affichage à partir de son type + parties dynamiques
  const translateNotification = (notif) => {
    const type = notif.type;
    const msg = notif.message || "";

    const isEmail = type === "EMAIL" || type === "EMAIL_RECU" || notif.title === "📧 Nouvel email reçu";
    if (isEmail) {
      return { title: notif.title, message: formatNotificationMessage(notif) };
    }

    const titleKey = {
      NOUVEAU_SIGNALEMENT: "notifT.NOUVEAU_SIGNALEMENT",
      CONFIRMATION_SIGNALEMENT: "notifT.CONFIRMATION_SIGNALEMENT",
      ASSIGNATION: "notifT.ASSIGNATION",
      CHANGEMENT_STATUS: "notifT.CHANGEMENT_STATUS",
      AGENT_ASSIGNE: "notifT.AGENT_ASSIGNE",
      PARTAGE_SIGNALEMENT: "notifT.PARTAGE_SIGNALEMENT",
    }[type];
    const title = titleKey ? t(titleKey) : notif.title;

    const titre = extractTitreFromMessage(msg);
    let message = notif.message;

    if (titre) {
      if (type === "CONFIRMATION_SIGNALEMENT") {
        message = t("notifM.CONFIRMATION_SIGNALEMENT").replace("{title}", titre);
      } else if (type === "ASSIGNATION") {
        message = t("notifM.ASSIGNATION").replace("{title}", titre);
      } else if (type === "NOUVEAU_SIGNALEMENT") {
        message = t("notifM.NOUVEAU_SIGNALEMENT").replace("{title}", titre);
      } else if (type === "AGENT_ASSIGNE") {
        const agent = (msg.split(/»\s*:\s*/)[1] || "").trim();
        message = t("notifM.AGENT_ASSIGNE").replace("{title}", titre).replace("{agent}", agent);
      } else if (type === "CHANGEMENT_STATUS") {
        let sk = "statusPhrase.EN_COURS";
        if (/résolu|resolu/i.test(msg)) sk = "statusPhrase.RESOLU";
        else if (/rejet/i.test(msg)) sk = "statusPhrase.REJETE";
        message = t("notifM.CHANGEMENT_STATUS").replace("{title}", titre).replace("{status}", t(sk));
      } else if (type === "PARTAGE_SIGNALEMENT") {
        const sender = (msg.split(/\s+a partagé/)[0] || "").trim();
        message = t("notifM.PARTAGE_SIGNALEMENT").replace("{sender}", sender).replace("{title}", titre);
      }
    }

    return { title, message };
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
        { path: "/admin/dashboard", name: t("nav.dashboard"), icon: LayoutDashboard, description: t("desc.overview") },
        { path: "/admin/assignation-ia", name: t("nav.assignmentIA"), icon: Brain, description: t("desc.ai") },
        { path: "/admin/signalement", name: t("nav.signalements"), icon: ClipboardList, description: t("desc.management") },
        { path: "/admin/users", name: t("nav.users"), icon: Users, description: t("desc.management") },
        { path: "/admin/profil", name: t("nav.profile"), icon: User, description: t("desc.settings") },
      ];
    } else if (role === "AGENT") {
      return [
        { path: "/agent/dashboard", name: t("nav.dashboard"), icon: LayoutDashboard, description: t("desc.overview") },
        { path: "/agent/signalements-assignes", name: t("nav.signalements"), icon: AlertTriangle, description: t("desc.missions") },
        { path: "/agent/profil", name: t("nav.profile"), icon: User, description: t("desc.settings") },
      ];
    } else {
      return [
        { path: "/signalements", name: t("nav.home"), icon: Home, description: t("desc.explore") },
        { path: "/signaler", name: t("nav.report"), icon: PlusCircle, description: t("desc.new") },
        { path: "/profil", name: t("nav.profile"), icon: User, description: t("desc.myAccount") },
      ];
    }
  };

  const navLinks = getNavLinks();
  const isActive = (path) => location.pathname === path;

  const getRoleBadge = () => {
    if (userRole === "ADMIN") return { label: t("role.admin"), icon: Crown, color: "text-amber-400" };
    if (userRole === "AGENT") return { label: t("role.agent"), icon: Shield, color: "text-blue-400" };
    return { label: t("role.citizen"), icon: Star, color: "text-emerald-400" };
  };

  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;

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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/10 transform animate-modal-pop">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/30">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">{t("logout.title")}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t("logout.question")}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition shadow-lg shadow-red-500/30"
                >
                  {t("menu.logout")}
                </button>
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
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link 
              to={userRole === "ADMIN" ? "/admin/dashboard" : userRole === "AGENT" ? "/agent/dashboard" : "/signalements"} 
              className="flex items-center gap-3 flex-shrink-0 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-300">
                  <MapPin className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold tracking-tight">
                  <span className={`bg-gradient-to-r bg-clip-text text-transparent ${theme === "light" ? "from-[#0f172a] to-emerald-600" : "from-white to-emerald-400"}`}>SmartCity</span>
                </h1>
                <p className="text-[10px] text-emerald-400/60 font-medium -mt-0.5 tracking-wider flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
                  {t("app.tagline")}
                </p>
              </div>
            </Link>

            {/* Navigation Desktop */}
            <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link 
                    key={link.path} 
                    to={link.path} 
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                      active 
                        ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400 shadow-lg shadow-emerald-500/10" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-emerald-400" : ""} />
                    <span className="text-sm font-medium">{link.name}</span>
                    {active && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-6 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"></div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Actions utilisateur */}
            <div className="flex items-center gap-3">
              
              {/* Notifications */}
              <div className="relative notifications-menu">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) fetchNotifications();
                  }}
                  className="relative p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-red-600 rounded-full text-[9px] flex items-center justify-center text-white px-1 font-bold shadow-lg shadow-red-500/30">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                        <Bell size={16} className="text-emerald-400" />
                        {t("notif.title")}
                      </h3>
                      <div className="flex gap-3">
                        <button onClick={fetchNotifications} className="text-xs text-emerald-400 hover:text-emerald-300 transition">
                          {t("notif.refresh")}
                        </button>
                        {notifications.length > 0 && (
                          <button onClick={markAllAsRead} className="text-xs text-emerald-400 hover:text-emerald-300 transition">
                            {t("notif.readAll")}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {isLoadingNotifications ? (
                        <div className="p-6 text-center">
                          <Loader2 size={28} className="animate-spin text-emerald-400 mx-auto" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                            <Bell size={24} className="text-white/20" />
                          </div>
                          <p className="text-white/40 text-sm">{t("notif.empty")}</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${
                              !notif.lu ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-1.5 rounded-lg ${!notif.lu ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                                {getNotificationIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white/90 text-sm font-medium">{translateNotification(notif).title}</p>
                                <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{translateNotification(notif).message}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Clock size={10} className="text-white/30" />
                                  <p className="text-white/20 text-[10px]">{new Date(notif.dateCreation).toLocaleString()}</p>
                                </div>
                              </div>
                              {!notif.lu && (
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shadow-lg shadow-emerald-500/50"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Menu utilisateur Desktop */}
              <div className="relative user-menu hidden md:block">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)} 
                  className="flex items-center gap-3 pl-3 border-l border-white/10 hover:opacity-80 transition group"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-white/90 text-sm font-medium capitalize leading-tight">{userName || t("user.default")}</p>
                      <div className="flex items-center gap-1">
                        <RoleIcon size={10} className={roleBadge.color} />
                        <span className={`text-[10px] font-medium ${roleBadge.color}`}>{roleBadge.label}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-white/40 hidden lg:block group-hover:text-white/60 transition" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50">
                    <div className="p-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full blur-md opacity-50"></div>
                          <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium capitalize">{userName || t("user.default")}</p>
                          <div className="flex items-center gap-1.5">
                            <RoleIcon size={12} className={roleBadge.color} />
                            <p className={`text-xs font-medium ${roleBadge.color}`}>
                              {userRole === "ADMIN" ? t("roleFull.admin") : userRole === "AGENT" ? t("roleFull.agent") : t("roleFull.citizen")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      {/* Apparence : clair / sombre */}
                      <div className="px-2 pt-1">
                        <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">{t("menu.appearance")}</p>
                        <button
                          onClick={toggleTheme}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
                        >
                          <span className="flex items-center gap-2 text-sm text-white/80">
                            {theme === "dark"
                              ? <Moon size={16} className="text-emerald-400" />
                              : <Sun size={16} className="text-amber-400" />}
                            {theme === "dark" ? t("menu.dark") : t("menu.light")}
                          </span>
                          <span className={`relative w-9 h-5 rounded-full transition-colors ${theme === "dark" ? "bg-emerald-500/40" : "bg-amber-400/40"}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${theme === "dark" ? "left-0.5" : "left-4"}`} />
                          </span>
                        </button>
                      </div>

                      {/* Langue : MG / FR / ANG */}
                      <div className="px-2 pt-1">
                        <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5">{t("menu.language")}</p>
                        <div className="grid grid-cols-3 gap-1">
                          {languages.map((l) => (
                            <button
                              key={l.code}
                              onClick={() => setLang(l.code)}
                              className={`py-1.5 rounded-lg text-xs font-semibold transition border ${
                                lang === l.code
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : "bg-white/5 text-white/60 hover:bg-white/10 border-transparent"
                              }`}
                            >
                              {l.short}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-white/10 my-1" />

                      <button
                        onClick={openLogoutModal}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition text-sm group"
                      >
                        <div className="p-1 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition">
                          <LogOut size={16} />
                        </div>
                        {t("menu.logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton menu mobile */}
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="md:hidden relative w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition flex items-center justify-center z-50"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay pour fermer le menu - CORRIGÉ */}
      {isOpen && (
        <div 
          className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Navigation Mobile - CORRIGÉ */}
      <div 
        className={`fixed top-16 bottom-0 right-0 w-full max-w-sm bg-slate-900/98 backdrop-blur-xl shadow-2xl z-40 md:hidden transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto p-4">
          {/* En-tête du menu mobile */}
          <div className="flex items-center gap-3 px-4 py-4 mb-4 bg-white/5 rounded-xl border border-white/5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full blur-md opacity-50"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium capitalize">{userName || t("user.default")}</p>
              <div className="flex items-center gap-1.5">
                <RoleIcon size={12} className={roleBadge.color} />
                <p className={`text-xs font-medium ${roleBadge.color}`}>
                  {userRole === "ADMIN" ? "Administrateur" : userRole === "AGENT" ? "Agent terrain" : "Citoyen"}
                </p>
              </div>
            </div>
          </div>

          {/* Liens de navigation mobile */}
          <div className="space-y-1 flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  onClick={() => setIsOpen(false)} 
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all ${
                    active 
                      ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-400 border border-emerald-500/20" 
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${active ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{link.name}</span>
                    <p className="text-[10px] text-white/40">{link.description}</p>
                  </div>
                  {active && <ChevronRight size={16} className="text-emerald-400" />}
                </Link>
              );
            })}
          </div>

          {/* Apparence + Langue (mobile) */}
          <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
            >
              <span className="flex items-center gap-2 text-sm text-white/80">
                {theme === "dark"
                  ? <Moon size={18} className="text-emerald-400" />
                  : <Sun size={18} className="text-amber-400" />}
                {theme === "dark" ? t("menu.dark") : t("menu.light")}
              </span>
              <span className={`relative w-10 h-5 rounded-full transition-colors ${theme === "dark" ? "bg-emerald-500/40" : "bg-amber-400/40"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${theme === "dark" ? "left-0.5" : "left-5"}`} />
              </span>
            </button>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5 px-1">{t("menu.language")}</p>
              <div className="grid grid-cols-3 gap-2">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`py-2 rounded-lg text-sm font-semibold transition border ${
                      lang === l.code
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-white/5 text-white/60 hover:bg-white/10 border-transparent"
                    }`}
                  >
                    {l.short}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bouton déconnexion mobile */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={openLogoutModal}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition border border-red-500/20"
            >
              <LogOut size={18} /> {t("menu.logout")}
            </button>
          </div>
        </div>
      </div>

      {/* Espace pour compenser la navbar fixe */}
      <div className="h-16"></div>

      <style>{`
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
        @keyframes modal-pop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-modal-pop {
          animation: modal-pop 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </>
  );
}