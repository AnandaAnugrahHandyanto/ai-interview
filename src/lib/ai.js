import { 
  GROQ_API_CHAT_ENDPOINT,
  GROQ_CHAT_MODEL,
  SYSTEM_PROMPT_HRD
} from '../constants';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Model resmi aktif yang diverifikasi tersedia di akun Groq pengguna
const CANDIDATE_MODELS = [
  GROQ_CHAT_MODEL || 'openai/gpt-oss-120b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'allam-2-7b'
];

const UNIQUE_MODELS = [...new Set(CANDIDATE_MODELS)];

// Fungsi untuk memeriksa apakah string adalah JSON yang valid
export function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch {
    return false;
  }
  return true;
}

/**
 * Membersihkan nomor urut pertanyaan dari AI (seperti "1. ", "Pertanyaan 1:", "Nomor 2 - ")
 * agar HRD langsung berbicara ke inti pertanyaan tanpa melafalkan angka urut.
 */
export function stripLeadingNumbering(text) {
  if (!text) return '';
  return text
    .replace(/^\s*(?:pertanyaan|soal|nomor|no)?\s*\d+[.:)-]?\s*/i, '')
    .replace(/^\s*pertanyaan\s*(?:ke-?\d+|pertama|kedua|ketiga|keempat|kelima)[.:)]?\s*/i, '')
    .trim();
}

export async function getNextQuestion(position, experience, chatHistory) {
  if (!GROQ_API_KEY) {
    return { error: "API Key belum dikonfigurasi di file .env." };
  }

  // Ganti placeholder di SYSTEM_PROMPT_HRD
  const systemContent = SYSTEM_PROMPT_HRD
    .replace('{{POSISI}}', position)
    .replace('{{PENGALAMAN}}', experience);

  const messages = [
    {
      role: "system",
      content: systemContent,
    },
    ...chatHistory.map(entry => ({ role: entry.sender === 'user' ? 'user' : 'assistant', content: entry.message }))
  ];

  let lastError = null;

  // Coba model resmi secara berurutan
  for (const modelToTry of UNIQUE_MODELS) {
    try {
      const response = await fetch(GROQ_API_CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToTry,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || response.statusText;
        console.warn(`Groq model ${modelToTry} response error (${response.status}): ${errorMsg}`);

        if (response.status === 404 || errorMsg.includes('does not exist') || errorMsg.includes('decommissioned')) {
          lastError = `Model ${modelToTry}: ${errorMsg}`;
          continue;
        }

        return { error: `API request failed: ${response.status} - ${errorMsg}` };
      }

      const data = await response.json();
      let rawContent = data.choices[0]?.message?.content || "Maaf, saya tidak bisa memproses pertanyaan saat ini.";
      
      // Bersihkan pemikiran model reasoning (<think>...</think>) jika ada
      const cleanedContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      const aiResponseContent = cleanedContent || rawContent;

      // Cek apakah ada format JSON di dalam response
      const jsonMatch = aiResponseContent.match(/\{[\s\S]*"finalResult"[\s\S]*\}/);
      if (jsonMatch && isJsonString(jsonMatch[0])) {
        return { finalResult: JSON.parse(jsonMatch[0]).finalResult || JSON.parse(jsonMatch[0]) };
      } else if (isJsonString(aiResponseContent)) {
        const parsed = JSON.parse(aiResponseContent);
        return { finalResult: parsed.finalResult || parsed };
      } else {
        return { question: stripLeadingNumbering(aiResponseContent) };
      }

    } catch (error) {
      console.warn(`Error connecting to Groq with model ${modelToTry}:`, error);
      lastError = error.message;
    }
  }

  return { error: `Gagal berkomunikasi dengan AI: ${lastError}` };
}

/**
 * Evaluasi Wawancara yang Diakhiri Lebih Awal (Awal atau Tengah Sesi)
 * - Jika tidak ada jawaban (baru mulai langsung diakhiri) -> Skor 0
 * - Jika ada sebagian jawaban -> Evaluasi objektif apa adanya berdasarkan jawaban yang masuk
 */
export async function evaluateEarlyInterview(position, experience, chatHistory) {
  const userMessages = chatHistory.filter(entry => entry.sender === 'user');

  // KASUS 1: Baru mulai / belum ada jawaban dari kandidat sama sekali -> Nilai 0
  if (userMessages.length === 0) {
    return {
      finalResult: {
        score: 0,
        strengths: [
          "Kandidat telah berhasil memulai sesi simulasi wawancara."
        ],
        weaknesses: [
          "Wawancara diakhiri sebelum kandidat memberikan jawaban sama sekali.",
          "Belum ada data kompetensi teknis atau kemampuan komunikasi yang dapat dinilai."
        ],
        recommendations: [
          "Ikuti sesi wawancara hingga selesai dan jawab setiap pertanyaan dari HRD.",
          "Gunakan fitur mic rekaman suara atau ketik teks untuk menyampaikan pengalaman kerja Anda.",
          "Pelajari tips wawancara di dashboard untuk meningkatkan kepercayaan diri."
        ]
      }
    };
  }

  // KASUS 2: Diakhiri di tengah jalan dengan sebagian jawaban -> Evaluasi AI apa adanya
  if (!GROQ_API_KEY) {
    const fallbackScore = Math.min(50, userMessages.length * 20);
    return {
      finalResult: {
        score: fallbackScore,
        strengths: [
          `Kandidat telah merespons ${userMessages.length} pertanyaan awal dari HRD.`,
          "Menunjukkan inisiatif komunikasi dasar untuk posisi yang dilamar."
        ],
        weaknesses: [
          "Wawancara diakhiri lebih awal sebelum seluruh kompetensi dapat dinilai secara mendalam.",
          "Data jawaban terbatas karena sesi tidak diselesaikan hingga tuntas."
        ],
        recommendations: [
          "Selesaikan seluruh pertanyaan wawancara pada sesi berikutnya untuk evaluasi komprehensif.",
          "Perdalam penjelasan studi kasus dan pencapaian kerja."
        ]
      }
    };
  }

  const prompt = `Anda adalah HRD Alex Rivera. Kandidat untuk posisi ${position} (pengalaman: ${experience}) mengakhiri sesi wawancara di tengah jalan (wawancara tidak diselesaikan hingga selesai).
Berikut transkrip percakapan sejauh ini:
${chatHistory.map(entry => `${entry.sender === 'user' ? 'Kandidat' : 'HRD Alex'}: ${entry.message}`).join('\n')}

Tugas Anda:
Berikan evaluasi objektif APA ADANYA berdasarkan HANYA jawaban yang sudah diberikan oleh kandidat di atas.
Karena wawancara diakhiri lebih awal dan belum tuntas:
- Berikan skor proporsional apa adanya (maksimal proporsional sesuai kelengkapan jawaban, jangan beri 100).
- Jika jawaban minim atau kurang memadai, berikan skor rendah apa adanya.
- Sebutkan kelebihan dari jawaban yang ada.
- Sebutkan kekurangan dan catatan bahwa wawancara diakhiri lebih awal.
- Berikan rekomendasi konkret.

WAJIB FORMAT JSON MURNI TANPA PEMBUKA ATAU PENUTUP:
{
  "finalResult": {
    "score": <angka bilangan bulat antara 1 sampai 75>,
    "strengths": [
      "<Kelebihan yang terlihat dari jawaban yang ada 1>",
      "<Kelebihan yang terlihat dari jawaban yang ada 2>"
    ],
    "weaknesses": [
      "Wawancara diakhiri lebih awal sebelum seluruh pertanyaan kompetensi selesai diajukan.",
      "<Kekurangan dari jawaban yang ada>"
    ],
    "recommendations": [
      "<Rekomendasi pengembangan 1>",
      "<Rekomendasi pengembangan 2>"
    ]
  }
}`;

  for (const modelToTry of UNIQUE_MODELS) {
    try {
      const response = await fetch(GROQ_API_CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToTry,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content || "";
        const cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        const match = cleaned.match(/\{[\s\S]*"finalResult"[\s\S]*\}/);
        if (match && isJsonString(match[0])) {
          return { finalResult: JSON.parse(match[0]).finalResult };
        } else if (isJsonString(cleaned)) {
          const parsed = JSON.parse(cleaned);
          return { finalResult: parsed.finalResult || parsed };
        }
      }
    } catch (err) {
      console.warn(`Groq early evaluation failed with model ${modelToTry}:`, err);
    }
  }

  // Fallback cadangan jika request AI gagal
  const fallbackScore = Math.min(50, userMessages.length * 20);
  return {
    finalResult: {
      score: fallbackScore,
      strengths: [
        `Kandidat telah memberikan ${userMessages.length} jawaban selama simulasi berlangsung.`,
        "Menunjukkan kemauan berkomunikasi untuk posisi yang dilamar."
      ],
      weaknesses: [
        "Wawancara diakhiri lebih awal sebelum seluruh pertanyaan kompetensi selesai diajukan.",
        "Penilaian dilakukan berdasarkan data terbatas."
      ],
      recommendations: [
        "Selesaikan seluruh pertanyaan simulasi wawancara untuk mendapatkan skor maksimal.",
        "Pelajari kembali struktur jawaban STAR untuk menyusun narasi yang lebih komprehensif."
      ]
    }
  };
}
