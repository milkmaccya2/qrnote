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
- **クラウドストレージ**: AWS S3 (音声ファイル保存)
- **テスト**: Vitest, React Testing Library

## プロジェクト構造

```
src/
├── app/
│   ├── api/upload-audio/          # S3音声ファイルアップロードAPI
│   └── page.tsx                   # メインページ
├── hooks/                         # カスタムフック
│   ├── useHistory.ts              # 履歴管理
│   ├── useSpeechRecognition.ts    # Web Speech API
│   ├── useAudioRecording.ts       # 音声録音・S3アップロード
│   └── useQRCodeGeneration.ts     # QRコード生成
├── services/                      # サービス層
│   ├── s3Service.ts               # AWS S3操作
│   └── audioUploadService.ts      # 音声アップロード処理
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

### 4. 履歴管理
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

# テスト実行
npm test

# テスト（ウォッチモード）
npm run test:watch

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

## デプロイメント

### Vercel（推奨）
1. GitHubリポジトリ連携
2. 環境変数設定
3. 自動デプロイメント

### 手動デプロイ
```bash
npm run build
npm start
```

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

## 今後の拡張予定

- [ ] カメラ機能（QRコード読み取り）
- [ ] 画像ファイルのS3アップロード対応
- [ ] ユーザー認証
- [ ] QRコードデザインカスタマイズ
- [ ] 共有機能
- [ ] 多言語対応

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

## コントリビューション

1. フォークしてブランチ作成
2. 機能実装・テスト追加
3. ESLintエラー修正
4. プルリクエスト作成

## ライセンス

MIT License