import React, { useState, useEffect, useRef } from 'react';
import AIHRD from '../AIHRD';
import { Mic, MicOff, PhoneOff, User } from 'lucide-react';
import './InterviewSession.css';
import { GROQ_API_TRANSCRIPTION_ENDPOINT, GROQ_TRANSCRIPTION_MODEL } from '../constants';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function InterviewSession({ currentQuestion, onSendAnswer, isSpeaking, isLoadingAI, onEndInterview, userName }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoRef = useRef(null);

  const cleanText = (text) => text?.replace(/[*#_~]/g, '') || '';

  useEffect(() => {
    if (currentQuestion && !isLoadingAI && !isSpeaking) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText(currentQuestion));
      utterance.lang = 'id-ID';
      window.speechSynthesis.speak(utterance);
    }
  }, [currentQuestion]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Webcam access denied:", err);
      }
    };
    startCamera();
  }, []);

  const startRecording = async () => {
    window.speechSynthesis.cancel();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await transcribeAudio(new File([audioBlob], 'audio.webm', { type: 'audio/webm' }));
    };
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const transcribeAudio = async (audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', GROQ_TRANSCRIPTION_MODEL);
    const response = await fetch(GROQ_API_TRANSCRIPTION_ENDPOINT, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });
    const data = await response.json();
    if (data.text) onSendAnswer(data.text);
  };

  return (
    <div className="interview-container">
      <div className="meeting-body">
        <main className="main-stage">
          <AIHRD isSpeaking={isSpeaking} />
          <div className="caption-box">{cleanText(currentQuestion)}</div>
        </main>
        <aside className="sidebar">
          <div className="user-video">
            <video ref={videoRef} autoPlay muted playsInline />
            <div className="user-overlay">
              <User size={14} /> {userName}
            </div>
            {isRecording && <div className="rec-indicator" />}
          </div>
        </aside>
      </div>
      <footer className="control-bar">
        <button className={`mic-btn ${isRecording ? 'recording' : ''}`} onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}
        </button>
        <button className="end-btn" onClick={onEndInterview}>
          <PhoneOff size={24} color="white" />
        </button>
      </footer>
    </div>
  );
}
