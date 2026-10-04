import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SideNavBar from '../components/SideNavBar';
import TopNavBar from '../components/TopNavBar';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-on-surface font-body-md text-body-md antialiased select-none">
      <SideNavBar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <TopNavBar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-space-lg relative" id="spa-canvas">
          <div key={location.pathname} className="premium-animate-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
