# 📱 QRノート

スマホとPCのちょっとした橋渡しアプリ

## 🌐 デモサイト

**🚀 [https://qrnote-sandy.vercel.app](https://qrnote-sandy.vercel.app)**

> 🎨 **新デザイン**: モダンなグラスモーフィズム + ダークテーマ  
> 📱 **PWA対応**: スマホでアクセスして「ホーム画面に追加」でアプリのように使えます

## 💡 なにができる？

- **QRコード生成**: テキストやURLを即座にQRコード化
- **音声認識**: Web Speech APIで音声→テキスト変換
- **音声録音**: MediaRecorder APIで音声ファイルをS3にアップロード・共有
- **クロスデバイス**: PCで打ってスマホで読み取り、またはその逆も
- **履歴機能**: 過去10件の生成履歴を自動保存
- **PWA対応**: ホーム画面に追加してネイティブアプリのように使用可能
- **オフライン動作**: ネット接続なしでも基本機能が利用可能

## 📖 使い方

### 基本機能
1. **テキスト入力**: QRコードにしたいテキストやURLを入力
2. **QRコード生成**: 「QRコード生成」ボタンをクリック
3. **履歴から再利用**: 過去の履歴をタップして再度QRコード化

### 音声機能
- **🎤 音声認識**: マイクボタン（シアン）で音声→テキスト変換
- **🔴 音声録音**: 録音ボタン（ピンク）で音声ファイル→S3アップロード→共有URL化

### PWA機能
- **ホーム画面追加**: スマホで「ホーム画面に追加」してアプリのように起動

### 💡 活用例
- **URL共有**: 長いURLをQRコードで簡単共有
- **テキスト転送**: PCで打った文章をスマホに転送
- **音声メッセージ**: 録音した音声ファイルをQRコードで共有
- **ボイスメモ**: 重要な音声をクラウド保存→QRで即アクセス
- **WiFiパスワード**: ゲスト用WiFi情報の共有
- **連絡先情報**: メールアドレスや電話番号の共有

## 🔧 技術要素

- **フロントエンド**: Next.js 15 + React 19
- **スタイリング**: Tailwind CSS + グラスモーフィズム
- **QRコード生成**: qrcode (日本語完全対応)
- **音声処理**: Web Speech API + MediaRecorder API
- **クラウドストレージ**: AWS S3 + SDK v3
- **PWA**: next-pwa (Service Worker + Workbox)
- **TypeScript**: 型安全な開発環境

## 🚀 クイックスタート

### 開発環境

```bash
# 依存関係インストール
npm install

# 環境変数設定（音声録音機能を使う場合）
cp .env.local.example .env.local
# AWS S3の認証情報を設定

# 開発サーバー起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセス

### S3設定（音声録音機能）

音声録音機能を使用する場合、以下が必要です：

1. **AWS S3バケット作成**
2. **環境変数設定** (.env.local)
   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=qrnote-audio-files
   ```
3. **バケット設定**: パブリック読み取り + CORS設定

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
