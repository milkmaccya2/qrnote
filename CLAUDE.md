# QRノート - プロジェクト概要

QRノート：スマホとPCのちょっとした橋渡し

## プロジェクト概要

テキスト、URL、音声からQRコードを生成し、デバイス間でのデータ交換を簡単にするPWAアプリケーションです。

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS (Glassmorphism デザイン)
- **PWA**: next-pwa
- **QRコード生成**: qrcode ライブラリ
- **音声機能**: Web Speech API, MediaRecorder API
- **クラウドストレージ**: AWS S3 (音声・画像ファイル保存)
- **カメラ機能**: MediaDevices API (写真撮影)
- **テスト**: Vitest, React Testing Library

## プロジェクト構造

```
src/
├── app/
│   ├── api/upload-audio/          # S3音声ファイルアップロードAPI
│   │   ├── __tests__/
│   │   │   └── route.test.ts      # API ルートテスト
│   │   └── route.ts
│   ├── api/upload-image/          # S3画像ファイルアップロードAPI
│   │   ├── __tests__/
│   │   │   └── route.test.ts      # API ルートテスト
│   │   └── route.ts
│   └── page.tsx                   # メインページ
├── hooks/                         # カスタムフック
│   ├── __tests__/
│   │   ├── useAudioRecording.test.ts    # 音声録音フックテスト
│   │   ├── useCameraCapture.test.ts     # カメラ撮影フックテスト
│   │   └── useQRCodeGeneration.test.ts  # QRコード生成フックテスト
│   ├── useHistory.ts              # 履歴管理
│   ├── useSpeechRecognition.ts    # Web Speech API
│   ├── useAudioRecording.ts       # 音声録音・S3アップロード
│   ├── useCameraCapture.ts        # カメラ撮影・画像処理
│   └── useQRCodeGeneration.ts     # QRコード生成
├── services/                      # サービス層
│   ├── __tests__/
│   │   ├── audioUploadService.test.ts   # 音声アップロードサービステスト
│   │   ├── imageUploadService.test.ts   # 画像アップロードサービステスト
│   │   └── s3Service.test.ts           # S3サービステスト
│   ├── s3Service.ts               # AWS S3操作
│   ├── audioUploadService.ts      # 音声アップロード処理
│   └── imageUploadService.ts      # 画像アップロード処理
├── test/
│   └── setup.ts                   # テスト環境セットアップ
├── types/
│   └── index.ts                   # TypeScript型定義
└── constants/
    └── index.ts                   # アプリケーション定数
```

## 主な機能

### 1. QRコード生成
- テキスト/URLからQRコード生成
- リアルタイム更新
- 日本語文字列対応（UTF-8エンコーディング）

### 2. 音声認識機能
- Web Speech API使用
- 日本語音声認識
- リアルタイムテキスト変換

### 3. 音声録音・S3アップロード
- MediaRecorder API使用
- 音声ファイル録音
- AWS S3への自動アップロード
- 24時間自動削除設定
- QRコード化してデバイス間共有

### 4. カメラ撮影・画像アップロード
- MediaDevices API使用
- 写真撮影機能
- 前面・背面カメラ切り替え
- AWS S3への自動アップロード
- 画像URL QRコード化

### 5. 履歴管理
- ローカルストレージ使用
- 最大10件保存
- 重複排除機能
- 検索機能

## 開発・ビルドコマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# プロダクションサーバー起動
npm start

# リンター実行
npm run lint

# テスト実行（ウォッチモード）
npm test

# テスト実行（1回のみ）
npm run test:run

# テストUI表示
npm run test:ui

# テストカバレッジ
npm run test:coverage
```

## 環境変数設定

`.env.local`ファイルに以下を設定：

```env
# AWS S3設定
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_bucket_name
```

## AWS S3設定

### 必要なIAMポリシー

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your_bucket_name/*"
        }
    ]
}
```

### S3バケット設定
- パブリックアクセス: 制限あり
- オブジェクト有効期限: 24時間
- CORS設定: 必要に応じて設定

## Vercelデプロイメント

### 1. GitHubリポジトリ連携
1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. リポジトリをインポート
3. 自動デプロイ設定完了

### 2. 環境変数設定
**Vercel Dashboard で設定 (推奨):**
1. Project Settings → Environment Variables
2. 以下の環境変数を追加:

```env
AWS_ACCESS_KEY_ID=your_production_access_key
AWS_SECRET_ACCESS_KEY=your_production_secret_key  
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_production_bucket
```

**Vercel CLI での設定:**
```bash
npm i -g vercel
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add AWS_REGION
vercel env add AWS_S3_BUCKET_NAME
```

### 3. デプロイ
- `main`ブランチへのpushで自動デプロイ
- プレビューデプロイでPR確認

## 開発の経緯

1. **基本QRコード生成機能**: Next.js + TypeScript
2. **UI現代化**: Glassmorphismデザイン、アニメーション
3. **日本語対応**: UTF-8エンコーディング修正
4. **音声機能追加**: Web Speech API統合
5. **S3連携**: 音声ファイルクラウド保存
6. **コード品質向上**: ESLint、TypeScript strict mode
7. **構造化**: カスタムフック分離、サービス層作成
8. **テスト導入**: Vitest、テストファイル作成

## アーキテクチャの特徴

- **カスタムフック**: 機能別に分離された再利用可能なロジック
- **サービス層**: API呼び出しとビジネスロジックの分離
- **型安全性**: 厳密なTypeScript型定義
- **PWA対応**: オフライン機能、ホーム画面追加可能
- **テスト駆動**: Vitest + React Testing Library による包括的テストカバレッジ

## 今後の拡張予定

- [x] カメラ機能（写真撮影）
- [x] 画像ファイルのS3アップロード対応
- [ ] QRコード読み取り機能
- [ ] ユーザー認証
- [ ] QRコードデザインカスタマイズ
- [ ] 共有機能
- [ ] 多言語対応

## コード品質管理

### ESLint設定
- TypeScript厳密モード有効
- `@typescript-eslint/no-explicit-any` 禁止（型安全性確保）
- React Hooks ルール適用
- Next.js推奨設定

### JSDoc規約
- 関数：概要、パラメータ、戻り値を簡潔に記載
- 型定義：インターフェース概要とプロパティ説明
- カスタムフック：用途とオプション説明
- 定数：設定の用途を明記

### よくあるESLintエラーと対処法

1. **`@typescript-eslint/no-explicit-any`** → 適切な型定義を作成
2. **`react-hooks/exhaustive-deps`** → useEffect依存配列を修正
3. **`@typescript-eslint/no-unused-vars`** → 未使用変数は削除または`_`プレフィックス
4. **`@typescript-eslint/prefer-nullish-coalescing`** → `||` を `??` に変更

### テスト戦略

- **単体テスト**: カスタムフック、サービス層、API ルートをテスト
- **モック**: AWS S3、fetch、Web API のモック
- **テスト環境**: happy-dom を使用した軽量DOM環境
- **カバレッジ**: 主要機能の網羅的テスト

### コードレビューチェックリスト

- [ ] JSDocが適切に記載されている
- [ ] `any`型を使用していない
- [ ] useEffectの依存配列が適切
- [ ] 未使用の変数・インポートがない
- [ ] ESLintエラーがゼロ
- [ ] テストが作成され、パスしている

## トラブルシューティング

### 音声認識が動作しない
- HTTPS環境で実行してください
- ブラウザがWeb Speech APIをサポートしているか確認
- マイクの許可設定を確認

### S3アップロードエラー
- AWS認証情報を確認
- IAMポリシーの権限を確認
- バケット名とリージョンを確認

### ビルドエラー
- Node.js バージョン確認（18.17以上推奨）
- 依存関係の再インストール: `rm -rf node_modules package-lock.json && npm install`

### ESLintエラーが大量発生する場合
```bash
# 段階的に修正する場合
npm run lint -- --fix  # 自動修正可能なエラーを修正

# 特定のルールを一時的に無効化（非推奨）
// eslint-disable-next-line @typescript-eslint/no-explicit-any

# 型定義不足の場合
npm install --save-dev @types/node @types/react @types/react-dom
```

## コントリビューション

1. フォークしてブランチ作成
2. 機能実装・テスト追加
3. ESLintエラー修正
4. プルリクエスト作成

## ライセンス

MIT License