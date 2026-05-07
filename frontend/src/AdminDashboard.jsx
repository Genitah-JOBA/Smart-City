import { useEffect, useState } from "react";
import { 
  TrendingUp, TrendingDown, Users, AlertTriangle, 
  CheckCircle, Clock, MapPin, Calendar, Download,
  PlusCircle, UserPlus, Eye, MoreVertical, Search,
  Filter, Loader2, X, ChevronRight, Award, Zap,
  FileText, FileSpreadsheet, FileJson, Printer
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
  const [agentsWithStats, setAgentsWithStats] = useState([]);
  const [signalementsParType, setSignalementsParType] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periode, setPeriode] = useState("semaine");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDashboardData();
  }, [periode]);

  // ✅ VERSION AMÉLIORÉE - Calcul des stats des agents
  useEffect(() => {
    if (signalements.length > 0 && agents.length > 0) {
      // Compter les signalements par agent
      const agentStats = {};
      
      signalements.forEach(signalement => {
        // 🔥 Vérifier plusieurs possibilités pour l'agent
        const agentEmail = signalement.agentEmail || 
                          signalement.assignedTo || 
                          signalement.agent?.email ||
                          signalement.assignedAgent?.email;
        
        // Afficher pour déboguer
        if (signalement.statut === "EN_COURS" || signalement.statut === "RESOLU") {
          console.log(`Signalement ${signalement.id} - Statut: ${signalement.statut} - Agent: ${agentEmail}`);
        }
        
        if (agentEmail) {
          if (!agentStats[agentEmail]) {
            agentStats[agentEmail] = {
              traites: 0,
              enCours: 0,
              resolus: 0,
              enAttente: 0
            };
          }
          
          // Compter selon le statut
          if (signalement.statut === "RESOLU") {
            agentStats[agentEmail].resolus++;
            agentStats[agentEmail].traites++;
          } else if (signalement.statut === "EN_COURS") {
            agentStats[agentEmail].enCours++;
            agentStats[agentEmail].traites++;
          } else if (signalement.statut === "EN_ATTENTE") {
            agentStats[agentEmail].enAttente++;
          }
        } else {
          // 🔥 Si pas d'agent assigné, afficher un avertissement
          if (signalement.statut !== "EN_ATTENTE") {
            console.warn(`⚠️ Signalement ${signalement.id} (${signalement.statut}) n'a pas d'agent assigné!`);
          }
        }
      });
      
      console.log("📊 Agent stats calculées:", agentStats);
      
      // Fusionner avec la liste des agents
      const agentsAvecStats = agents.map(agent => ({
        ...agent,
        signalementsTraites: agentStats[agent.email]?.traites || 0,
        signalementsEnCours: agentStats[agent.email]?.enCours || 0,
        signalementsResolus: agentStats[agent.email]?.resolus || 0,
        signalementsEnAttente: agentStats[agent.email]?.enAttente || 0
      }));
      
      console.log("👥 Agents avec stats:", agentsAvecStats);
      setAgentsWithStats(agentsAvecStats);
      
      // Mettre à jour le nombre d'agents actifs
      const agentsActifsCount = agentsAvecStats.filter(a => a.signalementsTraites > 0).length;
      setStats(prev => ({ ...prev, agentsActifs: agentsActifsCount || agents.length }));
    }
  }, [signalements, agents]);

  const fetchDashboardData = async () => {
  setIsLoading(true);
  try {
    const signalementsRes = await fetch("http://localhost:8081/api/signalements", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (signalementsRes.ok) {
      const data = await signalementsRes.json();
      
      // ✅ Déplacer les console.log ICI après la définition de data
      console.log("🔍 Signalements reçus:", data);
      console.log("🔍 Premier signalement:", data[0]);
      
      setSignalements(data);
      
      const total = data.length;
      const enAttente = data.filter(s => s.statut === "EN_ATTENTE").length;
      const enCours = data.filter(s => s.statut === "EN_COURS").length;
      const resolus = data.filter(s => s.statut === "RESOLU").length;
      const tauxResolution = total > 0 ? Math.round((resolus / total) * 100) : 0;
      
      setStats(prev => ({
        ...prev,
        total,
        enAttente,
        enCours,
        resolus,
        tauxResolution,
        tempsMoyen: 2.5
      }));
      
      setDerniersSignalements(data.slice(0, 5));
      
      const typesCount = {};
      data.forEach(s => {
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
      setAgents(agentsList);
    }
    
  } catch (error) {
    console.error("Erreur chargement dashboard:", error);
  } finally {
    setIsLoading(false);
  }
};
  
// 🔥 FONCTIONS D'EXPORTATION
  const exportToCSV = () => {
    const headers = ["ID", "Titre", "Description", "Type", "Statut", "Localisation", "Date création"];
    const rows = signalements.map(s => [
      s.id,
      `"${(s.titre || "").replace(/"/g, '""')}"`,
      `"${(s.description || "").replace(/"/g, '""')}"`,
      s.type || "Non défini",
      getStatusLabel(s.statut),
      s.ville || s.address || "Non spécifiée",
      new Date(s.dateCreation).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `signalements_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      periode: periode,
      stats: stats,
      signalements: signalements.map(s => ({
        id: s.id,
        titre: s.titre,
        description: s.description,
        type: s.type,
        statut: s.statut,
        statutLabel: getStatusLabel(s.statut),
        localisation: s.ville || s.address,
        dateCreation: s.dateCreation
      })),
      signalementsParType: signalementsParType
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `dashboard_export_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <tr><th>Total signalements</th><td>${stats.total}</td></tr>
          <tr><th>En attente</th><td>${stats.enAttente}</td></tr>
          <tr><th>En cours</th><td>${stats.enCours}</td></tr>
          <tr><th>Résolus</th><td>${stats.resolus}</td></tr>
          <tr><th>Taux de résolution</th><td>${stats.tauxResolution}%</td></tr>
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
    
    html += `</tbody></table></body></html>`;
    
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `signalements_${new Date().toISOString().split("T")[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <h1>🏙️ SmartCity - Rapport des signalements</h1>
        <p>Exporté le ${new Date().toLocaleString()}</p>
        
        <h2>📊 Statistiques</h2>
        <div class="stat-card"><strong>Total:</strong> ${stats.total}</div>
        <div class="stat-card"><strong>En attente:</strong> ${stats.enAttente}</div>
        <div class="stat-card"><strong>En cours:</strong> ${stats.enCours}</div>
        <div class="stat-card"><strong>Résolus:</strong> ${stats.resolus}</div>
        <div class="stat-card"><strong>Taux de résolution:</strong> ${stats.tauxResolution}%</div>
        
        <h2>📋 Liste des signalements</h2>
        <table>
          <thead><tr><th>ID</th><th>Titre</th><th>Type</th><th>Statut</th><th>Localisation</th><th>Date</th></tr></thead>
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
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      switch (exportFormat) {
        case "csv": exportToCSV(); break;
        case "json": exportToJSON(); break;
        case "excel": exportToExcel(); break;
        case "pdf": exportToPDF(); break;
        default: exportToCSV();
      }
      setIsExporting(false);
      setShowExportModal(false);
    }, 500);
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

  // Ouvrir le modal d'assignation
  const openAssignModal = (signalement) => {
    setSelectedSignalement(signalement);
    setSelectedAgent("");
    setShowAssignModal(true);
  };

  // Assigner un signalement à un agent
  const assignerSignalement = async () => {
    if (!selectedAgent) {
      alert("Veuillez sélectionner un agent");
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
        alert(`✅ Signalement assigné à ${agents.find(a => a.email === selectedAgent)?.nom}`);
        setShowAssignModal(false);
        fetchDashboardData(); // Rafraîchir les données
      } else {
        const error = await response.json();
        alert("❌ Erreur: " + (error.error || "Impossible d'assigner"));
      }
    } catch (error) {
      console.error("Erreur assignation:", error);
      alert("❌ Erreur réseau");
    } finally {
      setIsAssigning(false);
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
      <div className="max-w-7xl mx-auto">
        
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

        {/* MODAL D'EXPORTATION - Garde ton code existant */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1e1f22] rounded-2xl max-w-md w-full p-6 border border-white/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">📥 Exporter les données</h3>
                <button onClick={() => setShowExportModal(false)} className="text-white/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-white/60 text-sm mb-6">
                Choisissez le format d'exportation pour télécharger les signalements.
              </p>
              
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

        {/* Cartes KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/50 text-sm">Total signalements</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-xl"><MapPin className="text-blue-400" size={24} /></div>
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
              <div className="bg-emerald-500/20 p-3 rounded-xl"><CheckCircle className="text-emerald-400" size={24} /></div>
            </div>
            <div className="mt-3"><div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.tauxResolution}%` }} /></div></div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/50 text-sm">Agents actifs</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.agentsActifs}</p>
              </div>
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

          {/* ✅ SECTION TOP AGENTS CORRIGÉE */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 lg:col-span-1">
            <h3 className="text-white font-semibold mb-4">🏆 Top agents</h3>
            <div className="space-y-3">
              {agentsWithStats.length > 0 ? (
                agentsWithStats
                  .sort((a, b) => b.signalementsTraites - a.signalementsTraites)
                  .slice(0, 5)
                  .map((agent, index) => (
                    <div key={agent.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{agent.nom}</p>
                        <p className="text-white/40 text-xs">{agent.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-lg">{agent.signalementsTraites}</p>
                        <p className="text-white/40 text-xs">traités</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 text-sm font-semibold">{agent.signalementsResolus}</p>
                        <p className="text-white/40 text-xs">résolus</p>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-white/40 text-center py-4">Aucun agent pour le moment</p>
              )}
            </div>
            
            {/* Détail des signalements par agent */}
            {agentsWithStats.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-white/60 text-xs font-medium mb-2">📊 Détail par agent</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {agentsWithStats.map(agent => (
                    <div key={agent.id} className="flex justify-between items-center text-xs">
                      <span className="text-white/50">{agent.nom}</span>
                      <div className="flex gap-3">
                        <span className="text-amber-400">{agent.signalementsEnAttente || 0} en attente</span>
                        <span className="text-blue-400">{agent.signalementsEnCours || 0} en cours</span>
                        <span className="text-emerald-400">{agent.signalementsResolus || 0} résolus</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition">
              <UserPlus size={16} /> Ajouter un agent
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 lg:col-span-1">
            <h3 className="text-white font-semibold mb-4">⚠️ Signalements urgents</h3>
            <div className="space-y-3">
              {derniersSignalements.filter(s => s.statut === "EN_ATTENTE").slice(0, 3).map((signalement) => (
                <div key={signalement.id} className="p-3 bg-red-500/10 rounded-xl border border-red-500/30">
                  <p className="text-white font-medium text-sm">{signalement.titre || "Sans titre"}</p>
                  <p className="text-white/50 text-xs mt-1 line-clamp-2">{signalement.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-red-400 text-xs">⚠️ En attente</span>
                    <button 
                      onClick={() => openAssignModal(signalement)}
                      className="text-white/50 hover:text-white text-xs"
                    >
                      Assigner →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Derniers signalements */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
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

      {/* MODAL D'ASSIGNATION DES SIGNALEMENTS */}
      {showAssignModal && selectedSignalement && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e1f22] rounded-2xl w-full max-w-md p-6 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">👤 Assigner un agent</h3>
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
    </div>
  );
}