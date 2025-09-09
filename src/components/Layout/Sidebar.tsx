import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { easeInOut } from 'framer-motion';
import {
  BookOpenIcon,
  ShoppingBagIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  SparklesIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { logout } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { useAuth0 } from "@auth0/auth0-react";

// Custom icon component for Unicode U+26E8 (Black Cross On Shield)
const BlackCrossOnShieldIcon = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-block ${className} text-[20px] leading-[20px]`}
    role="img"
    aria-label="Black Cross On Shield"
  >
    {"\u26E8"}
  </span>
);

// Custom icon component for Unicode U+2655 (White Chess Queen)
const WhiteChessQueenIcon = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-block ${className} text-[20px] leading-[20px]`}
    role="img"
    aria-label="White Chess Queen"
  >
    {"\u2655"}
  </span>
);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  showInscriptionLink?: boolean;
}

const navItems = [
  {
    name: "Cards",
    path: "/poiche",
    icon: BlackCrossOnShieldIcon,
    label: "Ta pioche",
  },
  {
    name: "Quiz",
    path: "/miroir",
    icon: WhiteChessQueenIcon,
    label: "Miroir, Miroir!",
  },
  {
    name: "Chat",
    path: "/salon",
    icon: ChatBubbleLeftRightIcon,
    label: "Salon de thé",
  },
  {
    name: "Dashboard",
    external: true,
    url: "https://le-royaume-de-queen-de-q.mn.co/",
    icon: SparklesIcon,
    label: "Royaume Queen de Q",
  },
  {
    name: "Journal",
    path: "/journal",
    icon: BookOpenIcon,
    label: "La Gazette du Royaume",
  },
  // 'About' or 'Stats' will be injected dynamically depending on user role
  {
    name: "Shop",
    external: true,
    url: "https://www.redbubble.com/fr/people/QueensdeQ/shop?asc=u",
    icon: ShoppingBagIcon,
    label: "La boutique",
  },
  // ...other static items
];

const Sidebar = ({
  isOpen,
  onClose,
  showInscriptionLink = false,
}: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Handle escape key to close sidebar on mobile
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLargeScreen) {
        onClose();
      }
    };

    if (isOpen && !isLargeScreen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when sidebar is open on mobile
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isLargeScreen, onClose]);

  const sidebarAnimation = {
    initial: { x: isLargeScreen ? 0 : -320 },
    animate: {
      x: isLargeScreen ? 0 : isOpen ? 0 : -320,
    },
    transition: { duration: 0.3, ease: easeInOut },
  };

  const { user } = useAuth();
  const { logout: auth0Logout } = useAuth0();
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && !isLargeScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={sidebarAnimation.initial}
        animate={sidebarAnimation.animate}
        transition={sidebarAnimation.transition}
        className="fixed lg:static inset-y-0 left-0 z-30 w-80 lg:w-70 bg-royal-purple shadow-royal lg:shadow-none border-r border-royal-gold/20"
      >
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-royal-gold/20">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <img
                    src="/assets/images/logo-gold.webp"
                    alt="Queen de Q"
                    className="h-8 w-auto drop-shadow-md"
                  />
                </div>
                <div>
                  <h1 className="text-royal-pearl font-serif text-xl font-bold">
                    Queen de Q
                  </h1>
                </div>
              </Link>
              <button
                onClick={onClose}
                className="lg:hidden text-royal-pearl hover:text-royal-champagne transition-colors p-1 rounded-lg hover:bg-royal-gold/10"
                aria-label="Close menu"
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
                      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group text-royal-pearl hover:bg-royal-gold/10 hover:text-royal-champagne"
                    }
                  >
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110 text-royal-pearl" />
                    <span className="font-sans font-medium">{item.label}</span>
                  </a>
                );
              }
              const isActive = location.pathname === item.path;
              return item.path ? (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "bg-royal-gold text-royal-purple border-l-4 border-royal-gold"
                      : "text-royal-pearl hover:bg-royal-gold/10 hover:text-royal-champagne"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? "text-royal-purple" : "text-royal-pearl"
                    }`}
                  />
                  <span className="font-sans font-medium">{item.label}</span>
                </Link>
              ) : null;
            })}
            {/* Dynamic link: show admin-only Stats, otherwise show About external link */}
            {user && user.role === "admin" ? (
              <Link
                to="/stats"
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  location.pathname === "/stats"
                    ? "bg-royal-gold text-royal-purple border-l-4 border-royal-gold"
                    : "text-royal-pearl hover:bg-royal-gold/10 hover:text-royal-champagne"
                }`}
              >
                <InformationCircleIcon
                  className={`w-5 h-5 ${
                    location.pathname === "/stats"
                      ? "text-royal-purple"
                      : "text-royal-pearl"
                  }`}
                />
                <span className="font-sans font-medium">Statistiques</span>
              </Link>
            ) : (
              <a
                href="https://queen-de-q.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className={
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group text-royal-pearl hover:bg-royal-gold/10 hover:text-royal-champagne"
                }
              >
                <InformationCircleIcon className="w-5 h-5 text-royal-pearl" />
                <span className="font-sans font-medium">À propos</span>
              </a>
            )}
            {showInscriptionLink && (
              <Link
                to="/auth?mode=signup"
                onClick={onClose}
                className="mt-4 flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 group text-royal-purple bg-royal-gold hover:bg-royal-champagne font-medium"
              >
                Inscription
              </Link>
            )}
          </nav>

          {/* Footer + TopBar widgets */}
          <div
            className="p-6 pb-20 lg:pb-6 border-t border-royal-gold/20 space-y-4"
            style={{
              paddingBottom: "max(5rem, env(safe-area-inset-bottom, 5rem))",
            }}
          >
            {/* Enhanced Sidebar Widgets */}
            <div className="flex flex-col gap-4 mt-2">
              {/* Profile Menu */}
              <div className="relative group w-full flex flex-col items-stretch">
                {user ? (
                  <div className="flex items-center justify-between w-full p-3 rounded-xl bg-royal-purple/20 border border-royal-gold/20">
                    <div className="flex items-center gap-2 text-royal-pearl">
                      <UserCircleIcon className="w-6 h-6 text-royal-gold" />
                      <span className="font-sans text-sm">{user.name}</span>
                    </div>
                    <button
                      onClick={async () => {
                        // Always clear local storage first
                        logout();
                        
                        // Check if user is logged in via Auth0
                        if (user?.authProvider === 'auth0') {
                          // Use Auth0 logout without returnTo - it will use default configured URL
                          auth0Logout();
                        } else {
                          // Navigate manually for non-Auth0 users
                          navigate("/auth", { replace: true });
                        }
                        onClose();
                      }}
                      className="text-royal-gold hover:text-royal-champagne text-sm"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    className="flex items-center justify-center w-full p-3 rounded-xl bg-royal-purple/20 hover:bg-royal-gold/10 transition-colors border border-royal-gold/20 shadow-soft focus:outline-none focus:ring-2 focus:ring-royal-gold/60 focus:ring-offset-2 focus:ring-offset-royal-purple/80"
                    onClick={() => {
                      navigate("/auth");
                      onClose();
                    }}
                  >
                    <UserCircleIcon className="w-6 h-6 text-royal-gold" />
                    <span className="text-royal-gold font-sans font-semibold text-base ml-2">
                      Se connecter / S'inscrire
                    </span>
                  </button>
                )}
                {/* Dropdown menu (opens upwards, themed colors, matches button width) */}
                <div className="mt-2 lg:mt-3 text-center">
                  <p className="text-royal-champagne font-sans text-xs sm:text-sm lg:text-base leading-snug">
                    Révèle ta puissance intérieure
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