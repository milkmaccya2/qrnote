# QRノート - 開発者ガイド

> テキスト、音声、画像からQRコードを生成し、デバイス間でデータ交換を簡単にするPWAアプリケーション

## 🚀 クイックスタート

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数設定
cp .env.example .env.local  # AWS S3設定が必要

# 3. 開発サーバー起動
npm run dev

# 4. テスト実行
npm test
```

## 📁 プロジェクト構造

```
src/
├── app/                   # Next.js App Router
│   ├── api/               # API エンドポイント
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # メインページ
├── components/            # React コンポーネント
│   ├── error/             # ErrorBoundary
│   ├── ui/                # Toast, Button 等
│   ├── layout/            # Header, Footer 等
│   ├── input/             # TextInput 等
│   ├── camera/            # CameraPreview 等
│   ├── qr/                # QRDisplay 等
│   └── history/           # HistorySection 等
├── hooks/                 # カスタムフック + テスト
├── services/              # API連携・ビジネスロジック
├── lib/                   # ユーティリティ（環境変数等）
├── types/                 # TypeScript型定義
└── constants/             # アプリケーション定数
```

## 🎯 機能概要

| 機能 | 説明 | 使用技術 |
|------|------|----------|
| **QRコード生成** | テキスト/URLからリアルタイム生成 | qrcode ライブラリ |
| **音声認識** | 音声をテキストに変換 | Web Speech API |
| **音声録音** | 録音してS3保存、URL生成 | MediaRecorder + AWS S3 |
| **カメラ撮影** | 写真撮影してS3保存、URL生成 | MediaDevices + AWS S3 |
| **履歴管理** | 過去のQRコード内容を保存・検索 | localStorage |
| **Toast通知** | ユーザーフレンドリーな通知 | カスタム実装 |

## 🛠️ 技術スタック

- **Next.js 15** - App Router
- **TypeScript** - Strict mode
- **Tailwind CSS** - Glassmorphism デザイン
- **AWS S3** - ファイルストレージ
- **Vitest** - テストフレームワーク
- **PWA** - オフライン対応

## ⚙️ 開発環境セットアップ

### 環境変数設定

`.env.local` を作成：

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET_NAME=your_bucket_name
NODE_ENV=development
```

### AWS S3設定

IAMポリシー:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
            "Resource": "arn:aws:s3:::your_bucket_name/*"
        }
    ]
}
```

S3バケット設定:
- オブジェクト有効期限: 24時間
- パブリックアクセス: 制限あり

### 開発コマンド

```bash
npm run dev          # 開発サーバー
npm test             # テスト（ウォッチ）
npm run test:run     # テスト（1回）
npm run lint         # ESLint
npm run build        # 本番ビルド
npm start            # 本番サーバー
```

## 🔧 アーキテクチャ原則

### コード品質
- **単一責任**: 1コンポーネント300行以下
- **型安全**: TypeScript strict、`any`禁止
- **テスト**: 新機能は必ずテスト追加
- **エラーハンドリング**: Error Boundary + Toast通知

### TypeScript設定
```typescript
// tsconfig.json 主要設定
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true
  }
}
```

### 環境変数管理
```typescript
// src/lib/env.ts でZod実行時バリデーション
const envSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  // ...
});
export const env = envSchema.parse(process.env);
```

## 🧪 テスト

### 概要
- **総数**: 139 tests（12ファイル）
- **フレームワーク**: Vitest + React Testing Library
- **カバレッジ**: 主要機能100%

### カテゴリ別
- **カスタムフック**: 64 tests（6ファイル）
- **サービス層**: 42 tests（3ファイル）
- **API**: 18 tests（2ファイル）
- **ユーティリティ**: 6 tests（1ファイル）

### テスト実装パターン
```typescript
// 環境変数テスト例
it('環境変数変更のテスト', async () => {
  vi.resetModules(); // キャッシュクリア
  process.env.AWS_REGION = 'us-west-2';
  const { env } = await import('../env'); // 動的インポート
  expect(env.AWS_REGION).toBe('us-west-2');
});
```

## 📋 開発フロー

### コードレビューチェックリスト
- [ ] TypeScript strict mode準拠
- [ ] ESLint エラーゼロ
- [ ] 新機能にテスト追加
- [ ] useEffect依存配列適切
- [ ] 300行以下のコンポーネント
- [ ] Toast通知でのエラーハンドリング

### よくある問題と解決
| 問題 | 解決法 |
|------|--------|
| ESLint大量エラー | `npm run lint -- --fix` |
| テスト失敗 | `vi.resetModules()` でキャッシュクリア |
| 型エラー | strict mode対応、適切な型定義 |
| ビルドエラー | Node.js 18.17+、依存関係再インストール |

## 🚀 デプロイ

### Vercel設定
1. GitHubリポジトリ連携
2. 環境変数設定（Dashboard推奨）
3. `main`ブランチ自動デプロイ

```bash
# CLI環境変数設定
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
vercel env add AWS_REGION production
vercel env add AWS_S3_BUCKET_NAME production
```

## 🔍 トラブルシューティング

### 音声機能
- HTTPS環境必須
- マイク許可設定確認
- Chrome/Safari対応確認

### AWS S3
- IAMポリシー・認証情報確認
- ファイルサイズ制限（10MB）
- CORS設定確認

### 開発環境
```bash
# 依存関係リセット
rm -rf node_modules package-lock.json && npm install

# 型定義追加
npm install --save-dev @types/node @types/react @types/react-dom
```

## 📚 参考リンク

- [Next.js 15 ドキュメント](https://nextjs.org/docs)
- [TypeScript ハンドブック](https://www.typescriptlang.org/docs/)
- [AWS SDK v3 ガイド](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Vitest テストガイド](https://vitest.dev/guide/)

## 🤝 コントリビューション

1. フォーク・ブランチ作成
2. 機能実装・テスト追加
3. ESLint・型チェック通過
4. PR作成

---

*MIT License*