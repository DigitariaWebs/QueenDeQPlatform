import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useBackgroundMusic } from '../../hooks/useBackgroundMusic';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Initialize background music with auto-play enabled
  useBackgroundMusic();

  return (
    <div className="flex h-screen bg-gradient-to-br from-royal-pearl to-cabinet-parchment">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Bar */}
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="royal-wrapper space-y-12 lg:space-y-16 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;