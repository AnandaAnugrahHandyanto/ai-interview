/**
 * Storage Utility untuk Riwayat Interview dan Profil Pengguna
 * Menggunakan localStorage browser dengan key 'ai_interview_history'
 */

const STORAGE_KEY_HISTORY = 'ai_interview_history';
const STORAGE_KEY_PROFILE = 'ai_user_profile';

// Default profil awal
const DEFAULT_PROFILE = {
  name: 'Fathur',
  title: 'Software Engineer & Tech Enthusiast',
  email: 'fathur@example.com',
  avatarUrl: null
};

/**
 * Mendapatkan seluruh riwayat interview
 * @returns {Array} List riwayat interview terurut dari terbaru
 */
export function getInterviewHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Gagal membaca riwayat interview:", error);
    return [];
  }
}

/**
 * Menyimpan sesi interview baru ke riwayat
 * @param {Object} session Data sesi (userData, finalResult, durationSeconds)
 * @returns {Object} Data sesi tersimpan
 */
export function saveInterviewSession({ userData, finalResult, durationSeconds = 180 }) {
  try {
    const history = getInterviewHistory();
    const score = Number(finalResult?.score) || 0;
    
    let statusLabel = "Perlu Peningkatan";
    if (score >= 80) statusLabel = "Sangat Direkomendasikan";
    else if (score >= 65) statusLabel = "Direkomendasikan";

    const newRecord = {
      id: `int_${Date.now()}`,
      date: new Date().toISOString(),
      formattedDate: new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date()),
      candidateName: userData?.name || 'Kandidat',
      position: userData?.position || 'Web Developer',
      experience: userData?.experience || '',
      score,
      status: statusLabel,
      durationSeconds,
      finalResult,
      userData
    };

    const updated = [newRecord, ...history];
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));

    // Perbarui nama profil jika ada
    if (userData?.name) {
      const currentProfile = getUserProfile();
      saveUserProfile({ ...currentProfile, name: userData.name });
    }

    return newRecord;
  } catch (error) {
    console.error("Gagal menyimpan sesi interview:", error);
    return null;
  }
}

/**
 * Menghapus satu sesi interview dari riwayat berdasarkan ID
 * @param {string} id ID sesi yang akan dihapus
 * @returns {Array} Riwayat terbaru setelah dihapus
 */
export function deleteInterviewSession(id) {
  try {
    const history = getInterviewHistory();
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Gagal menghapus sesi interview:", error);
    return getInterviewHistory();
  }
}

/**
 * Menghapus seluruh riwayat interview
 * @returns {Array} Array kosong []
 */
export function clearAllInterviewHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    return [];
  } catch (error) {
    console.error("Gagal membersihkan riwayat interview:", error);
    return [];
  }
}

/**
 * Menghitung statistik akumulatif interview dari data nyata
 * @returns {Object}
 */
export function calculateStats(history = null) {
  const data = history || getInterviewHistory();
  const total = data.length;

  if (total === 0) {
    return {
      totalInterviews: 0,
      averageScore: 0,
      totalPracticeMinutes: 0,
      scoreGrowth: 0,
      growthDirection: 'neutral'
    };
  }

  const totalScore = data.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
  const averageScore = Math.round(totalScore / total);

  const totalSeconds = data.reduce((acc, curr) => acc + (Number(curr.durationSeconds) || 180), 0);
  const totalPracticeMinutes = Math.max(1, Math.round(totalSeconds / 60));

  // Menghitung perkembangan skor (sesi terbaru dibanding sesi pertama atau rata-rata)
  let scoreGrowth = 0;
  let growthDirection = 'neutral';
  if (total > 1) {
    const latestScore = Number(data[0].score) || 0;
    const previousScore = Number(data[1].score) || 0;
    const diff = latestScore - previousScore;
    if (diff > 0) {
      scoreGrowth = diff;
      growthDirection = 'up';
    } else if (diff < 0) {
      scoreGrowth = Math.abs(diff);
      growthDirection = 'down';
    }
  }

  return {
    totalInterviews: total,
    averageScore,
    totalPracticeMinutes,
    scoreGrowth,
    growthDirection
  };
}

/**
 * Mendapatkan profil pengguna
 */
export function getUserProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

/**
 * Menyimpan profil pengguna
 */
export function saveUserProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error("Gagal menyimpan profil:", error);
  }
}
