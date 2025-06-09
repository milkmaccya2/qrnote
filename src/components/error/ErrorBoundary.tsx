'use client';

import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | undefined;
  onError?: ((error: Error, errorInfo: React.ErrorInfo) => void) | undefined;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | undefined;
}

/**
 * React Error Boundary
 * 子コンポーネントでのJavaScriptエラーをキャッチし、フォールバックUIを表示
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // カスタムエラーハンドラーがあれば実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックがあれば使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラーUI
      return <DefaultErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error?: Error | undefined;
  onRetry: () => void;
}

/**
 * デフォルトのエラーフォールバックUI
 */
function DefaultErrorFallback({ error, onRetry }: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-red-400 to-pink-400 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            申し訳ございません
          </h1>
          
          <p className="text-white/80 text-sm mb-6 leading-relaxed">
            予期しないエラーが発生しました。<br />
            ページを再読み込みするか、しばらく時間をおいてから再度お試しください。
          </p>
          
          {error && (
            <details className="text-left mb-6">
              <summary className="text-white/60 text-xs cursor-pointer hover:text-white/80 transition-colors">
                エラーの詳細 (開発者向け)
              </summary>
              <div className="mt-2 p-3 bg-black/20 rounded-lg text-red-300 text-xs font-mono break-all">
                {error.message}
              </div>
            </details>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 px-4 rounded-2xl hover:from-cyan-600 hover:to-purple-600 transition-all duration-300 font-semibold text-sm"
            >
              再試行
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-white/20 backdrop-blur-sm text-white py-3 px-4 rounded-2xl hover:bg-white/30 transition-all duration-300 font-semibold text-sm"
            >
              ページ再読み込み
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 関数コンポーネント用のError Boundaryラッパー
 */
interface WithErrorBoundaryProps {
  fallback?: ReactNode | undefined;
  onError?: ((error: Error, errorInfo: React.ErrorInfo) => void) | undefined;
  children: ReactNode;
}

export function WithErrorBoundary({ children, fallback, onError }: WithErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}