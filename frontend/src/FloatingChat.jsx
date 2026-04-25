// FloatingChat.jsx
import { useState, useEffect, useRef } from "react";
import { MessageCircle, Mail, Send, X, Bell, Check, Trash2, Eye, Move, Reply } from "lucide-react";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const [messages, setMessages] = useState([]);
  const [nonLuCount, setNonLuCount] = useState(0);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [messageForm, setMessageForm] = useState({
    destinataireEmail: "",
    sujet: "",
    contenu: "",
    type: "MESSAGE"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  
  const [position, setPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatRef = useRef(null);
  
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const userEmail = localStorage.getItem("userEmail");
  const isAdmin = userRole === "ADMIN";
  const isAgent = userRole === "AGENT";
  const isCitizen = userRole === "CITIZEN";

  useEffect(() => {
    const savedPosition = localStorage.getItem("chatPosition");
    if (savedPosition) {
      const pos = JSON.parse(savedPosition);
      setPosition(pos);
    }
  }, []);

  useEffect(() => {
    if (position.x !== null && position.y !== null) {
      localStorage.setItem("chatPosition", JSON.stringify(position));
    }
  }, [position]);

  useEffect(() => {
    if (token && isOpen) {
      fetchMessages();
      fetchNonLuCount();
      
      const interval = setInterval(() => {
        fetchMessages();
        fetchNonLuCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [token, isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === "send") {
      fetchUtilisateurs();
    }
  }, [isOpen, activeTab]);

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('select')) {
      return;
    }
    
    setIsDragging(true);
    const rect = chatRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    const maxX = window.innerWidth - (chatRef.current?.offsetWidth || 400);
    const maxY = window.innerHeight - (chatRef.current?.offsetHeight || 500);
    
    setPosition({
      x: Math.min(Math.max(0, newX), maxX),
      y: Math.min(Math.max(0, newY), maxY)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetPosition = () => {
    setPosition({ x: null, y: null });
    localStorage.removeItem("chatPosition");
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const fetchMessages = async () => {
    try {
      const response = await fetch("http://localhost:8081/api/messages", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Erreur chargement messages:", error);
    }
  };

  const fetchNonLuCount = async () => {
    try {
      const response = await fetch("http://localhost:8081/api/messages/non-lus", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNonLuCount(data.nonLuCount || 0);
      }
    } catch (error) {
      console.error("Erreur comptage non lus:", error);
    }
  };

  const fetchUtilisateurs = async () => {
    try {
      console.log("🔍 Récupération des utilisateurs depuis /api/users...");
      const response = await fetch("http://localhost:8081/api/users", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("📋 Utilisateurs récupérés:", data);
        
        let utilisateursFiltres = [];
        
        if (isAdmin) {
          // ✅ Admin peut envoyer à TOUS les utilisateurs
          utilisateursFiltres = data.filter(user => user.email !== userEmail);
          console.log("👑 Admin - Peut envoyer à tous:", utilisateursFiltres);
        } else if (isAgent) {
          // ✅ Agent ne peut envoyer qu'aux ADMINS uniquement
          utilisateursFiltres = data.filter(user => 
            user.email !== userEmail && user.role === "ADMIN"
          );
          console.log("👔 Agent - Destinataires autorisés (admins uniquement):", utilisateursFiltres);
        } else if (isCitizen) {
          // ✅ Citoyen ne peut envoyer qu'aux ADMINS uniquement
          utilisateursFiltres = data.filter(user => 
            user.email !== userEmail && user.role === "ADMIN"
          );
          console.log("👤 Citoyen - Destinataires autorisés (admins uniquement):", utilisateursFiltres);
        }
        
        setUtilisateurs(utilisateursFiltres);
      } else {
        console.error("Erreur API /api/users:", response.status);
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    }
  };

  const marquerCommeLu = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:8081/api/messages/${messageId}/lu`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchMessages();
        fetchNonLuCount();
      }
    } catch (error) {
      console.error("Erreur marquage lu:", error);
    }
  };

  const supprimerMessage = async (messageId) => {
    if (!confirm("Supprimer ce message ?")) return;
    
    try {
      const response = await fetch(`http://localhost:8081/api/messages/${messageId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchMessages();
        fetchNonLuCount();
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  // ✅ Vérifier si l'utilisateur peut envoyer un message à un destinataire spécifique
  const peutEnvoyerA = (destinataireEmail) => {
    const destinataire = utilisateurs.find(u => u.email === destinataireEmail);
    if (!destinataire) return false;
    
    if (isAdmin) {
      // Admin peut envoyer à tout le monde
      return true;
    } else if (isAgent || isCitizen) {
      // Agents et citoyens ne peuvent envoyer qu'aux admins
      return destinataire.role === "ADMIN";
    }
    return false;
  };

  const repondreMessage = (message) => {
    // ✅ Vérifier si l'utilisateur peut répondre à ce message
    const peutRepondre = () => {
      if (isAdmin) return true;
      if (isAgent || isCitizen) {
        // Les agents et citoyens ne peuvent répondre qu'aux admins
        return message.expediteurRole === "ADMIN";
      }
      return false;
    };

    if (!peutRepondre()) {
      alert("❌ Vous ne pouvez répondre qu'aux messages des administrateurs.");
      return;
    }

    // Préparer le sujet avec "Re: " si ce n'est pas déjà le cas
    let sujetReponse = message.sujet;
    if (!sujetReponse.startsWith("Re: ")) {
      sujetReponse = `Re: ${sujetReponse}`;
    }

    // Remplir le formulaire avec les infos de l'expéditeur original
    setMessageForm({
      destinataireEmail: message.expediteurEmail,
      sujet: sujetReponse,
      contenu: `\n\n--- Message original de ${message.expediteurNom} (${new Date(message.dateEnvoi).toLocaleString()}) :\n${message.contenu}`,
      type: "MESSAGE"
    });

    setReplyTo({
      id: message.id,
      expediteurNom: message.expediteurNom,
      expediteurEmail: message.expediteurEmail
    });

    setActiveTab("send");
    
    if (!message.lu) {
      marquerCommeLu(message.id);
    }
  };

  const envoyerMessage = async () => {
    if (!messageForm.destinataireEmail || !messageForm.sujet || !messageForm.contenu) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    // ✅ Vérification finale avant envoi
    if (!peutEnvoyerA(messageForm.destinataireEmail)) {
      if (isAdmin) {
        alert("❌ Destinataire invalide.");
      } else {
        alert("❌ Vous ne pouvez envoyer des messages qu'aux administrateurs uniquement.");
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8081/api/messages/envoyer", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          destinataireEmail: messageForm.destinataireEmail,
          sujet: messageForm.sujet,
          contenu: messageForm.contenu,
          type: messageForm.type
        })
      });
      
      if (response.ok) {
        const notification = messageForm.type === "MESSAGE" 
          ? "✅ Message envoyé avec succès !" 
          : "✅ Email envoyé avec succès !";
        alert(notification);
        
        setMessageForm({ 
          destinataireEmail: "", 
          sujet: "", 
          contenu: "", 
          type: "MESSAGE" 
        });
        setReplyTo(null);
        setActiveTab("messages");
        fetchMessages();
        fetchNonLuCount();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Erreur envoi message:", error);
      alert("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  };

  const annulerReponse = () => {
    setReplyTo(null);
    setMessageForm({ 
      destinataireEmail: "", 
      sujet: "", 
      contenu: "", 
      type: "MESSAGE" 
    });
  };

  const getTypeIcon = (type) => {
    return type === "EMAIL" ? <Mail className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />;
  };

  const chatStyle = position.x !== null && position.y !== null
    ? { position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, bottom: 'auto', right: 'auto' }
    : { position: 'fixed', bottom: '20px', right: '20px' };

  const getInfoMessage = () => {
    if (isCitizen) {
      return "💬 En tant que citoyen, vous pouvez uniquement envoyer des messages aux administrateurs.";
    }
    if (isAgent) {
      return "💬 En tant qu'agent, vous pouvez uniquement envoyer des messages aux administrateurs.";
    }
    if (isAdmin) {
      return "💬 En tant qu'administrateur, vous pouvez envoyer des messages à tous les utilisateurs (citoyens, agents, admins).";
    }
    return "";
  };

  return (
    <div 
      ref={chatRef}
      style={chatStyle}
      className="z-50"
    >
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 cursor-pointer">
            <MessageCircle className="w-6 h-6 text-white" />
            {nonLuCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {nonLuCount > 9 ? "9+" : nonLuCount}
              </span>
            )}
          </div>
        </button>
      )}

      {isOpen && (
        <div className={`w-96 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[500px]'}`}>
          <div 
            className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-3 border-b border-white/20 select-none"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-400" />
                <h3 className="text-white font-semibold">Messages</h3>
                {nonLuCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {nonLuCount} non lu(s)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetPosition}
                  className="text-white/30 hover:text-white/50 transition-colors text-xs"
                  title="Réinitialiser la position"
                >
                  ↺
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  {isMinimized ? "□" : "−"}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex border-b border-white/20">
                <button
                  onClick={() => {
                    setActiveTab("messages");
                    annulerReponse();
                  }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    activeTab === "messages"
                      ? "text-indigo-400 border-b-2 border-indigo-400"
                      : "text-white/50 hover:text-white/70"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Bell className="w-4 h-4" />
                    Messages reçus
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("send");
                  }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    activeTab === "send"
                      ? "text-indigo-400 border-b-2 border-indigo-400"
                      : "text-white/50 hover:text-white/70"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Nouveau message
                  </div>
                </button>
              </div>

              <div className="h-[400px] overflow-y-auto p-3 space-y-3">
                {activeTab === "messages" && (
                  <>
                    {messages.length === 0 ? (
                      <div className="text-center text-white/50 py-8">
                        <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Aucun message</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-xl transition-all cursor-pointer ${
                            !message.lu
                              ? "bg-indigo-500/20 border border-indigo-400/30"
                              : "bg-white/5 hover:bg-white/10"
                          }`}
                          onClick={() => repondreMessage(message)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              {getTypeIcon(message.type)}
                              <p className="text-white font-medium text-sm flex-1">
                                {message.sujet}
                              </p>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => repondreMessage(message)}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                title="Répondre"
                              >
                                <Reply className="w-3 h-3 text-indigo-400" />
                              </button>
                              {!message.lu && (
                                <button
                                  onClick={() => marquerCommeLu(message.id)}
                                  className="p-1 hover:bg-white/10 rounded transition-colors"
                                  title="Marquer comme lu"
                                >
                                  <Eye className="w-3 h-3 text-emerald-400" />
                                </button>
                              )}
                              <button
                                onClick={() => supprimerMessage(message.id)}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                            </div>
                          </div>
                          <p className="text-white/60 text-xs mb-1">
                              De: {message.expediteurNom} (
                              {message.expediteurRole === "ADMIN" ? "Admin" : 
                              message.expediteurRole === "AGENT" ? "Agent" : "Citoyen"})
                          </p>
                          <p className="text-white/70 text-sm mb-2">
                            {message.contenu.length > 100
                              ? message.contenu.substring(0, 100) + "..."
                              : message.contenu}
                          </p>
                          <p className="text-white/30 text-xs">
                            {new Date(message.dateEnvoi).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeTab === "send" && (
                  <div className="space-y-4">
                    {replyTo && (
                      <div className="bg-indigo-500/30 border border-indigo-400/50 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-indigo-300 text-xs">
                            📩 Réponse à <strong>{replyTo.expediteurNom}</strong>
                          </p>
                        </div>
                        <button
                          onClick={annulerReponse}
                          className="text-white/50 hover:text-white/80 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="bg-indigo-500/20 border border-indigo-400/30 rounded-lg p-2 text-center">
                      <p className="text-indigo-300 text-xs">{getInfoMessage()}</p>
                    </div>

                    <div>
                      <label className="text-white/70 text-sm mb-1 block">Destinataire</label>
                      <select
                        value={messageForm.destinataireEmail}
                        onChange={(e) => setMessageForm({ ...messageForm, destinataireEmail: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                        disabled={!!replyTo}
                      >
                        <option value="">Sélectionner un destinataire</option>
                        {utilisateurs.map((user) => (
                          <option key={user.email} value={user.email} className="bg-gray-800">
                            {user.nom} ({user.role === "ADMIN" ? "Admin" : user.role === "AGENT" ? "Agent" : "Citoyen"}) - {user.email}
                          </option>
                        ))}
                      </select>
                      {replyTo && (
                        <p className="text-indigo-400 text-xs mt-1">
                          Destinataire verrouillé (réponse en cours)
                        </p>
                      )}
                      {utilisateurs.length === 0 && !replyTo && (
                        <p className="text-white/40 text-xs mt-1">
                          {isCitizen || isAgent 
                            ? "Aucun administrateur disponible pour le moment" 
                            : "Aucun autre utilisateur trouvé"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-white/70 text-sm mb-1 block">Type d'envoi</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="MESSAGE"
                            checked={messageForm.type === "MESSAGE"}
                            onChange={(e) => setMessageForm({ ...messageForm, type: e.target.value })}
                            className="text-indigo-500"
                          />
                          <MessageCircle className="w-4 h-4 text-indigo-400" />
                          <span className="text-white text-sm">Message</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="EMAIL"
                            checked={messageForm.type === "EMAIL"}
                            onChange={(e) => setMessageForm({ ...messageForm, type: e.target.value })}
                            className="text-indigo-500"
                          />
                          <Mail className="w-4 h-4 text-sky-400" />
                          <span className="text-white text-sm">Email</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-white/70 text-sm mb-1 block">Sujet</label>
                      <input
                        type="text"
                        value={messageForm.sujet}
                        onChange={(e) => setMessageForm({ ...messageForm, sujet: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="Sujet du message"
                      />
                    </div>

                    <div>
                      <label className="text-white/70 text-sm mb-1 block">Message</label>
                      <textarea
                        value={messageForm.contenu}
                        onChange={(e) => setMessageForm({ ...messageForm, contenu: e.target.value })}
                        rows={4}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                        placeholder="Votre message..."
                        autoFocus={!!replyTo}
                      />
                    </div>

                    <div className="flex gap-2">
                      {replyTo && (
                        <button
                          onClick={annulerReponse}
                          className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2 rounded-lg transition-all duration-300"
                        >
                          Annuler
                        </button>
                      )}
                      <button
                        onClick={envoyerMessage}
                        disabled={isLoading || (utilisateurs.length === 0 && !replyTo)}
                        className={`${replyTo ? 'flex-1' : 'w-full'} bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send size={16} />
                            {replyTo ? "Envoyer la réponse" : (messageForm.type === "MESSAGE" ? "Envoyer le message" : "Envoyer l'email")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}