/**
 * 履歴アイテムの型定義
 */
export interface HistoryItem {
  /** 一意のID */
  id: string;
  /** QRコード生成用のテキスト */
  text: string;
  /** 作成日時のタイムスタンプ */
  timestamp: number;
}

/**
 * 音声認識の結果
 */
export interface SpeechRecognitionEventResult {
  /** 認識されたテキスト */
  transcript: string;
  /** 認識の信頼度（0-1） */
  confidence: number;
}

/**
 * 音声認識の結果リスト
 */
export interface SpeechRecognitionEventResultList {
  [index: number]: SpeechRecognitionEventResult;
  length: number;
}

/**
 * 音声認識のイベント
 */
export interface SpeechRecognitionEvent extends Event {
  /** 認識結果の配列 */
  results: SpeechRecognitionEventResultList[];
}

/**
 * 音声認識のエラーイベント
 */
export interface SpeechRecognitionErrorEvent extends Event {
  /** エラーの種類 */
  error: string;
}

/**
 * Web Speech API の SpeechRecognition インターフェース
 */
export interface SpeechRecognition extends EventTarget {
  /** 連続音声認識を有効にするかどうか */
  continuous: boolean;
  /** 中間結果を取得するかどうか */
  interimResults: boolean;
  /** 認識言語 */
  lang: string;
  /** 音声認識を開始 */
  start(): void;
  /** 音声認識を停止 */
  stop(): void;
  /** 認識開始時のコールバック */
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  /** 認識終了時のコールバック */
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  /** 認識結果取得時のコールバック */
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  /** エラー発生時のコールバック */
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
}

/**
 * 音声ファイルアップロードの結果
 */
export interface AudioUploadResult {
  /** アップロードが成功したかどうか */
  success: boolean;
  /** アップロードされたファイルの公開URL */
  url: string;
  /** 署名付きURL */
  signedUrl: string;
  /** アップロードされたファイル名 */
  fileName: string;
  /** URL の有効期限 */
  expiresAt: string;
}

/**
 * AWS エラーの型定義
 */
export interface AWSError extends Error {
  /** AWS エラーコード */
  code?: string;
  /** HTTP ステータスコード */
  statusCode?: number;
}

/**
 * Window オブジェクトの型拡張
 */
declare global {
  interface Window {
    /** 標準の SpeechRecognition API */
    SpeechRecognition?: {
      new (): SpeechRecognition;
    };
    /** WebKit プレフィックス付きの SpeechRecognition API */
    webkitSpeechRecognition?: {
      new (): SpeechRecognition;
    };
  }
}

/**
 * useSpeechRecognition フックのオプション
 */
export interface UseSpeechRecognitionOptions {
  /** 認識言語（デフォルト: 'ja-JP'） */
  lang?: string;
  /** 連続音声認識を有効にするかどうか */
  continuous?: boolean;
  /** 中間結果を取得するかどうか */
  interimResults?: boolean;
  /** 認識結果を受け取るコールバック */
  onResult?: (transcript: string) => void;
  /** エラー発生時のコールバック */
  onError?: (error: string) => void;
}

/**
 * useAudioRecording フックのオプション
 */
export interface UseAudioRecordingOptions {
  /** 録音のMIMEタイプ */
  mimeType?: string;
  /** アップロード成功時のコールバック */
  onUploadSuccess?: (url: string) => void;
  /** アップロードエラー時のコールバック */
  onUploadError?: (error: string) => void;
}

/**
 * useHistory フックのオプション
 */
export interface UseHistoryOptions {
  /** 履歴の最大保存件数 */
  maxItems?: number;
  /** ローカルストレージのキー */
  storageKey?: string;
}

/**
 * useCameraCapture フックのオプション
 */
export interface UseCameraCaptureOptions {
  /** 写真撮影成功時のコールバック */
  onCapture?: (imageBlob: Blob) => void;
  /** エラー発生時のコールバック */
  onError?: (error: string) => void;
  /** キャプチャする画像の幅 */
  width?: number;
  /** キャプチャする画像の高さ */
  height?: number;
  /** カメラの向き（'user': 前面カメラ, 'environment': 背面カメラ） */
  facingMode?: 'user' | 'environment';
}

/**
 * 画像ファイルアップロードの結果
 */
export interface ImageUploadResult {
  /** アップロードが成功したかどうか */
  success: boolean;
  /** アップロードされた画像の公開URL */
  url: string;
  /** 署名付きURL */
  signedUrl: string;
  /** アップロードされたファイル名 */
  fileName: string;
  /** URL の有効期限 */
  expiresAt: string;
}