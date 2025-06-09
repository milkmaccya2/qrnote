# 📱 QRノート

スマホとPCのちょっとした橋渡しアプリ

## 💡 なにができる？

- **QRコード生成**: テキストやURLを即座にQRコード化
- **クロスデバイス**: PCで打ってスマホで読み取り、またはその逆も
- **履歴機能**: 過去10件の生成履歴を自動保存
- **PWA対応**: ホーム画面に追加してネイティブアプリのように使用可能
- **オフライン動作**: ネット接続なしでも基本機能が利用可能

## 🔧 技術要素

- **フロントエンド**: Next.js 15 + React 19
- **スタイリング**: Tailwind CSS
- **QRコード生成**: qrcode (日本語完全対応)
- **PWA**: next-pwa (Service Worker + Workbox)
- **TypeScript**: 型安全な開発環境

## 🚀 クイックスタート

### 開発環境

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセス

### プロダクション

```bash
# ビルド
npm run build

# プロダクション起動
npm start
```

## 📦 主要依存関係

- `next` - React フレームワーク
- `qrcode` - QRコード生成ライブラリ
- `next-pwa` - PWA サポート
- `tailwindcss` - ユーティリティファーストCSS

## 🌐 デプロイ

### Vercel (推奨)

```bash
# Vercel CLI でデプロイ
npx vercel
```

### その他のプラットフォーム

- Netlify
- AWS Amplify
- Railway
- 任意のNode.js対応ホスティング

## 📱 PWA として使用

1. スマホでサイトにアクセス
2. ブラウザメニューから「ホーム画面に追加」
3. ネイティブアプリのように起動可能

## 🛠️ 開発

### プロジェクト構造

```
src/
├── app/
│   ├── layout.tsx    # レイアウト設定
│   ├── page.tsx      # メインページ
│   └── globals.css   # グローバルスタイル
public/
├── manifest.json     # PWAマニフェスト
├── icon-*.png        # アプリアイコン
└── sw.js            # Service Worker (自動生成)
```

### カスタマイズ

- `src/app/page.tsx`: UI とロジック
- `public/manifest.json`: PWA設定
- `tailwind.config.js`: スタイル設定

## 📄 ライセンス

MIT License
