import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardHome from './components/Pages/DashboardHome';
import PoicheChatPage from './components/Pages/PoicheChatPage';
import QuizPage from './components/Pages/MiroirChatPage';
import JournalPage from './components/Pages/JournalPage';
import RoyaumePage from './components/Pages/RoyaumePage';
import ChatPage from './components/Pages/SalonChatPage';




const AppContent = () => {
  // No auth logic, always show app
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="/cards" element={<PoicheChatPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/royaume" element={<RoyaumePage />} />
        <Route path="/chat" element={<ChatPage />} />
        

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
