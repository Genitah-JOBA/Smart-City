import { useEffect, useState } from "react";
import { 
  MapPin, Clock, MessageCircle, Share2, MoreHorizontal, 
  Construction, Lightbulb, Trash2, Droplets, TreePine, 
  Shield, HelpCircle, X, ChevronLeft, ChevronRight, Image,
  BarChart3, TrendingUp, CheckCircle2, Activity,
  AlertTriangle, PlayCircle, Send, Users, Search, Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Signalements() {
  const [signalements, setSignalements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showStats, setShowStats] = useState(true);

  // États pour les commentaires
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState(null);
  const [newComments, setNewComments] = useState({});
  const [shares, setShares] = useState({});
  
  // États pour le partage
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

  // Récupérer l'utilisateur connecté
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

  // Récupérer les utilisateurs depuis la base de données
  const fetchUsers = async () => {
    if (!token) return;
    try {
      console.log("🔍 Récupération des utilisateurs depuis /api/users...");
      const response = await fetch("http://localhost:8081/api/users", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("📋 Utilisateurs récupérés:", data);
        
        const filteredUsers = data.filter(user => user.id !== currentUserId);
        setUsers(filteredUsers);
        console.log("👥 Utilisateurs après filtrage:", filteredUsers);
      } else {
        console.error("Erreur API /api/users:", response.status);
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
      const res = await fetch("http://localhost:8081/api/signalements", {
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

  // Charger les données sauvegardées
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

  // Sauvegarder les commentaires et partages
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

  // Ajouter un commentaire
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

  // Supprimer un commentaire (vérification des droits)
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

  // Ouvrir la modale de partage
  const openShareModal = (signalement) => {
    setSelectedSignalementToShare(signalement);
    setSelectedUsers([]);
    setSearchUserTerm("");
    setShowShareModal(true);
  };

  // Ajouter/retirer un utilisateur de la sélection
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

  // Envoyer le partage via le backend
  const sendSharedMessage = async () => {
    console.log("🚀 Début de sendSharedMessage");
    console.log("selectedUsers:", selectedUsers);
    
    if (selectedUsers.length === 0) {
      alert("Veuillez sélectionner au moins un destinataire");
      return;
    }

    setIsSharing(true);
    const currentUserData = getCurrentUser();
    const senderName = `${currentUserData.prenom || ""} ${currentUserData.nom || "Un citoyen"}`.trim();
    
    let successCount = 0;
    
    for (const user of selectedUsers) {
      try {
        console.log(`📤 Envoi du partage à ${user.email} (ID: ${user.id})`);
        
        const shareData = {
          signalementId: selectedSignalementToShare.id,
          recipientUserId: user.id,
          recipientEmail: user.email,
          signalementTitle: selectedSignalementToShare.titre,
          senderName: senderName
        };
        
        const response = await fetch("http://localhost:8081/api/notifications/share", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(shareData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Partagé avec ${user.email}:`, result);
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
          const error = await response.text();
          console.error(`❌ Erreur pour ${user.email}:`, error);
          alert(`Erreur lors du partage avec ${user.email}`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur pour ${user.email}:`, error);
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

  // Filtrer les utilisateurs par recherche
  const filteredUsers = users.filter(user => {
    const fullName = `${user.prenom || ""} ${user.nom || ""}`.toLowerCase();
    return fullName.includes(searchUserTerm.toLowerCase());
  });

  // Calcul des statistiques
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

  // Gestion de la galerie d'images
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
    if (!dateString) return "Récemment";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
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
    const labels = {
      'VOIRIE': 'Voirie',
      'ECLAIRAGE': 'Éclairage',
      'DECHETS': 'Déchets',
      'EAU': 'Eau',
      'ESPACES_VERTS': 'Espaces verts',
      'SECURITE': 'Sécurité',
      'AUTRE': 'Autre'
    };
    return labels[type] || type;
  };

  const getStatusColor = (statut) => {
    const colors = {
      'EN_ATTENTE': 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      'EN_COURS': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      'RESOLU': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      'TRAITE': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
    };
    return colors[statut] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  const getStatusIcon = (statut) => {
    const icons = {
      'EN_ATTENTE': AlertTriangle,
      'EN_COURS': PlayCircle,
      'RESOLU': CheckCircle2,
      'TRAITE': CheckCircle2
    };
    return icons[statut] || AlertTriangle;
  };

  const getStatusText = (statut) => {
    const texts = {
      'EN_ATTENTE': 'En attente',
      'EN_COURS': 'En cours',
      'RESOLU': 'Résolu',
      'TRAITE': 'Traité'
    };
    return texts[statut] || statut;
  };

  // Composant de commentaires avec gestion des droits de suppression
  const CommentsSection = ({ signalementId }) => {
    const signalComments = comments[signalementId] || [];
    const currentComment = newComments[signalementId] || "";
    const signalement = signalements.find(s => s.id === signalementId);
    const isSignalementOwner = signalement && (signalement.utilisateur?.id === currentUserId || signalement.citoyen?.id === currentUserId);
    
    return (
      <div className="border-t border-gray-700/50 mt-3 pt-3">
        <div className="space-y-3 max-h-60 overflow-y-auto mb-3 px-1">
          {signalComments.map(comment => {
            const canDelete = comment.userId === currentUserId || isSignalementOwner;
            return (
              <div key={comment.id} className="flex gap-2 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {comment.avatar}
                </div>
                <div className="flex-1 bg-gray-700/30 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-medium">{comment.user}</span>
                    <span className="text-gray-500 text-[10px]">{getRelativeTime(comment.date)}</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{comment.text}</p>
                </div>
                {canDelete && (
                  <button 
                    onClick={() => deleteComment(signalementId, comment.id, comment.userId)} 
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
          {signalComments.length === 0 && (
            <p className="text-gray-500 text-xs text-center py-2">Aucun commentaire. Soyez le premier à réagir !</p>
          )}
        </div>
        
        <div className="flex gap-2 mt-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getCurrentUser().prenom?.[0] || getCurrentUser().nom?.[0] || "C"}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Écrire un commentaire..."
              value={currentComment}
              onChange={(e) => updateCommentText(signalementId, e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') addComment(signalementId); }}
              className="flex-1 bg-gray-700/50 rounded-full px-4 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button onClick={() => addComment(signalementId)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1">
              <Send size={14} /> Envoyer
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des signalements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Modal de partage */}
      {showShareModal && selectedSignalementToShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
          <div className="bg-[#242526] rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden shadow-2xl border border-gray-700 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <Share2 size={20} className="text-blue-400" />
                <h2 className="text-white font-bold">Partager le signalement</h2>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 bg-gray-800/30 border-b border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Signalement à partager :</p>
              <p className="text-white font-medium text-sm">{selectedSignalementToShare.titre}</p>
              <p className="text-gray-400 text-xs mt-1">{selectedSignalementToShare.ville || selectedSignalementToShare.commune || "Localisation"}</p>
            </div>
            
            <div className="p-4 border-b border-gray-700">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchUserTerm}
                  onChange={(e) => setSearchUserTerm(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-80 p-2">
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={32} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Chargement des utilisateurs...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={32} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Aucun utilisateur trouvé</p>
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedUsers.some(u => u.id === user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUserSelection(user)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all mb-1 ${
                        isSelected ? 'bg-blue-600/20 border border-blue-500/50' : 'hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                        {(user.prenom?.[0] || user.nom?.[0] || "U").toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white text-sm font-medium">
                          {user.prenom || ""} {user.nom || "Utilisateur"}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {user.role === "ADMIN" ? "👑 Administrateur" : user.role === "AGENT" ? "👔 Agent" : "👤 Citoyen"}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700 flex-shrink-0">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400 text-sm">
                  {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''} sélectionné{selectedUsers.length > 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={sendSharedMessage}
                disabled={isSharing || selectedUsers.length === 0}
                className={`w-full font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 ${
                  isSharing || selectedUsers.length === 0
                    ? 'bg-gray-600 cursor-not-allowed text-white/70'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isSharing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Envoyer à {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="container mx-auto max-w-3xl px-4 py-6">
        {/* Statistiques */}
        {showStats && signalements.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Vue globale</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#242526] rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Total</span>
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-gray-500 text-xs mt-1">signalements</p>
              </div>
              <div className="bg-[#242526] rounded-xl p-4 border border-amber-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">En attente</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-400">{stats.enAttente}</p>
                <p className="text-gray-500 text-xs mt-1">à traiter</p>
              </div>
              <div className="bg-[#242526] rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">En cours</span>
                  <PlayCircle className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-400">{stats.enCours}</p>
                <p className="text-gray-500 text-xs mt-1">en traitement</p>
              </div>
              <div className="bg-[#242526] rounded-xl p-4 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Résolus</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-400">{stats.resolus}</p>
                <p className="text-gray-500 text-xs mt-1">traités</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#242526] rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Taux de prise en charge</span>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-400">{tauxPriseEnCharge}%</p>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${tauxPriseEnCharge}%` }} />
                </div>
              </div>
              <div className="bg-[#242526] rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Taux de résolution</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-emerald-400">{tauxResolution}%</p>
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400" style={{ width: `${tauxResolution}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des signalements */}
        <div className="space-y-4">
          {signalements.length === 0 ? (
            <div className="bg-[#242526] rounded-xl p-12 text-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-300 text-lg font-medium mb-2">Aucun signalement</p>
              <p className="text-gray-500 text-sm">Soyez le premier à signaler un problème dans votre quartier !</p>
            </div>
          ) : (
            signalements.map((s) => {
              const TypeIcon = getTypeIcon(s.type);
              const StatusIcon = getStatusIcon(s.statut);
              
              return (
                <article key={s.id} className="bg-[#242526] rounded-xl shadow-lg overflow-hidden">
                  {/* En-tête */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                          {(s.citoyen?.nom?.[0] || s.utilisateur?.nom?.[0] || 'C').toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white">{s.citoyen?.nom || s.utilisateur?.nom || 'Citoyen anonyme'}</h3>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} /> {getRelativeTime(s.dateCreation || s.createdAt || s.dateSignalement)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={12} /> {s.ville || s.commune || s.address || 'Localisation'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-300 p-1 rounded-full hover:bg-gray-700/50">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${getTypeColor(s.type)}`}>
                        <TypeIcon size={14} /> {getTypeLabel(s.type)}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border ${getStatusColor(s.statut)}`}>
                        <StatusIcon size={14} /> {getStatusText(s.statut)}
                      </span>
                      {s.images && s.images.length > 0 && (
                        <span className="text-xs text-gray-400 bg-gray-700/50 px-2.5 py-1.5 rounded-full flex items-center gap-1">
                          <Image size={12} /> {s.images.length} photo{s.images.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">{s.titre || 'Sans titre'}</h2>
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">{s.description || 'Aucune description fournie'}</p>
                  </div>

                  {/* Images */}
                  {s.images && s.images.length > 0 && (
                    <div className={`grid gap-1 ${s.images.length === 1 ? 'grid-cols-1' : s.images.length === 2 ? 'grid-cols-2' : s.images.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                      {s.images.slice(0, 4).map((img, index) => (
                        <div key={index} className={`relative bg-black/30 cursor-pointer group ${s.images.length === 3 && index === 0 ? 'row-span-2' : ''}`} onClick={() => openImageViewer(s.images, index)}>
                          <img src={img.url} className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity" alt={`${s.titre} - image ${index + 1}`} onError={(e) => { e.target.src = "https://via.placeholder.com/400x300/242526/808080?text=Image+non+disponible"; }} />
                          {s.images.length > 4 && index === 3 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-2xl font-bold">+{s.images.length - 4}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-2 py-1 border-t border-gray-700/50">
                    <div className="flex items-center justify-around">
                      <button onClick={() => setShowComments(showComments === s.id ? null : s.id)} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-gray-400 hover:bg-gray-700/30 rounded-lg transition-colors text-sm font-medium">
                        <MessageCircle size={18} /> Commenter {getCommentCount(s.id) > 0 && `(${getCommentCount(s.id)})`}
                      </button>
                      <button onClick={() => openShareModal(s)} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-gray-400 hover:bg-gray-700/30 rounded-lg transition-colors text-sm font-medium">
                        <Share2 size={18} /> Partager {getShareCount(s.id) > 0 && `(${getShareCount(s.id)})`}
                      </button>
                    </div>
                    {showComments === s.id && <CommentsSection signalementId={s.id} />}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

      {/* Lightbox */}
      {selectedImages && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeImageViewer}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50 hover:bg-black/70" onClick={closeImageViewer}>
            <X size={24} />
          </button>
          <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1.5 rounded-full">
            {currentImageIndex + 1} / {selectedImages.length}
          </div>
          {currentImageIndex > 0 && (
            <button className="absolute left-4 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 hover:bg-black/70" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
              <ChevronLeft size={32} />
            </button>
          )}
          {currentImageIndex < selectedImages.length - 1 && (
            <button className="absolute right-4 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 hover:bg-black/70" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
              <ChevronRight size={32} />
            </button>
          )}
          <img src={selectedImages[currentImageIndex]?.url} className="max-w-[90vw] max-h-[90vh] object-contain" alt="Image" onClick={(e) => e.stopPropagation()} />
          {selectedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-xl backdrop-blur-sm">
              {selectedImages.map((img, index) => (
                <button key={index} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }} className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={img.url} className="w-full h-full object-cover" alt={`Miniature ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}