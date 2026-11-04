import React, { useState } from 'react';
import './FormInput.css';

export default function FormInput({ onStart }) {
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [position, setPosition] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && experience && position) onStart({ name, experience, position });
    else alert('Semua field harus diisi!');
  };

  return (
    <div className="form-container">
      <div className="form-box">
        <h1 className="form-title">AI Interviewer</h1>
        <p className="form-subtitle">Simulasi wawancara kerja dengan AI HRD Profesional.</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nama Lengkap</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Masukkan nama Anda" />
          </div>
          <div className="input-group">
            <label>Pengalaman Kerja</label>
            <textarea value={experience} onChange={(e) => setExperience(e.target.value)} className="form-input" rows="3" placeholder="Deskripsikan pengalaman Anda..."></textarea>
          </div>
          <div className="input-group">
            <label>Posisi yang Dilamar</label>
            <select value={position} onChange={(e) => setPosition(e.target.value)} className="form-input">
              <option value="">Pilih Posisi</option>
              <option value="Web Developer">Web Developer</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="QA Tester">QA Tester</option>
            </select>
          </div>
          <button type="submit" className="submit-btn">Mulai Interview</button>
        </form>
      </div>
    </div>
  );
}
