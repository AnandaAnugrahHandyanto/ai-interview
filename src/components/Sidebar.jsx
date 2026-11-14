import React from 'react';
import { 
  LayoutDashboard, 
  PlayCircle, 
  History, 
  Lightbulb, 
  User, 
  X, 
  Bot
} from 'lucide-react';

export default function Sidebar({ 
  activeMenu, 
  onSelectMenu, 
  isCollapsed, 
  isMobileOpen, 
  onCloseMobile 
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'start', label: 'Mulai Interview', icon: PlayCircle },
    { id: 'history', label: 'Riwayat Interview', icon: History },
    { id: 'tips', label: 'Tips Interview', icon: Lightbulb },
    { id: 'profile', label: 'Profil Saya', icon: User },
  ];

  const handleItemClick = (id) => {
    onSelectMenu(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar-mobile-overlay" 
          onClick={onCloseMobile}
          aria-hidden="true" 
        />
      )}

      <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo & Brand Header (Bersih tanpa tombol ganda pada desktop) */}
        <div className="sidebar-brand-header">
          <div className="brand-logo-icon">
            <Bot size={22} className="logo-svg" />
            <span className="logo-glow" />
          </div>

          <div className="brand-text-block">
            <span className="brand-title">DevInterview</span>
            <span className="brand-tag">AI HRD Platform</span>
          </div>

          {/* Tombol Tutup Khusus Layar Mobile Drawer (X) */}
          {isMobileOpen && (
            <button 
              className="sidebar-mobile-close-btn" 
              onClick={onCloseMobile}
              aria-label="Tutup Menu"
              title="Tutup Menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-group-label">
            MENU UTAMA
          </div>

          <ul className="nav-menu-list">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <li key={item.id}>
                  <button 
                    className={`nav-menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleItemClick(item.id)}
                    title={item.label}
                  >
                    <Icon size={20} className="nav-item-icon" />
                    <span className="nav-item-label">{item.label}</span>
                    {isActive && <span className="active-indicator" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Support / HR info */}
        <div className="sidebar-interviewer-card">
          <div className="interviewer-mini-badge">
            <span className="online-pulse-dot" />
            <span>HRD Alex Rivera</span>
          </div>
          <p className="interviewer-subtext">Latihan wawancara interaktif kapan saja dengan AI HRD profesional.</p>
        </div>
      </aside>
    </>
  );
}
