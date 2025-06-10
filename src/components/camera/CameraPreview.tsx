import { RefObject, useState, useEffect } from 'react';

interface CameraPreviewProps {
  isVisible: boolean;
  isUploading: boolean;
  onCapture: () => void;
  onSwitchCamera: () => void;
  cameraProps: {
    isActive: boolean;
    isSupported: boolean;
    error: string | null;
    videoRef: RefObject<HTMLVideoElement | null>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
  };
}

/**
 * カメラプレビューコンポーネント
 * カメラ撮影機能とコントロールを提供
 */
export default function CameraPreview({ 
  isVisible, 
  isUploading, 
  onCapture, 
  onSwitchCamera, 
  cameraProps 
}: CameraPreviewProps) {
  const [showFlash, setShowFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const { isActive, isSupported, error, videoRef, canvasRef } = cameraProps;

  // フラッシュ効果を自動的に非表示にする
  useEffect(() => {
    if (!showFlash) return;
    
    const timer = setTimeout(() => {
      setShowFlash(false);
    }, 200);
    
    return () => clearTimeout(timer);
  }, [showFlash]);

  // カメラモードを閉じたときにプレビューをクリア
  useEffect(() => {
    if (!isVisible) {
      setCapturedImage(null);
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const handleCapture = async () => {
    // フラッシュ効果を表示
    setShowFlash(true);
    
    // キャンバスから画像を取得してプレビュー用に保存
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // プレビュー用の画像URLを生成
        const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageUrl);
      }
    }
    
    // 元のキャプチャ処理を実行
    onCapture();
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 mb-8 shadow-2xl">
      <div className="flex flex-col items-center">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-blue-400 to-indigo-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl">
            {isSupported && !error ? (
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
                    {error || 'カメラを起動中...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* カメラコントロール */}
        {isActive && (
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleCapture}
              disabled={isUploading}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
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
              onClick={onSwitchCamera}
              disabled={isUploading}
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
      
      {/* 撮影した画像のプレビュー */}
      {capturedImage && !isUploading && (
        <div className="mt-4 flex justify-center">
          <div className="relative">
            <img 
              src={capturedImage} 
              alt="撮影した画像" 
              className="w-24 h-24 rounded-xl object-cover shadow-lg ring-2 ring-white/30"
            />
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              撮影済み
            </div>
          </div>
        </div>
      )}
      
      {/* 隠しキャンバス（写真撮影用） */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* フラッシュ効果 */}
      {showFlash && (
        <div className="fixed inset-0 bg-white pointer-events-none z-50 animate-flash" />
      )}
    </div>
  );
}