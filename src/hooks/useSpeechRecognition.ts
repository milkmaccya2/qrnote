import { useState, useRef, useEffect, useCallback } from 'react';
import type { 
  SpeechRecognition, 
  SpeechRecognitionEvent, 
  SpeechRecognitionErrorEvent,
  UseSpeechRecognitionOptions 
} from '@/types';
import { SPEECH_CONFIG } from '@/constants';

/**
 * Web Speech API を使用した音声認識のカスタムフック
 * 
 * @param options - 音声認識のオプション設定
 * @returns 音声認識の状態と操作用の関数
 */
export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const {
    lang = SPEECH_CONFIG.DEFAULT_LANG,
    continuous = SPEECH_CONFIG.CONTINUOUS,
    interimResults = SPEECH_CONFIG.INTERIM_RESULTS,
    onResult,
    onError
  } = options;

  /**
   * Web Speech API の初期化とイベントハンドラーの設定
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        
        const recognition = new SpeechRecognition();
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = lang;
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          onResult?.(transcript);
          setIsListening(false);
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('音声認識エラー:', event.error);
          onError?.(event.error);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, [lang, continuous, interimResults, onResult, onError]);

  /**
   * 音声認識を開始する
   */
  const startListening = useCallback(() => {
    if (recognitionRef.current && isSupported && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        onError?.('Failed to start speech recognition');
      }
    }
  }, [isSupported, isListening, onError]);

  /**
   * 音声認識を停止する
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
      }
    }
  }, [isListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening
  };
}