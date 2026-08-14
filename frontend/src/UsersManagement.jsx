import { useEffect, useState } from "react";
import { 
  Users, UserCheck, UserCircle, Phone, Mail, Award, 
  TrendingUp, Activity, Clock, MapPin, Calendar,
  Search, Filter, Loader2, X, Crown, Star, 
  Shield, Building2, Smartphone, Eye, ChevronRight,
  CheckCircle, AlertTriangle, Briefcase, Wrench
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "./context/AppContext";

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
      case 'error': return <AlertTriangle size={18} />;
      default: return <Activity size={18} />;
    }
  };

  const getColors = () => {
    switch(type) {
      case 'success': return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
      case 'error': return 'bg-red-500/20 border-red-500/30 text-red-400';
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

export default function UsersManagement() {
  const { t } = useI18n();
  const [agents, setAgents] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [signalements, setSignalements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageBox, setMessageBox] = useState(null);
  
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const showMessage = (message, type = 'info') => {
    setMessageBox({ message, type });
  };

  const hideMessage = () => {
    setMessageBox(null);
  };

  // Récupérer tous les utilisateurs
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8081/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
        
        // Séparer agents et citoyens
        const agentsList = data.filter(user => user?.role === "AGENT");
        const citizensList = data.filter(user => user?.role === "CITIZEN" || user?.role === "CITOYEN");
        
        setAgents(agentsList);
        setCitizens(citizensList);
        
        console.log(`👥 ${agentsList.length} agents, ${citizensList.length} citoyens`);
      } else {
        console.error("Erreur récupération utilisateurs:", response.status);
        showMessage("Impossible de récupérer les utilisateurs", 'error');
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
      showMessage("Erreur lors du chargement des utilisateurs", 'error');
    }
  };

  // Récupérer les signalements
  const fetchSignalements = async () => {
    try {
      const response = await fetch("http://localhost:8081/api/signalements", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSignalements(data);
      }
    } catch (error) {
      console.error("Erreur récupération signalements:", error);
    }
  };

  // ⭐ Pour les citoyens : nombre de signalements créés
  const getCitizenActivity = (userId) => {
    return signalements.filter(s => s.utilisateur?.id === userId || s.citoyen?.id === userId).length;
  };

  // ⭐ Pour les agents : nombre de signalements traités (EN_COURS + RESOLU)
  const getAgentTreatedCount = (agentId) => {
    return signalements.filter(s => 
      s.agentId === agentId && 
      (s.statut === "EN_COURS" || s.statut === "RESOLU" || s.statut === "TRAITE")
    ).length;
  };

  // ⭐ Pour les agents : nombre de signalements résolus
  const getAgentResolvedCount = (agentId) => {
    return signalements.filter(s => s.agentId === agentId && (s.statut === "RESOLU" || s.statut === "TRAITE")).length;
  };

  // ⭐ Pour les agents : nombre de signalements en cours
  const getAgentInProgressCount = (agentId) => {
    return signalements.filter(s => s.agentId === agentId && s.statut === "EN_COURS").length;
  };

  // Obtenir les 3 agents les plus actifs (basé sur les signalements traités)
  const getTopAgents = () => {
    return [...agents]
      .map(agent => ({
        ...agent,
        treatedCount: getAgentTreatedCount(agent.id),
        resolvedCount: getAgentResolvedCount(agent.id),
        inProgressCount: getAgentInProgressCount(agent.id)
      }))
      .sort((a, b) => b.treatedCount - a.treatedCount)
      .slice(0, 3);
  };

  // Obtenir les 3 citoyens les plus actifs (basé sur les signalements créés)
  const getTopCitizens = () => {
    return [...citizens]
      .map(citizen => ({
        ...citizen,
        activityCount: getCitizenActivity(citizen.id)
      }))
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 3);
  };

  // Filtrer les agents par recherche
  const filteredAgents = agents.filter(agent =>
    agent.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.telephone?.includes(searchTerm)
  );

  // Filtrer les citoyens par recherche
  const filteredCitizens = citizens.filter(citizen =>
    citizen.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    citizen.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    citizen.telephone?.includes(searchTerm)
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchUsers();
      await fetchSignalements();
      setIsLoading(false);
    };
    loadData();
  }, [token]);

  const topAgents = getTopAgents();
  const topCitizens = getTopCitizens();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
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
              <Users className="w-8 h-8 text-emerald-400" />
              {t("admin.userManagement")}
            </h1>
            <p className="text-white/50 mt-1">
              {agents.length} {t("admin.agentsWord")} • {citizens.length} {t("admin.citizensWord")}
            </p>
          </div>
          
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder={t("feed.searchUser")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-emerald-500 w-64"
            />
          </div>
        </div>

        {/* SECTION TOP AGENTS ET TOP CITOYENS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Top 3 Agents - Score basé sur les signalements traités */}
          <div className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 overflow-hidden">
            <div className="p-5 border-b border-blue-500/30 bg-blue-600/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/30 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{t("admin.topAgents")}</h2>
                  <p className="text-white/50 text-sm">{t("admin.topAgentsSub")}</p>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              {topAgents.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40">{t("admin.noActiveAgent")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topAgents.map((agent, index) => (
                    <div key={agent.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition group">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-slate-400' :
                          'bg-gradient-to-r from-amber-600 to-orange-600'
                        }`}>
                          {index + 1}
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1">
                            <Crown className="w-4 h-4 text-yellow-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-semibold">{agent.nom}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                            {agent.domaine ? t(`type.${agent.domaine}`) : t("role.agent")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/50 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail size={12} />
                            {agent.email}
                          </span>
                          {agent.telephone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} />
                              {agent.telephone}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-blue-400 text-xs">
                            <Activity size={12} />
                            <span>{agent.inProgressCount} {t("agent.inProgressShort")}</span>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-400 text-xs">
                            <CheckCircle size={12} />
                            <span>{agent.resolvedCount} {t("agent.resolvedShort")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-400">{agent.treatedCount}</div>
                        <div className="text-white/40 text-xs">{t("agent.treatedShort")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top 3 Citoyens - Score basé sur les signalements créés */}
          <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 backdrop-blur-xl rounded-2xl border border-emerald-500/30 overflow-hidden">
            <div className="p-5 border-b border-emerald-500/30 bg-emerald-600/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/30 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{t("admin.topCitizens")}</h2>
                  <p className="text-white/50 text-sm">{t("admin.topCitizensSub")}</p>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              {topCitizens.length === 0 ? (
                <div className="text-center py-8">
                  <UserCircle className="w-12 h-12 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40">{t("admin.noActiveCitizen")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topCitizens.map((citizen, index) => (
                    <div key={citizen.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition group">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-slate-400' :
                        'bg-gradient-to-r from-amber-600 to-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{citizen.nom}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/50 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail size={12} />
                            {citizen.email}
                          </span>
                          {citizen.telephone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} />
                              {citizen.telephone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-400">{citizen.activityCount}</div>
                        <div className="text-white/40 text-xs">{t("agent.reportsShort")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION LISTE COMPLÈTE DES AGENTS */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden mb-8">
          <div className="p-5 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">{t("admin.allAgents")}</h2>
              <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                {filteredAgents.length}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-white/50 text-sm">{t("admin.colName")}</th>
                  <th className="text-left p-4 text-white/50 text-sm">{t("admin.email")}</th>
                  <th className="text-left p-4 text-white/50 text-sm">{t("admin.phone")}</th>
                  <th className="text-left p-4 text-white/50 text-sm">{t("admin.domain")}</th>
                  <th className="text-left p-4 text-white/50 text-sm">{t("admin.job")}</th>
                  <th className="text-left p-4 text-white/50 text-sm">{t("status.EN_COURS")}</th>
                  <th className="text-left p-4 text-white/50 text-sm">{t("feed.resolved")}</th>
                  <th className="text-left p-4 text-white/50 text-sm">{t("admin.totalHandled")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-white/40">
                      Aucun agent trouvé
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => {
                    const inProgressCount = signalements.filter(s => s.agentId === agent.id && s.statut === "EN_COURS").length;
                    const resolvedCount = signalements.filter(s => s.agentId === agent.id && (s.statut === "RESOLU" || s.statut === "TRAITE")).length;
                    const totalTreated = inProgressCount + resolvedCount;
                    
                    return (
                      <tr key={agent.id} className="border-t border-white/5 hover:bg-white/5 transition">
                        <td className="p-4 text-white font-medium">{agent.nom}</td>
                        <td className="p-4 text-white/70 text-sm">{agent.email}</td>
                        <td className="p-4 text-white/70 text-sm">{agent.telephone || "-"}</td>
                        <td className="p-4">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                            {agent.domaine ? t(`type.${agent.domaine}`) : t("agent.notDefined")}
                          </span>
                        </td>
                        <td className="p-4 text-white/60 text-sm">
                          {agent.metier ? t(`met.${agent.metier}.label`) : "-"}
                        </td>
                        <td className="p-4">
                          <span className="text-blue-400 font-medium">{inProgressCount}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-emerald-400 font-medium">{resolvedCount}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-white font-bold">{totalTreated}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION LISTE COMPLÈTE DES CITOYENS */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-5 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">{t("admin.allCitizens")}</h2>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                {filteredCitizens.length}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-white/50 text-sm">{t("admin.colName")}</th>
                  <th className="text-left p-4 text-white/50 text-sm">{t("admin.email")}</th>
                  <th className="text-left p-4 text-white/50 text-sm">{t("admin.phone")}</th>
                  <th className="text-left p-4 text-white/50 text-sm">{t("admin.signupDate")}</th>
                  <th className="text-left p-4 text-white/50 text-sm">{t("prof.reports")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCitizens.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-white/40">
                      Aucun citoyen trouvé
                    </td>
                  </tr>
                ) : (
                  filteredCitizens.map((citizen) => (
                    <tr key={citizen.id} className="border-t border-white/5 hover:bg-white/5 transition">
                      <td className="p-4 text-white font-medium">{citizen.nom}</td>
                      <td className="p-4 text-white/70 text-sm">{citizen.email}</td>
                      <td className="p-4 text-white/70 text-sm">{citizen.telephone || "-"}</td>
                      <td className="p-4 text-white/60 text-sm">
                        {citizen.dateCreation ? new Date(citizen.dateCreation).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-400 font-medium">{getCitizenActivity(citizen.id)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}