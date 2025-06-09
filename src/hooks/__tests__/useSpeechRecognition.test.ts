import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from '../useSpeechRecognition';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// SpeechRecognitionのモック
const mockRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  onstart: null,
  onresult: null,
  onerror: null,
  onend: null,
  continuous: false,
  interimResults: false,
  lang: '',
};

const mockSpeechRecognition = vi.fn(() => mockRecognition);

// グローバルオブジェクトのモック
Object.defineProperty(global, 'webkitSpeechRecognition', {
  writable: true,
  value: mockSpeechRecognition,
});

Object.defineProperty(global, 'SpeechRecognition', {
  writable: true,
  value: undefined,
});

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecognition.start.mockClear();
    mockRecognition.stop.mockClear();
    mockRecognition.abort.mockClear();
    mockSpeechRecognition.mockClear();
  });

  it('初期状態では音声認識していない', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    
    expect(result.current.isListening).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });

  it('onResultとonErrorのコールバック付きで初期化できる', () => {
    const onResult = vi.fn();
    const onError = vi.fn();
    
    const { result } = renderHook(() => 
      useSpeechRecognition({ onResult, onError })
    );
    
    expect(result.current.isListening).toBe(false);
    expect(result.current.isSupported).toBe(true);
  });

  it('startListening で音声認識を開始できる', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    
    act(() => {
      result.current.startListening();
    });

    expect(mockSpeechRecognition).toHaveBeenCalledTimes(1);
    expect(mockRecognition.start).toHaveBeenCalledTimes(1);
  });

  it('stopListening で音声認識を停止できる', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    
    act(() => {
      result.current.startListening();
    });

    // 認識開始をシミュレート
    act(() => {
      mockRecognition.onstart?.();
    });

    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.stopListening();
    });

    expect(mockRecognition.stop).toHaveBeenCalledTimes(1);
  });

  it('認識開始時にisListeningがtrueになる', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    
    act(() => {
      result.current.startListening();
    });

    // onstart イベントをシミュレート
    act(() => {
      mockRecognition.onstart?.();
    });

    expect(result.current.isListening).toBe(true);
  });

  it('音声認識結果を受け取ってonResultコールバックを呼ぶ', () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => 
      useSpeechRecognition({ onResult })
    );
    
    act(() => {
      result.current.startListening();
    });

    // 音声認識結果をシミュレート
    const mockEvent = {
      results: [
        [{ transcript: '音声認識テスト' }]
      ]
    };

    act(() => {
      mockRecognition.onresult?.(mockEvent as SpeechRecognitionEvent);
    });

    expect(onResult).toHaveBeenCalledWith('音声認識テスト');
    expect(result.current.isListening).toBe(false);
  });

  it('音声認識結果が空の場合の安全性チェック', () => {
    const onResult = vi.fn();
    const { result } = renderHook(() => 
      useSpeechRecognition({ onResult })
    );
    
    act(() => {
      result.current.startListening();
    });

    // 空の結果をシミュレート
    const mockEvent = {
      results: []
    };

    act(() => {
      mockRecognition.onresult?.(mockEvent as SpeechRecognitionEvent);
    });

    expect(onResult).not.toHaveBeenCalled();
    expect(result.current.isListening).toBe(false);
  });

  it('音声認識エラー時にonErrorコールバックを呼ぶ', () => {
    const onError = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => 
      useSpeechRecognition({ onError })
    );
    
    act(() => {
      result.current.startListening();
    });

    // エラーイベントをシミュレート
    const mockErrorEvent = {
      error: 'no-speech'
    };

    act(() => {
      mockRecognition.onerror?.(mockErrorEvent as SpeechRecognitionErrorEvent);
    });

    expect(onError).toHaveBeenCalledWith('no-speech');
    expect(consoleErrorSpy).toHaveBeenCalledWith('音声認識エラー:', 'no-speech');
    expect(result.current.isListening).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('音声認識終了時にisListeningがfalseになる', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    
    act(() => {
      result.current.startListening();
    });

    act(() => {
      mockRecognition.onstart?.();
    });

    expect(result.current.isListening).toBe(true);

    // 認識終了をシミュレート
    act(() => {
      mockRecognition.onend?.();
    });

    expect(result.current.isListening).toBe(false);
  });

  it('ブラウザが音声認識をサポートしていない場合', () => {
    // SpeechRecognitionを無効にする
    Object.defineProperty(global, 'webkitSpeechRecognition', {
      value: undefined,
    });
    Object.defineProperty(global, 'SpeechRecognition', {
      value: undefined,
    });

    const { result } = renderHook(() => useSpeechRecognition());
    
    expect(result.current.isSupported).toBe(false);

    // startListening を呼んでも何も起こらない
    act(() => {
      result.current.startListening();
    });

    expect(result.current.isListening).toBe(false);

    // 元に戻す
    Object.defineProperty(global, 'webkitSpeechRecognition', {
      value: mockSpeechRecognition,
    });
  });

  it('onResultコールバックなしでも動作する', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    
    act(() => {
      result.current.startListening();
    });

    const mockEvent = {
      results: [
        [{ transcript: 'テスト' }]
      ]
    };

    // エラーが発生しないことを確認
    expect(() => {
      act(() => {
        mockRecognition.onresult?.(mockEvent as SpeechRecognitionEvent);
      });
    }).not.toThrow();

    expect(result.current.isListening).toBe(false);
  });

  it('onErrorコールバックなしでも動作する', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useSpeechRecognition());
    
    act(() => {
      result.current.startListening();
    });

    const mockErrorEvent = {
      error: 'network'
    };

    // エラーが発生しないことを確認
    expect(() => {
      act(() => {
        mockRecognition.onerror?.(mockErrorEvent as SpeechRecognitionErrorEvent);
      });
    }).not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith('音声認識エラー:', 'network');
    expect(result.current.isListening).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  it('SpeechRecognitionの設定が正しく行われる', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    
    act(() => {
      result.current.startListening();
    });

    expect(mockSpeechRecognition).toHaveBeenCalledTimes(1);
    expect(mockRecognition.continuous).toBe(false);
    expect(mockRecognition.interimResults).toBe(false);
    expect(mockRecognition.lang).toBe('ja-JP');
  });

  it('複数回startListeningを呼んでも連続してstartされない', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    
    act(() => {
      result.current.startListening();
    });

    // 認識中の状態にする
    act(() => {
      mockRecognition.onstart?.();
    });

    act(() => {
      result.current.startListening();
    });

    act(() => {
      result.current.startListening();
    });

    expect(mockSpeechRecognition).toHaveBeenCalledTimes(1);
    expect(mockRecognition.start).toHaveBeenCalledTimes(1);
  });
});