import { useEffect, useState } from "react";
import { 
  TrendingUp, TrendingDown, Users, AlertTriangle, 
  CheckCircle, Clock, MapPin, Calendar, Download,
  PlusCircle, UserPlus, Eye, MoreVertical, Search,
  Filter, Loader2, X, ChevronRight, Award, Zap,
  FileText, FileSpreadsheet, FileJson, Printer, Mail, Phone,
  UserCheck
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    enCours: 0,
    resolus: 0,
    agentsActifs: 0,
    tauxResolution: 0,
    tempsMoyen: 0
  });
  
  const [signalements, setSignalements] = useState([]);
  const [derniersSignalements, setDerniersSignalements] = useState([]);
  const [agents, setAgents] = useState([]);
  const [signalementsParType, setSignalementsParType] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periode, setPeriode] = useState("semaine");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [isExporting, setIsExporting] = useState(false);
  
  // États pour le modal d'ajout d'agent
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [newAgent, setNewAgent] = useState({
    nom: "",
    email: "",
    motDePasse: "",
    role: "AGENT"
  });
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  
  // États pour la MessageBox de confirmation
  const [messageBox, setMessageBox] = useState({
    show: false,
    type: "success",
    title: "",
    message: ""
  });
  
  // États pour l'assignation d'agent
  const [showAssignAgentModal, setShowAssignAgentModal] = useState(false);
  const [selectedUrgentSignalement, setSelectedUrgentSignalement] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  
  const token = localStorage.getItem("token");

  const showMessage = (type, title, message) => {
    setMessageBox({ show: true, type, title, message });
    setTimeout(() => {
      setMessageBox(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [periode]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const signalementsRes = await fetch("http://localhost:8081/api/signalements", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      let signalementsData = [];
      if (signalementsRes.ok) {
        signalementsData = await signalementsRes.json();
        setSignalements(signalementsData);
        
        const total = signalementsData.length;
        const enAttente = signalementsData.filter(s => s.statut === "EN_ATTENTE").length;
        const enCours = signalementsData.filter(s => s.statut === "EN_COURS").length;
        const resolus = signalementsData.filter(s => s.statut === "RESOLU").length;
        const tauxResolution = total > 0 ? Math.round((resolus / total) * 100) : 0;
        
        setStats({
          total,
          enAttente,
          enCours,
          resolus,
          tauxResolution,
          agentsActifs: 0,
          tempsMoyen: 2.5
        });
        
        setDerniersSignalements(signalementsData.slice(0, 5));
        
        const typesCount = {};
        signalementsData.forEach(s => {
          const type = s.type || "Autre";
          typesCount[type] = (typesCount[type] || 0) + 1;
        });
        setSignalementsParType(Object.entries(typesCount).map(([name, value]) => ({ name, value })));
      }
      
      const agentsRes = await fetch("http://localhost:8081/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (agentsRes.ok) {
        const allUsers = await agentsRes.json();
        const agentsList = allUsers.filter(user => user.role === "AGENT");
        
        const assignationsMock = [
          { signalement_id: 1, agent_id: 3 },
          { signalement_id: 3, agent_id: 3 }
        ];
        
        const agentsWithCount = agentsList.map(agent => {
          const agentAssignations = assignationsMock.filter(a => a.agent_id === agent.id);
          const assignedSignalementIds = agentAssignations.map(a => a.signalement_id);
          const signalementsTraites = signalementsData.filter(s => 
            assignedSignalementIds.includes(s.id) && s.statut === "RESOLU"
          ).length;
          return { ...agent, signalementsTraites };
        });
        
        setAgents(agentsWithCount);
        setStats(prev => ({ ...prev, agentsActifs: agentsWithCount.length }));
      }
      
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
      showMessage("error", "Erreur", "Impossible de charger les données");
    } finally {
      setIsLoading(false);
    }
  };

  // Ajouter un agent avec message de confirmation
  const handleAddAgent = async () => {
    if (!newAgent.nom || !newAgent.email || !newAgent.motDePasse) {
      showMessage("error", "Champs manquants", "Veuillez remplir tous les champs obligatoires (Nom, Email, Mot de passe)");
      return;
    }

    setIsAddingAgent(true);
    try {
      const response = await fetch("http://localhost:8081/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nom: newAgent.nom,
          email: newAgent.email,
          motDePasse: newAgent.motDePasse,
          role: "AGENT"
        })
      });

      if (response.ok) {
        showMessage("success", "Succès !", `L'agent ${newAgent.nom} a été ajouté avec succès`);
        setShowAddAgentModal(false);
        setNewAgent({ nom: "", email: "", motDePasse: "", role: "AGENT" });
        fetchDashboardData();
      } else {
        const error = await response.text();
        showMessage("error", "Erreur", error || "Impossible d'ajouter l'agent");
      }
    } catch (error) {
      console.error("Erreur ajout agent:", error);
      showMessage("error", "Erreur réseau", "Impossible de contacter le serveur");
    } finally {
      setIsAddingAgent(false);
    }
  };

  // 🔥 Fonction pour assigner un signalement à un agent (sans endpoint /api/assignations)
  const handleAssignToAgent = async () => {
    if (!selectedAgentId) {
      showMessage("error", "Sélection requise", "Veuillez sélectionner un agent");
      return;
    }

    setIsAssigning(true);
    try {
      // Au lieu d'utiliser /api/assignations, on met directement à jour le statut du signalement
      // et on stocke l'assignation dans localStorage pour le moment
      const agentNom = agents.find(a => a.id === parseInt(selectedAgentId))?.nom || "Agent";
      
      // 1. Mettre à jour le statut du signalement à "EN_COURS" (pris en charge)
      const updateResponse = await fetch(`http://localhost:8081/api/signalements/${selectedUrgentSignalement?.id}/statut`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ statut: "EN_COURS" })
      });

      if (updateResponse.ok) {
        // 2. Stocker l'assignation dans localStorage (solution temporaire)
        const assignments = JSON.parse(localStorage.getItem("assignments") || "[]");
        assignments.push({
          signalement_id: selectedUrgentSignalement?.id,
          agent_id: parseInt(selectedAgentId),
          agent_nom: agentNom,
          date_assignation: new Date().toISOString(),
          titre: selectedUrgentSignalement?.titre
        });
        localStorage.setItem("assignments", JSON.stringify(assignments));
        
        showMessage("success", "Assignation réussie !", `Le signalement "${selectedUrgentSignalement?.titre}" a été assigné à ${agentNom}`);
        setShowAssignAgentModal(false);
        setSelectedUrgentSignalement(null);
        setSelectedAgentId("");
        fetchDashboardData(); // Rafraîchir les données
      } else {
        const error = await updateResponse.text();
        showMessage("error", "Erreur", error || "Impossible d'assigner le signalement");
      }
    } catch (error) {
      console.error("Erreur assignation:", error);
      showMessage("error", "Erreur réseau", "Impossible de contacter le serveur");
    } finally {
      setIsAssigning(false);
    }
  };

  const openAssignModal = (signalement) => {
    setSelectedUrgentSignalement(signalement);
    setSelectedAgentId("");
    setShowAssignAgentModal(true);
  };

  const getStatusColor = (statut) => {
    const colors = {
      'EN_ATTENTE': 'bg-amber-500/20 text-amber-400',
      'EN_COURS': 'bg-blue-500/20 text-blue-400',
      'RESOLU': 'bg-emerald-500/20 text-emerald-400'
    };
    return colors[statut] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      'EN_ATTENTE': 'En attente',
      'EN_COURS': 'En cours',
      'RESOLU': 'Résolu'
    };
    return labels[statut] || statut;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* MESSAGE BOX DE CONFIRMATION */}
        {messageBox.show && (
          <div className="fixed top-4 right-4 z-[200] animate-slide-in-right">
            <div className={`rounded-xl shadow-2xl p-4 min-w-[300px] max-w-md flex items-start gap-3 ${
              messageBox.type === "success" ? "bg-emerald-500 text-white" :
              messageBox.type === "error" ? "bg-red-500 text-white" : "bg-blue-500 text-white"
            }`}>
              <div className="flex-shrink-0">
                {messageBox.type === "success" && <CheckCircle size={20} />}
                {messageBox.type === "error" && <AlertTriangle size={20} />}
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

        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">📊 Tableau de bord</h1>
            <p className="text-white/50 mt-1">Vue d'ensemble de la plateforme SmartCity</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowExportModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Download size={18} />
              Exporter
            </button>
          </div>
        </div>

        {/* Modal d'exportation */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1e1f22] rounded-2xl max-w-md w-full p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">📥 Exporter les données</h3>
                <button onClick={() => setShowExportModal(false)} className="text-white/50 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition">
                  <input type="radio" name="exportFormat" value="csv" checked={exportFormat === "csv"} onChange={(e) => setExportFormat(e.target.value)} className="w-4 h-4 text-emerald-500" />
                  <FileText size={20} className="text-green-400" />
                  <div><p className="text-white font-medium">CSV</p><p className="text-white/40 text-xs">Compatible Excel</p></div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition">
                  <input type="radio" name="exportFormat" value="excel" checked={exportFormat === "excel"} onChange={(e) => setExportFormat(e.target.value)} className="w-4 h-4 text-emerald-500" />
                  <FileSpreadsheet size={20} className="text-green-400" />
                  <div><p className="text-white font-medium">Excel (XLS)</p><p className="text-white/40 text-xs">Microsoft Excel</p></div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition">
                  <input type="radio" name="exportFormat" value="json" checked={exportFormat === "json"} onChange={(e) => setExportFormat(e.target.value)} className="w-4 h-4 text-emerald-500" />
                  <FileJson size={20} className="text-yellow-400" />
                  <div><p className="text-white font-medium">JSON</p><p className="text-white/40 text-xs">Pour développeurs</p></div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition">
                  <input type="radio" name="exportFormat" value="pdf" checked={exportFormat === "pdf"} onChange={(e) => setExportFormat(e.target.value)} className="w-4 h-4 text-emerald-500" />
                  <Printer size={20} className="text-red-400" />
                  <div><p className="text-white font-medium">PDF / Impression</p><p className="text-white/40 text-xs">Aperçu avant impression</p></div>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowExportModal(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg">Annuler</button>
                <button onClick={handleExport} disabled={isExporting} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg flex items-center justify-center gap-2">
                  {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  {isExporting ? "Export..." : "Exporter"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL D'AJOUT D'AGENT */}
        {showAddAgentModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1e1f22] rounded-2xl max-w-md w-full p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">👤 Ajouter un agent</h3>
                <button onClick={() => setShowAddAgentModal(false)} className="text-white/50 hover:text-white"><X size={20} /></button>
              </div>
              
              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Nom complet *"
                  value={newAgent.nom}
                  onChange={(e) => setNewAgent({ ...newAgent, nom: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="password"
                  placeholder="Mot de passe *"
                  value={newAgent.motDePasse}
                  onChange={(e) => setNewAgent({ ...newAgent, motDePasse: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                />
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setShowAddAgentModal(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg">Annuler</button>
                <button onClick={handleAddAgent} disabled={isAddingAgent} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg flex items-center justify-center gap-2">
                  {isAddingAgent ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  {isAddingAgent ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 MODAL D'ASSIGNATION D'AGENT */}
        {showAssignAgentModal && selectedUrgentSignalement && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1e1f22] rounded-2xl max-w-md w-full p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">📋 Assigner un agent</h3>
                <button onClick={() => setShowAssignAgentModal(false)} className="text-white/50 hover:text-white"><X size={20} /></button>
              </div>
              
              <div className="mb-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <p className="text-amber-300 text-sm font-medium">Signalement urgent</p>
                <p className="text-white text-sm mt-1">{selectedUrgentSignalement.titre || "Sans titre"}</p>
                <p className="text-white/50 text-xs mt-1 line-clamp-2">{selectedUrgentSignalement.description}</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-white/70 text-sm mb-2">Choisir un agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Sélectionner un agent --</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.nom} - {agent.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setShowAssignAgentModal(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg">Annuler</button>
                <button onClick={handleAssignToAgent} disabled={isAssigning} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg flex items-center justify-center gap-2">
                  {isAssigning ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
                  {isAssigning ? "Assignation..." : "Assigner"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cartes KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div><p className="text-white/50 text-sm">Total signalements</p><p className="text-3xl font-bold text-white mt-1">{stats.total}</p></div>
              <div className="bg-blue-500/20 p-3 rounded-xl"><MapPin className="text-blue-400" size={24} /></div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div><p className="text-white/50 text-sm">En attente</p><p className="text-3xl font-bold text-amber-300 mt-1">{stats.enAttente}</p></div>
              <div className="bg-amber-500/20 p-3 rounded-xl"><Clock className="text-amber-400" size={24} /></div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div><p className="text-white/50 text-sm">Taux de résolution</p><p className="text-3xl font-bold text-emerald-300 mt-1">{stats.tauxResolution}%</p></div>
              <div className="bg-emerald-500/20 p-3 rounded-xl"><CheckCircle className="text-emerald-400" size={24} /></div>
            </div>
            <div className="mt-3"><div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.tauxResolution}%` }} /></div></div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div><p className="text-white/50 text-sm">Agents</p><p className="text-3xl font-bold text-white mt-1">{agents.length}</p></div>
              <div className="bg-purple-500/20 p-3 rounded-xl"><Users className="text-purple-400" size={24} /></div>
            </div>
          </div>
        </div>

        {/* Graphiques et tableaux */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 lg:col-span-1">
            <h3 className="text-white font-semibold mb-4">📊 Par type de problème</h3>
            <div className="space-y-3">
              {signalementsParType.map((type, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-white/70">{type.name}</span><span className="text-white">{type.value}</span></div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${(type.value / stats.total) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 lg:col-span-1">
            <h3 className="text-white font-semibold mb-4">🏆 Top agents</h3>
            <div className="space-y-3">
              {agents.sort((a,b) => (b.signalementsTraites || 0) - (a.signalementsTraites || 0)).slice(0, 3).map((agent, index) => (
                <div key={agent.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">{index + 1}</div>
                  <div className="flex-1"><p className="text-white font-medium text-sm">{agent.nom}</p><p className="text-white/40 text-xs">{agent.email}</p></div>
                  <div className="text-right"><p className="text-white font-bold">{agent.signalementsTraites || 0}</p><p className="text-white/40 text-xs">traités</p></div>
                </div>
              ))}
              {agents.length === 0 && <p className="text-white/40 text-center py-4">Aucun agent</p>}
            </div>
            <button 
              onClick={() => setShowAddAgentModal(true)}
              className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition"
            >
              <UserPlus size={16} /> Ajouter un agent
            </button>
          </div>

          {/* 🔥 Signalements urgents avec lien Assigner */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 lg:col-span-1">
            <h3 className="text-white font-semibold mb-4">⚠️ Signalements urgents</h3>
            <div className="space-y-3">
              {signalements.filter(s => s.statut === "EN_ATTENTE").slice(0, 3).map((signalement) => (
                <div key={signalement.id} className="p-3 bg-red-500/10 rounded-xl border border-red-500/30">
                  <p className="text-white font-medium text-sm">{signalement.titre || "Sans titre"}</p>
                  <p className="text-white/50 text-xs mt-1 line-clamp-2">{signalement.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-red-400 text-xs">⚠️ En attente</span>
                    <button 
                      onClick={() => openAssignModal(signalement)}
                      className="text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1 transition"
                    >
                      <UserCheck size={12} />
                      Assigner →
                    </button>
                  </div>
                </div>
              ))}
              {signalements.filter(s => s.statut === "EN_ATTENTE").length === 0 && (
                <p className="text-white/40 text-center py-4">Aucun signalement urgent</p>
              )}
            </div>
          </div>
        </div>

        {/* Derniers signalements */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-white font-semibold">📋 Derniers signalements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr><th className="text-left p-4 text-white/50 text-sm">Titre</th><th className="text-left p-4 text-white/50 text-sm">Type</th><th className="text-left p-4 text-white/50 text-sm">Localisation</th><th className="text-left p-4 text-white/50 text-sm">Statut</th><th className="text-left p-4 text-white/50 text-sm">Date</th></tr>
              </thead>
              <tbody>
                {derniersSignalements.map((signalement) => (
                  <tr key={signalement.id} className="border-t border-white/5 hover:bg-white/5 transition">
                    <td className="p-4 text-white">{signalement.titre || "Sans titre"}</td>
                    <td className="p-4 text-white/70">{signalement.type || "Non défini"}</td>
                    <td className="p-4 text-white/70">{signalement.ville || "Non spécifiée"}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(signalement.statut)}`}>{getStatusLabel(signalement.statut)}</span></td>
                    <td className="p-4 text-white/50 text-sm">{new Date(signalement.dateCreation).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Animation CSS */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}