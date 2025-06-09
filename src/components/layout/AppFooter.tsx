/**
 * アプリケーションフッター
 * アプリケーション情報と技術スタック表示
 */
export default function AppFooter() {
  return (
    <footer className="text-center mt-12 pb-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>Bridge your devices seamlessly</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div className="text-white/40 text-xs">
          Made with ❤️ using Next.js + Tailwind CSS
        </div>
      </div>
    </footer>
  );
}