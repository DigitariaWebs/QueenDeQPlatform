import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardHome from './components/Pages/DashboardHome';
import PoicheChatPage from './components/Pages/PoicheChatPage';
import MiroirChatPremium from './components/Pages/MiroirChatPage';
import JournalPage from './components/Pages/JournalPage';
import SalonChatPage from './components/Pages/SalonChatPage';
import StatsPage from "./components/Pages/StatsPage";
import AuthPage from "./components/Pages/AuthPage";
import { useAuth } from "./context/AuthContext";

const AppContent = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
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
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
