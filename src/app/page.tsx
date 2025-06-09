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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('qrnote-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
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

  const currentQRValue = inputText.trim() || 'QRノートへようこそ！';

  const generateQRCode = async (text: string) => {
    if (!canvasRef.current) return;
    
    try {
      await QRCode.toCanvas(canvasRef.current, text, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📱 QRノート</h1>
          <p className="text-gray-600">スマホとPCのちょっとした橋渡し</p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label htmlFor="input-text" className="block text-sm font-medium text-gray-700 mb-2">
              テキストまたはURLを入力
            </label>
            <textarea
              id="input-text"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="QRコードにしたいテキストやURLを入力してください..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
          
          <button
            onClick={handleGenerate}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            QRコード生成
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex justify-center">
              <canvas 
                ref={canvasRef}
                className="max-w-full h-auto"
              />
            </div>
            <p className="mt-3 text-sm text-gray-600 text-center break-all max-w-full">
              {currentQRValue}
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">履歴</h2>
              <button
                onClick={clearHistory}
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                クリア
              </button>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setInputText(item.text)}
                >
                  <p className="text-sm text-gray-800 break-all">{item.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.timestamp).toLocaleString('ja-JP')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>💡 PCで入力してスマホで読み取り、またはその逆も！</p>
        </footer>
      </div>
    </div>
  );
}
