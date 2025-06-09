/**
 * アプリケーションヘッダー
 * ロゴ、タイトル、説明文を表示
 */
export default function AppHeader() {
  return (
    <header className="text-center mb-12 pt-8">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-cyan-400 to-purple-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/25">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm-4-4h2v6h-2v-6z"/>
          </svg>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          QRノート
        </h1>
        <p className="text-slate-400 text-sm">Bridge your devices seamlessly</p>
      </div>
    </header>
  );
}