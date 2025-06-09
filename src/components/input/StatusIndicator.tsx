interface StatusIndicatorProps {
  isListening: boolean;
  isRecording: boolean;
  isUploading: boolean;
  isCameraMode: boolean;
  isImageUploading: boolean;
  speechSupported: boolean;
}

/**
 * 状態表示コンポーネント
 * 各種処理状態の視覚的フィードバック
 */
export default function StatusIndicator({
  isListening,
  isRecording,
  isUploading,
  isCameraMode,
  isImageUploading,
  speechSupported
}: StatusIndicatorProps) {
  const hasActiveStatus = isListening || isRecording || isUploading || isCameraMode || isImageUploading;

  if (!hasActiveStatus && speechSupported) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {/* アクティブな状態表示 */}
      {hasActiveStatus && (
        <div className="flex items-center gap-2 text-white/80 text-sm">
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
      
      {/* 音声認識サポート警告 */}
      {!speechSupported && (
        <div className="text-white/60 text-xs">
          ⚠️ このブラウザは音声認識をサポートしていません
        </div>
      )}
    </div>
  );
}