import { useState, useEffect } from "react";
import { 
  Brain, MapPin, User, Building2, Wrench, CheckCircle, 
  X, Search, Filter, AlertTriangle, Clock, Phone, Mail,
  Send, Loader2, Sparkles, Target, Award, Shield as ShieldIcon,
  Users, Settings, Eye, EyeOff, Check, ChevronLeft, ChevronRight,
  Bell, BellRing, Cpu, Zap,
  Lightbulb, Trash, TreePine, Bus, Home, Camera, Edit2,
  RefreshCw, Maximize2, Navigation2, LocateFixed, PlusCircle,
  LayoutDashboard, ClipboardList, MessageSquare, UserCheck,
  Share2, ChevronDown, BarChart3, Droplets
} from "lucide-react";
import { useI18n } from "./context/AppContext";

export default function AssignationIA() {
  const { t } = useI18n();
  const [signalements, setSignalements] = useState([]);
  const [agents, setAgents] = useState([]);
  const [filteredSignalements, setFilteredSignalements] = useState([]);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDomaine, setFilterDomaine] = useState("TOUS");
  const [messageBox, setMessageBox] = useState({ show: false, type: "", text: "" });

  // Affiche une notification toast (auto-masquée). Était appelée mais jamais définie.
  const showMessage = (type, text) => {
    setMessageBox({ show: true, type, text });
    setTimeout(() => setMessageBox({ show: false, type: "", text: "" }), 4000);
  };
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  // Domaines disponibles (avec DECHETS au lieu de PROPRETE, et EAU ajouté)
  const domaines = [
    { id: "TOUS", label: t("admin.allDomains"), icon: Target, color: "from-emerald-600 to-emerald-500" },
    { id: "VOIRIE", label: t("type.VOIRIE"), icon: MapPin, color: "from-green-600 to-green-400" },
    { id: "ECLAIRAGE", label: t("type.ECLAIRAGE"), icon: Lightbulb, color: "from-amber-600 to-amber-400" },
    { id: "DECHETS", label: t("type.DECHETS"), icon: Trash, color: "from-red-600 to-red-400" },
    { id: "EAU", label: t("cat.EAU"), icon: Droplets, color: "from-blue-600 to-blue-400" },
    { id: "ESPACES_VERTS", label: t("type.ESPACES_VERTS"), icon: TreePine, color: "from-emerald-600 to-emerald-400" },
    { id: "TRANSPORTS", label: t("type.TRANSPORTS"), icon: Bus, color: "from-purple-600 to-purple-400" },
    { id: "SECURITE", label: t("type.SECURITE"), icon: ShieldIcon, color: "from-slate-600 to-slate-400" },
    { id: "URBANISME", label: t("type.URBANISME"), icon: Building2, color: "from-cyan-600 to-cyan-400" }
  ];

  const getDomaineIcon = (domaine) => {
    const d = domaines.find(d => d.id === domaine);
    if (!d) return Target;
    return d.icon;
  };

  const getDomaineColor = (domaine) => {
    const colors = {
      VOIRIE: "text-green-400",
      ECLAIRAGE: "text-amber-400",
      DECHETS: "text-red-400",
      EAU: "text-blue-400",
      ESPACES_VERTS: "text-emerald-400",
      TRANSPORTS: "text-purple-400",
      SECURITE: "text-slate-400",
      URBANISME: "text-cyan-400"
    };
    return colors[domaine] || "text-white/60";
  };

  // Fonction pour extraire la ville d'une adresse
  const extractCityFromAddress = (address) => {
    if (!address) return null;
    
    const cities = [
      'MAHAJANGA', 'TULEAR', 'TOAMASINA', 'FIANARANTSOA', 'ANTANANARIVO',
      'ANTSIRANANA', 'ANTSIRABE', 'AMBOVOMBE', 'MANAKARA', 'AMBOSITRA',
      'DIEGO', 'NOSY BE', 'MORONDAVA', 'TAOLAGNARO', 'MIANDRIVAZO'
    ];
    
    const upperAddress = address.toUpperCase();
    for (const city of cities) {
      if (upperAddress.includes(city)) {
        return city;
      }
    }
    return null;
  };

  // Récupérer les signalements non assignés
  const fetchSignalements = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8081/api/signalements", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const nonAssignes = data.filter(s => !s.agentId && s.statut !== "RESOLU");
        setSignalements(nonAssignes);
        setFilteredSignalements(nonAssignes);
      }
    } catch (error) {
      console.error("Erreur chargement signalements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les agents avec leur charge de travail
  const fetchAgents = async () => {
    if (!token) return;
    try {
      const response = await fetch("http://localhost:8081/api/users/role/AGENT", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        const agentsWithWorkload = await Promise.all(data.map(async (agent) => {
          try {
            const assignedRes = await fetch(`http://localhost:8081/api/signalements/agent/${agent.id}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            const assignedSignalements = assignedRes.ok ? await assignedRes.json() : [];
            const workload = assignedSignalements.filter(s => s.statut !== "RESOLU" && s.statut !== "TRAITE").length;
            return { ...agent, workload };
          } catch {
            return { ...agent, workload: 0 };
          }
        }));
        
        setAgents(agentsWithWorkload);
      }
    } catch (error) {
      console.error("Erreur chargement agents:", error);
    }
  };

  // Intelligence Artificielle : Suggérer le meilleur agent
  const aiSuggestAgent = async (signalement) => {
    setIsAiProcessing(true);
    
    try {
      const signalementVille = signalement.ville || extractCityFromAddress(signalement.address);
      
      let compatibleAgents = agents.filter(agent => 
        agent.domaine === signalement.type
      );
      
      const agentsWithPriority = compatibleAgents.map(agent => {
        const agentVille = extractCityFromAddress(agent.adresse);
        const sameCity = agentVille === signalementVille;
        const available = agent.workload === 0;
        
        return {
          ...agent,
          sameCity,
          available,
          priorityScore: (sameCity ? 100 : 0) + (available ? 50 : 0) - (agent.workload * 10)
        };
      });
      
      const sortedAgents = agentsWithPriority.sort((a, b) => b.priorityScore - a.priorityScore);
      const suggestions = sortedAgents.slice(0, 5);
      
      setAiSuggestions(suggestions);
      
      if (suggestions.length === 0) {
        showMessage("info", t("admin.noAgentForType"));
      } else {
        const sameCityCount = suggestions.filter(s => s.sameCity).length;
        const availableCount = suggestions.filter(s => s.available).length;
        showMessage("success", `${t("admin.aiFoundPrefix")} ${suggestions.length} ${t("admin.agentsWord")} — ${sameCityCount} ${t("admin.inSameCity")} — ${availableCount} ${t("admin.availableWord")}`);
      }

    } catch (error) {
      console.error("Erreur IA:", error);
      showMessage("error", t("admin.aiError"));
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Assigner un signalement à un agent
  const assignerSignalement = async () => {
    if (!selectedSignalement || !selectedAgent) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8081/api/signalements/${selectedSignalement.id}/assigner`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          agentEmail: selectedAgent.email,
          agentNom: selectedAgent.nom
        })
      });
      
      if (response.ok) {
        showMessage("success", `✅ ${t("admin.assignedTo")} ${selectedAgent.nom}`);
        setShowAssignModal(false);
        setSelectedSignalement(null);
        setSelectedAgent(null);
        fetchSignalements();
        fetchAgents();
      } else {
        const error = await response.text();
        showMessage("error", error || t("admin.assignError"));
      }
    } catch (error) {
      showMessage("error", t("admin.networkError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Ajouter une notification
  const addNotification = (agent, signalement) => {
    const newNotification = {
      id: Date.now(),
      agentId: agent.id,
      agentNom: agent.nom,
      signalementId: signalement.id,
      signalementTitre: signalement.titre,
      message: `Un nouveau signalement "${signalement.titre}" vous a été assigné.`,
      read: false,
      date: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Filtrer les signalements
  useEffect(() => {
    let filtered = [...signalements];
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.quartier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterDomaine !== "TOUS") {
      filtered = filtered.filter(s => s.type === filterDomaine);
    }
    
    setFilteredSignalements(filtered);
  }, [searchTerm, filterDomaine, signalements]);

  useEffect(() => {
    if (userRole !== "ADMIN") {
      showMessage("error", t("admin.adminOnly"));
    } else {
      fetchSignalements();
      fetchAgents();
    }
  }, [token, userRole]);

  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getSignalementAddress = (signalement) => {
    if (signalement.address && signalement.address.length > 5) {
      return signalement.address;
    }
    const parts = [];
    if (signalement.quartier) parts.push(signalement.quartier);
    if (signalement.rue) parts.push(signalement.rue);
    if (signalement.ville) parts.push(signalement.ville);
    if (parts.length > 0) return parts.join(', ');
    return signalement.address || signalement.ville || "Localisation non spécifiée";
  };

  if (userRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 backdrop-blur-xl rounded-2xl p-8 text-center border border-red-500/30">
          <ShieldIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{t("admin.accessDenied")}</h2>
          <p className="text-white/70">{t("admin.adminOnly")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      
      {/* Message Box */}
      {messageBox.show && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-modal-pop">
          <div className={`rounded-xl shadow-2xl max-w-md w-[90vw] sm:w-full ${
            messageBox.type === 'success' ? 'bg-emerald-500/90' : 
            messageBox.type === 'error' ? 'bg-red-500/90' : 'bg-blue-500/90'
          } backdrop-blur-md border border-white/20`}>
            <div className="flex items-center gap-3 p-4">
              {messageBox.type === 'success' && <CheckCircle className="w-5 h-5 text-white" />}
              {messageBox.type === 'error' && <AlertTriangle className="w-5 h-5 text-white" />}
              {messageBox.type === 'info' && <Brain className="w-5 h-5 text-white" />}
              <p className="text-white text-sm flex-1">{messageBox.text}</p>
              <button onClick={() => setMessageBox({ show: false, type: "", text: "" })}>
                <X className="w-4 h-4 text-white/70 hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'assignation */}
      {showAssignModal && selectedSignalement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-slate-900 p-5 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-400" />
                {t("admin.assignAgent")}
              </h3>
              <button onClick={() => { setShowAssignModal(false); setSelectedAgent(null); setAiSuggestions([]); }} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  {(() => {
                    const Icon = getDomaineIcon(selectedSignalement.type);
                    return <Icon className={`w-5 h-5 ${getDomaineColor(selectedSignalement.type)}`} />;
                  })()}
                  <span className={`text-sm font-medium ${getDomaineColor(selectedSignalement.type)}`}>
                    {domaines.find(d => d.id === selectedSignalement.type)?.label || selectedSignalement.type}
                  </span>
                </div>
                <h4 className="text-white font-bold mb-2">{selectedSignalement.titre}</h4>
                <p className="text-white/60 text-sm">{selectedSignalement.description}</p>
                
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-white/40 text-xs flex items-center gap-1 mb-1">
                    <MapPin size={10} />
                    {t("admin.reportAddress")}
                  </p>
                  <p className="text-white/70 text-sm">
                    {getSignalementAddress(selectedSignalement)}
                  </p>
                </div>
              </div>
              
              <div>
                <button
                  onClick={() => aiSuggestAgent(selectedSignalement)}
                  disabled={isAiProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium transition-all"
                >
                  {isAiProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("admin.aiAnalyzing")}
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      {t("admin.suggestWithAI")}
                    </>
                  )}
                </button>
              </div>
              
              {aiSuggestions.length > 0 && (
                <div className="bg-purple-600/20 rounded-xl p-4 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 text-sm font-medium">{t("admin.aiSuggestions")}</span>
                    <span className="text-white/40 text-xs ml-auto">{t("admin.aiPriority")}</span>
                  </div>
                  <div className="space-y-2">
                    {aiSuggestions.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                          selectedAgent?.id === agent.id
                            ? "bg-purple-600/40 border border-purple-400"
                            : "bg-white/5 border border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{agent.nom}</p>
                            {agent.sameCity && (
                              <span className="text-green-400 text-[10px] bg-green-400/20 px-1.5 py-0.5 rounded-full">
                                Même ville
                              </span>
                            )}
                            {agent.available && (
                              <span className="text-emerald-400 text-[10px] bg-emerald-400/20 px-1.5 py-0.5 rounded-full">
                                Disponible
                              </span>
                            )}
                          </div>
                          <p className="text-white/50 text-xs">{agent.email}</p>
                          {agent.adresse && (
                            <p className="text-white/30 text-[10px] flex items-center gap-1 mt-1">
                              <MapPin size={8} />
                              {agent.adresse.length > 40 ? agent.adresse.substring(0, 40) + '...' : agent.adresse}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full bg-white/10 ${getDomaineColor(agent.domaine)}`}>
                              {t(`type.${agent.domaine}`)}
                            </span>
                            {agent.metier && (
                              <span className="text-white/30 text-[10px]">{agent.metier ? t(`met.${agent.metier}.label`) : ""}</span>
                            )}
                            <span className="text-white/30 text-[10px]">
                              {agent.workload} {t("agent.inProgressShort")}
                            </span>
                          </div>
                        </div>
                        {(() => {
                          const Icon = getDomaineIcon(agent.domaine);
                          return <Icon className={`w-4 h-4 ${getDomaineColor(agent.domaine)}`} />;
                        })()}
                        {selectedAgent?.id === agent.id && <Check className="w-5 h-5 text-purple-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-white/70 text-sm mb-2 block flex items-center gap-2">
                  <Users size={14} />
                  {t("admin.allAvailableAgents")}
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {agents.filter(a => a.domaine === selectedSignalement.type).length === 0 ? (
                    <p className="text-white/40 text-center py-4">{t("admin.noAgentForDomain")}</p>
                  ) : (
                    agents.filter(a => a.domaine === selectedSignalement.type).map(agent => {
                      const signalementVille = selectedSignalement.ville || extractCityFromAddress(selectedSignalement.address);
                      const agentVille = extractCityFromAddress(agent.adresse);
                      const sameCity = agentVille === signalementVille;
                      return (
                        <button
                          key={agent.id}
                          onClick={() => setSelectedAgent(agent)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                            selectedAgent?.id === agent.id
                              ? "bg-emerald-600/40 border border-emerald-400"
                              : "bg-white/5 border border-white/20 hover:bg-white/10"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-600/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">{agent.nom}</p>
                              {sameCity && (
                                <span className="text-green-400 text-[10px] bg-green-400/20 px-1.5 py-0.5 rounded-full">
                                  Même ville
                                </span>
                              )}
                            </div>
                            <p className="text-white/40 text-xs">{agent.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full bg-white/10 ${getDomaineColor(agent.domaine)}`}>
                                {t(`type.${agent.domaine}`)}
                              </span>
                              {agent.metier && (
                                <span className="text-white/30 text-[10px]">{agent.metier ? t(`met.${agent.metier}.label`) : ""}</span>
                              )}
                              <span className="text-white/30 text-[10px]">
                                {agent.workload} {t("agent.inProgressShort")}
                              </span>
                            </div>
                          </div>
                          {selectedAgent?.id === agent.id && <Check className="w-5 h-5 text-emerald-400" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-slate-800/95 p-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedAgent(null); setAiSuggestions([]); }}
                className="flex-1 py-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500 transition"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={assignerSignalement}
                disabled={!selectedAgent || isLoading}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t("admin.assign")}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative z-10 container mx-auto max-w-6xl">
        
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">{t("admin.smartAssignment")}</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            {t("admin.aiAssignmentTitle")}
            <Cpu className="w-7 h-7 text-emerald-400" />
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            {t("admin.aiAssignmentSub")}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 rounded-xl p-4 border border-emerald-500/30 text-center">
            <div className="text-2xl font-bold text-emerald-400">{signalements.length}</div>
            <div className="text-white/60 text-sm">{t("admin.pendingReports")}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/20 to-indigo-500/10 rounded-xl p-4 border border-purple-500/30 text-center">
            <div className="text-2xl font-bold text-purple-400">{agents.length}</div>
            <div className="text-white/60 text-sm">{t("admin.availableAgents")}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-500/10 rounded-xl p-4 border border-blue-500/30 text-center">
            <div className="text-2xl font-bold text-blue-400">{domaines.filter(d => d.id !== "TOUS").length}</div>
            <div className="text-white/60 text-sm">{t("admin.expertiseDomains")}</div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder={t("admin.searchToAssign")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-emerald-500"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {domaines.map((domaine) => {
              const Icon = domaine.icon;
              const isSelected = filterDomaine === domaine.id;
              return (
                <button
                  key={domaine.id}
                  onClick={() => setFilterDomaine(domaine.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    isSelected
                      ? `bg-gradient-to-r ${domaine.color || 'from-gray-600 to-gray-500'} text-white shadow-lg`
                      : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm">{domaine.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : filteredSignalements.length === 0 ? (
          <div className="bg-white/10 rounded-2xl p-12 text-center">
            <Target className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70">{t("admin.noReportToAssign")}</p>
            <p className="text-white/40 text-sm mt-2">{t("admin.allAssignedOrResolved")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSignalements.map((signalement) => {
              const DomaineIcon = getDomaineIcon(signalement.type);
              return (
                <div
                  key={signalement.id}
                  className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {signalement.images && signalement.images[0] && (
                    <div className="h-40 overflow-hidden">
                      <img src={signalement.images[0].url} className="w-full h-full object-cover" alt={signalement.titre} />
                    </div>
                  )}
                  
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <DomaineIcon className={`w-5 h-5 ${getDomaineColor(signalement.type)}`} />
                        <span className={`text-xs font-medium ${getDomaineColor(signalement.type)}`}>
                          {t(`type.${signalement.type}`)}
                        </span>
                      </div>
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(signalement.dateCreation)}
                      </span>
                    </div>
                    
                    <h3 className="text-white font-bold line-clamp-1">{signalement.titre}</h3>
                    <p className="text-white/60 text-sm line-clamp-2">{signalement.description}</p>
                    
                    <div className="flex items-start gap-1 text-white/40 text-xs">
                      <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{getSignalementAddress(signalement)}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedSignalement(signalement);
                        setShowAssignModal(true);
                        setSelectedAgent(null);
                        setAiSuggestions([]);
                      }}
                      className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium transition-all flex items-center justify-center gap-2 group"
                    >
                      <Target size={16} />
                      {t("admin.assignToAgent")}
                      <Zap size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes modal-pop {
          0% { transform: scale(0.9) translate(-50%, -20px); opacity: 0; }
          100% { transform: scale(1) translate(-50%, 0); opacity: 1; }
        }
        .animate-modal-pop {
          animation: modal-pop 0.3s ease-out forwards;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.4);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}