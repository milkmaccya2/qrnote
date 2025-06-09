'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface HistoryItem {
  id: string;
  text: string;
  timestamp: number;
}

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('qrnote-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    // Web Speech API サポート確認
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        
        // 音声認識の初期化
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'ja-JP'; // 日本語設定
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
        };
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          console.error('音声認識エラー:', event.error);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const saveToHistory = (text: string) => {
    if (!text.trim()) return;
    
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      text: text.trim(),
      timestamp: Date.now()
    };
    
    const updatedHistory = [newItem, ...history.slice(0, 9)];
    setHistory(updatedHistory);
    localStorage.setItem('qrnote-history', JSON.stringify(updatedHistory));
  };

  const handleGenerate = () => {
    if (inputText.trim()) {
      saveToHistory(inputText);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('qrnote-history');
  };

  const startListening = () => {
    if (recognitionRef.current && speechSupported) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAudioFile(audioBlob);
        
        // ストリームを停止
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
    } catch (error) {
      console.error('録音開始エラー:', error);
      alert('マイクへのアクセスが許可されていません');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudioFile = async (audioBlob: Blob) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording-${Date.now()}.webm`);
      
      const response = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('アップロードに失敗しました');
      }
      
      const result = await response.json();
      
      // URLをテキストエリアに設定
      setInputText(result.url);
      
      // 履歴に追加
      saveToHistory(result.url);
      
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert('音声ファイルのアップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const currentQRValue = inputText.trim() || 'QRノートへようこそ！';

  const generateQRCode = async (text: string) => {
    if (!canvasRef.current) return;
    
    try {
      await QRCode.toCanvas(canvasRef.current, text, {
        width: 240,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('QR Code generation failed:', error);
    }
  };

  useEffect(() => {
    generateQRCode(currentQRValue);
  }, [currentQRValue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-xl float-animation"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl float-animation" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-r from-pink-400/20 to-cyan-400/20 rounded-full blur-xl float-animation" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/2 right-8 w-16 h-16 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-xl float-animation" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="max-w-lg mx-auto relative z-10">
        <header className="text-center mb-12 pt-8">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-cyan-400 to-purple-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/25">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm-4-4h2v6h-2v-6z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              QRノート
            </h1>
            <p className="text-slate-400 text-sm">Bridge your devices seamlessly</p>
          </div>
        </header>

        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="mb-6">
            <div className="relative">
              <textarea
                id="input-text"
                className={`w-full p-4 bg-white/90 backdrop-blur-sm border-0 rounded-2xl focus:ring-2 focus:ring-cyan-400 focus:outline-none resize-none text-slate-800 placeholder-slate-500 shadow-inner ${
                  speechSupported ? 'pr-24' : 'pr-14'
                }`}
                rows={3}
                placeholder="✨ Enter text, URL, or record audio to generate QR code..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              
              {/* 音声入力ボタン */}
              {speechSupported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isRecording || isUploading}
                  className={`absolute right-14 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600'
                  } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isListening ? '音声認識を停止' : '音声入力を開始'}
                >
                  {isListening ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h12v12H6z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                    </svg>
                  )}
                </button>
              )}

              {/* 音声録音ボタン */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isListening || isUploading}
                className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                    : isUploading
                    ? 'bg-yellow-500 animate-spin'
                    : 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600'
                } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                title={
                  isRecording 
                    ? '音声録音を停止' 
                    : isUploading 
                    ? 'アップロード中...' 
                    : '音声を録音してS3にアップロード'
                }
              >
                {isUploading ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
                  </svg>
                ) : isRecording ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                  </svg>
                )}
              </button>
            </div>
            
            {/* 状態表示 */}
            {(isListening || isRecording || isUploading) && (
              <div className="mt-3 flex items-center gap-2 text-white/80 text-sm">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  isListening ? 'bg-cyan-400' : 
                  isRecording ? 'bg-red-400' : 
                  'bg-yellow-400'
                }`}></div>
                <span>
                  {isListening ? '音声を認識中...' : 
                   isRecording ? '音声を録音中...' : 
                   'S3にアップロード中...'}
                </span>
              </div>
            )}
            
            {!speechSupported && (
              <div className="mt-3 text-white/60 text-xs">
                ⚠️ このブラウザは音声認識をサポートしていません
              </div>
            )}
          </div>
          
          <button
            onClick={handleGenerate}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-4 px-6 rounded-2xl hover:from-cyan-600 hover:to-purple-600 transition-all duration-300 font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm-4-4h2v6h-2v-6z"/>
              </svg>
              Generate QR Code
            </span>
          </button>
        </div>

        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative bg-white p-6 rounded-2xl shadow-xl">
                <canvas 
                  ref={canvasRef}
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            </div>
            <div className="mt-6 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
              <p className="text-white/90 text-sm text-center break-all font-mono leading-relaxed">
                {currentQRValue}
              </p>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                </svg>
                Recent
              </h2>
              <button
                onClick={clearHistory}
                className="text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
              >
                Clear
              </button>
            </div>
            <div className="space-y-3">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className="group p-4 bg-white/10 backdrop-blur-sm rounded-2xl cursor-pointer hover:bg-white/20 transition-all duration-300 border border-white/10 hover:border-white/30"
                  onClick={() => setInputText(item.text)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm break-all leading-relaxed group-hover:text-white transition-colors">
                        {item.text}
                      </p>
                      <p className="text-white/50 text-xs mt-2 font-mono">
                        {new Date(item.timestamp).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="text-center mt-12 pb-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>Bridge your devices seamlessly</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="text-white/40 text-xs">
              Made with ❤️ using Next.js + Tailwind CSS
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
