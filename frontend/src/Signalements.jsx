import { API_URL } from "./config/api";
import { useEffect, useState } from "react";
import { 
  MapPin, Clock, MessageCircle, Share2, MoreHorizontal, 
  Construction, Lightbulb, Trash2, Droplets, TreePine, 
  Shield, HelpCircle, X, ChevronLeft, ChevronRight,
  BarChart3, TrendingUp, CheckCircle2, Activity,
  AlertTriangle, XCircle, PlayCircle, Send, Users, Search, Check,
  Sparkles, Eye, Layers, Award, Zap, Camera, 
  LayoutGrid, List, Grid3x3, Grid
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "./context/AppContext";
import MessageBox from "./components/MessageBox";

export default function Signalements() {
  const { t } = useI18n();
  const [signalements, setSignalements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [selectedImages, setSelectedImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showStats, setShowStats] = useState(true);
  const [viewMode, setViewMode] = useState("grid");

  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState(null);
  const [newComments, setNewComments] = useState({});
  const [shares, setShares] = useState({});
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedSignalementToShare, setSelectedSignalementToShare] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchUserTerm, setSearchUserTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
    
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser.id;

  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (e) {
      console.error("Erreur parsing user:", e);
    }
    return { nom: "Citoyen", prenom: "Anonyme", id: null };
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const filteredUsers = data.filter(user => user.id !== currentUserId);
        setUsers(filteredUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
      setUsers([]);
    }
  };

  const fetchSignalements = async () => {
    if (!token) {
      setIsLoading(false);
      navigate("/auth", { replace: true });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/signalements`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (res.ok) {
        const data = await res.json();
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.dateCreation || a.createdAt || a.dateSignalement || 0);
          const dateB = new Date(b.dateCreation || b.createdAt || b.dateSignalement || 0);
          return dateB - dateA;
        });
        setSignalements(sortedData);
      } else if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        navigate("/auth", { replace: true });
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
      setMsg({ type: "error", text: t("agent.cantReachServer") });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (!token) {
      navigate("/auth", { replace: true });
      return;
    }
    fetchSignalements();
    fetchUsers();
  }, []);

  useEffect(() => {
    const savedComments = localStorage.getItem("signalements_comments");
    const savedShares = localStorage.getItem("signalements_shares");
    if (savedComments) {
      try {
        setComments(JSON.parse(savedComments));
      } catch(e) {}
    }
    if (savedShares) {
      try {
        setShares(JSON.parse(savedShares));
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (Object.keys(comments).length > 0) {
      localStorage.setItem("signalements_comments", JSON.stringify(comments));
    }
  }, [comments]);

  useEffect(() => {
    if (Object.keys(shares).length > 0) {
      localStorage.setItem("signalements_shares", JSON.stringify(shares));
    }
  }, [shares]);

  const addComment = (signalementId) => {
    const commentText = newComments[signalementId] || "";
    if (!commentText.trim()) return;
    
    const currentUserData = getCurrentUser();
    const userInitial = (currentUserData.prenom?.[0] || currentUserData.nom?.[0] || "C").toUpperCase();
    
    const comment = {
      id: Date.now(),
      userId: currentUserData.id,
      user: `${currentUserData.prenom || ""} ${currentUserData.nom || "Anonyme"}`.trim(),
      text: commentText,
      date: new Date().toISOString(),
      avatar: userInitial
    };
    
    setComments(prev => ({
      ...prev,
      [signalementId]: [...(prev[signalementId] || []), comment]
    }));
    
    setNewComments(prev => ({
      ...prev,
      [signalementId]: ""
    }));
  };

  const deleteComment = (signalementId, commentId, commentUserId) => {
    const signalement = signalements.find(s => s.id === signalementId);
    const isSignalementOwner = signalement && (signalement.utilisateur?.id === currentUserId || signalement.citoyen?.id === currentUserId);
    const isCommentOwner = commentUserId === currentUserId;
    
    if (!isCommentOwner && !isSignalementOwner) {
      alert("Vous n'êtes pas autorisé à supprimer ce commentaire");
      return;
    }
    
    setComments(prev => ({
      ...prev,
      [signalementId]: prev[signalementId].filter(c => c.id !== commentId)
    }));
  };

  const updateCommentText = (signalementId, text) => {
    setNewComments(prev => ({
      ...prev,
      [signalementId]: text
    }));
  };

  const openShareModal = (signalement) => {
    setSelectedSignalementToShare(signalement);
    setSelectedUsers([]);
    setSearchUserTerm("");
    setShowShareModal(true);
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const sendSharedMessage = async () => {
    if (selectedUsers.length === 0) {
      alert(t("feed.selectRecipient"));
      return;
    }

    setIsSharing(true);
    const currentUserData = getCurrentUser();
    const senderName = `${currentUserData.prenom || ""} ${currentUserData.nom || "Un citoyen"}`.trim();
    
    let successCount = 0;
    
    for (const user of selectedUsers) {
      try {
        const shareData = {
          signalementId: selectedSignalementToShare.id,
          recipientUserId: user.id,
          recipientEmail: user.email,
          signalementTitle: selectedSignalementToShare.titre,
          senderName: senderName
        };
        
        const response = await fetch(`${API_URL}/api/notifications/share`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(shareData)
        });
        
        if (response.ok) {
          successCount++;
          
          const share = {
            id: Date.now() + Math.random(),
            signalementId: selectedSignalementToShare.id,
            sharedBy: senderName,
            sharedAt: new Date().toISOString(),
            sharedWith: user.email,
            sharedWithName: `${user.prenom || ""} ${user.nom || ""}`.trim(),
            titre: selectedSignalementToShare.titre,
            type: selectedSignalementToShare.type,
            status: selectedSignalementToShare.statut
          };
          
          setShares(prev => ({
            ...prev,
            [selectedSignalementToShare.id]: [...(prev[selectedSignalementToShare.id] || []), share]
          }));
          
        } else {
          alert(`Erreur lors du partage avec ${user.email}`);
        }
        
      } catch (error) {
        console.error(`Erreur pour ${user.email}:`, error);
        alert(`Erreur réseau lors du partage avec ${user.email}`);
      }
    }
    
    if (successCount > 0) {
      alert(`✓ Signalement partagé avec ${successCount} utilisateur${successCount > 1 ? 's' : ''}`);
    }
    
    setShowShareModal(false);
    setSelectedSignalementToShare(null);
    setSelectedUsers([]);
    setIsSharing(false);
  };

  const getShareCount = (signalementId) => {
    return shares[signalementId]?.length || 0;
  };

  const getCommentCount = (signalementId) => {
    return comments[signalementId]?.length || 0;
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.prenom || ""} ${user.nom || ""}`.toLowerCase();
    return fullName.includes(searchUserTerm.toLowerCase());
  });

  const stats = {
    total: signalements.length,
    enAttente: signalements.filter(s => s.statut === 'EN_ATTENTE').length,
    enCours: signalements.filter(s => s.statut === 'EN_COURS').length,
    resolus: signalements.filter(s => s.statut === 'RESOLU' || s.statut === 'TRAITE').length,
    parType: signalements.reduce((acc, s) => {
      const type = s.type || 'AUTRE';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}),
    parVille: signalements.reduce((acc, s) => {
      const ville = s.ville || s.commune || 'Non spécifié';
      acc[ville] = (acc[ville] || 0) + 1;
      return acc;
    }, {})
  };

  const tauxResolution = stats.total > 0 ? Math.round((stats.resolus / stats.total) * 100) : 0;
  const tauxPriseEnCharge = stats.total > 0 ? Math.round(((stats.enCours + stats.resolus) / stats.total) * 100) : 0;

  const openImageViewer = (images, startIndex = 0) => {
    setSelectedImages(images);
    setCurrentImageIndex(startIndex);
  };

  const closeImageViewer = () => {
    setSelectedImages(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedImages && currentImageIndex < selectedImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImages) return;
      if (e.key === 'Escape') closeImageViewer();
      else if (e.key === 'ArrowLeft') prevImage();
      else if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImages, currentImageIndex]);

  const getRelativeTime = (dateString) => {
    if (!dateString) return t("feed.recently");
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return t("time.now");
    if (diffInSeconds < 3600) return t("time.minutes").replace("{n}", Math.floor(diffInSeconds / 60));
    if (diffInSeconds < 86400) return t("time.hours").replace("{n}", Math.floor(diffInSeconds / 3600));
    if (diffInSeconds < 604800) return t("time.days").replace("{n}", Math.floor(diffInSeconds / 86400));
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getTypeIcon = (type) => {
    const icons = {
      'VOIRIE': Construction,
      'ECLAIRAGE': Lightbulb,
      'DECHETS': Trash2,
      'EAU': Droplets,
      'ESPACES_VERTS': TreePine,
      'SECURITE': Shield,
      'AUTRE': HelpCircle
    };
    return icons[type] || MapPin;
  };

  const getTypeColor = (type) => {
    const colors = {
      'VOIRIE': 'text-orange-400 bg-orange-500/20 border-orange-500/30',
      'ECLAIRAGE': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      'DECHETS': 'text-red-400 bg-red-500/20 border-red-500/30',
      'EAU': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      'ESPACES_VERTS': 'text-green-400 bg-green-500/20 border-green-500/30',
      'SECURITE': 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      'AUTRE': 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    };
    return colors[type] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  const getTypeLabel = (type) => {
    const label = t(`type.${type}`);
    return label === `type.${type}` ? type : label;
  };

  const getStatusColor = (statut) => {
    const colors = {
      'EN_ATTENTE': 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      'EN_COURS': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      'RESOLU': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      'TRAITE': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      'REJETE': 'text-red-400 bg-red-500/20 border-red-500/30'
    };
    return colors[statut] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  const getStatusIcon = (statut) => {
    const icons = {
      'EN_ATTENTE': AlertTriangle,
      'EN_COURS': PlayCircle,
      'RESOLU': CheckCircle2,
      'TRAITE': CheckCircle2,
      'REJETE': XCircle
    };
    return icons[statut] || AlertTriangle;
  };

  const getStatusText = (statut) => {
    const label = t(`status.${statut}`);
    return label === `status.${statut}` ? statut : label;
  };

  const CommentsSection = ({ signalementId }) => {
    const signalComments = comments[signalementId] || [];
    const currentComment = newComments[signalementId] || "";
    const signalement = signalements.find(s => s.id === signalementId);
    const isSignalementOwner = signalement && (signalement.utilisateur?.id === currentUserId || signalement.citoyen?.id === currentUserId);
    
    return (
      <div className="border-t border-white/5 mt-3 pt-3">
        <div className="space-y-3 max-h-60 overflow-y-auto mb-3 px-1">
          {signalComments.map(comment => {
            const canDelete = comment.userId === currentUserId || isSignalementOwner;
            return (
              <div key={comment.id} className="flex gap-2 group">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/40 to-emerald-500/40 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {comment.avatar}
                </div>
                <div className="flex-1 bg-white/5 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-[10px] font-medium">{comment.user}</span>
                    <span className="text-white/20 text-[9px]">{getRelativeTime(comment.date)}</span>
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">{comment.text}</p>
                </div>
                {canDelete && (
                  <button 
                    onClick={() => deleteComment(signalementId, comment.id, comment.userId)} 
                    className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
          {signalComments.length === 0 && (
            <p className="text-white/20 text-[10px] text-center py-2">{t("feed.noComment")}</p>
          )}
        </div>
        
        <div className="flex gap-2 mt-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/40 to-emerald-500/40 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {getCurrentUser().prenom?.[0] || getCurrentUser().nom?.[0] || "C"}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder={t("feed.writeComment")}
              value={currentComment}
              onChange={(e) => updateCommentText(signalementId, e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') addComment(signalementId); }}
              className="flex-1 bg-white/5 rounded-full px-3 py-1.5 text-white text-xs placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
            <button onClick={() => addComment(signalementId)} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-full text-[10px] font-medium transition">
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full animate-ping opacity-75"></div>
          </div>
          <p className="text-blue-400/40 mt-4 text-xs font-medium tracking-[0.3em] text-center animate-pulse">
            CHARGEMENT
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <MessageBox message={msg} onClose={() => setMsg(null)} />
      {/* En-tête */}
      <header className="sticky top-0 z-40 bg-[#1a1a2e]/90 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-xl border border-blue-500/20">
                <MapPin className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h1 className="text-base font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  {t("nav.signalements")}
                </h1>
                <p className="text-white/20 text-[10px] tracking-wider">
                  {signalements.length} {t("feed.reportsWord")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-white/5 rounded-xl p-0.5 border border-white/5">
                {['grid', 'list', 'compact'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-1.5 rounded-lg transition-all duration-300 ${
                      viewMode === mode 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'text-white/20 hover:text-white/40 hover:bg-white/5'
                    }`}
                  >
                    {mode === 'grid' && <Grid size={14} />}
                    {mode === 'list' && <List size={14} />}
                    {mode === 'compact' && <Grid3x3 size={14} />}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowStats(!showStats)}
                className={`p-1.5 rounded-xl border transition-all duration-300 ${
                  showStats 
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                    : 'bg-white/5 border-white/5 text-white/20 hover:text-white/40'
                }`}
              >
                <Activity size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-6">
        {/* Statistiques */}
        {showStats && signalements.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Total', value: stats.total, icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                { label: t("status.EN_ATTENTE"), value: stats.enAttente, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                { label: t("status.EN_COURS"), value: stats.enCours, icon: PlayCircle, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                { label: t("feed.resolved"), value: stats.resolus, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className={`bg-white/3 rounded-xl p-3 border ${stat.border}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-white/20 text-[9px] font-medium tracking-wider uppercase">{stat.label}</span>
                      <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                        <Icon className={`w-3 h-3 ${stat.color}`} />
                      </div>
                    </div>
                    <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-white/20 text-[9px] font-medium tracking-wider uppercase">{t("feed.handling")}</span>
                  <span className="text-blue-400 font-bold text-xs">{tauxPriseEnCharge}%</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000" 
                       style={{ width: `${tauxPriseEnCharge}%` }} />
                </div>
              </div>
              <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-white/20 text-[9px] font-medium tracking-wider uppercase">{t("feed.resolution")}</span>
                  <span className="text-emerald-400 font-bold text-xs">{tauxResolution}%</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-1000" 
                       style={{ width: `${tauxResolution}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des signalements */}
        <div className={`grid gap-3 ${
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2" :
          viewMode === "list" ? "grid-cols-1" :
          "grid-cols-1 md:grid-cols-3"
        }`}>
          {signalements.length === 0 ? (
            <div className="col-span-full bg-white/3 rounded-2xl p-12 text-center border border-white/5">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-full animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 rounded-full flex items-center justify-center border border-white/10">
                  <MapPin className="w-8 h-8 text-white/20" />
                </div>
              </div>
              <p className="text-white/30 text-sm font-medium mb-1">{t("feed.empty")}</p>
              <p className="text-white/20 text-xs">{t("feed.beFirst")}</p>
            </div>
          ) : (
            signalements.map((s, index) => {
              const TypeIcon = getTypeIcon(s.type);
              const StatusIcon = getStatusIcon(s.statut);
              
              return (
                <article 
                  key={s.id} 
                  className={`group relative bg-white/3 rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 ${
                    viewMode === "compact" ? "p-2" : "p-4"
                  }`}
                >
                  {/* Ligne de catégorie */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
                    s.type === 'VOIRIE' ? 'from-orange-500 to-orange-400' :
                    s.type === 'ECLAIRAGE' ? 'from-yellow-500 to-yellow-400' :
                    s.type === 'DECHETS' ? 'from-red-500 to-red-400' :
                    s.type === 'EAU' ? 'from-blue-500 to-blue-400' :
                    s.type === 'ESPACES_VERTS' ? 'from-green-500 to-green-400' :
                    s.type === 'SECURITE' ? 'from-purple-500 to-purple-400' :
                    'from-gray-500 to-gray-400'
                  }`} />

                  <div className={`${viewMode === "compact" ? "p-2" : "p-3"}`}>
                    {/* En-tête */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-emerald-500/30 flex items-center justify-center text-blue-400 font-bold text-xs border border-white/10">
                            {(s.citoyen?.nom?.[0] || s.utilisateur?.nom?.[0] || 'C').toUpperCase()}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500/60 rounded-full border-2 border-[#0f0f1a]"></div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-medium text-white/60 text-xs truncate max-w-[80px]">
                              {s.citoyen?.nom || s.utilisateur?.nom || 'Anonyme'}
                            </h3>
                            <span className="text-white/10 text-[10px]">•</span>
                            <span className="text-white/20 text-[9px] flex items-center gap-0.5 whitespace-nowrap">
                              <Clock size={8} /> {getRelativeTime(s.dateCreation || s.createdAt || s.dateSignalement)}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <MapPin size={8} className="text-white/20" />
                            <span className="text-white/20 text-[9px] truncate">
                              {s.ville || s.commune || s.address || 'Localisation'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="text-white/20 hover:text-white/40 p-1 rounded-lg hover:bg-white/5 transition-all flex-shrink-0">
                        <MoreHorizontal size={12} />
                      </button>
                    </div>

                    {/* Contenu */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-0.5 text-[8px] font-medium px-1.5 py-0.5 rounded-full border ${getTypeColor(s.type)}`}>
                          <TypeIcon size={8} /> {getTypeLabel(s.type)}
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-[8px] font-medium px-1.5 py-0.5 rounded-full border ${getStatusColor(s.statut)}`}>
                          <StatusIcon size={8} /> {getStatusText(s.statut)}
                        </span>
                        {s.images && s.images.length > 0 && (
                          <span className="text-[8px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Camera size={8} /> {s.images.length}
                          </span>
                        )}
                      </div>
                      
                      <h2 className={`font-bold text-white/80 leading-tight group-hover:text-white transition-colors ${
                        viewMode === "compact" ? "text-xs" : "text-base"
                      } line-clamp-2`}>
                        {s.titre || 'Sans titre'}
                      </h2>
                      
                      {viewMode !== "compact" && (
                        <p className="text-white/20 text-xs leading-relaxed line-clamp-2">
                          {s.description || 'Aucune description fournie'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Images */}
                  {s.images && s.images.length > 0 && viewMode !== "compact" && (
                    <div className="px-3 pb-2">
                      <div className={`grid gap-0.5 ${
                        s.images.length === 1 ? 'grid-cols-1' : 
                        s.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                      }`}>
                        {s.images.slice(0, 4).map((img, index) => (
                          <div 
                            key={index} 
                            className={`relative bg-black/50 cursor-pointer group/image overflow-hidden ${
                              s.images.length === 3 && index === 0 ? 'row-span-2' : ''
                            }`} 
                            onClick={() => openImageViewer(s.images, index)}
                          >
                            <img 
                              src={img.url} 
                              className="w-full h-28 object-cover transition-transform duration-500 group-hover/image:scale-105" 
                              alt={`${s.titre} - image ${index + 1}`} 
                              onError={(e) => { 
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%23333' text-anchor='middle' font-family='sans-serif'%3ENo image%3C/text%3E%3C/svg%3E"; 
                              }} 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <Eye className="w-4 h-4 text-white/60" />
                            </div>
                            {s.images.length > 4 && index === 3 && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                                <span className="text-white font-bold text-sm">+{s.images.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className={`border-t border-white/5 ${
                    viewMode === "compact" ? "px-2 py-1.5" : "px-3 py-2"
                  }`}>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setShowComments(showComments === s.id ? null : s.id)} 
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-white/20 hover:text-blue-400 hover:bg-blue-500/5 rounded-lg transition-all group/btn text-[10px] font-medium"
                      >
                        <MessageCircle size={12} className="group-hover/btn:scale-110 transition-transform" /> 
                        <span className="hidden sm:inline">{t("feed.comment")}</span>
                        {getCommentCount(s.id) > 0 && (
                          <span className="bg-blue-500/10 text-blue-400/60 text-[8px] px-1 py-0.5 rounded-full">
                            {getCommentCount(s.id)}
                          </span>
                        )}
                      </button>
                      <button 
                        onClick={() => openShareModal(s)} 
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-white/20 hover:text-emerald-400 hover:bg-emerald-500/5 rounded-lg transition-all group/btn text-[10px] font-medium"
                      >
                        <Share2 size={12} className="group-hover/btn:scale-110 transition-transform" /> 
                        <span className="hidden sm:inline">{t("feed.share")}</span>
                        {getShareCount(s.id) > 0 && (
                          <span className="bg-emerald-500/10 text-emerald-400/60 text-[8px] px-1 py-0.5 rounded-full">
                            {getShareCount(s.id)}
                          </span>
                        )}
                      </button>
                    </div>
                    
                    {showComments === s.id && (
                      <div className="mt-2 animate-slide-down">
                        <CommentsSection signalementId={s.id} />
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

      {/* Modal de partage */}
      {showShareModal && selectedSignalementToShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={() => setShowShareModal(false)}>
          <div className="bg-[#1a1a2e] rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden border border-white/10 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-xl">
                  <Share2 size={16} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm">{t("feed.share")}</h2>
                  <p className="text-white/30 text-[10px]">{t("feed.shareTo")}</p>
                </div>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-white/30 hover:text-white/60 p-1.5 rounded-lg hover:bg-white/5 transition">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                  <MapPin size={14} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/60 font-medium text-xs truncate">{selectedSignalementToShare.titre}</p>
                  <p className="text-white/20 text-[10px] truncate">{selectedSignalementToShare.ville || selectedSignalementToShare.commune || t("feed.location")}</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="text"
                  placeholder={t("feed.searchUser")}
                  value={searchUserTerm}
                  onChange={(e) => setSearchUserTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-blue-500/30"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-60 p-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6">
                  <Users size={24} className="text-white/10 mx-auto mb-2" />
                  <p className="text-white/20 text-xs">{t("feed.noUser")}</p>
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedUsers.some(u => u.id === user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUserSelection(user)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all mb-0.5 ${
                        isSelected 
                          ? 'bg-blue-500/10 border border-blue-500/20' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-emerald-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                        {(user.prenom?.[0] || user.nom?.[0] || "U").toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white/60 text-xs font-medium">
                          {user.prenom || ""} {user.nom || "Utilisateur"}
                        </p>
                        <p className="text-white/20 text-[9px]">{user.role === "ADMIN" ? "Admin" : user.role === "AGENT" ? "Agent" : "Citoyen"}</p>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                          <Check size={8} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            
            <div className="p-3 border-t border-white/10 flex-shrink-0">
              <button
                onClick={sendSharedMessage}
                disabled={isSharing || selectedUsers.length === 0}
                className={`w-full font-medium py-2.5 rounded-xl transition-all text-xs ${
                  isSharing || selectedUsers.length === 0
                    ? 'bg-white/5 cursor-not-allowed text-white/20'
                    : 'bg-gradient-to-r from-blue-500/20 to-emerald-500/20 hover:from-blue-500/30 hover:to-emerald-500/30 text-blue-400 border border-blue-500/20'
                }`}
              >
                {isSharing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    {t("feed.sending")}
                  </div>
                ) : (
                  `${t("feed.sendToPrefix")} ${selectedUsers.length} ${selectedUsers.length > 1 ? t("feed.users") : t("feed.user")}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedImages && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeImageViewer}>
          <button 
            className="absolute top-4 right-4 text-white/40 hover:text-white p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all" 
            onClick={closeImageViewer}
          >
            <X size={20} />
          </button>
          
          <div className="absolute top-4 left-4 text-white/40 text-xs bg-black/50 px-3 py-1.5 rounded-full border border-white/10">
            {currentImageIndex + 1} / {selectedImages.length}
          </div>
          
          {currentImageIndex > 0 && (
            <button 
              className="absolute left-4 text-white/40 hover:text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all" 
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <ChevronLeft size={24} />
            </button>
          )}
          
          {currentImageIndex < selectedImages.length - 1 && (
            <button 
              className="absolute right-4 text-white/40 hover:text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all" 
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <ChevronRight size={24} />
            </button>
          )}
          
          <img 
            src={selectedImages[currentImageIndex]?.url} 
            className="max-w-[90vw] max-h-[85vh] object-contain" 
            alt="Image" 
            onClick={(e) => e.stopPropagation()} 
          />
          
          {selectedImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/60 backdrop-blur-sm p-1.5 rounded-xl border border-white/10">
              {selectedImages.map((img, index) => (
                <button 
                  key={index} 
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }} 
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex 
                      ? 'border-blue-500 scale-105' 
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt={`Miniature ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-6px); max-height: 0; }
          to { opacity: 1; transform: translateY(0); max-height: 300px; }
        }
        
        .animate-slide-down {
          animation: slide-down 0.25s ease-out forwards;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        ::-webkit-scrollbar {
          width: 3px;
          height: 3px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}