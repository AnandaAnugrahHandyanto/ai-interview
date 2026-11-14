import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import FormInput from './components/FormInput';
import InterviewSession from './components/InterviewSession';
import ResultPage from './components/ResultPage';
import { getNextQuestion, evaluateEarlyInterview, stripLeadingNumbering } from './lib/ai';
import { saveInterviewSession } from './lib/storage';
import './App.css';

/**
 * Deteksi apakah input pengalaman kerja kandidat menandakan tidak ada pengalaman kerja
 * (misal: "tidak ada", "belum ada", "fresh graduate", "0", dll).
 */
const isZeroExperience = (exp) => {
  if (!exp) return true;
  const normalized = String(exp).trim().toLowerCase();
  return (
    normalized === 'tidak ada' ||
    normalized === 'belum ada' ||
    normalized === 'tidak' ||
    normalized === 'none' ||
    normalized === '0' ||
    normalized === '0 tahun' ||
    normalized === '0th' ||
    normalized.includes('fresh graduate') ||
    normalized.includes('freshgraduate') ||
    normalized.includes('fresh-grad') ||
    normalized.includes('belum memiliki') ||
    normalized.includes('belum pernah') ||
    normalized.includes('lulusan baru')
  );
};

function App() {
  const [page, setPage] = useState('dashboard'); // Alur awal: Dashboard
  const [userData, setUserData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [finalResult, setFinalResult] = useState(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [networkError, setNetworkError] = useState(null);
  const [pendingAnswer, setPendingAnswer] = useState(null);

  const fetchAIResponse = async (userAnswer = null, isInitial = false) => {
    setIsLoadingAI(true);
    setNetworkError(null);
    if (userAnswer) setPendingAnswer(userAnswer);

    const historyToPass = [...chatHistory];
    if (userAnswer) {
      historyToPass.push({ sender: 'user', message: userAnswer });
    }

    const response = await getNextQuestion(userData.position, userData.experience, historyToPass);

    if (response.error) {
      // Hentikan suara AI jika sedang aktif
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      // PENTING: Jangan ubah currentQuestion menjadi string error agar AI tidak looping bicara!
      setNetworkError({
        title: "Gangguan Koneksi Jaringan",
        message: response.error.includes("Failed to fetch") || response.error.includes("NetworkError") || response.error.includes("Gagal")
          ? "Gagal terhubung ke server AI. Mohon periksa koneksi internet Anda dan coba lagi."
          : response.error,
        canRetry: true
      });
    } else if (response.finalResult) {
      setFinalResult(response.finalResult);
      // Simpan hasil evaluasi ke penyimpanan riwayat lokal
      saveInterviewSession({
        userData,
        finalResult: response.finalResult,
        durationSeconds: Math.max(180, chatHistory.length * 45)
      });
      setPage('result');
    } else if (response.question) {
      // Pastikan pertanyaan bersih dari angka nomor urut (seperti "1. ", "Pertanyaan 2:")
      const cleanQuestion = stripLeadingNumbering(response.question);
      setCurrentQuestion(cleanQuestion);
      setChatHistory(prev => isInitial ? 
        [{ sender: 'assistant', message: cleanQuestion }] : 
        [...prev, { sender: 'user', message: userAnswer }, { sender: 'assistant', message: cleanQuestion }]
      );
    }
    setIsLoadingAI(false);
  };

  const handleRetryLastAnswer = () => {
    setNetworkError(null);
    if (pendingAnswer) {
      fetchAIResponse(pendingAnswer);
    }
  };

  const handleDismissNetworkError = () => {
    setNetworkError(null);
  };

  const handleStartInterview = (data) => {
    setIsSpeaking(false);
    setUserData(data);
    setPage('interview');
    setNetworkError(null);
    setPendingAnswer(null);

    const noExperience = isZeroExperience(data.experience);

    // Salam pembuka disesuaikan secara cerdas:
    // Jika TIDAK ADA pengalaman kerja / fresh graduate -> JANGAN tanya pengalaman kerja, fokus ke motivasi, pendidikan & proyek
    const freshGradGreetings = [
      `Halo ${data.name}, selamat datang. Saya Alex Rivera dari TechCorp. Mari kita mulai wawancara untuk posisi ${data.position}. Sebagai kandidat fresh graduate, ceritakan motivasi Anda memilih posisi ini dan proyek tugas akhir atau portofolio yang pernah Anda kembangkan.`,
      `Selamat datang ${data.name}. Senang bertemu dengan Anda hari ini untuk posisi ${data.position}. Silakan perkenalkan diri Anda, latar belakang pendidikan, serta keahlian utama yang Anda miliki.`,
      `Halo ${data.name}, terima kasih telah hadir untuk posisi ${data.position}. Silakan mulai dengan menceritakan bidang keahlian yang paling Anda minati serta alasan Anda tertarik berkarier di bidang ini.`
    ];

    // Jika MEMILIKI pengalaman kerja nyata -> Tanyakan latar belakang profesional
    const experiencedGreetings = [
      `Halo ${data.name}, selamat datang. Saya Alex Rivera dari TechCorp. Mari kita mulai wawancara untuk posisi ${data.position}. Silakan ceritakan tentang diri dan pengalaman relevan Anda.`,
      `Selamat datang ${data.name}. Saya senang bertemu Anda hari ini untuk posisi ${data.position}. Bisakah Anda memperkenalkan latar belakang profesional dan keahlian utama Anda?`,
      `Halo ${data.name}, terima kasih telah meluangkan waktu untuk posisi ${data.position}. Silakan mulai dengan menceritakan pengalaman kerja Anda yang paling berkesan.`
    ];

    const greetingsPool = noExperience ? freshGradGreetings : experiencedGreetings;
    const greeting = greetingsPool[Math.floor(Math.random() * greetingsPool.length)];
    
    setCurrentQuestion(greeting);
    setChatHistory([{ sender: 'assistant', message: greeting }]);
  };

  const handleSendAnswer = (answer) => {
    fetchAIResponse(answer);
  };

  const handleRestartInterview = () => {
    setPage('form');
    setUserData(null);
    setChatHistory([]);
    setCurrentQuestion('');
    setFinalResult(null);
    setNetworkError(null);
    setPendingAnswer(null);
  };

  const handleBackToDashboard = () => {
    setPage('dashboard');
    setUserData(null);
    setChatHistory([]);
    setCurrentQuestion('');
    setFinalResult(null);
    setNetworkError(null);
    setPendingAnswer(null);
  };

  const handleEndInterviewEarly = async () => {
    // 1. Hentikan suara AI segera
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setNetworkError(null);

    // 2. Cek apakah ada jawaban dari kandidat
    const userMessages = chatHistory.filter(msg => msg.sender === 'user');

    // KASUS 1: Baru mulai / belum ada jawaban sama sekali dari kandidat -> Skor 0
    if (userMessages.length === 0) {
      const zeroResult = {
        score: 0,
        strengths: [
          "Kandidat telah berhasil mendaftar dan memulai simulasi wawancara."
        ],
        weaknesses: [
          "Wawancara diakhiri sebelum kandidat memberikan jawaban sama sekali.",
          "Tidak ada data kompetensi, pemecahan masalah, atau komunikasi yang dapat dinilai."
        ],
        recommendations: [
          "Ikuti sesi wawancara hingga selesai dan jawab setiap pertanyaan yang diajukan oleh HRD.",
          "Gunakan fitur rekaman suara atau ketik teks untuk menyampaikan pengalaman atau proyek Anda secara detail.",
          "Pelajari tips wawancara di dashboard untuk mempersiapkan diri menghadapi simulasi berikutnya."
        ]
      };

      saveInterviewSession({
        userData,
        finalResult: zeroResult,
        durationSeconds: 15
      });

      setFinalResult(zeroResult);
      setPage('result');
      return;
    }

    // KASUS 2: Diakhiri di tengah jalan dengan sebagian jawaban -> Evaluasi apa adanya
    setIsLoadingAI(true);
    const evaluation = await evaluateEarlyInterview(userData?.position || '', userData?.experience || '', chatHistory);
    setIsLoadingAI(false);

    if (evaluation.finalResult) {
      saveInterviewSession({
        userData,
        finalResult: evaluation.finalResult,
        durationSeconds: Math.max(30, chatHistory.length * 30)
      });
      setFinalResult(evaluation.finalResult);
      setPage('result');
    }
  };

  // Membuka detail hasil evaluasi sesi lama dari riwayat
  const handleViewHistoricalResult = (record) => {
    setUserData(record.userData || { name: record.candidateName, position: record.position });
    setFinalResult(record.finalResult);
    setPage('result');
  };

  return (
    <div className="App">
      {/* 1. Dashboard Utama */}
      {page === 'dashboard' && (
        <Dashboard 
          onStartInterview={() => setPage('form')}
          onViewResult={handleViewHistoricalResult}
        />
      )}

      {/* 2. Form Input Data Kandidat */}
      {page === 'form' && (
        <FormInput 
          onStart={handleStartInterview} 
          onBack={handleBackToDashboard}
        />
      )}

      {/* 3. Simulasi Wawancara Video Call Interaktif */}
      {page === 'interview' && (
        <InterviewSession
          currentQuestion={currentQuestion}
          onSendAnswer={handleSendAnswer}
          isSpeaking={isSpeaking}
          setIsSpeaking={setIsSpeaking}
          isLoadingAI={isLoadingAI}
          onEndInterview={handleEndInterviewEarly}
          userName={userData?.name}
          chatHistory={chatHistory}
          userData={userData}
          networkError={networkError}
          onRetryNetworkError={handleRetryLastAnswer}
          onDismissNetworkError={handleDismissNetworkError}
        />
      )}

      {/* 4. Halaman Hasil Evaluasi */}
      {page === 'result' && (
        <ResultPage 
          finalResult={finalResult} 
          onRestart={handleRestartInterview} 
          onBackToDashboard={handleBackToDashboard}
          userData={userData}
        />
      )}
    </div>
  );
}

export default App;
