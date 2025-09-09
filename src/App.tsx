import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardHome from './components/Pages/DashboardHome';
import PoicheChatPage from './components/Pages/PoicheChatPage';
import MiroirChatPremium from './components/Pages/MiroirChatPage';
import JournalPage from './components/Pages/JournalPage';
import SalonChatPage from './components/Pages/SalonChatPage';
import StatsPage from "./components/Pages/StatsPage";
import AuthPage from "./components/Pages/AuthPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Auth0ProviderWithConfig } from "./context/Auth0Provider";

const AppContent = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  // Show loading during authentication transitions
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2d133e] via-[#130926] to-black/95 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-lg">Authentification en cours...</p>
          <p className="text-sm text-zinc-400 mt-2">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      {user ? (
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="/poiche" element={<PoicheChatPage />} />
          <Route path="/miroir" element={<MiroirChatPremium />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/salon" element={<SalonChatPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Route>
      ) : (
        <Route path="/*" element={<Navigate to="/auth" replace />} />
      )}
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Auth0ProviderWithConfig>
      <Router>
        <AppContent />
      </Router>
    </Auth0ProviderWithConfig>
  );
}

export default App;
