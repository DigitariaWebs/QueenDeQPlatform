import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
// import TopBar from './TopBar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [starPositions, setStarPositions] = useState<Array<{x: number, y: number, delay: number}>>([]);

  useEffect(() => {
    // Generate random star positions for background
    const stars = Array.from({ length: 15 }, (_, _index) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setStarPositions(stars);
  }, []);

  return (
    <div className="flex h-screen bg-royal-purple relative overflow-hidden">
      {/* Animated Background Stars */}
      {starPositions.map((star, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
          style={{ left: `${star.x}%`, top: `${star.y}%` }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: star.delay }}
        />
      ))}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 relative z-10">      
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="royal-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;