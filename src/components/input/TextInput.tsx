import StatusIndicator from './StatusIndicator';

interface SpeechProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
}

interface AudioProps {
  isRecording: boolean;
  isUploading: boolean;
  onStart: () => void;
  onStop: () => void;
}

interface TextInputProps {
  inputText: string;
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  isCameraMode: boolean;
  isImageUploading: boolean;
  onToggleCameraMode: () => void;
  speechProps: SpeechProps;
  audioProps: AudioProps;
}

/**
 * テキスト入力コンポーネント
 * テキスト入力、音声認識、音声録音、カメラ機能を統合
 */
export default function TextInput({
  inputText,
  onTextChange,
  onGenerate,
  isCameraMode,
  isImageUploading,
  onToggleCameraMode,
  speechProps,
  audioProps
}: TextInputProps) {
  const { isListening, isSupported: speechSupported, onStart: startListening, onStop: stopListening } = speechProps;
  const { isRecording, isUploading, onStart: startRecording, onStop: stopRecording } = audioProps;

  const isAnyProcessing = isListening || isRecording || isUploading || isImageUploading;

  return (
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
            onChange={(e) => onTextChange(e.target.value)}
          />
          
          {/* 音声認識ボタン */}
          {speechSupported && (
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isRecording || isUploading || isCameraMode || isImageUploading}
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
            disabled={isListening || isUploading || isCameraMode || isImageUploading}
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
            onClick={onToggleCameraMode}
            disabled={isAnyProcessing}
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
        <StatusIndicator
          isListening={isListening}
          isRecording={isRecording}
          isUploading={isUploading}
          isCameraMode={isCameraMode}
          isImageUploading={isImageUploading}
          speechSupported={speechSupported}
        />
      </div>
      
      <button
        onClick={onGenerate}
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
  );
}