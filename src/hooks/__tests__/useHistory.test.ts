import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../useHistory';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HistoryItem } from '@/types';

// localStorage のモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態では空の履歴配列を返す', () => {
    const { result } = renderHook(() => useHistory());
    
    expect(result.current.history).toEqual([]);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('qrnote-history');
  });

  it('localStorage に既存の履歴がある場合、それを読み込む', () => {
    const existingHistory: HistoryItem[] = [
      { id: '1', text: 'test1', timestamp: Date.now() },
      { id: '2', text: 'test2', timestamp: Date.now() },
      { id: '3', text: 'test3', timestamp: Date.now() }
    ];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingHistory));

    const { result } = renderHook(() => useHistory());
    
    expect(result.current.history).toEqual(existingHistory);
  });

  it('localStorage の履歴データが不正な場合、空配列にフォールバック', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.getItem.mockReturnValue('invalid json');

    const { result } = renderHook(() => useHistory());
    
    expect(result.current.history).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load history from localStorage:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('addToHistory で新しいアイテムを追加できる', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('新しいアイテム');
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].text).toBe('新しいアイテム');
    expect(result.current.history[0].id).toBeDefined();
    expect(result.current.history[0].timestamp).toBeDefined();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('qrnote-history', expect.any(String));
  });

  it('空文字列や空白のみのアイテムは追加されない', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('');
    });

    act(() => {
      result.current.addToHistory('   ');
    });

    act(() => {
      result.current.addToHistory('\n\t  \n');
    });

    expect(result.current.history).toEqual([]);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('重複するアイテムは追加されない（既存のものが削除される）', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('テストアイテム');
    });

    expect(result.current.history).toHaveLength(1);

    act(() => {
      result.current.addToHistory('テストアイテム');
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].text).toBe('テストアイテム');
  });

  it('重複するアイテムがある場合、既存のものを削除して最新の位置に追加', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('アイテム1');
    });

    act(() => {
      result.current.addToHistory('アイテム2');
    });

    act(() => {
      result.current.addToHistory('アイテム3');
    });

    act(() => {
      result.current.addToHistory('アイテム1'); // 重複
    });

    expect(result.current.history).toHaveLength(3);
    expect(result.current.history[0].text).toBe('アイテム1'); // 最新が先頭
    expect(result.current.history[1].text).toBe('アイテム3');
    expect(result.current.history[2].text).toBe('アイテム2');
  });

  it('最大10件まで保存し、古いものから削除される', () => {
    const { result } = renderHook(() => useHistory());
    
    // 11件追加
    for (let i = 1; i <= 11; i++) {
      act(() => {
        result.current.addToHistory(`アイテム${i}`);
      });
    }

    expect(result.current.history).toHaveLength(10);
    expect(result.current.history[0].text).toBe('アイテム11'); // 最新が先頭
    expect(result.current.history[9].text).toBe('アイテム2'); // 最初のアイテムが削除される
  });

  it('clearHistory で履歴を全削除できる', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('アイテム1');
      result.current.addToHistory('アイテム2');
    });

    expect(result.current.history).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toEqual([]);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('qrnote-history');
  });

  it('removeFromHistory で特定のアイテムを削除できる', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('アイテム1');
      result.current.addToHistory('アイテム2');
    });

    const targetId = result.current.history[0].id;

    act(() => {
      result.current.removeFromHistory(targetId);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].text).toBe('アイテム1');
  });

  it('URLが正しく処理される', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('https://example.com');
    });

    act(() => {
      result.current.addToHistory('http://test.org/path?query=value');
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].text).toBe('http://test.org/path?query=value');
    expect(result.current.history[1].text).toBe('https://example.com');
  });

  it('日本語テキストが正しく処理される', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('これは日本語のテストです');
    });

    act(() => {
      result.current.addToHistory('絵文字も含む 🎉 テスト');
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].text).toBe('絵文字も含む 🎉 テスト');
    expect(result.current.history[1].text).toBe('これは日本語のテストです');
  });

  it('長いテキストも正しく処理される', () => {
    const { result } = renderHook(() => useHistory());
    const longText = 'a'.repeat(1000);
    
    act(() => {
      result.current.addToHistory(longText);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].text).toBe(longText);
  });

  it('localStorage.setItem でエラーが発生した場合の処理', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('テストアイテム');
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save history to localStorage:', expect.any(Error));
    // メモリ上の状態は更新される
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].text).toBe('テストアイテム');

    consoleErrorSpy.mockRestore();
  });

  it('localStorage.removeItem でエラーが発生した場合の処理', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {
      throw new Error('Remove failed');
    });

    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('テストアイテム');
    });

    act(() => {
      result.current.clearHistory();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to clear history from localStorage:', expect.any(Error));
    // メモリ上の状態は更新される
    expect(result.current.history).toEqual([]);

    consoleErrorSpy.mockRestore();
  });

  it('先頭と末尾の空白は自動的にトリミングされる', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('  トリミングされるテキスト  ');
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].text).toBe('トリミングされるテキスト');
  });

  it('getHistoryItem でインデックス指定でアイテムを取得できる', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('アイテム1');
      result.current.addToHistory('アイテム2');
    });

    const item = result.current.getHistoryItem(0);
    expect(item?.text).toBe('アイテム2'); // 最新が先頭

    const nullItem = result.current.getHistoryItem(10);
    expect(nullItem).toBeNull();
  });

  it('searchHistory で検索ができる', () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.addToHistory('テストアイテム1');
      result.current.addToHistory('別のアイテム');
      result.current.addToHistory('テストアイテム2');
    });

    const searchResults = result.current.searchHistory('テスト');
    expect(searchResults).toHaveLength(2);
    expect(searchResults[0].text).toBe('テストアイテム2');
    expect(searchResults[1].text).toBe('テストアイテム1');

    const emptyResults = result.current.searchHistory('存在しない');
    expect(emptyResults).toHaveLength(0);

    const allResults = result.current.searchHistory('');
    expect(allResults).toHaveLength(3);
  });

  it('既存の履歴がある状態でフックを初期化し、新しいアイテムを追加', () => {
    const existingHistory: HistoryItem[] = [
      { id: '1', text: '既存1', timestamp: Date.now() },
      { id: '2', text: '既存2', timestamp: Date.now() }
    ];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingHistory));

    const { result } = renderHook(() => useHistory());
    
    expect(result.current.history).toEqual(existingHistory);

    act(() => {
      result.current.addToHistory('新規追加');
    });

    expect(result.current.history).toHaveLength(3);
    expect(result.current.history[0].text).toBe('新規追加'); // 最新が先頭
    expect(result.current.history[1].text).toBe('既存1');
    expect(result.current.history[2].text).toBe('既存2');
  });
});