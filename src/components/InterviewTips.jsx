import React, { useState } from 'react';
import { 
  Lightbulb, 
  UserCheck, 
  MessageSquare, 
  Target, 
  Briefcase, 
  HelpCircle, 
  ArrowRight,
  X,
  CheckCircle2
} from 'lucide-react';

const TIPS_DATA = [
  {
    id: 'intro',
    icon: UserCheck,
    title: 'Cara Memperkenalkan Diri dengan Baik',
    subtitle: 'Metode Present - Past - Future (2 Menit Emas)',
    summary: 'Awali dengan peran dan keahlian Anda saat ini, rangkum pengalaman penting masa lalu, lalu tutup dengan alasan melamar posisi ini.',
    details: [
      'Gunakan rumus Present-Past-Future: Jelaskan apa yang Anda kerjakan sekarang, apa prestasi relevan di masa lalu, dan mengapa posisi ini adalah langkah masa depan yang tepat.',
      'Hindari mengulang isi CV kata per kata. Ceritakan nilai tambah dan kepribadian profesional Anda.',
      'Jaga durasi perkenalan diri antara 90 hingga 120 detik agar tetap fokus dan memikat pewawancara.'
    ]
  },
  {
    id: 'answering',
    icon: MessageSquare,
    title: 'Cara Menjawab Pertanyaan HRD',
    subtitle: 'Artikulasi Jelas, Jujur & Relevan',
    summary: 'Fokus langsung ke inti pertanyaan tanpa berputar-putar, sertakan contoh nyata, dan sesuaikan dengan budaya perusahaan.',
    details: [
      'Dengarkan pertanyaan sampai tuntas sebelum mulai menjawab. Berhenti sejenak 2-3 detik untuk menyusun pemikiran adalah hal yang wajar dan profesional.',
      'Kaitkan jawaban dengan kebutuhan spesifik posisi yang dilamar, bukan hanya sekadar teori.',
      'Gunakan intonasi ramah, percaya diri, dan tatap kamera secara konsisten dalam wawancara video.'
    ]
  },
  {
    id: 'star',
    icon: Target,
    title: 'Teknik STAR dalam Menjawab Pertanyaan',
    subtitle: 'Situation, Task, Action, Result',
    summary: 'Metode paling teruji untuk menjawab pertanyaan berbasis perilaku (Behavioral Questions) dengan terstruktur dan meyakinkan.',
    details: [
      'Situation: Gambarkan konteks atau tantangan situasi nyata yang Anda hadapi di tempat kerja.',
      'Task: Jelaskan tanggung jawab spesifik apa yang harus Anda selesaikan dalam situasi tersebut.',
      'Action: Uraikan langkah taktis dan keputusan yang Anda ambil secara mandiri maupun kolaboratif.',
      'Result: Paparkan hasil terukur (metrik/persentase) dan pembelajaran berharga yang didapat.'
    ]
  },
  {
    id: 'experience',
    icon: Briefcase,
    title: 'Cara Menjelaskan Pengalaman Kerja',
    subtitle: 'Fokus pada Kontribusi & Dampak Nyata',
    summary: 'Tekankan dampak solusi yang Anda ciptakan bagi tim atau bisnis, bukan sekadar daftar rutinitas tugas harian.',
    details: [
      'Sebutkan metrik kuantitatif jika memungkinkan (misal: "berhasil mempercepat waktu load 40%" atau "mengurangi bug sebesar 25%").',
      'Ceritakan peran kepemimpinan atau inisiatif proaktif yang pernah Anda ambil saat proyek mengalami kendala.',
      'Hubungkan keahlian lama Anda dengan kontribusi yang siap Anda berikan di perusahaan tujuan.'
    ]
  },
  {
    id: 'difficult',
    icon: HelpCircle,
    title: 'Tips Menghadapi Pertanyaan Sulit',
    subtitle: 'Ketenangan, Klarifikasi & Pola Pikir Solutif',
    summary: 'Saat menghadapi pertanyaan tak terduga atau kelemahan diri, fokus pada pola pikir solutif dan komitmen berkembang.',
    details: [
      'Jangan panik saat belum mengetahui jawaban pasti. Katakan dengan jujur bagaimana pendekatan Anda dalam mencari solusi.',
      'Untuk pertanyaan seputar kelemahan: pilih kelemahan nyata yang tidak fatal, lalu jelaskan langkah konkret yang sedang Anda ambil untuk memperbaikinya.',
      'Jangan ragu mengajukan pertanyaan klarifikasi jika ada konteks pertanyaan HRD yang belum sepenuhnya Anda pahami.'
    ]
  }
];

export default function InterviewTips() {
  const [selectedTip, setSelectedTip] = useState(null);

  return (
    <div className="dashboard-section-card interview-tips-card">
      <div className="section-card-header">
        <div className="header-title-flex">
          <Lightbulb size={20} className="section-title-icon icon-blue" />
          <div>
            <h2 className="section-heading">Tips & Panduan Wawancara Kerja</h2>
            <p className="section-subheading">Strategi teruji untuk tampil percaya diri dan memukau pewawancara.</p>
          </div>
        </div>
      </div>

      <div className="tips-grid">
        {TIPS_DATA.map((tip) => {
          const Icon = tip.icon;
          return (
            <div key={tip.id} className="tip-card">
              <div className="tip-card-top">
                <div className="tip-icon-box">
                  <Icon size={20} />
                </div>
                <span className="tip-badge">Best Practice</span>
              </div>

              <h3 className="tip-title">{tip.title}</h3>
              <span className="tip-subtitle">{tip.subtitle}</span>
              <p className="tip-summary">{tip.summary}</p>

              <button 
                className="tip-read-more-btn"
                onClick={() => setSelectedTip(tip)}
              >
                <span>Baca Selengkapnya</span>
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Popup Detail Tips */}
      {selectedTip && (
        <div className="tips-modal-backdrop" onClick={() => setSelectedTip(null)}>
          <div className="tips-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="tips-modal-header">
              <div className="modal-title-flex">
                <div className="modal-icon-box">
                  <selectedTip.icon size={22} />
                </div>
                <div>
                  <h3 className="modal-heading">{selectedTip.title}</h3>
                  <span className="modal-subheading">{selectedTip.subtitle}</span>
                </div>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setSelectedTip(null)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="tips-modal-body">
              <p className="modal-main-desc">{selectedTip.summary}</p>
              
              <h4 className="modal-section-title">Poin Penting & Implementasi:</h4>
              <ul className="modal-detail-list">
                {selectedTip.details.map((point, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={16} className="point-check-icon" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="tips-modal-footer">
              <button 
                className="modal-dismiss-btn"
                onClick={() => setSelectedTip(null)}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
