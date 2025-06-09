import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態では空のtoast配列を返す', () => {
    const { result } = renderHook(() => useToast());
    
    expect(result.current.toasts).toEqual([]);
  });

  it('showSuccess でトーストを追加できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('成功', 'テストメッセージ');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: '成功',
      message: 'テストメッセージ',
    });
    expect(result.current.toasts[0].id).toBeDefined();
  });

  it('showError でエラートーストを追加できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showError('エラー', 'エラーメッセージ');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      title: 'エラー',
      message: 'エラーメッセージ',
      duration: 7000, // エラーは長めに表示
    });
  });

  it('showWarning で警告トーストを追加できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showWarning('警告', '警告メッセージ');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'warning',
      title: '警告',
      message: '警告メッセージ',
    });
  });

  it('showInfo で情報トーストを追加できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showInfo('情報', '情報メッセージ');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'info',
      title: '情報',
      message: '情報メッセージ',
    });
  });

  it('addToast でカスタムトーストを追加できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.addToast('success', 'カスタム', 'カスタムメッセージ', 3000);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: 'カスタム',
      message: 'カスタムメッセージ',
      duration: 3000,
    });
  });

  it('複数のトーストを追加できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('成功1');
      result.current.showError('エラー1');
      result.current.showWarning('警告1');
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[1].type).toBe('error');
    expect(result.current.toasts[2].type).toBe('warning');
  });

  it('removeToast でトーストを削除できる', () => {
    const { result } = renderHook(() => useToast());
    
    let toastId: string;
    act(() => {
      toastId = result.current.showSuccess('削除対象');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('存在しないIDでremoveToastを呼んでも問題ない', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('テスト');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast('存在しないID');
    });

    expect(result.current.toasts).toHaveLength(1);
  });

  it('clearToasts で全てのトーストを削除できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('成功1');
      result.current.showSuccess('成功2');
      result.current.showSuccess('成功3');
    });

    expect(result.current.toasts).toHaveLength(3);

    act(() => {
      result.current.clearToasts();
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('トーストIDが一意である', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('テスト1');
      result.current.showSuccess('テスト2');
      result.current.showSuccess('テスト3');
    });

    const ids = result.current.toasts.map(toast => toast.id);
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(3);
  });

  it('メッセージなしでトーストを作成できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showSuccess('タイトルのみ');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: 'タイトルのみ',
      message: undefined,
    });
  });

  it('durationなしでトーストを作成できる', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.addToast('info', 'テスト');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'info',
      title: 'テスト',
      duration: undefined,
    });
  });
});