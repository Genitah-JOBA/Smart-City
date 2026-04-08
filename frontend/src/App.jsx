import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Navbar";
import Auth from "./Auth";  // Changé: auth → Auth (première lettre en majuscule)

// Pages Citoyen
import Signalements from "./Signalements";
import Signaler from "./Signaler";
import MesSignalements from "./MesSignalements";
import Carte from "./Carte";
import Profil from "./Profil";

// Pages Agent
import AgentDashboard from "./AgentDashboard";
import AgentSignalementsAssignes from "./AgentSignalementsAssignes";
import AgentInterventions from "./AgentInterventions";
import AgentProfil from "./AgentProfil";

// Pages Admin
import AdminDashboard from "./AdminDashboard";
//import AdminSignalements from "./AdminSignalements";
//import AdminUtilisateurs from "./AdminUtilisateurs";
//import AdminStatistiques from "./AdminStatistiques";
//import AdminProfil from "./AdminProfil";

function App() {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  // Composant wrapper qui affiche la Navbar si l'utilisateur est connecté
  const ProtectedLayout = ({ children }) => {
    if (!token) {
      return <Navigate to="/auth" />;  // Changé: /Auth → /auth (minuscule pour correspondre à la route)
    }
    return (
      <>
        <Navbar />
        {children}
      </>
    );
  };

  // Redirection basée sur le rôle
  const getDefaultRoute = () => {
    if (!token) return "/auth";
    if (userRole === "ADMIN") return "/admin/dashboard";
    if (userRole === "AGENT") return "/agent/dashboard";
    return "/signalements";
  };

  return (
    <Router>
      <Routes>
        {/* Routes publiques (sans navbar) */}
        <Route path="/auth" element={<Auth />} />
        
        {/* ========== ROUTES CITOYEN ========== */}
        <Route path="/signalements" element={
          <ProtectedLayout>
            <Signalements />
          </ProtectedLayout>
        } />
        
        <Route path="/signaler" element={
          <ProtectedLayout>
            <Signaler />
          </ProtectedLayout>
        } />
        
        <Route path="/mes-signalements" element={
          <ProtectedLayout>
            <MesSignalements />
          </ProtectedLayout>
        } />
        
        <Route path="/carte" element={
          <ProtectedLayout>
            <Carte />
          </ProtectedLayout>
        } />
        
        <Route path="/profil" element={
          <ProtectedLayout>
            <Profil />
          </ProtectedLayout>
        } />
        
        {/* ========== ROUTES AGENT ========== */}
        <Route path="/agent/dashboard" element={
          <ProtectedLayout>
            <AgentDashboard />
          </ProtectedLayout>
        } />
        
        <Route path="/agent/signalements-assignes" element={
          <ProtectedLayout>
            <AgentSignalementsAssignes />
          </ProtectedLayout>
        } />
        
        <Route path="/agent/interventions" element={
          <ProtectedLayout>
            <AgentInterventions />
          </ProtectedLayout>
        } />
        
        <Route path="/agent/profil" element={
          <ProtectedLayout>
            <AgentProfil />
          </ProtectedLayout>
        } />
        
        {/* Ancienne route Agent (compatibilité) */}
        <Route path="/agent/signalements-resolus" element={
          <ProtectedLayout>
            <AgentSignalementsAssignes />
          </ProtectedLayout>
        } />
        
        {/* ========== ROUTES ADMIN ========== */}
        <Route path="/admin/dashboard" element={
          <ProtectedLayout>
            <AdminDashboard />
          </ProtectedLayout>
        } />
        
        {/* Routes Admin commentées temporairement
        <Route path="/admin/signalements" element={
          <ProtectedLayout>
            <AdminSignalements />
          </ProtectedLayout>
        } />
        
        <Route path="/admin/utilisateurs" element={
          <ProtectedLayout>
            <AdminUtilisateurs />
          </ProtectedLayout>
        } />
        
        <Route path="/admin/statistiques" element={
          <ProtectedLayout>
            <AdminStatistiques />
          </ProtectedLayout>
        } />
        
        <Route path="/admin/profil" element={
          <ProtectedLayout>
            <AdminProfil />
          </ProtectedLayout>
        } />
        */}
        
        {/* Ancienne route Admin (compatibilité) */}
        <Route path="/admin/problemes" element={
          <ProtectedLayout>
            <AdminDashboard />
          </ProtectedLayout>
        } />
        
        {/* Redirection par défaut */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} />} />
        
        {/* Route 404 - Page non trouvée */}
        <Route path="*" element={<Navigate to={getDefaultRoute()} />} />
      </Routes>
    </Router>
  );
}

export default App;