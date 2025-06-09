'use client';

import { useState, useEffect } from 'react';
import { useHistory } from '@/hooks/useHistory';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useQRCodeGeneration } from '@/hooks/useQRCodeGeneration';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { uploadImageFile } from '@/services/imageUploadService';
import { QR_CONFIG } from '@/constants';

/**
 * QRノートメインページコンポーネント
 * テキスト、URL、音声からQRコードを生成し、デバイス間でのデータ交換を支援する
 */
export default function Home() {
  const [inputText, setInputText] = useState('');
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  // カスタムフックの初期化
  const { history, addToHistory, clearHistory } = useHistory();
  
  const { 
    isListening, 
    isSupported: speechSupported, 
    startListening, 
    stopListening 
  } = useSpeechRecognition({
    onResult: (transcript) => setInputText(transcript),
    onError: (error) => console.error('音声認識エラー:', error)
  });
  
  const { 
    isRecording, 
    isUploading, 
    startRecording, 
    stopRecording 
  } = useAudioRecording({
    onUploadSuccess: (url) => {
      setInputText(url);
      addToHistory(url);
    },
    onUploadError: (error) => {
      console.error('アップロードエラー:', error);
      alert('音声ファイルのアップロードに失敗しました');
    }
  });
  
  const { canvasRef, generateQRCode } = useQRCodeGeneration({
    onError: (error) => console.error('QRコード生成エラー:', error)
  });

  const { 
    isActive: isCameraActive,
    isSupported: cameraSupported,
    error: cameraError,
    videoRef,
    canvasRef: cameraCanvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    cleanup: cleanupCamera
  } = useCameraCapture({
    onCapture: async (imageBlob) => {
      try {
        setIsImageUploading(true);
        const result = await uploadImageFile(imageBlob);
        setInputText(result.url);
        addToHistory(result.url);
        setIsCameraMode(false);
        stopCamera();
      } catch (error) {
        console.error('画像アップロードエラー:', error);
        alert('画像のアップロードに失敗しました');
      } finally {
        setIsImageUploading(false);
      }
    },
    onError: (error) => {
      console.error('カメラエラー:', error);
      alert(error);
    }
  });

  /**
   * QRコードの現在の値を取得
   */
  const currentQRValue = inputText.trim() || QR_CONFIG.DEFAULT_MESSAGE;

  /**
   * QRコード生成ボタンのハンドラー
   */
  const handleGenerate = () => {
    if (inputText.trim()) {
      addToHistory(inputText);
    }
  };

  /**
   * カメラモードの切り替え
   */
  const toggleCameraMode = () => {
    if (isCameraMode) {
      setIsCameraMode(false);
      stopCamera();
    } else {
      setIsCameraMode(true);
      if (cameraSupported) {
        startCamera();
      }
    }
  };

  /**
   * 写真撮影ハンドラー
   */
  const handleCapturePhoto = async () => {
    if (isCameraActive) {
      await capturePhoto();
    }
  };

  /**
   * テキスト変更時にQRコードを自動更新
   */
  useEffect(() => {
    generateQRCode(currentQRValue);
  }, [currentQRValue, generateQRCode]);

  /**
   * コンポーネントアンマウント時のクリーンアップ
   */
  useEffect(() => {
    return () => {
      cleanupCamera();
    };
  }, [cleanupCamera]);

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
                  speechSupported ? 'pr-32' : 'pr-24'
                }`}
                rows={3}
                placeholder="✨ Enter text, URL, record audio, or capture photo to generate QR code..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              
              {/* 音声入力ボタン */}
              {speechSupported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isRecording || isUploading || isCameraMode}
                  className={`absolute right-24 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
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
                disabled={isListening || isUploading || isCameraMode}
                className={`absolute right-14 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
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

              {/* カメラボタン */}
              <button
                onClick={toggleCameraMode}
                disabled={isListening || isRecording || isUploading || isImageUploading}
                className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCameraMode
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isCameraMode ? 'カメラを閉じる' : 'カメラで撮影'}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 15.2l3.2-2.7L12 9.8l-3.2 2.7L12 15.2zM9 2l1.17 1H14v0l1.17-1H18c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h3zm6 17.5c3.31 0 6-2.69 6-6s-2.69-6-6-6-6 2.69-6 6 2.69 6 6 6zM12 8c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z"/>
                </svg>
              </button>
            </div>
            
            {/* 状態表示 */}
            {(isListening || isRecording || isUploading || isCameraMode || isImageUploading) && (
              <div className="mt-3 flex items-center gap-2 text-white/80 text-sm">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  isListening ? 'bg-cyan-400' : 
                  isRecording ? 'bg-red-400' : 
                  isCameraMode ? 'bg-green-400' :
                  isImageUploading ? 'bg-blue-400' :
                  'bg-yellow-400'
                }`}></div>
                <span>
                  {isListening ? '音声を認識中...' : 
                   isRecording ? '音声を録音中...' : 
                   isCameraMode ? 'カメラ撮影モード' :
                   isImageUploading ? '画像をアップロード中...' :
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

        {/* カメラプレビューエリア */}
        {isCameraMode && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 mb-8 shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-blue-400 to-indigo-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl">
                  {cameraSupported && !cameraError ? (
                    <video
                      ref={videoRef}
                      className="w-full max-w-md h-auto rounded-lg"
                      autoPlay
                      playsInline
                      muted
                    />
                  ) : (
                    <div className="w-full max-w-md h-48 flex items-center justify-center text-white/60">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 15.2l3.2-2.7L12 9.8l-3.2 2.7L12 15.2zM9 2l1.17 1H14v0l1.17-1H18c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h3z"/>
                        </svg>
                        <p className="text-sm">
                          {cameraError || 'カメラを起動中...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* カメラコントロール */}
              {isCameraActive && (
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleCapturePhoto}
                    disabled={isImageUploading}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isImageUploading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
                        </svg>
                        アップロード中...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                        </svg>
                        写真を撮影
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={switchCamera}
                    disabled={isImageUploading}
                    className="px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl hover:bg-white/30 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="カメラを切り替え"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM9 16l5.5-4L12 10.5 8.5 12 9 16zm0-6l2.5-2L9 6l-2.5 2L9 10z"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            {/* 隠しキャンバス（写真撮影用） */}
            <canvas ref={cameraCanvasRef} className="hidden" />
          </div>
        )}

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
