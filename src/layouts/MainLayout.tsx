import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SideNavBar from '../components/SideNavBar';
import TopNavBar from '../components/TopNavBar';
import SEO from '../components/SEO';

const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-on-surface font-body-md text-body-md antialiased select-none relative">
      <SEO title="SecureCode Auditor Console" robots="noindex,nofollow" />

      {/* Premium Cyber Backgrounds (More visible in dark mode) */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-secondary/10 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <SideNavBar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 relative z-10 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
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
