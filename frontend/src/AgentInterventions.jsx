import { useEffect, useState } from "react";
import { 
  Clock, MapPin, CheckCircle, Image as ImageIcon, 
  User, Calendar, ChevronRight, Search, Filter,
  Loader2, X, Eye, ChevronLeft, AlertCircle, Info,
  Phone, Mail, MessageSquare, PlusCircle, Trash2,
  Save, Edit2, CheckSquare, Square, Timer, Send
} from "lucide-react";

export default function AgentInterventions() {
  const [interventions, setInterventions] = useState([]);
  const [filteredInterventions, setFilteredInterventions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [selectedImages, setSelectedImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // États pour les fonctionnalités
  const [newNote, setNewNote] = useState("");
  const [checklistItems, setChecklistItems] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [tempsPasse, setTempsPasse] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  
  const [messageBox, setMessageBox] = useState({
    show: false,
    type: "success",
    title: "",
    message: ""
  });
  
  const token = localStorage.getItem("token");

  const showMessage = (type, title, message) => {
    setMessageBox({ show: true, type, title, message });
    if (type === "success") {
      setTimeout(() => setMessageBox(prev => ({ ...prev, show: false })), 3000);
    }
  };

  // Timer pour le temps passé
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTempsPasse(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    fetchInterventions();
  }, []);

  useEffect(() => {
    let filtered = interventions;
    if (statusFilter !== "TOUS") {
      filtered = filtered.filter(i => i.statut === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(i => 
        i.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredInterventions(filtered);
  }, [searchTerm, statusFilter, interventions]);

  const fetchInterventions = async () => {
    try {
      const res = await fetch("http://localhost:8081/api/signalements", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const interventionsData = data.filter(s => 
          s.statut === "EN_COURS" || s.statut === "RESOLU"
        );
        setInterventions(interventionsData);
        setFilteredInterventions(interventionsData);
      }
    } catch (error) {
      showMessage("error", "Erreur", "Impossible de charger les interventions");
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir les détails d'une intervention
  const openDetails = (intervention) => {
    setSelectedIntervention(intervention);
    // Charger les données sauvegardées
    const savedData = localStorage.getItem(`intervention_${intervention.id}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      setChecklistItems(data.checklist || []);
      setTempsPasse(data.tempsPasse || 0);
    } else {
      setChecklistItems([]);
      setTempsPasse(0);
    }
    setNewNote("");
    setShowDetailsModal(true);
  };

  // Ajouter une note
  const addNote = () => {
    if (!newNote.trim()) return;
    
    const savedData = localStorage.getItem(`intervention_${selectedIntervention.id}`);
    const data = savedData ? JSON.parse(savedData) : { notes: [], checklist: [], tempsPasse: 0 };
    const newNotes = [...(data.notes || []), {
      id: Date.now(),
      text: newNote,
      date: new Date().toISOString(),
      auteur: "Agent"
    }];
    data.notes = newNotes;
    localStorage.setItem(`intervention_${selectedIntervention.id}`, JSON.stringify(data));
    setNewNote("");
    showMessage("success", "Note ajoutée", "Votre note a été enregistrée");
  };

  // Checklist
  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: Date.now(),
      text: newChecklistItem,
      completed: false
    };
    const newChecklist = [...checklistItems, newItem];
    setChecklistItems(newChecklist);
    saveChecklist(newChecklist);
    setNewChecklistItem("");
  };

  const toggleChecklistItem = (id) => {
    const newChecklist = checklistItems.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklistItems(newChecklist);
    saveChecklist(newChecklist);
  };

  const deleteChecklistItem = (id) => {
    const newChecklist = checklistItems.filter(item => item.id !== id);
    setChecklistItems(newChecklist);
    saveChecklist(newChecklist);
  };

  const saveChecklist = (checklist) => {
    const savedData = localStorage.getItem(`intervention_${selectedIntervention.id}`);
    const data = savedData ? JSON.parse(savedData) : { notes: [], tempsPasse: 0 };
    data.checklist = checklist;
    localStorage.setItem(`intervention_${selectedIntervention.id}`, JSON.stringify(data));
  };

  // Sauvegarder le temps passé
  const saveTempsPasse = () => {
    const savedData = localStorage.getItem(`intervention_${selectedIntervention.id}`);
    const data = savedData ? JSON.parse(savedData) : { notes: [], checklist: [] };
    data.tempsPasse = tempsPasse;
    localStorage.setItem(`intervention_${selectedIntervention.id}`, JSON.stringify(data));
    showMessage("success", "Temps sauvegardé", `${formatTime(tempsPasse)} enregistré`);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Contacter le citoyen
  const sendMessage = async () => {
    if (!contactMessage.trim()) return;
    
    // Simulation d'envoi (à remplacer par votre API)
    showMessage("success", "Message envoyé", "Votre message a été envoyé au citoyen");
    setContactMessage("");
    setShowContactModal(false);
  };

  const stats = {
    total: interventions.length,
    enCours: interventions.filter(s => s.statut === "EN_COURS").length,
    resolus: interventions.filter(s => s.statut === "RESOLU").length
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

  const getStatusColor = (statut) => {
    return statut === "EN_COURS" 
      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  };

  const getStatusLabel = (statut) => {
    return statut === "EN_COURS" ? "En cours" : "Résolu";
  };

  const getStatusIcon = (statut) => {
    return statut === "EN_COURS" ? Clock : CheckCircle;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="container mx-auto max-w-7xl pt-8">
        
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">🛠️ Mes Interventions</h1>
          <p className="text-white/50 text-sm mt-1">Gérez vos interventions en cours et terminées</p>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-white/50 text-xs mt-1">Total</div>
          </div>
          <div 
            className={`rounded-xl p-4 text-center cursor-pointer transition ${statusFilter === "EN_COURS" ? 'bg-blue-500/30 border-2 border-blue-400' : 'bg-blue-500/20 hover:bg-blue-500/30'}`}
            onClick={() => setStatusFilter(statusFilter === "EN_COURS" ? "TOUS" : "EN_COURS")}
          >
            <div className="text-3xl font-bold text-blue-300">{stats.enCours}</div>
            <div className="text-blue-300/70 text-xs mt-1">En cours</div>
          </div>
          <div 
            className={`rounded-xl p-4 text-center cursor-pointer transition ${statusFilter === "RESOLU" ? 'bg-emerald-500/30 border-2 border-emerald-400' : 'bg-emerald-500/20 hover:bg-emerald-500/30'}`}
            onClick={() => setStatusFilter(statusFilter === "RESOLU" ? "TOUS" : "RESOLU")}
          >
            <div className="text-3xl font-bold text-emerald-300">{stats.resolus}</div>
            <div className="text-emerald-300/70 text-xs mt-1">Résolus</div>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher par titre, description ou adresse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Liste des interventions */}
        <div className="space-y-4">
          {filteredInterventions.length === 0 ? (
            <div className="bg-white/10 rounded-xl p-12 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <p className="text-white/60 text-lg">Aucune intervention trouvée</p>
            </div>
          ) : (
            filteredInterventions.map((intervention) => {
              const StatusIcon = getStatusIcon(intervention.statut);
              const savedData = JSON.parse(localStorage.getItem(`intervention_${intervention.id}`) || '{}');
              
              return (
                <div 
                  key={intervention.id} 
                  className="bg-[#242526] rounded-xl overflow-hidden border border-white/20 hover:shadow-xl transition hover:border-white/30 cursor-pointer"
                  onClick={() => openDetails(intervention)}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-48 h-48 md:h-auto relative">
                      {intervention.images && intervention.images.length > 0 ? (
                        <div className="w-full h-full relative overflow-hidden">
                          <img 
                            src={intervention.images[0].url} 
                            className="w-full h-full object-cover"
                            alt={intervention.titre}
                          />
                          {intervention.images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                              +{intervention.images.length - 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-700/50 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 p-5">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(intervention.statut)}`}>
                          <StatusIcon size={14} />
                          {getStatusLabel(intervention.statut)}
                        </div>
                        <div className="text-white/40 text-xs flex items-center gap-2">
                          <Calendar size={14} />
                          {formatDate(intervention.dateCreation)}
                        </div>
                      </div>

                      <h3 className="text-white font-bold text-xl mb-2">{intervention.titre || "Sans titre"}</h3>
                      <p className="text-white/60 text-sm mb-3 line-clamp-2">{intervention.description || "Aucune description"}</p>
                      
                      <div className="flex flex-wrap gap-4 text-xs text-white/40 mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>{intervention.address || intervention.ville || "Localisation non spécifiée"}</span>
                        </div>
                        {savedData.tempsPasse > 0 && (
                          <div className="flex items-center gap-1">
                            <Timer size={14} />
                            <span>Temps: {formatTime(savedData.tempsPasse)}</span>
                          </div>
                        )}
                        {savedData.checklist?.filter(i => i.completed).length > 0 && (
                          <div className="flex items-center gap-1">
                            <CheckSquare size={14} />
                            <span>{savedData.checklist.filter(i => i.completed).length}/{savedData.checklist.length} tâches</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                          Voir détails <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL DÉTAILS DE L'INTERVENTION */}
      {showDetailsModal && selectedIntervention && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#1e1f22] rounded-2xl overflow-hidden">
              
              {/* En-tête */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-transparent">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedIntervention.titre || "Intervention"}</h2>
                    <p className="text-white/40 text-sm mt-1 flex items-center gap-2">
                      <MapPin size={14} />
                      {selectedIntervention.address || selectedIntervention.ville || "Localisation non spécifiée"}
                    </p>
                  </div>
                  <button onClick={() => setShowDetailsModal(false)} className="text-white/50 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Colonne gauche - Détails et Checklist */}
                  <div className="space-y-6">
                    
                    {/* Description */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-white font-semibold mb-2">Description</h3>
                      <p className="text-white/60 text-sm">{selectedIntervention.description || "Aucune description"}</p>
                    </div>

                    {/* Checklist */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <CheckSquare size={18} />
                        Checklist des tâches
                      </h3>
                      <div className="space-y-2 mb-3">
                        {checklistItems.length === 0 ? (
                          <p className="text-white/40 text-sm">Aucune tâche pour le moment</p>
                        ) : (
                          checklistItems.map(item => (
                            <div key={item.id} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                              <button onClick={() => toggleChecklistItem(item.id)} className="flex-shrink-0">
                                {item.completed ? <CheckCircle size={18} className="text-emerald-500" /> : <Square size={18} className="text-white/40" />}
                              </button>
                              <span className={`flex-1 text-sm ${item.completed ? 'text-white/40 line-through' : 'text-white'}`}>{item.text}</span>
                              <button onClick={() => deleteChecklistItem(item.id)} className="text-red-400 hover:text-red-300">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newChecklistItem}
                          onChange={(e) => setNewChecklistItem(e.target.value)}
                          placeholder="Nouvelle tâche..."
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                        />
                        <button onClick={addChecklistItem} className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg">
                          <PlusCircle size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <MessageSquare size={18} />
                        Notes d'intervention
                      </h3>
                      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                        {(() => {
                          const savedData = localStorage.getItem(`intervention_${selectedIntervention.id}`);
                          const data = savedData ? JSON.parse(savedData) : {};
                          const notes = data.notes || [];
                          return notes.length === 0 ? (
                            <p className="text-white/40 text-sm">Aucune note</p>
                          ) : (
                            notes.map(note => (
                              <div key={note.id} className="bg-white/5 rounded-lg p-2">
                                <p className="text-white/80 text-sm">{note.text}</p>
                                <p className="text-white/30 text-xs mt-1">{new Date(note.date).toLocaleString()}</p>
                              </div>
                            ))
                          );
                        })()}
                      </div>
                      <div className="flex gap-2">
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Ajouter une note..."
                          rows={2}
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={addNote} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded-lg">
                          <Save size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Colonne droite - Temps et Actions */}
                  <div className="space-y-6">
                    
                    {/* Temps passé */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Timer size={18} />
                        Temps passé
                      </h3>
                      <div className="text-center">
                        <div className="text-4xl font-mono font-bold text-white mb-3">{formatTime(tempsPasse)}</div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                            className={`flex-1 py-2 rounded-lg font-medium transition ${isTimerRunning ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}
                          >
                            {isTimerRunning ? '⏸️ Pause' : '▶️ Démarrer'}
                          </button>
                          <button onClick={saveTempsPasse} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg">
                            💾 Sauvegarder
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Calendrier simplifié */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Calendar size={18} />
                        Planning
                      </h3>
                      <div className="space-y-2">
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <span className="text-white/80 text-sm">Date de création</span>
                            <span className="text-white font-mono text-sm">{formatDate(selectedIntervention.dateCreation)}</span>
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <span className="text-white/80 text-sm">Statut actuel</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${selectedIntervention.statut === "EN_COURS" ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                              {selectedIntervention.statut === "EN_COURS" ? "En cours" : "Résolu"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact citoyen */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Phone size={18} />
                        Contacter le citoyen
                      </h3>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                            <Phone size={16} />
                            Appeler
                          </button>
                          <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                            <Mail size={16} />
                            Email
                          </button>
                        </div>
                        <button 
                          onClick={() => setShowContactModal(true)}
                          className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
                        >
                          <MessageSquare size={16} />
                          Envoyer un message
                        </button>
                      </div>
                    </div>

                    {/* Images de l'intervention */}
                    {selectedIntervention.images && selectedIntervention.images.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <ImageIcon size={18} />
                          Photos ({selectedIntervention.images.length})
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedIntervention.images.map((img, index) => (
                            <div key={index} className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition" onClick={() => openImageViewer(selectedIntervention.images, index)}>
                              <img src={img.url} className="w-full h-full object-cover" alt="" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTACTER LE CITOYEN */}
      {showContactModal && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e1f22] rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Contacter le citoyen</h3>
              <button onClick={() => setShowContactModal(false)} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Envoyez un message concernant l'intervention : <br />
              <span className="text-white font-medium">{selectedIntervention?.titre}</span>
            </p>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              rows={4}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 mb-4"
              placeholder="Votre message..."
            />
            <div className="flex gap-3">
              <button onClick={() => setShowContactModal(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg">
                Annuler
              </button>
              <button onClick={sendMessage} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                <Send size={16} />
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE BOX */}
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

      {/* VISIONNEUSE D'IMAGES */}
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