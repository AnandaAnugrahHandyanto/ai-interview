import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  RotateCcw, 
  Printer, 
  Award,
  LayoutDashboard
} from 'lucide-react';
import alexAvatarThumb from '../assets/alex-rivera-hrd.png';
import './ResultPage.css';

export default function ResultPage({ 
  finalResult, 
  onRestart, 
  onBackToDashboard, 
  userData 
}) {
  const { 
    score = 0, 
    strengths = [], 
    weaknesses = [], 
    recommendations = [] 
  } = finalResult || {};

  const numScore = Number(score) || 0;

  // Tentukan predikat evaluasi
  let verdictBadge = "Perlu Pengembangan";
  let badgeClass = "badge-needs-improvement";
  let verdictHeadline = "Masih Ada Ruang Peningkatan";
  let verdictSubtext = "Kandidat memiliki potensi dasar namun perlu memperdalam pemahaman teknis dan artikulasi dalam menjawab.";

  if (numScore >= 80) {
    verdictBadge = "Sangat Direkomendasikan";
    badgeClass = "badge-excellent";
    verdictHeadline = "Performa Wawancara Unggul";
    verdictSubtext = "Kandidat menunjukkan penguasaan materi yang matang, komunikasi terstruktur, dan pemahaman industri yang kuat.";
  } else if (numScore >= 65) {
    verdictBadge = "Direkomendasikan Bersyarat";
    badgeClass = "badge-good";
    verdictHeadline = "Kandidat Kompeten & Siap Kerja";
    verdictSubtext = "Kandidat mampu menjawab sebagian besar tantangan dengan baik dan memiliki fondasi yang cukup solid.";
  }

  return (
    <div className="result-container">
      <div className="result-card-wrapper">
        {/* Header Hasil Evaluasi */}
        <header className="result-header">
          <div className="result-title-group">
            <h1>Hasil Evaluasi Wawancara</h1>
            <p>
              Kandidat: <strong>{userData?.name || 'Kandidat'}</strong> • Posisi: <strong>{userData?.position || 'Pelamar Kerja'}</strong>
            </p>
          </div>

          <div className="evaluator-tag">
            <img 
              src={alexAvatarThumb} 
              alt="Alex Rivera" 
              className="evaluator-avatar" 
            />
            <div className="evaluator-info">
              <span className="evaluator-name">Alex Rivera</span>
              <span className="evaluator-role">HR Manager • TechCorp</span>
            </div>
          </div>
        </header>

        {/* Skor Overview Section */}
        <div className="score-overview-section">
          <div className="score-radial-box">
            <span className="score-number">{numScore}</span>
            <span className="score-scale">/ 100 POIN</span>
          </div>

          <div className="score-verdict-box">
            <span className={`score-badge ${badgeClass}`}>
              <Award size={14} />
              {verdictBadge}
            </span>
            <h2 className="score-headline">{verdictHeadline}</h2>
            <p className="score-subtext">{verdictSubtext}</p>
          </div>
        </div>

        {/* Analysis Cards Grid */}
        <div className="analysis-cards-grid">
          {/* Kelebihan */}
          <div className="analysis-card">
            <div className="analysis-card-header header-green">
              <CheckCircle2 size={19} />
              <span>Kelebihan & Kekuatan (Strengths)</span>
            </div>
            <ul className="eval-list">
              {strengths.length > 0 ? (
                strengths.map((item, idx) => <li key={idx}>{item}</li>)
              ) : (
                <li>Respons positif pada pengenalan diri dan etos kerja.</li>
              )}
            </ul>
          </div>

          {/* Area Peningkatan */}
          <div className="analysis-card">
            <div className="analysis-card-header header-red">
              <AlertCircle size={19} />
              <span>Area Peningkatan (Weaknesses)</span>
            </div>
            <ul className="eval-list">
              {weaknesses.length > 0 ? (
                weaknesses.map((item, idx) => <li key={idx}>{item}</li>)
              ) : (
                <li>Dapat memperjelas detail implementasi teknis pada proyek sebelumnya.</li>
              )}
            </ul>
          </div>

          {/* Rekomendasi Karir */}
          <div className="analysis-card full-width">
            <div className="analysis-card-header header-gold">
              <Lightbulb size={19} />
              <span>Rekomendasi Pengembangan (Recommendations)</span>
            </div>
            <ul className="eval-list">
              {recommendations.length > 0 ? (
                recommendations.map((item, idx) => <li key={idx}>{item}</li>)
              ) : (
                <li>Latih teknik STAR (Situation, Task, Action, Result) untuk menyusun jawaban yang lebih komprehensif.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-actions">
          {onBackToDashboard && (
            <button onClick={onBackToDashboard} className="print-report-btn">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
          )}

          <button onClick={onRestart} className="primary-restart-btn">
            <RotateCcw size={18} />
            <span>Mulai Wawancara Baru</span>
          </button>

          <button onClick={() => window.print()} className="print-report-btn">
            <Printer size={18} />
            <span>Cetak Evaluasi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
