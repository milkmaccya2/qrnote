import { RefObject, useState, useEffect } from 'react';
import { isImageUrl } from '@/lib/utils';

interface QRDisplayProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  currentValue: string;
}

/**
 * QRコード表示コンポーネント
 * QRコードのキャンバスと現在の値を表示
 */
export default function QRDisplay({ canvasRef, currentValue }: QRDisplayProps) {
  const [isImage, setIsImage] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // URLが画像URLかどうかをチェック
  useEffect(() => {
    setIsImage(isImageUrl(currentValue));
    setImageLoaded(false);
  }, [currentValue]);
  return (
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
            {currentValue}
          </p>
        </div>
        
        {/* 画像URLの場合のプレビュー */}
        {isImage && (
          <div className="mt-6">
            <div className="relative">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl">
                  <svg className="w-8 h-8 animate-spin text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
                  </svg>
                </div>
              )}
              <img
                src={currentValue}
                alt="プレビュー"
                className={`max-w-full h-auto rounded-2xl shadow-xl transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ maxHeight: '300px' }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setIsImage(false)}
              />
            </div>
            <p className="text-white/60 text-xs text-center mt-2">
              画像プレビュー
            </p>
          </div>
        )}
      </div>
    </div>
  );
}