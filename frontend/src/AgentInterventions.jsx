import { useEffect, useState } from "react";
import { 
  Clock, MapPin, CheckCircle, Image as ImageIcon, 
  User, Calendar, ChevronRight, Search,
  Loader2, X, Eye, ChevronLeft, AlertCircle, Info,
  FolderOpen, Briefcase, Award, FileCheck
} from "lucide-react";

export default function AgentIntervention() {
  const [signalements, setSignalements] = useState([]);
  const [filteredSignalements, setFilteredSignalements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("TOUS");
  const [selectedImages, setSelectedImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedCard, setExpandedCard] = useState(null);
  
  const [preuvesData, setPreuvesData] = useState({});
  const [loadingPreuves, setLoadingPreuves] = useState({});
  const [errorPreuves, setErrorPreuves] = useState({});
  
  const [agentNames, setAgentNames] = useState({});
  
  const [messageBox, setMessageBox] = useState({
    show: false,
    type: "success",
    title: "",
    message: ""
  });
  
  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("userEmail");
  const userNom = localStorage.getItem("userNom");

  console.log("=== DEBUG AGENT INTERVENTION ===");
  console.log("userEmail du localStorage:", userEmail);
  console.log("userNom du localStorage:", userNom);

  const showMessage = (type, title, message) => {
    setMessageBox({ show: true, type, title, message });
    setTimeout(() => setMessageBox(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    fetchSignalements();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterType, signalements, preuvesData]);

  const applyFilters = () => {
    let filtered = [...signalements];
    
    console.log("=== APPLY FILTERS ===");
    console.log("filterType:", filterType);
    console.log("userEmail:", userEmail);
    
    if (filterType === "MES_RESOLUS") {
      filtered = filtered.filter(s => {
        const preuves = preuvesData[s.id] || [];
        console.log(`Signalement ${s.id} - preuves:`, preuves.map(p => p.agentEmail));
        const hasMyPreuve = preuves.some(p => {
          console.log(`Comparaison: ${p.agentEmail} === ${userEmail} ? ${p.agentEmail === userEmail}`);
          return p.agentEmail === userEmail;
        });
        console.log(`Signalement ${s.id} - hasMyPreuve: ${hasMyPreuve}`);
        return hasMyPreuve;
      });
    }
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    console.log("Résultats filtrés:", filtered.length);
    setFilteredSignalements(filtered);
  };

  const fetchSignalements = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching signalements...");
      
      const res = await fetch("http://localhost:8081/api/signalements", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("Signalements reçus:", data);
        
        const resolvedSignalements = data.filter(s => s.statut === "RESOLU");
        console.log("Signalements résolus:", resolvedSignalements);
        
        setSignalements(resolvedSignalements);
        
        for (const signalement of resolvedSignalements) {
          await fetchPreuvesForSignalement(signalement.id);
        }
      } else {
        console.error("Erreur API:", res.status);
        showMessage("error", "Erreur", "Impossible de charger les signalements");
      }
    } catch (error) {
      console.error("Erreur fetch:", error);
      showMessage("error", "Erreur", "Impossible de charger les signalements");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgentName = async (email) => {
    if (!email) return "Inconnu";
    if (agentNames[email]) return agentNames[email];
    
    try {
      const res = await fetch(`http://localhost:8081/api/utilisateurs/email/${email}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const userData = await res.json();
        const name = userData.nom || email.split('@')[0];
        setAgentNames(prev => ({ ...prev, [email]: name }));
        return name;
      } else {
        const name = email.split('@')[0];
        setAgentNames(prev => ({ ...prev, [email]: name }));
        return name;
      }
    } catch (error) {
      console.error(`Erreur récupération nom pour ${email}:`, error);
      const name = email.split('@')[0];
      setAgentNames(prev => ({ ...prev, [email]: name }));
      return name;
    }
  };

  const fetchPreuvesForSignalement = async (signalementId) => {
    try {
      console.log(`Fetching preuves for signalement ${signalementId}...`);
      setLoadingPreuves(prev => ({ ...prev, [signalementId]: true }));
      setErrorPreuves(prev => ({ ...prev, [signalementId]: null }));
      
      const res = await fetch(`http://localhost:8081/api/preuves/signalement/${signalementId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log(`Preuves pour signalement ${signalementId}:`, data);
        setPreuvesData(prev => ({ ...prev, [signalementId]: data }));
        
        for (const preuve of data) {
          if (preuve.agentEmail) {
            await fetchAgentName(preuve.agentEmail);
          }
        }
      } else {
        setPreuvesData(prev => ({ ...prev, [signalementId]: [] }));
      }
    } catch (error) {
      console.error(`Erreur fetch preuves pour ${signalementId}:`, error);
      setPreuvesData(prev => ({ ...prev, [signalementId]: [] }));
    } finally {
      setLoadingPreuves(prev => ({ ...prev, [signalementId]: false }));
    }
  };

  const toggleExpandCard = (signalementId) => {
    if (expandedCard === signalementId) {
      setExpandedCard(null);
    } else {
      setExpandedCard(signalementId);
      if (!preuvesData[signalementId] && !loadingPreuves[signalementId]) {
        fetchPreuvesForSignalement(signalementId);
      }
    }
  };

  const openImageViewer = (images, startIndex = 0) => {
    if (images && images.length > 0) {
      setSelectedImages(images);
      setCurrentImageIndex(startIndex);
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads')) return `http://localhost:8081${imagePath}`;
    if (imagePath.startsWith('data:image')) return imagePath;
    return `http://localhost:8081/uploads/${imagePath}`;
  };

  const getResolvedBy = (signalementId) => {
    const preuves = preuvesData[signalementId] || [];
    if (preuves.length > 0 && preuves[0].agentEmail) {
      return {
        email: preuves[0].agentEmail,
        name: agentNames[preuves[0].agentEmail] || preuves[0].agentEmail.split('@')[0]
      };
    }
    return null;
  };

  const isMyResolution = (signalementId) => {
    const preuves = preuvesData[signalementId] || [];
    return preuves.some(p => p.agentEmail === userEmail);
  };

  // Compter les résolutions de l'utilisateur actuel
  const countMyResolutions = () => {
    let count = 0;
    for (const s of signalements) {
      if (isMyResolution(s.id)) {
        count++;
      }
    }
    return count;
  };

  const stats = {
    total: signalements.length,
    mesResolus: countMyResolutions()
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl pt-8">
        
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FileCheck className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">Signalements Résolus</h1>
          </div>
          <p className="text-white/50 text-sm mt-1">Consultez les preuves de résolution des signalements</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mt-1">{stats.total}</div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-white/50 text-xs">Total résolus</span>
            </div>
          </div>
          <div className="bg-purple-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-300 mt-1">{stats.mesResolus}</div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Award className="w-4 h-4 text-purple-300" />
              <span className="text-purple-300/70 text-xs">Ma résolution</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setFilterType("TOUS")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              filterType === "TOUS" 
                ? 'bg-white/20 text-white' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Tous les résolus
          </button>
          <button
            onClick={() => {
              console.log("=== CLIC SUR MES RÉSOLUTIONS ===");
              console.log("userEmail actuel:", userEmail);
              setFilterType("MES_RESOLUS");
            }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              filterType === "MES_RESOLUS" 
                ? 'bg-purple-500/40 text-purple-200' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Award size={16} />
            Mes résolutions
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher par titre, description ou adresse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="space-y-4">
          {filteredSignalements.length === 0 ? (
            <div className="bg-white/10 rounded-xl p-12 text-center">
              <Briefcase className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/60 text-lg">
                {filterType === "MES_RESOLUS" 
                  ? "Vous n'avez pas encore résolu de signalement" 
                  : "Aucun signalement résolu trouvé"}
              </p>
            </div>
          ) : (
            filteredSignalements.map((signalement) => {
              const preuves = preuvesData[signalement.id] || [];
              const isLoadingPreuves = loadingPreuves[signalement.id];
              const isExpanded = expandedCard === signalement.id;
              const myResolution = isMyResolution(signalement.id);
              const resolvedBy = getResolvedBy(signalement.id);
              
              return (
                <div 
                  key={signalement.id} 
                  className="bg-[#242526] rounded-xl overflow-hidden border border-emerald-500/30 hover:border-emerald-500/50 transition"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-48 h-48 md:h-auto relative">
                      {signalement.images && signalement.images.length > 0 ? (
                        <div className="w-full h-full relative overflow-hidden">
                          <img 
                            src={getImageUrl(signalement.images[0].url)} 
                            className="w-full h-full object-cover"
                            alt={signalement.titre}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/200?text=Image+non+disponible";
                            }}
                          />
                          {signalement.images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                              +{signalement.images.length - 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-700/50 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-500" />
                        </div>
                      )}
                      {myResolution && (
                        <div className="absolute top-2 left-2 bg-purple-500/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Award size={12} />
                          Mienne
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-emerald-500/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle size={12} />
                        Résolu
                      </div>
                    </div>

                    <div className="flex-1 p-5">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <div className="text-white/40 text-xs flex items-center gap-2">
                          <Calendar size={14} />
                          {formatDate(signalement.dateCreation)}
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 text-xs">
                          <FolderOpen size={14} />
                          <span>{preuves.length} preuve(s)</span>
                        </div>
                      </div>

                      <h3 className="text-white font-bold text-xl mb-2">{signalement.titre || "Sans titre"}</h3>
                      <p className="text-white/60 text-sm mb-3 line-clamp-2">{signalement.description || "Aucune description"}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs mb-4">
                        <div className="flex items-center gap-1 text-white/40">
                          <MapPin size={14} />
                          <span>{signalement.address || signalement.ville || "Localisation non spécifiée"}</span>
                        </div>
                        {resolvedBy && (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <User size={14} />
                            <span>Résolu par : <span className="font-medium">{resolvedBy.name}</span></span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => toggleExpandCard(signalement.id)}
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1 transition"
                      >
                        {isExpanded ? "Voir moins" : "Voir les preuves de résolution"}
                        <ChevronRight size={16} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-5">
                      <div className="space-y-4">
                        <h4 className="text-emerald-400 font-semibold flex items-center gap-2">
                          <FolderOpen size={18} />
                          Preuves de résolution
                        </h4>

                        {isLoadingPreuves ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                          </div>
                        ) : preuves.length > 0 ? (
                          preuves.map((preuve, idx) => {
                            const agentName = agentNames[preuve.agentEmail] || preuve.agentEmail?.split('@')[0] || "Inconnu";
                            return (
                              <div key={preuve.id || idx} className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                                  <div>
                                    <h5 className="text-emerald-400 font-medium text-sm">
                                      Intervention #{idx + 1}
                                    </h5>
                                    {preuve.dateCreation && (
                                      <p className="text-white/30 text-xs mt-1">
                                        {formatDate(preuve.dateCreation)}
                                      </p>
                                    )}
                                  </div>
                                  {preuve.agentEmail && (
                                    <span className="text-white/30 text-xs flex items-center gap-1">
                                      <User size={12} />
                                      Agent: {agentName}
                                    </span>
                                  )}
                                </div>
                                
                                {preuve.description && (
                                  <div className="bg-white/5 rounded-lg p-3 mb-3">
                                    <p className="text-white/70 text-sm">{preuve.description}</p>
                                  </div>
                                )}
                                
                                {preuve.images && preuve.images.length > 0 ? (
                                  <div>
                                    <p className="text-white/50 text-xs mb-2 flex items-center gap-1">
                                      <ImageIcon size={12} />
                                      Images justificatives ({preuve.images.length})
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                      {preuve.images.map((img, imgIndex) => {
                                        const imgUrl = getImageUrl(img);
                                        return (
                                          <div 
                                            key={imgIndex} 
                                            className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition relative group"
                                            onClick={() => openImageViewer(
                                              preuve.images.map(imgUrl => ({ url: getImageUrl(imgUrl) })), 
                                              imgIndex
                                            )}
                                          >
                                            <img 
                                              src={imgUrl} 
                                              className="w-full h-full object-cover" 
                                              alt={`Preuve ${imgIndex + 1}`}
                                              onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/200?text=Image+non+disponible";
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                              <Eye size={24} className="text-white" />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 bg-white/5 rounded-lg">
                                    <p className="text-white/40 text-sm">Aucune image pour cette preuve</p>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 bg-black/30 rounded-xl">
                            <ImageIcon size={48} className="text-white/20 mx-auto mb-2" />
                            <p className="text-white/40 text-sm">Aucune preuve d'intervention enregistrée</p>
                          </div>
                        )}

                        {resolvedBy && (
                          <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                            <div className="flex items-center gap-2">
                              <CheckCircle size={16} className="text-emerald-400" />
                              <span className="text-emerald-400 text-sm font-medium">
                                Signalement résolu
                              </span>
                            </div>
                            <div className="mt-2 flex flex-col gap-1">
                              <p className="text-white/60 text-xs">
                                Résolu le {formatDate(signalement.dateModification || signalement.dateCreation)}
                              </p>
                              <p className="text-white/60 text-xs flex items-center gap-1">
                                <User size={12} className="text-emerald-400" />
                                Par : <span className="text-emerald-400 font-medium">{resolvedBy.name}</span>
                                {resolvedBy.email && resolvedBy.name !== resolvedBy.email && (
                                  <span className="text-white/40">({resolvedBy.email})</span>
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedImages && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center" onClick={closeImageViewer}>
          <button className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50 hover:bg-black/70 z-10" onClick={closeImageViewer}>
            <X size={24} />
          </button>
          <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1.5 rounded-full z-10">
            {currentImageIndex + 1} / {selectedImages.length}
          </div>
          {currentImageIndex > 0 && (
            <button className="absolute left-4 text-white p-3 rounded-full bg-black/50 hover:bg-black/70 z-10" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
              <ChevronLeft size={32} />
            </button>
          )}
          {currentImageIndex < selectedImages.length - 1 && (
            <button className="absolute right-4 text-white p-3 rounded-full bg-black/50 hover:bg-black/70 z-10" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
              <ChevronRight size={32} />
            </button>
          )}
          <img src={selectedImages[currentImageIndex]?.url} className="max-w-[90vw] max-h-[90vh] object-contain" alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {messageBox.show && (
        <div className="fixed bottom-4 right-4 z-[200] animate-slide-in-right">
          <div className={`rounded-xl shadow-2xl p-4 min-w-[300px] max-w-md flex items-start gap-3 ${
            messageBox.type === "success" ? "bg-emerald-500 text-white" :
            messageBox.type === "error" ? "bg-red-500 text-white" : "bg-blue-500 text-white"
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
            <button onClick={() => setMessageBox(prev => ({ ...prev, show: false }))} className="flex-shrink-0 hover:opacity-70">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

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