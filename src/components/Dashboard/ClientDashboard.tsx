import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HeartIcon,
  PowerIcon,
  SparklesIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

// Import des modules Queen de Q
import RoyalShop from '../Modules/RoyalShop';
import RoyalJournal from '../Modules/RoyalJournal';
import CardsPage from '../Pages/CardsPage';
import TarotQuiz from '../Modules/TarotQuiz';
import ChatPage from '../Pages/ChatPage';
import GoldenParticles from '../Effects/GoldenParticles';
import { CardsIcon, MirrorIcon, TeaIcon, BoutiqueIcon, JournalIcon, CrownIcon } from '../Icons/ArtDecoIcons';

interface ClientDashboardProps {
  onLogout: () => void;
  userEmail: string;
}

const ClientDashboard = ({ onLogout, userEmail }: ClientDashboardProps) => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Mon Royaume', icon: CrownIcon },
    { id: 'cards', label: 'Ta pioche', icon: CardsIcon },
    { id: 'mirror', label: 'Miroir, Miroir', icon: MirrorIcon },
    { id: 'tea', label: 'Salon de thé', icon: TeaIcon },
    { id: 'shop', label: 'Boutique Royale', icon: BoutiqueIcon },
    { id: 'journal', label: 'Journal Intime', icon: JournalIcon },
  ];


  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-title font-bold text-royal-purple">Bienvenue dans ton royaume personnel</h2>
              <p className="text-cabinet-aubergine mt-2 font-body">Explore tes archétypes et découvre ton pouvoir féminin</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-soft border border-royal-champagne/20 hover:shadow-royal transition-all duration-300">
                <div className="flex items-center">
                  <SparklesIcon className="h-8 w-8 text-cabinet-patina" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-cabinet-aubergine font-body">Cartes découvertes</p>
                    <p className="text-2xl font-bold text-royal-purple font-title">12</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-soft border border-royal-champagne/20 hover:shadow-royal transition-all duration-300">
                <div className="flex items-center">
                  <HeartIcon className="h-8 w-8 text-royal-gold" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-cabinet-aubergine font-body">Archétype dominant</p>
                    <p className="text-2xl font-bold text-royal-purple font-title">Cœur</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-soft border border-royal-champagne/20 hover:shadow-royal transition-all duration-300">
                <div className="flex items-center">
                  <BookOpenIcon className="h-8 w-8 text-cabinet-powder" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-cabinet-aubergine font-body">Entrées journal</p>
                    <p className="text-2xl font-bold text-royal-purple font-title">8</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Module Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div 
                onClick={() => setActiveSection('cards')} 
                className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-soft border border-royal-champagne/20 hover:shadow-royal transition-all duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center mb-4">
                  <CardsIcon className="h-8 w-8 text-cabinet-patina group-hover:text-royal-gold transition-colors animate-sparkle" />
                  <h3 className="text-lg font-title font-semibold text-royal-purple ml-3">Ta pioche</h3>
                </div>
                <p className="text-cabinet-aubergine font-body text-sm">Découvre les archétypes masculins à travers un tirage mystique</p>
              </motion.div>

              <motion.div 
                onClick={() => setActiveSection('mirror')} 
                className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-soft border border-royal-champagne/20 hover:shadow-royal transition-all duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center mb-4">
                  <MirrorIcon className="h-8 w-8 text-cabinet-powder group-hover:text-royal-gold transition-colors animate-float" />
                  <h3 className="text-lg font-title font-semibold text-royal-purple ml-3">Miroir, Miroir</h3>
                </div>
                <p className="text-cabinet-aubergine font-body text-sm">Révèle ton archétype féminin avec notre quiz mystique</p>
              </motion.div>

              <motion.div 
                onClick={() => setActiveSection('tea')} 
                className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-soft border border-royal-champagne/20 hover:shadow-royal transition-all duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center mb-4">
                  <TeaIcon className="h-8 w-8 text-royal-gold group-hover:text-cabinet-patina transition-colors animate-glow" />
                  <h3 className="text-lg font-title font-semibold text-royal-purple ml-3">Salon de thé</h3>
                </div>
                <p className="text-cabinet-aubergine font-body text-sm">Converse avec la Reine-Mère pour des conseils avisés</p>
              </motion.div>

              <motion.div 
                onClick={() => setActiveSection('shop')} 
                className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-soft border border-royal-champagne/20 hover:shadow-royal transition-all duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center mb-4">
                  <BoutiqueIcon className="h-8 w-8 text-cabinet-patina group-hover:text-royal-gold transition-colors animate-float" />
                  <h3 className="text-lg font-title font-semibold text-royal-purple ml-3">Boutique Royale</h3>
                </div>
                <p className="text-cabinet-aubergine font-body text-sm">Cartes physiques et objets mystiques pour ta collection</p>
              </motion.div>

              <motion.div 
                onClick={() => setActiveSection('journal')} 
                className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-soft border border-royal-champagne/20 hover:shadow-royal transition-all duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center mb-4">
                  <JournalIcon className="h-8 w-8 text-cabinet-powder group-hover:text-royal-gold transition-colors animate-sparkle" />
                  <h3 className="text-lg font-title font-semibold text-royal-purple ml-3">Journal Intime</h3>
                </div>
                <p className="text-cabinet-aubergine font-body text-sm">Consigne tes réflexions et ton parcours introspectif</p>
              </motion.div>
            </div>
          </div>
        );
      
      case 'cards':
        return <CardsPage />;
      
      case 'mirror':
        return <TarotQuiz />;
      
      case 'tea':
        return <ChatPage />;
      
      case 'shop':
        return <RoyalShop />;
      
      case 'journal':
        return <RoyalJournal />;
      
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{menuItems.find(item => item.id === activeSection)?.label}</h2>
            <p className="text-gray-600">Contenu de la section {activeSection} en cours de développement...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex relative">
      <GoldenParticles intensity="low" interactive={true} />
      {/* Sidebar */}
      <div className="w-64 bg-gradient-cabinet shadow-royal hidden lg:block">
        <div className="p-6 border-b border-cabinet-patina/20">
          <button 
            onClick={() => setActiveSection('dashboard')}
            className="flex items-center space-x-3 w-full text-left hover:bg-cabinet-patina/10 rounded-lg p-2 -m-2 transition-all duration-200"
          >
            <div className="relative">
              <img 
                src="/assets/images/logo-gold.webp" 
                alt="Queen de Q" 
                className="h-8 w-auto drop-shadow-md"
              />
              <div className="absolute inset-0 bg-cabinet-patina/20 blur-lg rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-title font-bold text-cabinet-powder">Mon Royaume</h1>
              <p className="text-xs text-cabinet-parchment font-body">Espace noble</p>
            </div>
          </button>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left text-sm font-medium font-body transition-all duration-300 ${
                  activeSection === item.id
                    ? 'bg-cabinet-patina/20 text-cabinet-powder border-r-2 border-cabinet-patina'
                    : 'text-cabinet-parchment hover:bg-cabinet-patina/10 hover:text-cabinet-powder'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 w-64 p-6 border-t border-cabinet-patina/20 bg-gradient-cabinet">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-cabinet-patina rounded-full flex items-center justify-center">
              <span className="text-cabinet-aubergine text-sm font-bold font-title">C</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-cabinet-powder font-body">Noble Cliente</p>
              <p className="text-xs text-cabinet-parchment font-body">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-cabinet-parchment hover:text-cabinet-powder hover:bg-cabinet-patina/10 rounded-md transition-all duration-200 font-body"
          >
            <PowerIcon className="h-4 w-4 mr-2" />
            Quitter le royaume
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-cabinet border-t border-cabinet-patina/20 p-4 z-10">
        <div className="flex justify-around">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex flex-col items-center space-y-1 px-2 py-1 rounded-lg transition-all duration-300 ${
                  activeSection === item.id
                    ? 'text-cabinet-powder bg-cabinet-patina/20'
                    : 'text-cabinet-parchment hover:text-cabinet-powder'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-body">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 pb-20 lg:pb-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default ClientDashboard;
