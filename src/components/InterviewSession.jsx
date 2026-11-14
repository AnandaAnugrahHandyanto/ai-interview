import React, { useState, useEffect, useRef } from 'react';
import AIHRD from '../AIHRD';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  User, 
  Video, 
  VideoOff, 
  Volume2, 
  MessageSquare, 
  Subtitles, 
  Clock, 
  Briefcase, 
  Loader2,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { GROQ_API_TRANSCRIPTION_ENDPOINT, GROQ_TRANSCRIPTION_MODEL } from '../constants';
import './InterviewSession.css';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function InterviewSession({ 
  currentQuestion, 
  onSendAnswer, 
  isSpeaking, 
  setIsSpeaking, 
  isLoadingAI, 
  onEndInterview, 
  userName, 
  chatHistory = [], 
  userData,
  networkError = null,
  onRetryNetworkError = null,
  onDismissNetworkError = null
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [localNetworkError, setLocalNetworkError] = useState(null);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const chatBottomRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastSpokenQuestionRef = useRef('');

  // Helper untuk membersihkan format markdown dan nomor urut sebelum dibacakan TTS atau ditampilkan
  const cleanText = (text) => {
    if (!text) return '';
    return text
      .replace(/[*#_~`>]/g, '')
      .replace(/\{[\s\S]*\}/g, '')
      .replace(/^\s*(?:pertanyaan|soal|nomor|no)?\s*\d+[.:)-]?\s*/i, '')
      .replace(/^\s*pertanyaan\s*(?:ke-?\d+|pertama|kedua|ketiga|keempat|kelima)[.:)]?\s*/i, '')
      .trim();
  };

  // Timer panggilan wawancara
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Auto-scroll ke pesan percakapan terbaru di sidebar
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoadingAI]);

  // Pre-load suara browser saat mount
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const preloadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    preloadVoices();
    window.speechSynthesis.onvoiceschanged = preloadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Algoritma Seleksi Suara Neural Natural Terbaik di Browser
  const selectBestNaturalVoice = (voices) => {
    if (!voices || voices.length === 0) return null;

    // Filter kandidat suara Bahasa Indonesia
    const idVoices = voices.filter(v => 
      v.lang === 'id-ID' || v.lang === 'id_ID' || v.lang.startsWith('id') || 
      v.name.toLowerCase().includes('indonesia')
    );

    if (idVoices.length > 0) {
      // 1. Prioritas Utama: Suara Pria Natural/Neural (seperti Microsoft Ardi Natural - selaras karakter Alex Rivera)
      const maleNatural = idVoices.find(v => 
        (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online')) &&
        (v.name.toLowerCase().includes('ardi') || v.name.toLowerCase().includes('male'))
      );
      if (maleNatural) return maleNatural;

      // 2. Prioritas Kedua: Suara Natural/Neural Online apapun (seperti Microsoft Gadis Natural)
      const anyNatural = idVoices.find(v => 
        v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online')
      );
      if (anyNatural) return anyNatural;

      // 3. Prioritas Ketiga: Suara Google Cloud TTS di Chrome (Google Bahasa Indonesia)
      const googleVoice = idVoices.find(v => v.name.toLowerCase().includes('google'));
      if (googleVoice) return googleVoice;

      return idVoices[0];
    }

    // Fallback: Suara Natural global jika Bahasa Indonesia tidak terpasang
    return voices.find(v => v.name.includes('Natural') || v.name.includes('Neural')) || null;
  };

  // Text-To-Speech (Alex Rivera berbicara membacakan pertanyaan dengan Suara Neural)
  const speakQuestion = React.useCallback((text) => {
    if (!text || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    let cleanSpeech = cleanText(text)
      .replace(/([.?!])\s*/g, '$1 ')
      .replace(/,\s*/g, ', ');

    if (!cleanSpeech) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = 'id-ID';
    // Kecepatan & nada disetel agar terdengar luwes seperti percakapan nyata (tidak terburu-buru/kaku)
    utterance.rate = 0.96;
    utterance.pitch = 1.0;

    // Pilih suara Neural/Natural terbaik
    const voices = window.speechSynthesis.getVoices();
    const bestVoice = selectBestNaturalVoice(voices);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onstart = () => {
      if (setIsSpeaking) setIsSpeaking(true);
    };

    utterance.onend = () => {
      if (setIsSpeaking) setIsSpeaking(false);
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis error:", e);
      lastSpokenQuestionRef.current = '';
      if (setIsSpeaking) setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [setIsSpeaking]);

  // Efek memicu suara pertanyaan:
  // Panggil speakQuestion saat pertanyaan berubah. Diberi delay 400ms agar hardware kamera/mic & transisi selesai.
  useEffect(() => {
    if (!currentQuestion || isLoadingAI) return;
    if (currentQuestion === lastSpokenQuestionRef.current) return;

    const speakTimer = setTimeout(() => {
      lastSpokenQuestionRef.current = currentQuestion;
      speakQuestion(currentQuestion);
    }, 400);

    return () => {
      clearTimeout(speakTimer);
    };
  }, [currentQuestion, isLoadingAI, speakQuestion]);

  // Cleanup suara HANYA saat komponen InterviewSession benar-benar unmount (keluar dari wawancara)
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (setIsSpeaking) setIsSpeaking(false);
    };
  }, [setIsSpeaking]);

  // Inisialisasi Webcam Pengguna
  useEffect(() => {
    isMountedRef.current = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (isMountedRef.current) {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.warn("Video play error:", e));
          }
        } else {
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error("Webcam access error:", err);
      }
    };

    startCamera();

    return () => {
      isMountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Toggle Video Kandidat
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !videoTracks[0].enabled;
        videoTracks[0].enabled = newState;
        setIsVideoEnabled(newState);
      }
    }
  };

  // Mulai Merekam Jawaban Kandidat (STT)
  const startRecording = async () => {
    // Matikan suara HRD jika masih berbicara
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (setIsSpeaking) setIsSpeaking(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(new File([audioBlob], 'candidate-answer.webm', { type: 'audio/webm' }));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Gagal memulai perekaman mikrofon:", err);
      setLocalNetworkError({
        title: "Izin Mikrofon Diperlukan",
        message: "Tidak dapat mengakses mikrofon. Pastikan mikrofon terpasang dan izin akses telah diberikan pada browser Anda."
      });
    }
  };

  // Berhenti Merekam Jawaban
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Mengirim Audio ke Groq Whisper untuk Transkripsi Teks
  const transcribeAudio = async (audioFile) => {
    if (!GROQ_API_KEY) {
      setLocalNetworkError({
        title: "Konfigurasi API Belum Lengkap",
        message: "Groq API Key belum dikonfigurasi di file environment (.env)."
      });
      return;
    }

    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', GROQ_TRANSCRIPTION_MODEL || 'whisper-large-v3-turbo');
      formData.append('language', 'id');

      const response = await fetch(GROQ_API_TRANSCRIPTION_ENDPOINT, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.text && data.text.trim()) {
        onSendAnswer(data.text.trim());
      } else {
        setLocalNetworkError({
          title: "Suara Tidak Terdeteksi",
          message: "Suara rekaman Anda belum terdengar dengan jelas. Silakan coba menjawab kembali dengan mendekatkan mikrofon."
        });
      }
    } catch (error) {
      console.error("Transkripsi error:", error);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (setIsSpeaking) setIsSpeaking(false);

      // Tampilkan Pop-Up Error Jaringan (Bukan alert browser dan tidak looping pertanyaan)
      setLocalNetworkError({
        title: "Gangguan Koneksi Jaringan",
        message: "Gagal mengirim atau mentranskripsi rekaman suara ke server AI. Mohon periksa koneksi internet Anda dan coba lagi."
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // Menghitung indeks pertanyaan (asisten)
  const assistantCount = chatHistory.filter(m => m.sender === 'assistant').length || 1;
  const questionNumber = Math.min(assistantCount, 4);

  // Status AI untuk Avatar HRD
  const aiStatus = (isLoadingAI || isTranscribing)
    ? 'thinking'
    : isSpeaking
      ? 'speaking'
      : isRecording
        ? 'listening'
        : 'idle';

  const activeError = networkError || localNetworkError;

  return (
    <div className="interview-container">
      {/* 1. TOP HEADER BAR */}
      <header className="meeting-header">
        <div className="header-brand">
          <div className="brand-badge">
            <span className="live-status-dot" />
            <span className="brand-name">TechCorp Interview AI</span>
          </div>
          <span className="divider-dot">•</span>
          <div className="candidate-position-pill">
            <Briefcase size={14} className="pill-icon" />
            <span>{userData?.position || 'Candidate'}</span>
          </div>
        </div>

        <div className="header-meta">
          <div className="progress-badge">
            <span className="progress-label">Progres</span>
            <span className="progress-count">{questionNumber} / 4</span>
            <div className="progress-mini-track">
              <div 
                className="progress-mini-bar" 
                style={{ width: `${Math.min(100, (questionNumber / 4) * 100)}%` }} 
              />
            </div>
          </div>

          <div className="timer-badge">
            <Clock size={14} className="timer-icon" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <button 
            className={`header-chat-toggle ${isChatOpen ? 'active' : ''}`}
            onClick={() => setIsChatOpen(prev => !prev)}
            title="Buka / Tutup Riwayat Percakapan"
          >
            <MessageSquare size={16} />
            <span className="chat-badge-dot" />
          </button>
        </div>
      </header>

      {/* 2. MAIN MEETING BODY */}
      <div className="meeting-body">
        {/* Main Stage: Alex Rivera AI HRD */}
        <main className="main-stage">
          <AIHRD 
            isSpeaking={isSpeaking}
            isLoading={isLoadingAI || isTranscribing}
            isListening={isRecording}
            status={aiStatus}
          />

          {/* Subtitle / Closed Caption Bar */}
          {showCaptions && (
            <div className="subtitle-container">
              <div className="subtitle-box">
                <div className="subtitle-speaker-tag">
                  <span className="speaker-avatar-dot" />
                  <span>Alex Rivera</span>
                </div>
                <div className="subtitle-text">
                  {isLoadingAI || isTranscribing ? (
                    <span className="subtitle-loading">
                      <Loader2 size={16} className="spinner-icon" />
                      {isTranscribing ? "Menerjemahkan rekaman suara Anda..." : "Alex sedang menyusun evaluasi / pertanyaan berikutnya..."}
                    </span>
                  ) : cleanText(currentQuestion) || "Menunggu pertanyaan..."}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar: Candidate Video & Chat History */}
        <aside className={`meeting-sidebar ${isChatOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {/* Candidate Webcam Feed Tile */}
          <div className="user-video-card">
            {isVideoEnabled ? (
              <video ref={videoRef} autoPlay muted playsInline className="user-webcam-feed" />
            ) : (
              <div className="user-video-disabled">
                <div className="user-avatar-fallback">
                  {userName ? userName.charAt(0).toUpperCase() : 'K'}
                </div>
                <span className="camera-off-text">Kamera Dimatikan</span>
              </div>
            )}

            {/* Video Overlays */}
            <div className="user-video-header">
              <span className="live-pill">
                <span className="rec-dot" />
                LIVE
              </span>
            </div>

            <div className="user-bottom-info">
              <div className="user-name-pill">
                <User size={13} />
                <span>{userName || 'Kandidat'}</span>
              </div>

              {isRecording && (
                <div className="user-audio-bars">
                  <span className="user-audio-bar" />
                  <span className="user-audio-bar" />
                  <span className="user-audio-bar" />
                </div>
              )}
            </div>
          </div>

          {/* Chat Transcript Panel */}
          <div className="chat-transcript-panel">
            <div className="chat-panel-header">
              <div className="chat-header-title">
                <MessageSquare size={15} className="panel-icon" />
                <span>Transkrip Wawancara</span>
              </div>
              <span className="message-count-pill">
                {chatHistory.length} pesan
              </span>
            </div>

            <div className="chat-messages-scroll">
              {chatHistory.map((item, index) => {
                const isAI = item.sender === 'assistant';
                return (
                  <div key={index} className={`chat-bubble-row ${isAI ? 'row-ai' : 'row-user'}`}>
                    <div className={`chat-bubble ${isAI ? 'bubble-ai' : 'bubble-user'}`}>
                      <div className="bubble-sender-name">
                        {isAI ? 'Alex Rivera (HRD)' : (userName || 'Anda')}
                      </div>
                      <div className="bubble-content-text">
                        {cleanText(item.message)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM CONTROL DOCK */}
      <footer className="meeting-footer">
        <div className="control-dock-inner">
          {/* Main Action Button: Jawab Pertanyaan (Mikrofon) */}
          <button 
            className={`control-btn mic-action-btn ${isRecording ? 'recording-active' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoadingAI || isTranscribing}
            title={isRecording ? "Klik untuk Selesai Menjawab" : "Klik untuk Mulai Menjawab"}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            <span className="btn-text">
              {isRecording ? "Selesai Bicara" : "Jawab Pertanyaan"}
            </span>
            {isRecording && <span className="mic-pulse-ring" />}
          </button>

          <div className="dock-divider" />

          {/* Toggle Video Camera */}
          <button 
            className={`control-btn secondary-btn ${!isVideoEnabled ? 'btn-alert' : ''}`}
            onClick={toggleVideo}
            title={isVideoEnabled ? "Matikan Kamera" : "Nyalakan Kamera"}
          >
            {isVideoEnabled ? <Video size={19} /> : <VideoOff size={19} />}
          </button>

          {/* Replay TTS Question Voice */}
          <button 
            className="control-btn secondary-btn"
            onClick={() => speakQuestion(currentQuestion)}
            disabled={isSpeaking || isLoadingAI || isTranscribing}
            title="Ulangi Suara Pertanyaan"
          >
            <Volume2 size={19} />
          </button>

          {/* Toggle Closed Captions / Subtitle */}
          <button 
            className={`control-btn secondary-btn ${showCaptions ? 'btn-active' : ''}`}
            onClick={() => setShowCaptions(prev => !prev)}
            title="Buka / Tutup Subtitle Teks"
          >
            <Subtitles size={19} />
          </button>

          {/* Toggle Sidebar Chat on Mobile/Tablet */}
          <button 
            className={`control-btn secondary-btn ${isChatOpen ? 'btn-active' : ''}`}
            onClick={() => setIsChatOpen(prev => !prev)}
            title="Buka / Tutup Transkrip"
          >
            <MessageSquare size={19} />
          </button>

          <div className="dock-divider" />

          {/* End Call / Akhiri Wawancara */}
          <button 
            className="control-btn end-call-btn"
            onClick={() => setIsEndModalOpen(true)}
            disabled={isLoadingAI}
            title="Akhiri Wawancara & Dapatkan Hasil Evaluasi"
          >
            <PhoneOff size={20} />
            <span className="btn-text end-text">Akhiri Wawancara</span>
          </button>
        </div>
      </footer>

      {/* 4. MODAL POP-UP GANGGUAN JARINGAN (TIDAK LOOPING PERTANYAAN) */}
      {activeError && (
        <div className="network-error-backdrop">
          <div className="network-error-modal">
            <div className="network-error-icon-box">
              <WifiOff size={32} />
            </div>

            <h3 className="network-error-title">
              {activeError.title || "Gangguan Koneksi Jaringan"}
            </h3>

            <p className="network-error-desc">
              {activeError.message || "Koneksi ke server AI terganggu. Silakan periksa jaringan internet Anda. Pertanyaan tidak akan diulang dan progres wawancara Anda tetap tersimpan."}
            </p>

            <div className="network-error-actions">
              <button 
                className="btn-retry-network"
                onClick={() => {
                  setLocalNetworkError(null);
                  if (networkError && onRetryNetworkError) {
                    onRetryNetworkError();
                  } else if (onDismissNetworkError) {
                    onDismissNetworkError();
                  }
                }}
              >
                <RefreshCw size={16} />
                <span>Coba Lagi</span>
              </button>

              <button 
                className="btn-cancel-network"
                onClick={() => {
                  setLocalNetworkError(null);
                  if (onDismissNetworkError) onDismissNetworkError();
                  setIsEndModalOpen(true);
                }}
              >
                <PhoneOff size={15} />
                <span>Akhiri Wawancara</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL POP-UP ALERT KONFIRMASI AKHIRI WAWANCARA ELEGAN */}
      {isEndModalOpen && (
        <div className="end-interview-backdrop" onClick={() => setIsEndModalOpen(false)}>
          <div className="end-interview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="end-modal-icon-glow-ring">
              <div className="end-modal-icon-box">
                <PhoneOff size={28} />
              </div>
            </div>

            <h3 className="end-modal-title">Akhiri Sesi Wawancara?</h3>

            <div className="end-modal-stats-badge">
              <span className="stat-pill-time">
                <Clock size={12} />
                <span>{formatTime(elapsedSeconds)}</span>
              </span>
              <span className="stat-pill-answers">
                {chatHistory.filter(msg => msg.sender === 'user').length === 0 
                  ? "Belum ada jawaban" 
                  : `${chatHistory.filter(msg => msg.sender === 'user').length} Pertanyaan Dijawab`}
              </span>
            </div>

            <p className="end-modal-desc">
              {chatHistory.filter(msg => msg.sender === 'user').length === 0 ? (
                <>
                  Anda baru saja memulai sesi dan belum memberikan jawaban. Jika diakhiri sekarang, skor akhir Anda akan tercatat <strong>0 / 100</strong> apa adanya.
                </>
              ) : (
                <>
                  Sesi wawancara akan dihentikan dan AI HRD Alex Rivera akan langsung mengompilasi evaluasi <strong>apa adanya</strong> berdasarkan jawaban yang sudah Anda berikan.
                </>
              )}
            </p>

            <div className="end-modal-actions">
              <button 
                type="button"
                className="btn-modal-continue"
                onClick={() => setIsEndModalOpen(false)}
              >
                <span>Lanjutkan Wawancara</span>
              </button>

              <button 
                type="button"
                className="btn-modal-confirm-end"
                onClick={() => {
                  setIsEndModalOpen(false);
                  if (onEndInterview) onEndInterview();
                }}
                disabled={isLoadingAI}
              >
                <PhoneOff size={16} />
                <span>Ya, Akhiri Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}