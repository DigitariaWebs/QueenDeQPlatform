import { 
  Bars3Icon, 
  UserCircleIcon,
  PowerIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar = ({ onMenuClick }: TopBarProps) => {
  const { user, logout } = useAuth();

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
                Bienvenue dans ton royaume personnel
              </p>
            </div>
          </div>

          {/* Right side - Widgets */}
          <div className="flex items-center space-x-4">
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