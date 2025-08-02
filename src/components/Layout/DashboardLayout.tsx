import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
// import TopBar from './TopBar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [starPositions, setStarPositions] = useState<Array<{x: number, y: number, delay: number}>>([]);

  useEffect(() => {
    // Generate random star positions for background
    const stars = Array.from({ length: 25 }, (_, _index) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setStarPositions(stars);
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#2d133e] via-[#130926] to-black/95 relative overflow-hidden">
      {/* Animated Background Stars */}
      {starPositions.map((star, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-royal-gold rounded-full pointer-events-none"
          style={{ left: `${star.x}%`, top: `${star.y}%` }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: star.delay }}
        />
      ))}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 relative z-10">
        {/* Mobile Top Bar with Burger Menu */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-royal-purple/20 backdrop-blur-sm border-b border-royal-gold/20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-royal-pearl hover:text-royal-gold hover:bg-royal-gold/10 transition-colors focus:outline-none focus:ring-2 focus:ring-royal-gold/60"
            aria-label="Open menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-3">
            <img 
              src="/assets/images/logo-gold.webp" 
              alt="Queen de Q" 
              className="h-6 w-auto drop-shadow-md"
            />
            <h1 className="text-royal-pearl font-serif text-lg font-bold">Queen de Q</h1>
          </div>
          
          <div className="w-10" /> {/* Spacer for center alignment */}
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8" style={{ paddingBottom: 'max(5rem, env(safe-area-inset-bottom, 5rem))' }}>
          <div className="royal-wrapper max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;