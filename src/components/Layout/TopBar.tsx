import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bars3Icon, 
  MusicalNoteIcon, 
  SpeakerXMarkIcon,
  SparklesIcon,
  UserCircleIcon,
  PowerIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';

interface TopBarProps {
  onMenuClick: () => void;
}

interface SpotsData {
  available: number;
  total: number;
  nextEvent: string;
}

const TopBar = ({ onMenuClick }: TopBarProps) => {
  const { user, logout } = useAuth();
  const { isPlaying, isLoading, controls } = useMusicPlayer('/audio/Roie Shpigler - Marbles.mp3', { 
    autoPlay: false, // TopBar doesn't trigger auto-play, just controls it
    targetVolume: 0.10 
  });
  const [spotsData] = useState<SpotsData>({
    available: 7,
    total: 20,
    nextEvent: "Tea Time — 13 juillet 19h GMT+1"
  });

  const handleMusicToggle = () => {
    controls.toggle();
  };

  return (
    <header className="bg-royal-purple/80 shadow-soft border-b border-royal-gold/20">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Menu & Welcome */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-royal-gold/10 transition-colors"
            >
              <Bars3Icon className="w-6 h-6 text-royal-purple" />
            </button>
            
            <div className="hidden sm:block">
              <h2 className="text-royal-purple font-serif text-2xl font-bold">
                Bonjour, {user?.firstName}
              </h2>
              <p className="text-cabinet-aubergine/70 text-sm font-sans">
                Bienvenue dans votre royaume personnel
              </p>
            </div>
          </div>

          {/* Right side - Widgets */}
          <div className="flex items-center space-x-4">
            {/* Spots Left Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="hidden md:flex items-center space-x-2 bg-royal-purple/60 rounded-full px-4 py-2 border border-royal-gold/30"
            >
              <SparklesIcon className="w-4 h-4 text-royal-gold" />
              <span className="text-royal-purple font-sans font-medium text-sm">
                {spotsData.available} spots left
              </span>
            </motion.div>

            {/* Music Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMusicToggle}
              className={`p-3 rounded-full transition-all duration-200 ${
                isPlaying 
                  ? 'bg-royal-gold text-royal-purple border border-royal-gold/30' 
                  : 'bg-royal-purple/10 text-royal-pearl hover:bg-royal-purple/20'
              }`}
              title={isPlaying ? 'Pause music' : 'Play music'}
              aria-pressed={isPlaying}
              aria-label={isPlaying ? 'Music on' : 'Music off'}
              disabled={isLoading}
            >
              {isPlaying ? (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <MusicalNoteIcon className="w-5 h-5" />
                </motion.div>
              ) : (
                <SpeakerXMarkIcon className="w-5 h-5" />
              )}
            </motion.button>

            {/* User Menu */}
            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-royal-gold/10 transition-colors">
                <UserCircleIcon className="w-6 h-6 text-royal-purple" />
                <span className="hidden sm:block text-royal-purple font-sans font-medium text-sm">
                  {user?.firstName}
                </span>
              </button>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-royal-pearl rounded-lg shadow-royal border border-royal-gold/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b border-royal-gold/20">
                  <p className="text-royal-purple font-sans font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-cabinet-aubergine/70 text-xs">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left text-cabinet-aubergine hover:bg-royal-gold/10 hover:text-royal-purple transition-colors rounded-b-lg"
                >
                  <PowerIcon className="w-4 h-4" />
                  <span className="font-sans text-sm">Se déconnecter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;