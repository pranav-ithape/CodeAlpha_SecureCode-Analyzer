import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SideNavBarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const SideNavBar: React.FC<SideNavBarProps> = ({ isOpen, toggleSidebar }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  interface NavItem {
    name: string;
    path: string;
    icon: string;
    badge?: string;
    count?: number;
  }

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'New Scan', path: '/new-scan', icon: 'add_moderator' },
    { name: 'Projects', path: '/projects', icon: 'folder_special' },
    { name: 'Findings', path: '/findings', icon: 'bug_report' },
    { name: 'Recommendations', path: '/recommendations', icon: 'lightbulb' },
    { name: 'Scan History', path: '/scan-history', icon: 'history' },
    { name: 'Reports', path: '/reports', icon: 'assessment' },
    { name: 'Security Rules', path: '/security-rules', icon: 'rule' },
    { name: 'Secure Coding Guide', path: '/secure-coding-guide', icon: 'menu_book' },
  ];

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-30 flex flex-col justify-between p-space-sm border-r border-outline-variant/50 bg-surface-container-lowest/70 backdrop-blur-xl transition-all duration-300">
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-space-sm py-space-xs border-b border-outline-variant pb-space-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container flex-shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="truncate">
              <div className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight truncate leading-tight">SecureCode Auditor</div>
              <div className="font-label-code-sm text-label-code-sm text-outline flex items-center gap-1.5">
                <span className="text-secondary font-medium">SAST Platform</span>
              </div>
            </div>
          </div>
          <button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors" onClick={toggleSidebar}>
            <span className="material-symbols-outlined text-sm">menu</span>
          </button>
        </div>
        


        
        <nav className="flex flex-col gap-0.5 mt-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded text-left font-label-code-sm text-label-code-sm transition-all duration-150 active:scale-[0.99] ${
                  isActive
                    ? 'bg-surface-container-high text-primary border-l-2 border-primary font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-on-primary font-label-code-sm font-semibold">{item.badge}</span>
              )}
              {item.count !== undefined && (
                <span className="text-label-code-sm text-outline px-1.5 py-[1px] rounded bg-surface-container">{item.count}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="flex flex-col gap-2 pt-space-sm border-t border-outline-variant">
        <NavLink 
          to="/settings"
          className={({ isActive }) => `flex items-center gap-2.5 px-3 py-1.5 rounded font-label-code-sm text-label-code-sm transition-colors ${isActive ? 'bg-surface-container-high text-primary font-medium' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'}`}
        >
          <span className="material-symbols-outlined text-base">settings</span>
          <span>Settings</span>
        </NavLink>
        <a className="flex items-center gap-2.5 px-3 py-1.5 rounded font-label-code-sm text-label-code-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors" href="#">
          <span className="material-symbols-outlined text-base">menu_book</span>
          <span>Documentation</span>
        </a>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded font-label-code-sm text-label-code-sm text-error hover:bg-error/10 hover:text-error transition-colors w-full text-left"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default SideNavBar;
