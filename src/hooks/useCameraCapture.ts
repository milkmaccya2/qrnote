import { useState, useRef, useCallback } from 'react';
import type { UseCameraCaptureOptions } from '@/types';

/**
 * カメラキャプチャ用のカスタムフック
 * 
 * @param options - カメラキャプチャのオプション設定
 * @returns カメラの状態と操作用の関数
 */
export function useCameraCapture(options: UseCameraCaptureOptions = {}) {
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    onCapture,
    onError,
    width = 640,
    height = 480,
    facingMode = 'environment' // 背面カメラを優先
  } = options;

  /**
   * カメラを起動する
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices?.getUserMedia) {
        setIsSupported(false);
        const errorMsg = 'このブラウザはカメラ機能をサポートしていません';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: facingMode
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);
      }
    } catch (error) {
      console.error('カメラ起動エラー:', error);
      const errorMsg = error instanceof Error 
        ? error.message 
        : 'カメラの起動に失敗しました';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsSupported(false);
    }
  }, [width, height, facingMode, onError]);

  /**
   * カメラを停止する
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setError(null);
  }, []);

  /**
   * 写真を撮影する
   */
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) {
      const errorMsg = 'カメラが起動していません';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        const errorMsg = 'Canvas context の取得に失敗しました';
        setError(errorMsg);
        onError?.(errorMsg);
        return null;
      }

      // キャンバスサイズをビデオサイズに合わせる
      canvas.width = video.videoWidth || width;
      canvas.height = video.videoHeight || height;

      // ビデオフレームをキャンバスに描画
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Blobオブジェクトとして画像データを取得
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            onCapture?.(blob);
            resolve(blob);
          } else {
            const errorMsg = '画像の生成に失敗しました';
            setError(errorMsg);
            onError?.(errorMsg);
            resolve(null);
          }
        }, 'image/jpeg', 0.9);
      });
    } catch (error) {
      console.error('写真撮影エラー:', error);
      const errorMsg = error instanceof Error 
        ? error.message 
        : '写真の撮影に失敗しました';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    }
  }, [isActive, width, height, onCapture, onError]);

  /**
   * カメラの向きを切り替える
   */
  const switchCamera = useCallback(async () => {
    if (!isActive) return;
    
    stopCamera();
    
    // 前面・背面カメラを切り替え
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: newFacingMode
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);
      }
    } catch (error) {
      console.error('カメラ切り替えエラー:', error);
      const errorMsg = 'カメラの切り替えに失敗しました';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [isActive, facingMode, width, height, onError, stopCamera]);

  /**
   * リソースのクリーンアップ
   */
  const cleanup = useCallback(() => {
    stopCamera();
  }, [stopCamera]);

  return {
    isActive,
    isSupported,
    error,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    cleanup
  };
}