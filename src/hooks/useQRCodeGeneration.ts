import { useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { QR_CONFIG } from '@/constants';

/**
 * QRコード生成フックのオプション
 */
interface UseQRCodeGenerationOptions {
  /** QRコードの幅（ピクセル） */
  width?: number;
  /** QRコードの余白 */
  margin?: number;
  /** エラー訂正レベル */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  /** エラー発生時のコールバック */
  onError?: (error: string) => void;
}

/**
 * QRコード生成用のカスタムフック
 * 
 * @param options - QRコード生成のオプション設定
 * @returns QRコード生成用の状態と関数
 */
export function useQRCodeGeneration(options: UseQRCodeGenerationOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    width = QR_CONFIG.SIZE,
    margin = QR_CONFIG.MARGIN,
    errorCorrectionLevel = QR_CONFIG.ERROR_CORRECTION_LEVEL,
    onError
  } = options;

  /**
   * キャンバスにQRコードを生成する
   * 
   * @param text - QRコードに埋め込むテキスト
   * @returns 生成に成功したかどうか
   */
  const generateQRCode = useCallback(async (text: string) => {
    if (!canvasRef.current) {
      onError?.('Canvas element not found');
      return false;
    }
    
    if (!text.trim()) {
      text = QR_CONFIG.DEFAULT_MESSAGE;
    }
    
    try {
      await QRCode.toCanvas(canvasRef.current, text, {
        width,
        margin,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        },
        errorCorrectionLevel
      });
      return true;
    } catch (error) {
      console.error('QR Code generation failed:', error);
      onError?.(
        error instanceof Error 
          ? error.message 
          : 'QRコード生成に失敗しました'
      );
      return false;
    }
  }, [width, margin, errorCorrectionLevel, onError]);

  /**
   * QRコードをData URL形式で生成する
   * 
   * @param text - QRコードに埋め込むテキスト
   * @returns 生成されたData URLまたはnull
   */
  const generateQRCodeDataURL = useCallback(async (text: string): Promise<string | null> => {
    if (!text.trim()) {
      text = QR_CONFIG.DEFAULT_MESSAGE;
    }
    
    try {
      const dataURL = await QRCode.toDataURL(text, {
        width,
        margin,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        },
        errorCorrectionLevel
      });
      return dataURL;
    } catch (error) {
      console.error('QR Code data URL generation failed:', error);
      onError?.(
        error instanceof Error 
          ? error.message 
          : 'QRコード生成に失敗しました'
      );
      return null;
    }
  }, [width, margin, errorCorrectionLevel, onError]);

  return {
    canvasRef,
    generateQRCode,
    generateQRCodeDataURL
  };
}