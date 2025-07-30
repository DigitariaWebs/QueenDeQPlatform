import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/Auth/AuthPage';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardHome from './components/Pages/DashboardHome';
import CardsPage from './components/Pages/PoicheChatPage';
import QuizPage from './components/Pages/MiroirChatPage';
import JournalPage from './components/Pages/JournalPage';
import RoyaumePage from './components/Pages/RoyaumePage';
import ChatPage from './components/Pages/SalonChatPage';

import ShopPage from './components/Pages/ShopPage';


const AppContent = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="/cards" element={<CardsPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/royaume" element={<RoyaumePage />} />
        <Route path="/chat" element={<ChatPage />} />
        
        <Route path="/shop" element={<ShopPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
