import { useEffect, useState } from "react";
import { 
  MapPin, CheckCircle, Clock, PlayCircle, AlertTriangle,
  Image as ImageIcon, ChevronLeft, ChevronRight, X, Eye,
  Upload, Camera, Loader2, AlertCircle, Info, ClipboardList,
  Users, FolderCheck, ListTodo, Award, FileText,
  Send, Calendar, User, Phone, Mail, Star, Heart,
  Share, Download, Trash2, Edit, Save, Plus, Minus,
  Settings, LogOut, Menu, Bell, MessageSquare, Home,
  Shield, Zap, Rocket, Sparkles, Globe, Lock, Unlock
} from "lucide-react";

export default function AgentSignalementsAssignes() {
  const [signalements, setSignalements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("TOUS");
  const [selectedImages, setSelectedImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // États pour le modal de preuve
  const [showProofModal, setShowProofModal] = useState(false);
  const [currentSignalementId, setCurrentSignalementId] = useState(null);
  const [proofDescription, setProofDescription] = useState("");
  const [proofImages, setProofImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // État pour la MessageBox
  const [messageBox, setMessageBox] = useState({
    show: false,
    type: "success",
    title: "",
    message: ""
  });
  
  const token = localStorage.getItem("token");

  const showMessage = (type, title, message) => {
    setMessageBox({
      show: true,
      type: type,
      title: title,
      message: message
    });
    
    if (type === "success") {
      setTimeout(() => {
        setMessageBox(prev => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  useEffect(() => {
    const fetchSignalements = async () => {
      try {
        const res = await fetch("http://localhost:8081/api/signalements", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Garder seulement les signalements EN_ATTENTE et EN_COURS
          const signalementsActifs = data.filter(s => s.statut === "EN_ATTENTE" || s.statut === "EN_COURS");
          
          const signalementsTries = signalementsActifs.sort((a, b) => {
            const priority = { "EN_ATTENTE": 0, "EN_COURS": 1 };
            return priority[a.statut] - priority[b.statut];
          });
          
          setSignalements(signalementsTries);
        } else {
          showMessage("error", "Erreur", "Impossible de charger les signalements");
        }
      } catch (error) {
        showMessage("error", "Erreur réseau", "Impossible de contacter le serveur");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSignalements();
  }, [token]);

  // Filtrer selon le bouton sélectionné
  const filteredSignalements = signalements.filter(s => {
    if (filter === "TOUS") return true;
    if (filter === "EN_ATTENTE") return s.statut === "EN_ATTENTE";
    if (filter === "EN_COURS") return s.statut === "EN_COURS";
    return true;
  });

  // Statistiques uniquement sur les signalements actifs
  const stats = {
    total: signalements.length,
    enAttente: signalements.filter(s => s.statut === "EN_ATTENTE").length,
    enCours: signalements.filter(s => s.statut === "EN_COURS").length,
    resolus: 0
  };

  const handlePrendreEnCharge = async (id) => {
    try {
      const res = await fetch(`http://localhost:8081/api/signalements/${id}/statut`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ statut: "EN_COURS" })
      });
      if (res.ok) {
        setSignalements(prev => prev.map(s => 
          s.id === id ? { ...s, statut: "EN_COURS" } : s
        ));
        showMessage("success", "Succès", "Signalement pris en charge !");
      }
    } catch (error) {
      showMessage("error", "Erreur", "Une erreur est survenue");
    }
  };

  const openProofModal = (id) => {
    setCurrentSignalementId(id);
    setProofDescription("");
    setProofImages([]);
    setShowProofModal(true);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleProofImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (proofImages.length + files.length > 5) {
      showMessage("error", "Limite", "5 photos maximum");
      return;
    }
    try {
      const base64Images = await Promise.all(files.map(convertToBase64));
      setProofImages(prev => [...prev, ...base64Images]);
    } catch (error) {
      showMessage("error", "Erreur", "Impossible de charger les images");
    }
  };

  const removeProofImage = (index) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitProof = async () => {
    if (!proofDescription.trim()) {
      showMessage("error", "Champ requis", "Ajoutez une description");
      return;
    }

    setIsSubmitting(true);

    try {
      const proofData = {
        signalementId: currentSignalementId,
        description: proofDescription,
        images: proofImages,
        dateResolution: new Date().toISOString()
      };

      const proofResponse = await fetch("http://localhost:8081/api/preuves", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(proofData)
      });

      if (!proofResponse.ok) {
        throw new Error("Erreur lors de l'envoi de la preuve");
      }

      const res = await fetch(`http://localhost:8081/api/signalements/${currentSignalementId}/statut`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ statut: "RESOLU" })
      });

      if (res.ok) {
        // Supprimer le signalement résolu de la liste
        setSignalements(prev => prev.filter(s => s.id !== currentSignalementId));
        setShowProofModal(false);
        setProofDescription("");
        setProofImages([]);
        showMessage("success", "Félicitations !", "Signalement résolu !");
      }
    } catch (error) {
      showMessage("error", "Erreur", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImages, currentImageIndex]);

  const getStatusColor = (statut) => {
    const colors = {
      'EN_ATTENTE': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      'EN_COURS': 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    };
    return colors[statut] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      'EN_ATTENTE': 'En attente',
      'EN_COURS': 'En cours'
    };
    return labels[statut] || statut;
  };

  const getStatusIcon = (statut) => {
    const icons = {
      'EN_ATTENTE': AlertTriangle,
      'EN_COURS': Clock
    };
    return icons[statut] || AlertTriangle;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement des signalements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl pt-8">
        {/* En-tête */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ClipboardList className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">SIGNALEMENTS ACTIFS</h1>
          </div>
          <p className="text-white/50 text-sm mt-2">Signalements en attente de traitement</p>
        </div>

        {/* CARTES STATISTIQUES AVEC NOMBRES */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Total */}
          <div className="bg-white/10 rounded-xl p-4 text-center hover:bg-white/20 transition cursor-pointer">
            <FolderCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-white/50 text-xs mt-1">Total actifs</div>
          </div>
          
          {/* En attente */}
          <div 
            className={`rounded-xl p-4 text-center transition cursor-pointer ${
              filter === "EN_ATTENTE" 
                ? 'bg-amber-500/30 border-2 border-amber-400' 
                : 'bg-amber-500/20 hover:bg-amber-500/30'
            }`}
            onClick={() => setFilter("EN_ATTENTE")}
          >
            <Clock className="w-6 h-6 text-amber-300 mx-auto mb-2" />
            <div className="text-3xl font-bold text-amber-300">{stats.enAttente}</div>
            <div className="text-amber-300/70 text-xs mt-1">En attente</div>
          </div>
          
          {/* En cours */}
          <div 
            className={`rounded-xl p-4 text-center transition cursor-pointer ${
              filter === "EN_COURS" 
                ? 'bg-blue-500/30 border-2 border-blue-400' 
                : 'bg-blue-500/20 hover:bg-blue-500/30'
            }`}
            onClick={() => setFilter("EN_COURS")}
          >
            <PlayCircle className="w-6 h-6 text-blue-300 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-300">{stats.enCours}</div>
            <div className="text-blue-300/70 text-xs mt-1">En cours</div>
          </div>
        </div>

        {/* FILTRES RAPIDES */}
        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setFilter("TOUS")}
            className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
              filter === "TOUS"
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <ListTodo size={16} />
            Tous ({stats.total})
          </button>
          <button
            onClick={() => setFilter("EN_ATTENTE")}
            className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
              filter === "EN_ATTENTE"
                ? 'bg-amber-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Clock size={16} />
            En attente ({stats.enAttente})
          </button>
          <button
            onClick={() => setFilter("EN_COURS")}
            className={`px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 ${
              filter === "EN_COURS"
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <PlayCircle size={16} />
            En cours ({stats.enCours})
          </button>
        </div>
        
        {/* Grille des signalements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSignalements.length === 0 ? (
            <div className="col-span-full bg-white/10 rounded-xl p-12 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <p className="text-white/60 text-lg">Aucun signalement à afficher</p>
              <p className="text-white/40 text-sm mt-2">Tous les signalements ont été traités !</p>
            </div>
          ) : (
            filteredSignalements.map((s) => {
              const StatusIcon = getStatusIcon(s.statut);
              
              return (
                <div key={s.id} className="bg-[#242526] backdrop-blur-xl rounded-xl overflow-hidden border border-white/20 hover:shadow-xl transition-shadow hover:scale-[1.02] duration-300">
                  {/* Section photo */}
                  {s.images && s.images.length > 0 ? (
                    <div className="relative">
                      <div 
                        className="relative h-48 cursor-pointer group"
                        onClick={() => openImageViewer(s.images, 0)}
                      >
                        <img 
                          src={s.images[0].url} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          alt={s.titre}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x300/1e293b/64748b?text=Image+non+disponible";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                        </div>
                      </div>
                      
                      {s.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <ImageIcon size={12} />
                          +{s.images.length - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-700/50 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-500" />
                    </div>
                  )}

                  <div className="p-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium mb-3 ${getStatusColor(s.statut)}`}>
                      <StatusIcon size={14} />
                      {getStatusLabel(s.statut)}
                    </div>

                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                      {s.titre || "Sans titre"}
                    </h3>
                    
                    <p className="text-white/60 text-sm mb-3 line-clamp-2">
                      {s.description || "Aucune description fournie"}
                    </p>
                    
                    <div className="flex items-center gap-2 text-white/40 text-xs mb-4">
                      <MapPin size={12} />
                      <span>{s.address || s.ville || s.commune || "Localisation non spécifiée"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-white/40 text-xs mb-4">
                      <Calendar size={12} />
                      <span>
                        Créé le {s.dateCreation ? new Date(s.dateCreation).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Date inconnue'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {s.statut === "EN_ATTENTE" && (
                        <button 
                          onClick={() => handlePrendreEnCharge(s.id)} 
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <PlayCircle size={16} />
                          Prendre en charge
                        </button>
                      )}
                      
                      <button 
                        onClick={() => openProofModal(s.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <CheckCircle size={16} />
                        Marquer résolu
                      </button>
                    </div>

                    {s.images && s.images.length > 1 && (
                      <div className="flex gap-1 mt-3">
                        {s.images.slice(1, 4).map((img, index) => (
                          <div 
                            key={index}
                            className="w-12 h-12 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openImageViewer(s.images, index + 1)}
                          >
                            <img src={img.url} className="w-full h-full object-cover" alt="" />
                          </div>
                        ))}
                        {s.images.length > 4 && (
                          <div 
                            className="w-12 h-12 rounded-lg bg-gray-700/50 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors"
                            onClick={() => openImageViewer(s.images, 1)}
                          >
                            <span className="text-white/60 text-xs">+{s.images.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MESSAGE BOX */}
      {messageBox.show && (
        <div className="fixed bottom-4 right-4 z-[200] animate-slide-in-right">
          <div className={`rounded-xl shadow-2xl p-4 min-w-[300px] max-w-md flex items-start gap-3 ${
            messageBox.type === "success" ? "bg-emerald-500 text-white" :
            messageBox.type === "error" ? "bg-red-500 text-white" :
            "bg-blue-500 text-white"
          }`}>
            <div className="flex-shrink-0">
              {messageBox.type === "success" && <CheckCircle size={20} />}
              {messageBox.type === "error" && <AlertCircle size={20} />}
              {messageBox.type === "info" && <Info size={20} />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">{messageBox.title}</h4>
              <p className="text-xs opacity-90">{messageBox.message}</p>
            </div>
            <button
              onClick={() => setMessageBox(prev => ({ ...prev, show: false }))}
              className="flex-shrink-0 hover:opacity-70 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE PREUVE */}
      {showProofModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-xl font-bold text-slate-900">Preuve de résolution</h2>
                </div>
                <button
                  onClick={() => setShowProofModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-slate-600 text-sm mb-4">
                Veuillez fournir une preuve que le problème a été résolu.
              </p>

              <div className="mb-4">
                <label className="block text-slate-700 font-medium mb-2">
                  Description de la résolution *
                </label>
                <textarea
                  value={proofDescription}
                  onChange={(e) => setProofDescription(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Décrivez comment le problème a été résolu..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-slate-700 font-medium mb-2">
                  Photos avant/après
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleProofImagesUpload}
                    className="hidden"
                    id="proofImages"
                  />
                  <label
                    htmlFor="proofImages"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Camera className="w-8 h-8 text-slate-400" />
                    <span className="text-slate-500 text-sm">Cliquez pour ajouter des photos</span>
                  </label>
                </div>
              </div>

              {proofImages.length > 0 && (
                <div className="mb-4">
                  <label className="block text-slate-700 font-medium mb-2">
                    Aperçu ({proofImages.length} photo(s))
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {proofImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          className="w-full h-24 object-cover rounded-lg"
                          alt={`Preuve ${index + 1}`}
                        />
                        <button
                          onClick={() => removeProofImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowProofModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2.5 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitProof}
                  disabled={isSubmitting || !proofDescription.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Confirmer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visionneuse d'images */}
      {selectedImages && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeImageViewer}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10"
            onClick={closeImageViewer}
          >
            <X size={24} />
          </button>

          <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1.5 rounded-full z-10">
            {currentImageIndex + 1} / {selectedImages.length}
          </div>

          {currentImageIndex > 0 && (
            <button 
              className="absolute left-4 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {currentImageIndex < selectedImages.length - 1 && (
            <button 
              className="absolute right-4 text-white hover:text-gray-300 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <ChevronRight size={32} />
            </button>
          )}

          <img 
            src={selectedImages[currentImageIndex]?.url} 
            className="max-w-[90vw] max-h-[90vh] object-contain"
            alt={`Image ${currentImageIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />

          {selectedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-xl backdrop-blur-sm">
              {selectedImages.map((img, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}