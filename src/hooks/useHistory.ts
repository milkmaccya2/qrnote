import { useState, useEffect, useCallback } from 'react';
import type { HistoryItem, UseHistoryOptions } from '@/types';
import { STORAGE_KEYS, HISTORY_CONFIG } from '@/constants';

/**
 * 履歴管理用のカスタムフック
 * 
 * @param options - オプション設定
 * @returns 履歴の状態と操作用の関数
 */
export function useHistory(options: UseHistoryOptions = {}) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const {
    maxItems = HISTORY_CONFIG.MAX_ITEMS,
    storageKey = STORAGE_KEYS.HISTORY
  } = options;

  /**
   * 初期化時にローカルストレージから履歴を読み込み
   */
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(storageKey);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as HistoryItem[];
        // 型安全性のためのバリデーション
        const validHistory = parsedHistory.filter(
          (item): item is HistoryItem => 
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.text === 'string' &&
            typeof item.timestamp === 'number'
        );
        setHistory(validHistory);
      }
    } catch (error) {
      console.error('Failed to load history from localStorage:', error);
      // エラーの場合は空の履歴から開始
      setHistory([]);
    }
  }, [storageKey]);

  /**
   * 履歴に新しいアイテムを追加する
   * 
   * @param text - 追加するテキスト
   */
  const addToHistory = useCallback((text: string) => {
    if (!text.trim()) return;
    
    const newItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      text: text.trim(),
      timestamp: Date.now()
    };
    
    setHistory(prevHistory => {
      // 同じテキストが既に存在する場合は新しいものに置き換え
      const filteredHistory = prevHistory.filter(item => item.text !== newItem.text);
      const updatedHistory = [newItem, ...filteredHistory].slice(0, maxItems);
      
      // ローカルストレージに保存
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Failed to save history to localStorage:', error);
      }
      
      return updatedHistory;
    });
  }, [maxItems, storageKey]);

  /**
   * 履歴を全てクリアする
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear history from localStorage:', error);
    }
  }, [storageKey]);

  /**
   * 特定のアイテムを履歴から削除する
   * 
   * @param id - 削除するアイテムのID
   */
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(item => item.id !== id);
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Failed to update history in localStorage:', error);
      }
      
      return updatedHistory;
    });
  }, [storageKey]);

  /**
   * インデックスを指定して履歴アイテムを取得する
   * 
   * @param index - 取得するアイテムのインデックス
   * @returns 指定したインデックスのアイテム、またはnull
   */
  const getHistoryItem = useCallback((index: number): HistoryItem | null => {
    return history[index] ?? null;
  }, [history]);

  /**
   * 指定したクエリ文字列で履歴を検索する
   * 
   * @param query - 検索クエリ文字列
   * @returns 検索条件にマッチする履歴アイテムの配列
   */
  const searchHistory = useCallback((query: string): HistoryItem[] => {
    if (!query.trim()) return history;
    
    const lowercaseQuery = query.toLowerCase();
    return history.filter(item => 
      item.text.toLowerCase().includes(lowercaseQuery)
    );
  }, [history]);

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
    getHistoryItem,
    searchHistory
  };
}