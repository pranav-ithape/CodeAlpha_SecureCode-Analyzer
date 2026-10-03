import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SideNavBarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const SideNavBar: React.FC<SideNavBarProps> = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

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
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-30 flex flex-col justify-between p-space-sm border-r border-outline-variant bg-surface-container-lowest transition-all duration-300">
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-space-sm py-space-xs border-b border-outline-variant pb-space-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-xl">shield</span>
            </div>
            <div className="truncate">
              <div className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight truncate leading-tight">SecureCode</div>
              <div className="font-label-code-sm text-label-code-sm text-outline flex items-center gap-1.5">
                <span className="text-secondary font-medium">SAST Platform</span>
              </div>
            </div>
          </div>
          <button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors" onClick={toggleSidebar}>
            <span className="material-symbols-outlined text-sm">left_panel_close</span>
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
        <a className="flex items-center gap-2.5 px-3 py-1.5 rounded font-label-code-sm text-label-code-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors" href="#">
          <span className="material-symbols-outlined text-base">menu_book</span>
          <span>Documentation</span>
        </a>

        <div className="relative">
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center justify-between p-2 rounded-lg bg-surface-container border border-outline-variant cursor-pointer hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded bg-surface-container-highest flex items-center justify-center font-label-code-sm text-primary font-bold">
                {user?.name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <div className="font-headline-sm text-body-sm font-semibold text-on-surface truncate">{user?.name || 'User Account'}</div>
                <div className="font-label-code-sm text-[10px] text-outline truncate">{user?.email || 'user@example.com'}</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-sm text-outline">more_vert</span>
          </div>

          {showDropdown && (
            <div className="absolute bottom-full left-0 mb-2 w-full rounded-lg bg-surface-container-high border border-outline-variant shadow-lg z-50">
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-container-highest rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default SideNavBar;
