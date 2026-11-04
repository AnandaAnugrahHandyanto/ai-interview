import React, { useState, useEffect } from 'react';
import FormInput from './components/FormInput';
import InterviewSession from './components/InterviewSession';
import ResultPage from './components/ResultPage';
import { getNextQuestion } from './lib/ai';

function App() {
  const [page, setPage] = useState('form');
  const [userData, setUserData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [finalResult, setFinalResult] = useState(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchAIResponse = async (userAnswer = null, isInitial = false) => {
    setIsLoadingAI(true);
    setIsSpeaking(true);

    const historyToPass = [...chatHistory];
    if (userAnswer) {
      historyToPass.push({ sender: 'user', message: userAnswer });
    }

    const response = await getNextQuestion(userData.position, userData.experience, historyToPass);

    if (response.error) {
      setCurrentQuestion(`Terjadi kesalahan: ${response.error}`);
    } else if (response.finalResult) {
      setFinalResult(response.finalResult);
      setPage('result');
    } else if (response.question) {
      setCurrentQuestion(response.question);
      setChatHistory(prev => isInitial ? 
        [{ sender: 'assistant', message: response.question }] : 
        [...prev, { sender: 'user', message: userAnswer }, { sender: 'assistant', message: response.question }]
      );
    }
    setIsLoadingAI(false);
    setIsSpeaking(false);
  };

  const handleStartInterview = (data) => {
    setUserData(data);
    setPage('interview');
    const greetings = [
      `Halo ${data.name}, mari kita mulai wawancara untuk posisi ${data.position}. Ceritakan pengalaman Anda.`,
      `Selamat datang ${data.name}. Mari bahas posisi ${data.position}. Silakan perkenalkan latar belakang Anda.`,
      `Halo ${data.name}, silakan mulai perkenalan untuk posisi ${data.position}.`
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
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
  };

  const handleEndInterviewEarly = () => fetchAIResponse("Mohon akhiri interview dan berikan evaluasi final sekarang.");

  return (
    <div className="App">
      {page === 'form' && <FormInput onStart={handleStartInterview} />}
      {page === 'interview' && (
        <InterviewSession
          currentQuestion={currentQuestion}
          onSendAnswer={handleSendAnswer}
          isSpeaking={isSpeaking}
          isLoadingAI={isLoadingAI}
          onEndInterview={handleEndInterviewEarly}
          userName={userData?.name}
        />
      )}
      {page === 'result' && <ResultPage finalResult={finalResult} onRestart={handleRestartInterview} />}
    </div>
  );
}

export default App;
