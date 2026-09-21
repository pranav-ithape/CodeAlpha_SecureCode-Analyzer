import React from 'react';
import { NavLink } from 'react-router-dom';

interface SideNavBarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const SideNavBar: React.FC<SideNavBarProps> = ({ isOpen, toggleSidebar }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'New Review', path: '/new-review', icon: 'security', badge: 'NEW' },
    { name: 'Projects', path: '/projects', icon: 'folder_special' },
    { name: 'Scan History', path: '/history', icon: 'history' },
    { name: 'Vulnerabilities', path: '/vulnerabilities', icon: 'bug_report', count: '0' },
    { name: 'Recommendations', path: '/recommendations', icon: 'verified_user' },
    { name: 'Reports', path: '/reports', icon: 'assessment' },
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
                <span className="text-secondary font-medium">v4.2</span>
                <span>•</span>
                <span className="truncate">SecOps</span>
              </div>
            </div>
          </div>
          <button className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors" onClick={toggleSidebar}>
            <span className="material-symbols-outlined text-sm">left_panel_close</span>
          </button>
        </div>
        
        <div className="px-space-sm py-1.5 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-between text-on-surface-variant cursor-pointer hover:border-outline transition-colors">
          <div className="flex items-center gap-2 truncate">
            <span className="material-symbols-outlined text-xs text-primary">domain</span>
            <span className="text-label-code-sm font-label-code-sm truncate">Acme / Prod-SecOps</span>
          </div>
          <span className="material-symbols-outlined text-xs">unfold_more</span>
        </div>
        
        <div className="px-space-xs">
          <NavLink to="/new-review" className="w-full h-9 px-3 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container font-headline-sm text-label-code-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] shadow-sm">
            <span className="material-symbols-outlined text-base">add_moderator</span>
            <span>Quick Triage</span>
          </NavLink>
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
        <div className="flex items-center justify-between px-3 py-1.5 rounded font-label-code-sm text-label-code-sm text-on-surface-variant bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-secondary">terminal</span>
            <span>API Status</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-secondary font-medium">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
            <span>99.98%</span>
          </span>
        </div>
        
        <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container border border-outline-variant">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded bg-surface-container-highest flex items-center justify-center font-label-code-sm text-primary font-bold">
              SC
            </div>
            <div className="truncate">
              <div className="font-headline-sm text-body-sm font-semibold text-on-surface truncate">SecOps Lead</div>
              <div className="font-label-code-sm text-[10px] text-outline truncate">alex@acme.corp</div>
            </div>
          </div>
          <span className="material-symbols-outlined text-sm text-outline">more_vert</span>
        </div>
      </div>
    </aside>
  );
};

export default SideNavBar;
