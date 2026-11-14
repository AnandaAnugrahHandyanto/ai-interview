import React, { useState } from 'react';
import { User, Briefcase, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import alexAvatarThumb from '../assets/alex-rivera-hrd.png';
import './FormInput.css';

export default function FormInput({ onStart, onBack }) {
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [position, setPosition] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() && experience.trim() && position) {
      // Buka kunci AudioContext / SpeechSynthesis dalam event klik pengguna
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      onStart({ 
        name: name.trim(), 
        experience: experience.trim(), 
        position 
      });
    } else {
      alert('Harap lengkapi seluruh field (Nama, Pengalaman, dan Posisi) sebelum memulai wawancara!');
    }
  };

  return (
    <div className="form-container">
      <div className="form-box">
        {/* Navigation back to Dashboard */}
        {onBack && (
          <button 
            type="button" 
            className="form-back-nav-btn" 
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              marginBottom: '16px',
              padding: '0',
              fontWeight: '500'
            }}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Dashboard</span>
          </button>
        )}

        {/* Header Preview Interviewer */}
        <div className="form-header-badge">
          <img 
            src={alexAvatarThumb} 
            alt="Alex Rivera" 
            className="form-avatar-preview" 
          />
          <div className="form-interviewer-info">
            <span className="interviewer-name">Alex Rivera</span>
            <span className="interviewer-role">HR Manager • TechCorp Interview AI</span>
          </div>
        </div>

        <h1 className="form-title">Simulasi Wawancara AI</h1>
        <p className="form-subtitle">
          Wawancara kerja interaktif dengan video call dan analisis suara real-time.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Nama Lengkap */}
          <div className="input-group">
            <div className="input-label-wrapper">
              <User size={13} />
              <label htmlFor="candidate-name">Nama Lengkap</label>
            </div>
            <input 
              id="candidate-name"
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="form-input" 
              placeholder="Contoh: Budi Pratama" 
              required
            />
          </div>

          {/* Posisi yang Dilamar */}
          <div className="input-group">
            <div className="input-label-wrapper">
              <Briefcase size={13} />
              <label htmlFor="candidate-position">Posisi yang Dilamar</label>
            </div>
            <select 
              id="candidate-position"
              value={position} 
              onChange={(e) => setPosition(e.target.value)} 
              className="form-input"
              required
            >
              <option value="">-- Pilih Posisi Pekerjaan --</option>
              <option value="Web Developer">Web Developer (Frontend / Fullstack)</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="Business Analyst">Business Analyst</option>
              <option value="System Analyst">System Analyst</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="QA Tester">QA Tester / Automation</option>
              <option value="Mobile App Developer">Mobile App Developer</option>
            </select>
          </div>

          {/* Pengalaman Kerja */}
          <div className="input-group">
            <div className="input-label-wrapper">
              <FileText size={13} />
              <label htmlFor="candidate-experience">Ringkasan Pengalaman Kerja</label>
            </div>
            <textarea 
              id="candidate-experience"
              value={experience} 
              onChange={(e) => setExperience(e.target.value)} 
              className="form-input" 
              rows="3" 
              placeholder="Ceritakan latar belakang, proyek, atau keahlian utama Anda..."
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            <span>Mulai Sesi Wawancara</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
