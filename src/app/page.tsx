'use client';

import { useState, useEffect } from 'react';
import { useHistory } from '@/hooks/useHistory';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { useQRCodeGeneration } from '@/hooks/useQRCodeGeneration';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { uploadImageFile } from '@/services/imageUploadService';
import { QR_CONFIG } from '@/constants';

// コンポーネントインポート
import BackgroundEffects from '@/components/layout/BackgroundEffects';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import TextInput from '@/components/input/TextInput';
import CameraPreview from '@/components/camera/CameraPreview';
import QRDisplay from '@/components/qr/QRDisplay';
import HistorySection from '@/components/history/HistorySection';

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
      {/* 背景エフェクト */}
      <BackgroundEffects />
      
      <div className="max-w-lg mx-auto relative z-10">
        {/* ヘッダー */}
        <AppHeader />

        {/* テキスト入力エリア */}
        <TextInput
          inputText={inputText}
          onTextChange={setInputText}
          onGenerate={handleGenerate}
          isCameraMode={isCameraMode}
          isImageUploading={isImageUploading}
          onToggleCameraMode={toggleCameraMode}
          speechProps={{
            isListening,
            isSupported: speechSupported,
            onStart: startListening,
            onStop: stopListening
          }}
          audioProps={{
            isRecording,
            isUploading,
            onStart: startRecording,
            onStop: stopRecording
          }}
        />

        {/* カメラプレビュー */}
        <CameraPreview
          isVisible={isCameraMode}
          isUploading={isImageUploading}
          onCapture={handleCapturePhoto}
          onSwitchCamera={switchCamera}
          cameraProps={{
            isActive: isCameraActive,
            isSupported: cameraSupported,
            error: cameraError,
            videoRef,
            canvasRef: cameraCanvasRef
          }}
        />

        {/* QRコード表示 */}
        <QRDisplay
          canvasRef={canvasRef}
          currentValue={currentQRValue}
        />

        {/* 履歴セクション */}
        <HistorySection
          history={history}
          onSelectItem={setInputText}
          onClear={clearHistory}
        />

        {/* フッター */}
        <AppFooter />
      </div>
    </div>
  );
}