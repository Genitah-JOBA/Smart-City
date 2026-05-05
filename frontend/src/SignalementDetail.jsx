import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, Clock, MessageCircle, Share2, 
  Construction, Lightbulb, Trash2, Droplets, TreePine, 
  Shield, HelpCircle, X, ChevronLeft, ChevronRight, Image,
  AlertTriangle, PlayCircle, Send, CheckCircle2, ArrowLeft
} from "lucide-react";

export default function SignalementDetail() {
  const { id } = useParams();
  const [signalement, setSignalement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [shares, setShares] = useState([]);
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token) {
      navigate("/auth", { replace: true });
      return;
    }
    fetchSignalementDetail();
    loadCommentsAndShares();
  }, [id]);

  const fetchSignalementDetail = async () => {
    try {
      const response = await fetch(`http://localhost:8081/api/signalements/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSignalement(data);
      } else if (response.status === 404) {
        console.error("Signalement non trouvé");
        navigate("/signalements");
      }
    } catch (error) {
      console.error("Erreur chargement signalement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommentsAndShares = () => {
    const savedComments = localStorage.getItem("signalements_comments");
    const savedShares = localStorage.getItem("signalements_shares");
    
    if (savedComments) {
      const allComments = JSON.parse(savedComments);
      setComments(allComments[id] || []);
    }
    
    if (savedShares) {
      const allShares = JSON.parse(savedShares);
      setShares(allShares[id] || []);
    }
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    
    const currentUserData = JSON.parse(localStorage.getItem("user") || "{}");
    const userInitial = (currentUserData.prenom?.[0] || currentUserData.nom?.[0] || "C").toUpperCase();
    
    const comment = {
      id: Date.now(),
      user: `${currentUserData.prenom || ""} ${currentUserData.nom || "Anonyme"}`.trim(),
      text: newComment,
      date: new Date().toISOString(),
      avatar: userInitial
    };
    
    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    
    // Sauvegarder dans localStorage
    const savedComments = JSON.parse(localStorage.getItem("signalements_comments") || "{}");
    savedComments[id] = updatedComments;
    localStorage.setItem("signalements_comments", JSON.stringify(savedComments));
    
    setNewComment("");
  };

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

  const openImageViewer = (images, startIndex = 0) => {
    setSelectedImages(images);
    setCurrentImageIndex(startIndex);
  };

  const closeImageViewer = () => {
    setSelectedImages(null);
    setCurrentImageIndex(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du signalement...</p>
        </div>
      </div>
    );
  }

  if (!signalement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Signalement non trouvé</p>
          <button onClick={() => navigate("/signalements")} className="mt-4 text-blue-400 hover:text-blue-300">
            Retour aux signalements
          </button>
        </div>
      </div>
    );
  }

  const TypeIcon = getTypeIcon(signalement.type);
  const StatusIcon = getStatusIcon(signalement.statut);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto max-w-3xl px-4 py-6">
        {/* Bouton retour */}
        <button 
          onClick={() => navigate("/signalements")}
          className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Retour aux signalements
        </button>

        {/* Signalement détaillé */}
        <article className="bg-[#242526] rounded-xl shadow-lg overflow-hidden">
          {/* En-tête */}
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                {(signalement.citoyen?.nom?.[0] || signalement.utilisateur?.nom?.[0] || 'C').toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-white text-lg">
                    {signalement.citoyen?.nom || signalement.utilisateur?.nom || 'Citoyen anonyme'}
                  </h3>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> {getRelativeTime(signalement.dateCreation || signalement.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={12} /> {signalement.ville || signalement.commune || 'Localisation'}
                  </span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border bg-blue-500/20 border-blue-500/30 text-blue-400">
                <TypeIcon size={14} /> {signalement.type}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border bg-amber-500/20 border-amber-500/30 text-amber-400">
                <StatusIcon size={14} /> {getStatusText(signalement.statut)}
              </span>
            </div>

            {/* Titre et description */}
            <h2 className="text-2xl font-bold text-white mb-3">{signalement.titre}</h2>
            <p className="text-gray-300 text-base leading-relaxed mb-4">{signalement.description}</p>

            {/* Images */}
            {signalement.images && signalement.images.length > 0 && (
              <div className={`grid gap-2 mt-4 ${signalement.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {signalement.images.map((img, index) => (
                  <div key={index} className="relative bg-black/30 cursor-pointer group" onClick={() => openImageViewer(signalement.images, index)}>
                    <img 
                      src={img.url} 
                      className="w-full h-64 object-cover rounded-lg group-hover:opacity-90 transition-opacity" 
                      alt={`${signalement.titre} - image ${index + 1}`} 
                      onError={(e) => { e.target.src = "https://via.placeholder.com/400x300/242526/808080?text=Image+non+disponible"; }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Statistiques de partage */}
            {shares.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-700/50">
                <p className="text-gray-400 text-sm">
                  📤 Partagé avec {shares.length} personne{shares.length > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Section commentaires */}
            <div className="mt-6 pt-4 border-t border-gray-700/50">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <MessageCircle size={18} />
                Commentaires ({comments.length})
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-2">
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
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Aucun commentaire. Soyez le premier à réagir !
                  </p>
                )}
              </div>

              {/* Ajouter un commentaire */}
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(currentUser.prenom?.[0] || currentUser.nom?.[0] || "C").toUpperCase()}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Écrire un commentaire..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') addComment(); }}
                    className="flex-1 bg-gray-700/50 rounded-full px-4 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button 
                    onClick={addComment} 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1"
                  >
                    <Send size={14} /> Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Lightbox pour les images */}
      {selectedImages && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeImageViewer}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50 hover:bg-black/70" onClick={closeImageViewer}>
            <X size={24} />
          </button>
          <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1.5 rounded-full">
            {currentImageIndex + 1} / {selectedImages.length}
          </div>
          {currentImageIndex > 0 && (
            <button className="absolute left-4 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 hover:bg-black/70" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev - 1); }}>
              <ChevronLeft size={32} />
            </button>
          )}
          {currentImageIndex < selectedImages.length - 1 && (
            <button className="absolute right-4 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 hover:bg-black/70" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev + 1); }}>
              <ChevronRight size={32} />
            </button>
          )}
          <img src={selectedImages[currentImageIndex]?.url} className="max-w-[90vw] max-h-[90vh] object-contain" alt="Image" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}