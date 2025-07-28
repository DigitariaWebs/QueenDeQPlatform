import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { easeInOut } from 'framer-motion';
import { 
  RectangleStackIcon, 
  ChatBubbleLeftRightIcon, 
  BookOpenIcon, 
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,

  SparklesIcon,
  UserCircleIcon,
  PowerIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    name: 'Cards',
    path: '/cards',
    icon: RectangleStackIcon,
    label: 'Ta pioche'
  },
  {
    name: 'Quiz',
    path: '/quiz',
    icon: ClipboardDocumentListIcon,
    label: 'Miroir, miroir,'
  },
  {
    name: 'Chat',
    path: '/chat',
    icon: ChatBubbleLeftRightIcon,
    label: 'Salon de thé'
  },
  {
    name: 'Dashboard',
    external: true,
    url: 'https://le-royaume-de-queen-de-q.mn.co/',
    icon: SparklesIcon,
    label: 'Le Royaume Queen de Q'
  },
  {
    name: 'Journal',
    path: '/journal',
    icon: BookOpenIcon,
    label: 'Le journal du Royaume'
  },
  {
    name: 'Shop',
    external: true,
    url: 'https://www.redbubble.com/fr/people/QueensdeQ/shop?asc=u',
    icon: ShoppingBagIcon,
    label: 'La boutique'
  }
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const { user, logout } = useAuth();



  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const sidebarAnimation = {
    initial: { x: isLargeScreen ? 0 : -280 },
    animate: { 
      x: isLargeScreen ? 0 : (isOpen ? 0 : -280)
    },
    transition: { duration: 0.3, ease: easeInOut }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && !isLargeScreen && (
        <div 
          className="fixed inset-0 bg-royal-velvet/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={sidebarAnimation.initial}
        animate={sidebarAnimation.animate}
        transition={sidebarAnimation.transition}
        className="fixed lg:static inset-y-0 left-0 z-30 w-70 bg-royal-purple shadow-royal"
      >
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-royal-gold/20">
            <div className="flex items-center justify-between">
              <Link to="/" onClick={onClose} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img 
                    src="/assets/images/logo-gold.webp" 
                    alt="Queen de Q" 
                    className="h-8 w-auto drop-shadow-md"
                  />
                </div>
                <div>
                  <h1 className="text-royal-pearl font-serif text-xl font-bold">Queen de Q</h1>
                  <p className="text-royal-champagne text-sm">Dashboard</p>
                </div>
              </Link>
              <button
                onClick={onClose}
                className="lg:hidden text-royal-pearl hover:text-royal-champagne transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              // External link for shop
              if (item.external) {
                return (
                  <a
                    key={item.label}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group text-royal-pearl hover:bg-royal-gold/10 hover:text-royal-champagne'
                    }
                  >
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110 text-royal-pearl" />
                    <span className="font-sans font-medium">{item.label}</span>
                  </a>
                );
              }
              const isActive = location.pathname === item.path;
              return (
                item.path ? (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive 
                        ? 'bg-royal-gold text-royal-purple border-l-4 border-royal-gold' 
                        : 'text-royal-pearl hover:bg-royal-gold/10 hover:text-royal-champagne'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-royal-purple' : 'text-royal-pearl'
                    }`} />
                    <span className="font-sans font-medium">{item.label}</span>
                  </Link>
                ) : null
              );
            })}
          </nav>

          {/* Footer + TopBar widgets */}
          <div className="p-6 border-t border-royal-gold/20 space-y-4">
            {/* Enhanced Sidebar Widgets */}
            <div className="flex flex-col gap-4 mt-2">
              {/* User Menu */}
              <div className="relative group w-full flex flex-col items-stretch">
                <button className="flex items-center gap-2 w-full p-3 rounded-xl bg-royal-purple/20 hover:bg-royal-gold/10 transition-colors border border-royal-gold/20 shadow-soft focus:outline-none focus:ring-2 focus:ring-royal-gold/60 focus:ring-offset-2 focus:ring-offset-royal-purple/80">
                  <UserCircleIcon className="w-6 h-6 text-royal-gold" />
                  <span className="text-royal-gold font-sans font-semibold text-base">
                    {user?.firstName}
                  </span>
                </button>
                {/* Dropdown menu (opens upwards, themed colors, matches button width) */}
                <div className="absolute left-0 bottom-full mb-2 min-w-full bg-royal-purple rounded-xl shadow-royal border border-royal-gold/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4 border-b border-royal-gold/20">
                    <p className="text-royal-gold font-sans font-semibold text-base">{user?.firstName} {user?.lastName}</p>
                    <p className="text-royal-pearl/80 text-xs">{user?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-royal-pearl hover:bg-royal-gold/10 hover:text-royal-purple transition-colors rounded-t-xl font-sans text-base"
                  >
                    <PowerIcon className="w-4 h-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
                {/* Centered quote and copyright under profile */}
                <div className="bg-royal-purple/60 rounded-lg p-4 mt-4 flex flex-col items-center text-center">
                  <p className="text-royal-champagne text-sm font-sans">
                    "Révèle ta reine intérieure"
                  </p>
                  <p className="text-royal-pearl/60 text-xs mt-1">
                    © 2025 Queen de Q
                  </p>
                </div>
              </div>
            </div>

            
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;