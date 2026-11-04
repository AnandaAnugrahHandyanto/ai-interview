import { 
  GROQ_API_CHAT_ENDPOINT,
  GROQ_CHAT_MODEL,
  SYSTEM_PROMPT_HRD
} from '../constants';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Fungsi untuk memeriksa apakah string adalah JSON yang valid
export function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export async function getNextQuestion(position, experience, chatHistory) {
  if (!GROQ_API_KEY) {
    return { error: "API Key is not configured." };
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

  try {
    const response = await fetch(GROQ_API_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_CHAT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API Error:", errorData);
      return { error: `API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || JSON.stringify(errorData)}` };
    }

    const data = await response.json();
    const aiResponseContent = data.choices[0]?.message?.content || "Maaf, saya tidak bisa memproses pertanyaan saat ini.";

    if (isJsonString(aiResponseContent)) {
      return { finalResult: JSON.parse(aiResponseContent) };
    } else {
      return { question: aiResponseContent };
    }

  } catch (error) {
    console.error("Error fetching from Groq API:", error);
    return { error: `Gagal berkomunikasi dengan AI: ${error.message}` };
  }
}