/**
 * 浮遊する背景エフェクト要素
 * アプリケーションの装飾的な背景アニメーション
 */
export default function BackgroundEffects() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-xl float-animation"></div>
      <div className="absolute top-40 right-16 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl float-animation" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-r from-pink-400/20 to-cyan-400/20 rounded-full blur-xl float-animation" style={{animationDelay: '4s'}}></div>
      <div className="absolute top-1/2 right-8 w-16 h-16 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-xl float-animation" style={{animationDelay: '1s'}}></div>
    </div>
  );
}