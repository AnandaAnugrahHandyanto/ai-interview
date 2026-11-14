import React, { useState } from 'react';
import { Menu, Calendar } from 'lucide-react';

export default function DashboardHeader({ 
  userName = 'Fathur', 
  isSidebarOpen = true,
  onToggleSidebar,
  onOpenProfile
}) {
  // Format tanggal hari ini dalam Bahasa Indonesia
  const [todayFormatted] = useState(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
  });

  return (
    <header className="dashboard-top-header">
      <div className="header-left">
        {/* Toggle Hamburger Button (Desktop & Mobile) */}
        <button 
          className="dashboard-hamburger-btn" 
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
          title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          <Menu size={20} />
        </button>

        <div className="header-greeting-block">
          <h1 className="header-greeting-title">
            Selamat Datang, <span className="highlight-username">{userName}</span>!
          </h1>
          <p className="header-greeting-sub">
            Siap meningkatkan kemampuan interview Anda hari ini?
          </p>
        </div>
      </div>

      <div className="header-right">
        {/* Date Badge */}
        <div className="header-date-badge">
          <Calendar size={15} className="date-icon" />
          <span>{todayFormatted}</span>
        </div>

        {/* User Profile Pill */}
        <div className="header-user-profile" onClick={onOpenProfile} role="button" tabIndex={0}>
          <div className="profile-avatar-circle">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-details-mini">
            <span className="profile-name-text">{userName}</span>
            <span className="profile-status-badge">Kandidat Aktif</span>
          </div>
        </div>
      </div>
    </header>
  );
}
