import { useEffect, useState } from "react";
import { 
  TrendingUp, TrendingDown, Users, AlertTriangle, 
  CheckCircle, Clock, MapPin, Calendar, Download,
  PlusCircle, UserPlus, Eye, MoreVertical, Search,
  Filter, Loader2, X, ChevronRight, Award, Zap,
  FileText, FileSpreadsheet, FileJson, Printer,
  BarChart3, Activity, UserCheck, Crown, Target,
  Info, AlertCircle, MessageSquare
} from "lucide-react";

import { useNavigate } from "react-router-dom"; 

const MessageBox = ({ message, type, onClose }) => {
  useEffect(() => {
    if (onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  const getIcon = () => {
    switch(type) {
      case 'success': return <CheckCircle size={18} />;
      case 'error': return <AlertCircle size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      default: return <Info size={18} />;
    }
  };

  const getColors = () => {
    switch(type) {
      case 'success': return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
      case 'error': return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'warning': return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
      default: return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
    }
  };

  return (
    <div className={`fixed top-20 right-4 z-50 p-4 rounded-xl border backdrop-blur-xl shadow-2xl animate-slide-in-right ${getColors()}`}>
      <div className="flex items-center gap-3">
        {getIcon()}
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-4 hover:opacity-70">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();

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
  const [signalementsUrgents, setSignalementsUrgents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentsWithStats, setAgentsWithStats] = useState([]);
  const [signalementsParType, setSignalementsParType] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periode, setPeriode] = useState("semaine");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [messageBox, setMessageBox] = useState(null);
  
  const token = localStorage.getItem("token");

  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ nom: "", email: "", password: "" });
  const [isAddingAgent, setIsAddingAgent] = useState(false);

  const getCreationDate = (signalement) => {
    return signalement.dateCreation || signalement.createdAt || signalement.date || new Date().toISOString();
  };

  const getLocalisation = (signalement) => {
    return signalement.ville || signalement.address || signalement.localisation || "Non spécifiée";
  };
  
  const showMessage = (message, type = 'info') => {
    setMessageBox({ message, type });
  };

  const hideMessage = () => {
    setMessageBox(null);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [periode]);

  useEffect(() => {
    if (signalements.length > 0 && agents.length > 0) {
      try {
        const agentStats = {};
        
        signalements.forEach(signalement => {
          if (!signalement) return;
          
          const agentEmail = signalement.agentEmail || 
                            signalement.assignedTo || 
                            signalement.agent?.email ||
                            signalement.assignedAgent?.email;
          
          if (agentEmail && typeof agentEmail === 'string') {
            if (!agentStats[agentEmail]) {
              agentStats[agentEmail] = {
                traites: 0,
                enCours: 0,
                resolus: 0,
                enAttente: 0
              };
            }
            
            const statut = signalement.statut || "";
            if (statut === "RESOLU") {
              agentStats[agentEmail].resolus++;
              agentStats[agentEmail].traites++;
            } else if (statut === "EN_COURS") {
              agentStats[agentEmail].enCours++;
              agentStats[agentEmail].traites++;
            } else if (statut === "EN_ATTENTE") {
              agentStats[agentEmail].enAttente++;
            }
          }
        });
        
        const agentsAvecStats = agents.map(agent => {
          const stats = agentStats[agent.email] || { traites: 0, enCours: 0, resolus: 0, enAttente: 0 };
          return {
            ...agent,
            signalementsTraites: stats.traites,
            signalementsEnCours: stats.enCours,
            signalementsResolus: stats.resolus,
            signalementsEnAttente: stats.enAttente
          };
        });
        
        setAgentsWithStats(agentsAvecStats);
        
        const agentsActifsCount = agentsAvecStats.filter(a => a.signalementsTraites > 0).length;
        setStats(prev => ({ 
          ...prev, 
          agentsActifs: agentsActifsCount || agents.length 
        }));
      } catch (error) {
        console.error("❌ Erreur calcul stats agents:", error);
      }
    }
  }, [signalements, agents]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Chargement des données du dashboard...");
      
      const signalementsRes = await fetch("http://localhost:8081/api/signalements", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (signalementsRes.ok) {
        const data = await signalementsRes.json();
        console.log(`📋 ${data.length} signalements récupérés`);
        
        setSignalements(data);
        
        const total = data.length;
        const enAttente = data.filter(s => s?.statut === "EN_ATTENTE").length;
        const enCours = data.filter(s => s?.statut === "EN_COURS").length;
        const resolus = data.filter(s => s?.statut === "RESOLU").length;
        const tauxResolution = total > 0 ? Math.round((resolus / total) * 100) : 0;
        
        setStats(prev => ({
          ...prev,
          total,
          enAttente,
          enCours,
          resolus,
          tauxResolution,
          tempsMoyen: 2.5,
          agentsActifs: prev.agentsActifs
        }));
        
        const tousLesSignalementsRecents = [...data]
          .sort((a, b) => {
            const dateA = new Date(getCreationDate(a));
            const dateB = new Date(getCreationDate(b));
            return dateB - dateA;
          })
          .slice(0, 10);
        
        setDerniersSignalements(tousLesSignalementsRecents);
        
        const urgents = data.filter(s => {
          const statut = s?.statut || "";
          return statut === "EN_ATTENTE" || statut === "NOUVEAU" || statut === "URGENT";
        });
        
        if (urgents.length > 0) {
          showMessage(`${urgents.length} signalement(s) urgent(s) à traiter`, 'warning');
        }
        
        setSignalementsUrgents(urgents);
        
        const typesCount = {};
        data.forEach(s => {
          const type = s?.type || "Autre";
          typesCount[type] = (typesCount[type] || 0) + 1;
        });
        setSignalementsParType(Object.entries(typesCount).map(([name, value]) => ({ name, value })));
      } else {
        console.error("❌ Erreur récupération signalements:", signalementsRes.status);
        showMessage("Impossible de récupérer les signalements", 'error');
      }
      
      const agentsRes = await fetch("http://localhost:8081/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (agentsRes.ok) {
        const allUsers = await agentsRes.json();
        const agentsList = allUsers.filter(user => user?.role === "AGENT");
        setAgents(agentsList);
        console.log(`👥 ${agentsList.length} agents récupérés`);
      } else {
        console.error("❌ Erreur récupération agents:", agentsRes.status);
      }
      
    } catch (error) {
      console.error("❌ Erreur chargement dashboard:", error);
      showMessage("Erreur lors du chargement des données", 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ⭐ EXPORT WORD (format DOC)
  const exportToWord = () => {
    let html = `
      <html>
      <head><meta charset="UTF-8"><title>Export Word - SmartCity</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; }
        th { background: #4CAF50; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        .stat-card { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 10px; }
        .footer { margin-top: 50px; text-align: center; color: #95a5a6; font-size: 12px; }
      </style>
      </head>
      <body>
        <h1>SmartCity - Rapport des signalements</h1>
        <p>Exporté le ${new Date().toLocaleString()}</p>
        <p>Période: ${periode === "semaine" ? "Cette semaine" : periode === "mois" ? "Ce mois" : "Cette année"}</p>
        
        <h2>Statistiques</h2>
        <div class="stat-card"><strong>Total signalements:</strong> ${stats.total}</div>
        <div class="stat-card"><strong>En attente:</strong> ${stats.enAttente}</div>
        <div class="stat-card"><strong>En cours:</strong> ${stats.enCours}</div>
        <div class="stat-card"><strong>Résolus:</strong> ${stats.resolus}</div>
        <div class="stat-card"><strong>Taux de résolution:</strong> ${stats.tauxResolution}%</div>
        
        <h2>Liste des signalements</h2>
        <table border="1">
          <thead>
            <tr><th>ID</th><th>Titre</th><th>Type</th><th>Statut</th><th>Localisation</th><th>Date</th></tr>
          </thead>
          <tbody>
    `;
    
    signalements.forEach(s => {
      html += `<tr>
        <td>${s.id}</td>
        <td>${s.titre || "-"}</td>
        <td>${s.type || "-"}</td>
        <td>${getStatusLabel(s.statut)}</td>
        <td>${s.ville || s.address || "-"}</td>
        <td>${new Date(s.dateCreation).toLocaleDateString()}</td>
      </tr>`;
    });
    
    html += `
          </tbody>
        </table>
        <div class="footer">
          <p>Rapport généré automatiquement par SmartCity Platform</p>
          <p>© ${new Date().getFullYear()} SmartCity - Tous droits réservés</p>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: "application/msword" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `signalements_${new Date().toISOString().split("T")[0]}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showMessage("Export Word réussi", 'success');
  };

  const exportToExcel = () => {
    let html = `
      <html>
      <head><meta charset="UTF-8"><title>Export Signalements SmartCity</title>
      <style>
        th { background: #4CAF50; color: white; padding: 8px; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        table { border-collapse: collapse; width: 100%; }
      </style>
      </head>
      <body>
        <h1>SmartCity - Rapport des signalements</h1>
        <p>Date d'export: ${new Date().toLocaleString()}</p>
        <p>Période: ${periode === "semaine" ? "Cette semaine" : periode === "mois" ? "Ce mois" : "Cette année"}</p>
        <h2>Statistiques</h2>
        <table border="1">
          <tr><th>Total signalements</th><td>${stats.total}</tr>
          <tr><th>En attente</th><td>${stats.enAttente}</tr>
          <tr><th>En cours</th><td>${stats.enCours}</tr>
          <tr><th>Résolus</th><td>${stats.resolus}</tr>
          <tr><th>Taux de résolution</th><td>${stats.tauxResolution}%</tr>
        </table>
        <h2>Liste des signalements</h2>
        <table border="1">
          <thead><tr><th>ID</th><th>Titre</th><th>Type</th><th>Statut</th><th>Localisation</th><th>Date</th></tr></thead>
          <tbody>
    `;
    
    signalements.forEach(s => {
      html += `<tr>
        <td>${s.id}</td>
        <td>${s.titre || "-"}</td>
        <td>${s.type || "-"}</td>
        <td>${getStatusLabel(s.statut)}</td>
        <td>${s.ville || s.address || "-"}</td>
        <td>${new Date(s.dateCreation).toLocaleDateString()}</td>
      </tr>`;
    });
    
    html += `</tbody>}</table></body></html>`;
    
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `signalements_${new Date().toISOString().split("T")[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showMessage("Export Excel réussi", 'success');
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head><title>SmartCity - Rapport</title>
      <style>
        body { font-family: Arial; margin: 40px; }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #4CAF50; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        .stat-card { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 10px; }
        .footer { margin-top: 50px; text-align: center; color: #95a5a6; font-size: 12px; }
      </style>
      </head>
      <body>
        <h1>SmartCity - Rapport des signalements</h1>
        <p>Exporté le ${new Date().toLocaleString()}</p>
        
        <h2>Statistiques</h2>
        <div class="stat-card"><strong>Total:</strong> ${stats.total}</div>
        <div class="stat-card"><strong>En attente:</strong> ${stats.enAttente}</div>
        <div class="stat-card"><strong>En cours:</strong> ${stats.enCours}</div>
        <div class="stat-card"><strong>Résolus:</strong> ${stats.resolus}</div>
        <div class="stat-card"><strong>Taux de résolution:</strong> ${stats.tauxResolution}%</div>
        
        <h2>Liste des signalements</h2>
        <table border="1">
          <thead>
            <tr><th>ID</th><th>Titre</th><th>Type</th><th>Statut</th><th>Localisation</th><th>Date</th></tr>
          </thead>
          <tbody>
    `);
    
    signalements.slice(0, 20).forEach(s => {
      printWindow.document.write(`
        <tr>
          <td>${s.id}</td>
          <td>${s.titre || "-"}</td>
          <td>${s.type || "-"}</td>
          <td>${getStatusLabel(s.statut)}</td>
          <td>${s.ville || s.address || "-"}</td>
          <td>${new Date(s.dateCreation).toLocaleDateString()}</td>
        </tr>
      `);
    });
    
    printWindow.document.write(`
          </tbody>
        </table>
        <div class="footer">
          <p>Rapport généré automatiquement par SmartCity Platform</p>
          <p>© ${new Date().getFullYear()} SmartCity - Tous droits réservés</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    showMessage("Export PDF réussi", 'success');
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      switch (exportFormat) {
        case "excel": exportToExcel(); break;
        case "word": exportToWord(); break;
        case "pdf": exportToPDF(); break;
        default: exportToExcel();
      }
      setIsExporting(false);
      setShowExportModal(false);
    }, 500);
  };

  const getStatusColor = (statut) => {
    const colors = {
      'EN_ATTENTE': 'bg-amber-500/20 text-amber-400',
      'NOUVEAU': 'bg-red-500/20 text-red-400',
      'URGENT': 'bg-red-500/20 text-red-400',
      'EN_COURS': 'bg-blue-500/20 text-blue-400',
      'RESOLU': 'bg-emerald-500/20 text-emerald-400'
    };
    return colors[statut] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (statut) => {
    const labels = {
      'NOUVEAU': 'Nouveau',
      'URGENT': 'Urgent',
      'EN_ATTENTE': 'En attente',
      'EN_COURS': 'En cours',
      'RESOLU': 'Résolu'
    };
    return labels[statut] || statut;
  };

  const openAssignModal = (signalement) => {
    setSelectedSignalement(signalement);
    setSelectedAgent("");
    setShowAssignModal(true);
  };

  const assignerSignalement = async () => {
    if (!selectedAgent) {
      showMessage("Veuillez sélectionner un agent", 'warning');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch(`http://localhost:8081/api/signalements/${selectedSignalement.id}/assigner`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          agentEmail: selectedAgent,
          agentId: agents.find(a => a.email === selectedAgent)?.id
        })
      });

      if (response.ok) {
        const agentNom = agents.find(a => a.email === selectedAgent)?.nom;
        showMessage(`Signalement assigné à ${agentNom}`, 'success');
        setShowAssignModal(false);
        fetchDashboardData();
      } else {
        const error = await response.json();
        showMessage(error.error || "Impossible d'assigner", 'error');
      }
    } catch (error) {
      console.error("Erreur assignation:", error);
      showMessage("Erreur réseau lors de l'assignation", 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const addAgent = async () => {
    if (!newAgent.nom || !newAgent.email || !newAgent.password) {
      showMessage("Veuillez remplir tous les champs", 'warning');
      return;
    }

    if (!newAgent.email.toLowerCase().endsWith("@gmail.com")) {
      showMessage("L'email doit être une adresse @gmail.com", 'warning');
      return;
    }

    if (newAgent.password.length < 6) {
      showMessage("Le mot de passe doit contenir au moins 6 caractères", 'warning');
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
          motDePasse: newAgent.password,
          role: "AGENT"
        })
      });

      if (response.ok) {
        showMessage(`Agent ${newAgent.nom} ajouté avec succès`, 'success');
        setShowAddAgentModal(false);
        setNewAgent({ nom: "", email: "", password: "" });
        fetchDashboardData();
      } else {
        let errorMessage = "Erreur lors de l'ajout";
        try {
          const errorText = await response.text();
          errorMessage = errorText || `Erreur ${response.status}`;
        } catch (e) {
          errorMessage = `Erreur ${response.status}: ${response.statusText}`;
        }
        showMessage(errorMessage, 'error');
      }
    } catch (error) {
      console.error("❌ Erreur réseau:", error);
      showMessage("Erreur réseau lors de l'ajout. Vérifiez que le serveur est démarré.", 'error');
    } finally {
      setIsAddingAgent(false);
    }
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
      {/* MessageBox */}
      {messageBox && (
        <MessageBox 
          message={messageBox.message} 
          type={messageBox.type} 
          onClose={hideMessage} 
        />
      )}

      <div className="max-w-7xl mx-auto">
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Activity className="w-8 h-8 text-emerald-400" />
              Tableau de bord
            </h1>
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

        {/* MODAL D'EXPORTATION - UNIQUEMENT PDF, WORD, EXCEL */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1e1f22] rounded-2xl max-w-md w-full p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Download size={20} className="text-emerald-400" />
                  Exporter les données
                </h3>
                <button onClick={() => setShowExportModal(false)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-white/60 text-sm mb-6">
                Choisissez le format d'exportation pour télécharger les signalements.
              </p>
              
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition">
                  <input type="radio" name="exportFormat" value="excel" checked={exportFormat === "excel"} onChange={(e) => setExportFormat(e.target.value)} className="w-4 h-4 text-emerald-500" />
                  <FileSpreadsheet size={20} className="text-green-400" />
                  <div><p className="text-white font-medium">Excel (XLS)</p><p className="text-white/40 text-xs">Microsoft Excel</p></div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition">
                  <input type="radio" name="exportFormat" value="word" checked={exportFormat === "word"} onChange={(e) => setExportFormat(e.target.value)} className="w-4 h-4 text-emerald-500" />
                  <FileText size={20} className="text-blue-400" />
                  <div><p className="text-white font-medium">Word (DOC)</p><p className="text-white/40 text-xs">Microsoft Word</p></div>
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

        {/* Cartes KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/50 text-sm">Total signalements</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-xl"><BarChart3 className="text-blue-400" size={24} /></div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/50 text-sm">En attente</p>
                <p className="text-3xl font-bold text-amber-300 mt-1">{stats.enAttente}</p>
              </div>
              <div className="bg-amber-500/20 p-3 rounded-xl"><Clock className="text-amber-400" size={24} /></div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/50 text-sm">Taux de résolution</p>
                <p className="text-3xl font-bold text-emerald-300 mt-1">{stats.tauxResolution}%</p>
              </div>
              <div className="bg-emerald-500/20 p-3 rounded-xl"><Target className="text-emerald-400" size={24} /></div>
            </div>
            <div className="mt-3"><div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.tauxResolution}%` }} /></div></div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/50 text-sm">Agents actifs</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.agentsActifs}</p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-xl"><UserCheck className="text-purple-400" size={24} /></div>
            </div>
          </div>
        </div>

        {/* Graphiques et tableaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 lg:col-span-1">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-400" />
              Par type de problème
            </h3>
            <div className="space-y-3">
              {signalementsParType.map((type, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-white/70">{type.name}</span><span className="text-white">{type.value}</span></div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${(type.value / stats.total) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION SIGNALEMENTS URGENTS - SANS BOUTON ASSIGNER */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 lg:col-span-1">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Signalements urgents
              {signalementsUrgents.length > 0 && (
                <span className="bg-red-500/30 text-red-400 text-xs px-2 py-0.5 rounded-full ml-2">
                  {signalementsUrgents.length}
                </span>
              )}
            </h3>
            
            {signalementsUrgents.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-500/30 mx-auto mb-2" />
                <p className="text-white/50 text-sm">Aucun signalement urgent</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {signalementsUrgents.map((signalement) => (
                  <div key={signalement.id} className="p-3 bg-red-500/10 rounded-xl border border-red-500/30 hover:bg-red-500/20 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{signalement.titre || "Sans titre"}</p>
                        <p className="text-white/50 text-xs mt-1 line-clamp-2">{signalement.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-red-400 text-xs flex items-center gap-1">
                            <AlertTriangle size={12} />
                            {getStatusLabel(signalement.statut)}
                          </span>
                          <span className="text-white/40 text-xs">
                            {new Date(signalement.dateCreation).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {/* ⭐ BOUTON ASSIGNER SUPPRIMÉ */}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {signalementsUrgents.length > 0 && (
              <button 
                onClick={() => navigate("/admin/signalement")}
                className="w-full mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition"
              >
                <Eye size={16} />
                Voir tous les signalements urgents
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Derniers signalements */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Activity size={18} className="text-blue-400" />
              Derniers signalements
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-white/50 text-sm">Titre</th>
                  <th className="text-left p-4 text-white/50 text-sm">Type</th>
                  <th className="text-left p-4 text-white/50 text-sm">Localisation</th>
                  <th className="text-left p-4 text-white/50 text-sm">Statut</th>
                  <th className="text-left p-4 text-white/50 text-sm">Date</th>
                </tr>
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

      {/* MODAL D'ASSIGNATION DES SIGNALEMENTS (gardé mais accessible ailleurs) */}
      {showAssignModal && selectedSignalement && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e1f22] rounded-2xl w-full max-w-md p-6 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus size={20} className="text-emerald-400" />
                Assigner un agent
              </h3>
              <button 
                onClick={() => setShowAssignModal(false)} 
                className="text-white/50 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-white/5 rounded-xl">
              <p className="text-white/60 text-sm mb-1">Signalement :</p>
              <p className="text-white font-medium">{selectedSignalement.titre || "Sans titre"}</p>
              <p className="text-white/40 text-sm mt-1 line-clamp-2">{selectedSignalement.description}</p>
            </div>

            <div className="mb-6">
              <label className="text-white/70 text-sm block mb-2">Choisir un agent :</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="" className="bg-slate-800">-- Sélectionner un agent --</option>
                {agents.filter(a => a.role === "AGENT").map((agent) => (
                  <option key={agent.id} value={agent.email} className="bg-slate-800">
                    {agent.nom} ({agent.email}) - {agent.signalementsTraites || 0} signalements traités
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl transition"
              >
                Annuler
              </button>
              <button
                onClick={assignerSignalement}
                disabled={isAssigning || !selectedAgent}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                {isAssigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                {isAssigning ? "Assignation..." : "Assigner"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>

      {/* MODAL D'AJOUT D'AGENT */}
      {showAddAgentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e1f22] rounded-2xl w-full max-w-md p-6 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus size={20} className="text-emerald-400" />
                Ajouter un agent
              </h3>
              <button 
                onClick={() => setShowAddAgentModal(false)} 
                className="text-white/50 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-white/70 text-sm block mb-2">Nom complet</label>
                <input
                  type="text"
                  value={newAgent.nom}
                  onChange={(e) => setNewAgent({ ...newAgent, nom: e.target.value })}
                  placeholder="Jean Dupont"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              
              <div>
                <label className="text-white/70 text-sm block mb-2">Email</label>
                <input
                  type="email"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                  placeholder="agent@smartcity.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              
              <div>
                <label className="text-white/70 text-sm block mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={newAgent.password}
                  onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddAgentModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl transition"
              >
                Annuler
              </button>
              <button
                onClick={addAgent}
                disabled={isAddingAgent}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                {isAddingAgent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                {isAddingAgent ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}