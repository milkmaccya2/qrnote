import { useState, useCallback } from 'react';
import type { ToastMessage, ToastType } from '@/components/ui/Toast';

let toastIdCounter = 0;

/**
 * Toast通知管理カスタムフック
 * アプリケーション全体でToast通知を統一的に管理
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  /**
   * 新しいToastを追加
   */
  const addToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
      duration,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);
    return id;
  }, []);

  /**
   * Toastを削除
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  /**
   * 全てのToastをクリア
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * 成功メッセージを表示
   */
  const showSuccess = useCallback((title: string, message?: string) => {
    return addToast('success', title, message);
  }, [addToast]);

  /**
   * エラーメッセージを表示
   */
  const showError = useCallback((title: string, message?: string) => {
    return addToast('error', title, message, 7000); // エラーは少し長めに表示
  }, [addToast]);

  /**
   * 警告メッセージを表示
   */
  const showWarning = useCallback((title: string, message?: string) => {
    return addToast('warning', title, message);
  }, [addToast]);

  /**
   * 情報メッセージを表示
   */
  const showInfo = useCallback((title: string, message?: string) => {
    return addToast('info', title, message);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}