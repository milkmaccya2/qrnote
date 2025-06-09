/**
 * ローカルストレージで使用するキーの定数
 */
export const STORAGE_KEYS = {
  /** 履歴データを保存するキー */
  HISTORY: 'qrnote-history'
} as const;

/**
 * 履歴機能の設定定数
 */
export const HISTORY_CONFIG = {
  /** 履歴の最大保存件数 */
  MAX_ITEMS: 10
} as const;

/**
 * QRコード生成の設定定数
 */
export const QR_CONFIG = {
  /** QRコードのサイズ（ピクセル） */
  SIZE: 240,
  /** QRコードの余白サイズ */
  MARGIN: 2,
  /** エラー訂正レベル（L, M, Q, H） */
  ERROR_CORRECTION_LEVEL: 'M' as const,
  /** デフォルトメッセージ */
  DEFAULT_MESSAGE: 'QRノートへようこそ！'
} as const;

/**
 * 音声認識の設定定数
 */
export const SPEECH_CONFIG = {
  /** デフォルトの認識言語 */
  DEFAULT_LANG: 'ja-JP',
  /** 連続音声認識を有効にするかどうか */
  CONTINUOUS: false,
  /** 中間結果を取得するかどうか */
  INTERIM_RESULTS: false
} as const;

/**
 * 音声録音の設定定数
 */
export const AUDIO_CONFIG = {
  /** 推奨のMIMEタイプ */
  MIME_TYPE: 'audio/webm;codecs=opus',
  /** フォールバック用のMIMEタイプ */
  FALLBACK_MIME_TYPE: 'audio/webm'
} as const;

/**
 * API エンドポイントの定数
 */
export const API_ENDPOINTS = {
  /** 音声ファイルアップロード用のエンドポイント */
  UPLOAD_AUDIO: '/api/upload-audio',
  /** 画像ファイルアップロード用のエンドポイント */
  UPLOAD_IMAGE: '/api/upload-image'
} as const;