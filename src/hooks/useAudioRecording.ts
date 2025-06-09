import { useState, useRef, useCallback } from 'react';
import type { UseAudioRecordingOptions } from '@/types';
import { AUDIO_CONFIG } from '@/constants';
import { uploadAudioFile } from '@/services/audioUploadService';

/**
 * 音声録音とS3アップロード用のカスタムフック
 * 
 * @param options - 音声録音のオプション設定
 * @returns 音声録音の状態と操作用の関数
 */
export function useAudioRecording(options: UseAudioRecordingOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const {
    mimeType = AUDIO_CONFIG.MIME_TYPE,
    onUploadSuccess,
    onUploadError
  } = options;

  /**
   * 音声ファイルをS3にアップロードする
   * 
   * @param audioBlob - アップロードする音声ファイルのBlob
   */
  const handleUpload = useCallback(async (audioBlob: Blob) => {
    setIsUploading(true);
    
    try {
      const result = await uploadAudioFile(audioBlob);
      onUploadSuccess?.(result.url);
    } catch (error) {
      console.error('アップロードエラー:', error);
      onUploadError?.(
        error instanceof Error 
          ? error.message 
          : '音声ファイルのアップロードに失敗しました'
      );
    } finally {
      setIsUploading(false);
    }
  }, [onUploadSuccess, onUploadError]);

  /**
   * 音声録音を開始する
   */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // MediaRecorderがサポートするMIMEタイプを確認
      const supportedMimeType = MediaRecorder.isTypeSupported(mimeType) 
        ? mimeType 
        : AUDIO_CONFIG.FALLBACK_MIME_TYPE;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: supportedMimeType 
        });
        await handleUpload(audioBlob);
        
        // ストリームを停止
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
    } catch (error) {
      console.error('録音開始エラー:', error);
      onUploadError?.('マイクへのアクセスが許可されていません');
      setIsSupported(false);
    }
  }, [mimeType, onUploadError, handleUpload]);

  /**
   * 音声録音を停止する
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  /**
   * リソースのクリーンアップを実行する
   */
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
    isRecording,
    isUploading,
    isSupported,
    startRecording,
    stopRecording,
    cleanup
  };
}