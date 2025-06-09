import { RefObject } from 'react';

interface QRDisplayProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  currentValue: string;
}

/**
 * QRコード表示コンポーネント
 * QRコードのキャンバスと現在の値を表示
 */
export default function QRDisplay({ canvasRef, currentValue }: QRDisplayProps) {
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
      </div>
    </div>
  );
}