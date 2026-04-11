import { useEffect, useState } from "react";
import { 
  Activity, CheckCircle, Clock, AlertTriangle, 
  TrendingUp, MapPin, Calendar, ArrowRight, Eye,
  Construction, Lightbulb, Trash2, Droplets, TreePine, Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AgentDashboard() {
  const [stats, setStats] = useState({ 
    total: 0, 
    enAttente: 0, 
    enCours: 0,
    resolus: 0 
  });
  const [signalementsRecents, setSignalementsRecents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:8081/api/signalements", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          
          // Statistiques détaillées
          setStats({
            total: data.length,
            enAttente: data.filter(s => s.statut === "EN_ATTENTE").length,
            enCours: data.filter(s => s.statut === "EN_COURS" || s.statut === "EN_ATTENTE").length,
            resolus: data.filter(s => s.statut === "RESOLU" || s.statut === "TRAITE").length
          });
          
          // Récupérer les signalements récents en attente
          const enAttente = data
            .filter(s => s.statut === "EN_ATTENTE")
            .sort((a, b) => new Date(b.dateCreation || b.createdAt) - new Date(a.dateCreation || a.createdAt))
            .slice(0, 5);
          
          setSignalementsRecents(enAttente);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  // Calculer le pourcentage de résolution
  const tauxResolution = stats.total > 0 
    ? Math.round((stats.resolus / stats.total) * 100) 
    : 0;

  // Obtenir l'icône selon le type
  const getTypeIcon = (type) => {
    const icons = {
      'VOIRIE': Construction,
      'ECLAIRAGE': Lightbulb,
      'DECHETS': Trash2,
      'EAU': Droplets,
      'ESPACES_VERTS': TreePine,
      'SECURITE': Shield,
      'AUTRE': AlertTriangle
    };
    return icons[type] || MapPin;
  };

  // Obtenir le libellé du type
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

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl pt-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Activity className="w-8 h-8 text-blue-400" />
              Dashboard Agent
            </h1>
            <p className="text-white/60">Bienvenue dans votre espace de travail</p>
          </div>
        </div>

        {/* RÉSUMÉ : Nombre à traiter (mis en avant) */}
        <div className="mb-8 p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-amber-500/30 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-300 text-sm font-medium mb-1">À TRAITER EN PRIORITÉ</p>
                <p className="text-5xl font-bold text-white">{stats.enAttente}</p>
                <p className="text-white/60 text-sm mt-1">signalements en attente de traitement</p>
              </div>
            </div>
            <button 
              onClick={() => navigate("/agent/signalements-en-attente")}
              className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2"
            >
              Voir tout
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#242526] backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-white/40 text-sm">Total</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.total}</div>
            <div className="text-white/60 text-sm">Signalements au total</div>
          </div>

          <div className="bg-[#242526] backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-white/40 text-sm">En cours</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.enCours}</div>
            <div className="text-white/60 text-sm">En attente + En cours</div>
          </div>

          <div className="bg-[#242526] backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:scale-[1.02] transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-white/40 text-sm">Résolus</span>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.resolus}</div>
            <div className="text-white/60 text-sm">Signalements traités</div>
          </div>
        </div>

        {/* Taux de résolution et progrès */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#242526] backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-semibold">Taux de résolution</h3>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold text-white">{tauxResolution}%</span>
              <span className="text-white/40 text-sm mb-1">des signalements résolus</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                style={{ width: `${tauxResolution}%` }}
              />
            </div>
          </div>

          <div className="bg-[#242526] backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Actions rapides</h3>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => navigate("/agent/signalements-en-attente")}
                className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium py-3 px-4 rounded-xl transition flex items-center justify-between border border-amber-500/30"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Traiter les signalements en attente
                </span>
                <ArrowRight size={18} />
              </button>
              <button 
                onClick={() => navigate("/agent/interventions")}
                className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-300 font-medium py-3 px-4 rounded-xl transition flex items-center justify-between border border-green-500/30"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle size={18} />
                  Voir les signalements résolus
                </span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Signalements récents à traiter */}
        {signalementsRecents.length > 0 && (
          <div className="bg-[#242526] backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Signalements récents à traiter
              </h3>
              <button 
                onClick={() => navigate("/agent/signalements-assignes")}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
              >
                Voir tout <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="space-y-3">
              {signalementsRecents.map((s) => {
                const TypeIcon = getTypeIcon(s.type);
                return (
                  <div 
                    key={s.id} 
                    className="bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-colors cursor-pointer border border-white/10"
                    onClick={() => navigate(`/agent/signalement/${s.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-medium">{s.titre || "Sans titre"}</h4>
                            <span className="text-xs bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full">
                              {getTypeLabel(s.type)}
                            </span>
                          </div>
                          <p className="text-white/60 text-sm line-clamp-1 mb-2">
                            {s.description || "Aucune description"}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-white/40">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {s.ville || s.commune || "Localisation"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(s.dateCreation || s.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="text-white/40 hover:text-white p-2">
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}