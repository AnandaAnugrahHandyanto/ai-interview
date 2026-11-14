import React from 'react';
import { History, Award, ArrowRight, PlayCircle, Clock, Trash2 } from 'lucide-react';

export default function InterviewHistory({ 
  history = [], 
  onViewResult, 
  onStartInterview,
  onDeleteHistory,
  onClearAll,
  showAll = false
}) {
  const formatDuration = (seconds = 180) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}d`;
  };

  const displayedHistory = showAll ? history : history.slice(0, 5);

  const handleDeleteItem = (e, item) => {
    e.stopPropagation();
    if (window.confirm(`Hapus riwayat sesi ${item.position} (${item.formattedDate})?`)) {
      onDeleteHistory?.(item.id);
    }
  };

  const handleClearAllItems = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat interview? Data yang dihapus tidak dapat dipulihkan.")) {
      onClearAll?.();
    }
  };

  return (
    <div className="dashboard-section-card interview-history-card">
      <div className="section-card-header">
        <div className="header-title-flex">
          <History size={20} className="section-title-icon icon-purple" />
          <div>
            <h2 className="section-heading">
              {showAll ? "Semua Riwayat Interview" : "Riwayat Interview Terakhir"}
            </h2>
            <p className="section-subheading">Catatan dan rekam jejak hasil simulasi evaluasi AI Anda.</p>
          </div>
        </div>

        <div className="history-header-actions">
          {history.length > 0 && onClearAll && (
            <button 
              className="btn-clear-history" 
              onClick={handleClearAllItems}
              title="Hapus Seluruh Riwayat"
            >
              <Trash2 size={14} />
              <span>Hapus Semua</span>
            </button>
          )}

          {history.length > 0 && onStartInterview && (
            <button className="view-all-link-btn" onClick={onStartInterview}>
              + Sesi Baru
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="history-empty-state">
          <div className="empty-state-icon-circle">
            <History size={36} />
          </div>
          <h3 className="empty-state-title">Belum ada riwayat interview</h3>
          <p className="empty-state-desc">
            Mulai simulasi pertamamu sekarang bersama Alex Rivera untuk melihat analisis skor dan evaluasi kompetensi kerja Anda!
          </p>
          <button className="empty-state-action-btn" onClick={onStartInterview}>
            <PlayCircle size={18} />
            <span>Mulai Simulasi Pertamamu</span>
          </button>
        </div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Posisi Pekerjaan</th>
                <th>Tanggal</th>
                <th>Durasi</th>
                <th>Skor</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayedHistory.map((item) => {
                const score = Number(item.score) || 0;
                let scoreBadgeClass = "badge-score-low";
                if (score >= 80) scoreBadgeClass = "badge-score-high";
                else if (score >= 65) scoreBadgeClass = "badge-score-mid";

                return (
                  <tr key={item.id} className="history-row">
                    <td>
                      <div className="position-cell">
                        <span className="position-name">{item.position}</span>
                        <span className="candidate-subname">{item.candidateName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="date-cell-text">{item.formattedDate}</span>
                    </td>
                    <td>
                      <span className="duration-pill">
                        <Clock size={12} />
                        {formatDuration(item.durationSeconds)}
                      </span>
                    </td>
                    <td>
                      <div className={`score-pill ${scoreBadgeClass}`}>
                        <Award size={13} />
                        <span>{score} / 100</span>
                      </div>
                    </td>
                    <td>
                      <span className="status-tag-cell">{item.status}</span>
                    </td>
                    <td className="text-right">
                      <div className="history-row-actions">
                        <button 
                          className="btn-view-result"
                          onClick={() => onViewResult(item)}
                          title="Buka Halaman Evaluasi Lengkap"
                        >
                          <span>Lihat Hasil</span>
                          <ArrowRight size={14} />
                        </button>
                        {onDeleteHistory && (
                          <button 
                            className="btn-delete-row"
                            onClick={(e) => handleDeleteItem(e, item)}
                            title="Hapus Riwayat Sesi Ini"
                            aria-label="Hapus Riwayat"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
