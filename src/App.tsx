import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardHome from './components/Pages/DashboardHome';
import PoicheChatPage from './components/Pages/PoicheChatPage';
import MiroirChatPage from './components/Pages/MiroirChatPage';
import JournalPage from './components/Pages/JournalPage';
import SalonChatPage from './components/Pages/SalonChatPage';




const AppContent = () => {
  // No auth logic, always show app
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="/poiche" element={<PoicheChatPage />} />
        <Route path="/miroir" element={<MiroirChatPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/salon" element={<SalonChatPage />} />
        

      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
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
