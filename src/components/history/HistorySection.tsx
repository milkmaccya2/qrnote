import { HistoryItem } from '@/types';

interface HistorySectionProps {
  history: HistoryItem[];
  onSelectItem: (text: string) => void;
  onClear: () => void;
}

/**
 * 履歴セクションコンポーネント
 * QRコード生成履歴の表示と管理
 */
export default function HistorySection({ history, onSelectItem, onClear }: HistorySectionProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
          Recent
        </h2>
        <button
          onClick={onClear}
          className="text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded-full bg-white/10 hover:bg-white/20"
        >
          Clear
        </button>
      </div>
      <div className="space-y-3">
        {history.map((item, index) => (
          <div
            key={item.id}
            className="group p-4 bg-white/10 backdrop-blur-sm rounded-2xl cursor-pointer hover:bg-white/20 transition-all duration-300 border border-white/10 hover:border-white/30"
            onClick={() => onSelectItem(item.text)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/90 text-sm break-all leading-relaxed group-hover:text-white transition-colors">
                  {item.text}
                </p>
                <p className="text-white/50 text-xs mt-2 font-mono">
                  {new Date(item.timestamp).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}