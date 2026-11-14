import React, { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import StatCard from './StatCard';
import InterviewHistory from './InterviewHistory';
import InterviewTips from './InterviewTips';
import { 
  PlayCircle, 
  BookOpen, 
  Award, 
  Clock, 
  BarChart3, 
  TrendingUp, 
  User, 
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  History
} from 'lucide-react';
import alexHeroAvatar from '../assets/alex-rivera-hrd.png';
import { 
  getInterviewHistory, 
  calculateStats, 
  getUserProfile, 
  saveUserProfile,
  deleteInterviewSession,
  clearAllInterviewHistory
} from '../lib/storage';
import './Dashboard.css';

export default function Dashboard({ 
  onStartInterview, 
  onViewResult 
}) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State riwayat interview dan profil
  const [history, setHistory] = useState(() => getInterviewHistory());
  const [userProfile, setUserProfile] = useState(() => getUserProfile());

  // Statistik dihitung secara dinamis dari riwayat terkini
  const stats = useMemo(() => calculateStats(history), [history]);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editName, setEditName] = useState(() => userProfile?.name || 'Fathur');
  const [editTitle, setEditTitle] = useState(() => userProfile?.title || 'Software Engineer');

  const handleMenuSelect = (menuId) => {
    if (menuId === 'start') {
      onStartInterview();
    } else if (menuId === 'profile') {
      setIsProfileModalOpen(true);
    } else {
      setActiveMenu(menuId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    const updated = { ...userProfile, name: editName.trim(), title: editTitle.trim() };
    setUserProfile(updated);
    saveUserProfile(updated);
    setIsProfileModalOpen(false);
  };

  // Hapus satu sesi riwayat interview
  const handleDeleteHistory = (id) => {
    const updated = deleteInterviewSession(id);
    setHistory(updated);
  };

  // Hapus seluruh riwayat interview
  const handleClearAllHistory = () => {
    const updated = clearAllInterviewHistory();
    setHistory(updated);
  };

  return (
    <div className="dashboard-container">
      {/* 1. Sidebar Navigasi */}
      <Sidebar 
        activeMenu={activeMenu}
        onSelectMenu={handleMenuSelect}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className={`dashboard-main-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <DashboardHeader 
          userName={userProfile.name}
          isSidebarOpen={!isSidebarCollapsed}
          onToggleSidebar={() => {
            if (window.innerWidth <= 768) {
              setIsMobileMenuOpen(prev => !prev);
            } else {
              setIsSidebarCollapsed(prev => !prev);
            }
          }}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        <main className="dashboard-content-area">
          {/* =================================================================
              TAMPILAN 1: DASHBOARD UTAMA (RINGKAS & TIDAK TERLALU PANJANG)
             ================================================================= */}
          {activeMenu === 'dashboard' && (
            <>
              {/* Hero Section Banner */}
              <section className="dashboard-hero-banner">
                <div className="hero-banner-decor" aria-hidden="true" />

                <div className="hero-content-col">
                  <div className="hero-online-badge">
                    <span className="live-pulse-green" />
                    <span>AI Interviewer Online • Alex Rivera</span>
                  </div>

                  <h2 className="hero-title">
                    Siap Menghadapi Interview Kerja?
                  </h2>

                  <p className="hero-description">
                    Latih kemampuan wawancara Anda bersama AI HRD profesional dan dapatkan evaluasi untuk meningkatkan peluang karier.
                  </p>

                  <div className="hero-action-buttons">
                    <button 
                      className="hero-btn-primary"
                      onClick={onStartInterview}
                    >
                      <PlayCircle size={18} />
                      <span>Mulai Simulasi Interview</span>
                    </button>

                    <button 
                      className="hero-btn-secondary"
                      onClick={() => handleMenuSelect('tips')}
                    >
                      <BookOpen size={18} />
                      <span>Pelajari Tips Interview</span>
                    </button>
                  </div>
                </div>

                {/* Showcase Gambar Avatar HRD Alex Rivera */}
                <div className="hero-avatar-showcase">
                  <div className="showcase-card">
                    <img 
                      src={alexHeroAvatar} 
                      alt="Alex Rivera - HR Manager TechCorp" 
                      className="showcase-img" 
                    />
                    <div className="showcase-badge-overlay">
                      <span className="showcase-name">Alex Rivera</span>
                      <span className="showcase-role">HR Manager • TechCorp</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Empat Kartu Statistik Real (Dari LocalStorage) */}
              <section className="dashboard-stats-grid">
                <StatCard 
                  title="Total Interview"
                  value={stats.totalInterviews}
                  unit="Sesi"
                  icon={BarChart3}
                  trendLabel={stats.totalInterviews === 0 ? "Belum ada sesi" : `${stats.totalInterviews} sesi tersimpan`}
                  gradientTheme="purple"
                />

                <StatCard 
                  title="Rata-rata Skor"
                  value={stats.averageScore}
                  unit="/ 100"
                  icon={Award}
                  trendLabel={stats.averageScore >= 80 ? "Sangat Baik" : stats.averageScore >= 65 ? "Kompeten" : "Perlu Latihan"}
                  gradientTheme="blue"
                />

                <StatCard 
                  title="Total Waktu Berlatih"
                  value={stats.totalPracticeMinutes}
                  unit="Menit"
                  icon={Clock}
                  trendLabel="Akumulasi simulasi"
                  gradientTheme="amber"
                />

                <StatCard 
                  title="Perkembangan Skor"
                  value={stats.scoreGrowth > 0 ? `+${stats.scoreGrowth}` : `${stats.scoreGrowth}`}
                  unit="Poin"
                  icon={TrendingUp}
                  trend={stats.growthDirection === 'up' ? `+${stats.scoreGrowth} Poin` : stats.growthDirection === 'down' ? `-${stats.scoreGrowth} Poin` : "Tetap"}
                  trendDirection={stats.growthDirection}
                  trendLabel="Dibanding sesi lalu"
                  gradientTheme="green"
                />
              </section>

              {/* Navigasi Ringkas: Riwayat & Panduan Interview (Riwayat lengkap ada di halaman tersendiri) */}
              <section className="dashboard-shortcuts-grid">
                {/* Shortcut Riwayat Interview */}
                <div className="dashboard-shortcut-card">
                  <div className="shortcut-icon-box blue">
                    <History size={24} />
                  </div>
                  <div className="shortcut-text-block">
                    <div className="shortcut-badge-row">
                      <h3 className="shortcut-title">Riwayat Interview</h3>
                      <span className="shortcut-count-badge">
                        {history.length} Sesi Tersimpan
                      </span>
                    </div>
                    <p className="shortcut-desc">
                      Tinjau hasil evaluasi, skor kompetensi, analisis kekuatan & kelemahan, serta saran pengembangan karier dari HRD.
                    </p>
                  </div>
                  <button 
                    className="shortcut-action-btn secondary"
                    onClick={() => handleMenuSelect('history')}
                  >
                    <span>Buka Riwayat</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* Shortcut Panduan & Strategi */}
                <div className="dashboard-shortcut-card">
                  <div className="shortcut-icon-box purple">
                    <Sparkles size={24} />
                  </div>
                  <div className="shortcut-text-block">
                    <div className="shortcut-badge-row">
                      <h3 className="shortcut-title">Panduan Wawancara</h3>
                      <span className="shortcut-count-badge purple">5 Topik Tips</span>
                    </div>
                    <p className="shortcut-desc">
                      Pelajari teknik STAR, cara perkenalan diri yang memikat, hingga strategi menjawab pertanyaan sulit dengan percaya diri.
                    </p>
                  </div>
                  <button 
                    className="shortcut-action-btn"
                    onClick={() => handleMenuSelect('tips')}
                  >
                    <span>Buka Panduan</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </section>
            </>
          )}

          {/* =================================================================
              TAMPILAN 2: PANDUAN & TIPS WAWANCARA (NAVIGASI TERPISAH)
             ================================================================= */}
          {activeMenu === 'tips' && (
            <div className="dashboard-subview-wrapper">
              <div className="subview-nav-bar">
                <button 
                  className="btn-back-dashboard"
                  onClick={() => handleMenuSelect('dashboard')}
                >
                  <ArrowLeft size={16} />
                  <span>Kembali ke Dashboard</span>
                </button>
              </div>

              <InterviewTips />
            </div>
          )}

          {/* =================================================================
              TAMPILAN 3: SEMUA RIWAYAT INTERVIEW (NAVIGASI TERPISAH)
             ================================================================= */}
          {activeMenu === 'history' && (
            <div className="dashboard-subview-wrapper">
              <div className="subview-nav-bar">
                <button 
                  className="btn-back-dashboard"
                  onClick={() => handleMenuSelect('dashboard')}
                >
                  <ArrowLeft size={16} />
                  <span>Kembali ke Dashboard</span>
                </button>
              </div>

              <InterviewHistory 
                history={history}
                onViewResult={onViewResult}
                onStartInterview={onStartInterview}
                onDeleteHistory={handleDeleteHistory}
                onClearAll={handleClearAllHistory}
                showAll={true}
              />
            </div>
          )}
        </main>
      </div>

      {/* Profil Modal */}
      {isProfileModalOpen && (
        <div className="tips-modal-backdrop" onClick={() => setIsProfileModalOpen(false)}>
          <div className="tips-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="tips-modal-header">
              <div className="modal-title-flex">
                <div className="modal-icon-box">
                  <User size={22} />
                </div>
                <div>
                  <h3 className="modal-heading">Profil Kandidat</h3>
                  <span className="modal-subheading">Informasi nama & target karier</span>
                </div>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setIsProfileModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>
                  NAMA LENGKAP
                </label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="form-input"
                  placeholder="Nama Anda"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>
                  TARGET POSISI / PROFESI
                </label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="form-input"
                  placeholder="Misal: Frontend Developer"
                />
              </div>

              <button 
                type="submit" 
                className="modal-dismiss-btn"
                style={{ marginTop: '8px' }}
              >
                Simpan Profil
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
