import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { easeInOut } from 'framer-motion';
import { 
  RectangleStackIcon, 
  ChatBubbleLeftRightIcon, 
  BookOpenIcon, 
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { 
    name: 'Cards', 
    path: '/cards', 
    icon: RectangleStackIcon,
    label: 'Cards / Cartes'
  },
  { 
    name: 'Quiz', 
    path: '/quiz', 
    icon: ClipboardDocumentListIcon,
    label: 'Quiz'
  },
  { 
    name: 'Journal', 
    path: '/journal', 
    icon: BookOpenIcon,
    label: 'Journal d\'âme'
  },
  { 
    name: 'Chat', 
    path: '/chat', 
    icon: ChatBubbleLeftRightIcon,
    label: 'Chat / Afternoon Tea'
  },
  { 
    name: 'Shop', 
    path: '/shop', 
    icon: ShoppingBagIcon,
    label: 'Shop / Boutique'
  }
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Check if screen is large (desktop)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Animation logic: visible on desktop, animated drawer on mobile
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
        className="fixed lg:static inset-y-0 left-0 z-30 w-70 bg-gradient-to-b from-royal-purple to-cabinet-aubergine shadow-royal"
      >
        <div className="flex flex-col h-full">
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
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gradient-to-r from-royal-gold/20 to-royal-champagne/20 text-royal-gold border-l-4 border-royal-gold' 
                      : 'text-royal-pearl hover:bg-royal-gold/10 hover:text-royal-champagne'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-royal-gold' : 'text-royal-pearl'
                  }`} />
                  <span className="font-sans font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-royal-gold/20">
            <div className="bg-gradient-to-r from-royal-gold/10 to-royal-champagne/10 rounded-lg p-4">
              <p className="text-royal-champagne text-sm font-sans">
                "Révélez votre reine intérieure"
              </p>
              <p className="text-royal-pearl/60 text-xs mt-1">
                © 2024 Queen de Q
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;