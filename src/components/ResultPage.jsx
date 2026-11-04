import React from 'react';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import './ResultPage.css';

export default function ResultPage({ finalResult, onRestart }) {
  const { score = 0, strengths = [], weaknesses = [], recommendations = [] } = finalResult || {};

  return (
    <div className="result-container">
      <div className="result-card">
        <h1 className="result-title">Hasil Evaluasi</h1>
        <div className="score-circle">
          <span className="score-number">{score}</span>
          <span className="score-label">/ 100</span>
        </div>

        <div className="analysis-grid">
          <div className="analysis-card">
            <h3><CheckCircle size={20} color="green" /> Kelebihan</h3>
            <ul>{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div className="analysis-card">
            <h3><XCircle size={20} color="red" /> Kekurangan</h3>
            <ul>{weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
          <div className="analysis-card full-width">
            <h3><Lightbulb size={20} color="gold" /> Rekomendasi</h3>
            <ul>{recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        </div>

        <button onClick={onRestart} className="restart-btn">Ulangi Interview</button>
      </div>
    </div>
  );
}
