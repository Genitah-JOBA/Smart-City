import { useEffect, useState } from "react";
import { 
  Activity, CheckCircle, Clock, AlertTriangle, 
  TrendingUp, MapPin, Calendar, ArrowRight, Eye, X,
  Construction, Lightbulb, Trash2, Droplets, TreePine, Shield,
  User, Briefcase, Wrench, Loader2, Building2, PlayCircle, Send, FileText, Camera, Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AgentDashboard() {
  const [stats, setStats] = useState({ 
    total: 0, 
    enAttente: 0, 
    enCours: 0,
    resolus: 0 
  });
  const [signalementsAssignes, setSignalementsAssignes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);
  const [agentInfo, setAgentInfo] = useState({ nom: "", domaine: "", metier: "" });
  const [actionLoading, setActionLoading] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [currentSignalementId, setCurrentSignalementId] = useState(null);
  const [proofDescription, setProofDescription] = useState("");
  const [proofImages, setProofImages] = useState([]);
  const [messageBox, setMessageBox] = useState({ show: false, type: "", title: "", message: "" });
  
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const showMessage = (type, title, message) => {
    setMessageBox({ show: true, type, title, message });
    setTimeout(() => setMessageBox(prev => ({ ...prev, show: false })), 3000);
  };

  // Récupérer les informations de l'agent connecté
  const fetchAgentInfo = async () => {
    try {
      const res = await fetch("http://localhost:8081/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAgentInfo({
          nom: data.nom || "Agent",
          domaine: data.domaine || "Non défini",
          metier: data.metier || "Non défini"
        });
      }
    } catch (error) {
      console.error("Erreur récupération infos agent:", error);
    }
  };

  // Récupérer les signalements assignés à l'agent
  const fetchAssignedSignalements = async () => {
    try {
      const meRes = await fetch("http://localhost:8081/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meRes.ok) return;
      
      const userData = await meRes.json();
      const agentId = userData.id;
      
      const res = await fetch(`http://localhost:8081/api/signalements/agent/${agentId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const actifs = data.filter(s => s.statut !== "RESOLU" && s.statut !== "TRAITE");
        const tries = actifs.sort((a, b) => 
          new Date(b.dateCreation || b.createdAt) - new Date(a.dateCreation || a.createdAt)
        );
        setSignalementsAssignes(tries);
        setStats({
          total: tries.length,
          enAttente: tries.filter(s => s.statut === "EN_ATTENTE").length,
          enCours: tries.filter(s => s.statut === "EN_COURS").length,
          resolus: 0
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrendreEnCharge = async (id) => {
    setActionLoading(id);
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
        setSignalementsAssignes(prev => prev.map(s => 
          s.id === id ? { ...s, statut: "EN_COURS" } : s
        ));
        showMessage("success", "Succès", "Signalement pris en charge !");
        fetchAssignedSignalements();
      }
    } catch (error) {
      showMessage("error", "Erreur", "Une erreur est survenue");
    } finally {
      setActionLoading(null);
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

    setActionLoading(currentSignalementId);

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
        setShowProofModal(false);
        setProofDescription("");
        setProofImages([]);
        showMessage("success", "Félicitations !", "Signalement résolu !");
        fetchAssignedSignalements();
      }
    } catch (error) {
      showMessage("error", "Erreur", error.message);
    } finally {
      setActionLoading(null);
      setCurrentSignalementId(null);
    }
  };

  useEffect(() => {
    fetchAgentInfo();
    fetchAssignedSignalements();
  }, [token]);

  const getTypeIcon = (type) => {
    const icons = {
      'VOIRIE': Construction, 'ECLAIRAGE': Lightbulb, 'PROPRETE': Trash2,
      'DECHETS': Trash2, 'EAU': Droplets, 'ESPACES_VERTS': TreePine,
      'TRANSPORTS': MapPin, 'SECURITE': Shield, 'URBANISME': Building2,
      'AUTRE': AlertTriangle
    };
    return icons[type] || MapPin;
  };

  const getTypeLabel = (type) => {
    const labels = {
      'VOIRIE': 'Voirie', 'ECLAIRAGE': 'Éclairage', 'PROPRETE': 'Propreté',
      'DECHETS': 'Déchets', 'EAU': 'Eau', 'ESPACES_VERTS': 'Espaces verts',
      'TRANSPORTS': 'Transports', 'SECURITE': 'Sécurité', 'URBANISME': 'Urbanisme',
      'AUTRE': 'Autre'
    };
    return labels[type] || type;
  };

  const getStatusColor = (statut) => {
    const colors = {
      'EN_ATTENTE': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      'EN_COURS': 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    };
    return colors[statut] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getStatusLabel = (statut) => {
    const labels = { 'EN_ATTENTE': 'En attente', 'EN_COURS': 'En cours' };
    return labels[statut] || statut;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getMetierLabel = (metierId) => {
    const metiers = {
      'AGENT_VOIRIE': 'Agent de voirie', 'TECHNICIEN_GENIE_CIVIL': 'Technicien génie civil',
      'CHEF_CHANTIER_VOIRIE': 'Chef de chantier', 'AGENT_SIGNALISATION': 'Agent signalisation',
      'TECHNICIEN_ECLAIRAGE': 'Technicien éclairage', 'INGENIEUR_ECLAIRAGE': 'Ingénieur éclairage',
      'AGENT_MAINTENANCE_ELEC': 'Agent maintenance', 'AGENT_COLLECTE': 'Agent de collecte',
      'TECHNICIEN_NETTOIEMENT': 'Technicien nettoiement', 'RESPONSABLE_DECHETTERIE': 'Responsable déchetterie',
      'JARDINIER_MUNICIPAL': 'Jardinier municipal', 'ELAGUEUR': 'Élagueur',
      'PAYSAGISTE_URBAIN': 'Paysagiste urbain', 'AGENT_REGULATION': 'Agent régulation',
      'CONTROLEUR_TRANSPORT': 'Contrôleur transport', 'TECHNICIEN_STATIONNEMENT': 'Technicien stationnement',
      'AGENT_SECURITE_URBAINE': 'Agent sécurité', 'POLICE_MUNICIPALE': 'Police municipale',
      'AGENT_MEDIATEUR': 'Agent médiateur', 'URBANISTE': 'Urbaniste',
      'ARCHITECTE_CONSEIL': 'Architecte conseil', 'TECHNICIEN_URBANISME': 'Technicien urbanisme'
    };
    return metiers[metierId] || metierId?.replace(/_/g, ' ').toLowerCase() || "Non défini";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Modal de preuve
  const ProofModal = () => {
    if (!showProofModal) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowProofModal(false)}>
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-900">Preuve de résolution</h2>
              </div>
              <button onClick={() => setShowProofModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <p className="text-slate-600 text-sm mb-4">Veuillez fournir une preuve que le problème a été résolu.</p>
            
            <div className="mb-4">
              <label className="block text-slate-700 font-medium mb-2">Description de la résolution *</label>
              <textarea value={proofDescription} onChange={(e) => setProofDescription(e.target.value)} rows={4}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Décrivez comment le problème a été résolu..." />
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 font-medium mb-2">Photos avant/après</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                <input type="file" accept="image/*" multiple onChange={handleProofImagesUpload} className="hidden" id="proofImages" />
                <label htmlFor="proofImages" className="cursor-pointer flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8 text-slate-400" />
                  <span className="text-slate-500 text-sm">Cliquez pour ajouter des photos</span>
                </label>
              </div>
            </div>

            {proofImages.length > 0 && (
              <div className="mb-4">
                <label className="block text-slate-700 font-medium mb-2">Aperçu ({proofImages.length} photo(s))</label>
                <div className="grid grid-cols-3 gap-2">
                  {proofImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img} className="w-full h-24 object-cover rounded-lg" alt={`Preuve ${index + 1}`} />
                      <button onClick={() => removeProofImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowProofModal(false)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2.5 rounded-lg transition">
                Annuler
              </button>
              <button onClick={handleSubmitProof} disabled={!proofDescription.trim() || actionLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={20} />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Message Box
  const MessageBoxComponent = () => {
    if (!messageBox.show) return null;
    return (
      <div className="fixed bottom-4 right-4 z-[200] animate-slide-in-right">
        <div className={`rounded-xl shadow-2xl p-4 min-w-[300px] max-w-md flex items-start gap-3 ${messageBox.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          <div className="flex-shrink-0">
            {messageBox.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">{messageBox.title}</h4>
            <p className="text-xs opacity-90">{messageBox.message}</p>
          </div>
          <button onClick={() => setMessageBox(prev => ({ ...prev, show: false }))} className="flex-shrink-0 hover:opacity-70 transition">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Composant Modal pour afficher tous les signalements AVEC BOUTONS
  const AllSignalementsModal = () => {
    if (!showAllModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowAllModal(false)}>
        <div className="bg-[#1e1e2f] rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-white/20" onClick={(e) => e.stopPropagation()}>
          <div className="p-5 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#1e1e2f]">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Signalements assignés
              </h2>
              <p className="text-white/50 text-sm mt-1">{signalementsAssignes.length} signalement(s) en attente de traitement</p>
            </div>
            <button onClick={() => setShowAllModal(false)} className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)] space-y-3">
            {signalementsAssignes.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <p className="text-white/60 text-lg">Aucun signalement assigné</p>
                <p className="text-white/40 text-sm mt-2">Tous vos signalements ont été traités !</p>
              </div>
            ) : (
              signalementsAssignes.map((s) => {
                const TypeIcon = getTypeIcon(s.type);
                const statusColor = getStatusColor(s.statut);
                const isLoadingAction = actionLoading === s.id;
                
                return (
                  <div key={s.id} className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-colors border border-white/10">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-4 h-4 text-amber-400" />
                          </div>
                          <h4 className="text-white font-semibold">{s.titre || "Sans titre"}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor}`}>
                            {getStatusLabel(s.statut)}
                          </span>
                          <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">
                            {getTypeLabel(s.type)}
                          </span>
                        </div>
                        
                        {/* BOUTONS D'ACTION DANS LE MODAL */}
                        <div className="flex gap-2">
                          {s.statut === "EN_ATTENTE" && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handlePrendreEnCharge(s.id); }}
                              disabled={isLoadingAction}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1 text-sm disabled:opacity-50"
                            >
                              {isLoadingAction && actionLoading === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle size={14} />}
                              Prendre en charge
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); openProofModal(s.id); }}
                            disabled={isLoadingAction}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1 text-sm disabled:opacity-50"
                          >
                            <CheckCircle size={14} />
                            Marquer résolu
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-white/60 text-sm">{s.description || "Aucune description"}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-white/40">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span>{s.address || s.ville || s.commune || "Localisation non spécifiée"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Créé le {formatDate(s.dateCreation || s.createdAt)}</span>
                        </div>
                        {s.quartier && (
                          <div className="flex items-center gap-1">
                            <Briefcase size={12} />
                            <span>Quartier: {s.quartier}</span>
                          </div>
                        )}
                        {s.rue && (
                          <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            <span>Rue: {s.rue}</span>
                          </div>
                        )}
                      </div>
                      
                      {s.images && s.images.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {s.images.slice(0, 3).map((img, idx) => (
                            <img key={idx} src={img.url} className="w-12 h-12 rounded-lg object-cover border border-white/20" alt={`Image ${idx + 1}`} />
                          ))}
                          {s.images.length > 3 && (
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-white/40 text-xs">
                              +{s.images.length - 3}
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <MessageBoxComponent />
      <ProofModal />
      <AllSignalementsModal />

      <div className="container mx-auto max-w-6xl pt-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="w-8 h-8 text-blue-400" />
              Dashboard Agent
            </h1>
            <p className="text-white/60">Bienvenue dans votre espace de travail</p>
          </div>
          
          <div className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600/20 to-emerald-600/20 rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-semibold">{agentInfo.nom}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-400">{agentInfo.domaine}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-emerald-400">{getMetierLabel(agentInfo.metier)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl border border-amber-500/30">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-amber-500/30 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-300 text-sm font-medium mb-1">SIGNALEMENTS ASSIGNÉS</p>
                <p className="text-5xl font-bold text-white">{stats.total}</p>
                <p className="text-white/60 text-sm mt-1">Signalements à traiter</p>
              </div>
            </div>
            {signalementsAssignes.length > 0 && (
              <button onClick={() => setShowAllModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2">
                <ArrowRight size={18} />
                Voir tous ({signalementsAssignes.length})
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#242526] backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><Activity className="w-6 h-6 text-blue-400" /></div>
              <span className="text-white/40 text-sm">Assignés</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.total}</div>
            <div className="text-white/60 text-sm">Signalements assignés</div>
          </div>

          <div className="bg-[#242526] backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-amber-400" /></div>
              <span className="text-white/40 text-sm">En attente</span>
            </div>
            <div className="text-4xl font-bold text-amber-400 mb-1">{stats.enAttente}</div>
            <div className="text-white/60 text-sm">À prendre en charge</div>
          </div>

          <div className="bg-[#242526] backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><CheckCircle className="w-6 h-6 text-blue-400" /></div>
              <span className="text-white/40 text-sm">En cours</span>
            </div>
            <div className="text-4xl font-bold text-blue-400 mb-1">{stats.enCours}</div>
            <div className="text-white/60 text-sm">Signalements en traitement</div>
          </div>
        </div>

        {signalementsAssignes.length > 0 && (
          <div className="bg-[#242526] backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Derniers signalements assignés
              </h3>
              <button onClick={() => setShowAllModal(true)} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                Voir tout <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-3">
              {signalementsAssignes.slice(0, 5).map((s) => {
                const TypeIcon = getTypeIcon(s.type);
                const statusColor = getStatusColor(s.statut);
                return (
                  <div key={s.id} className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-colors border border-white/10 cursor-pointer">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-white font-medium">{s.titre || "Sans titre"}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor}`}>{getStatusLabel(s.statut)}</span>
                          <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{getTypeLabel(s.type)}</span>
                        </div>
                        <p className="text-white/60 text-sm line-clamp-1 mb-2">{s.description || "Aucune description"}</p>
                        <div className="flex items-center gap-4 text-xs text-white/40">
                          <span className="flex items-center gap-1"><MapPin size={12} /> {s.ville || s.commune || "Localisation"}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(s.dateCreation || s.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {signalementsAssignes.length === 0 && (
          <div className="bg-[#242526] backdrop-blur-xl rounded-xl p-12 text-center border border-white/20">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <p className="text-white/60 text-lg">Aucun signalement assigné</p>
            <p className="text-white/40 text-sm mt-2">Vous n'avez pas encore de signalements à traiter.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
      `}</style>
    </div>
  );
}