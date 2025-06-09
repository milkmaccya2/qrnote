import { z } from 'zod';

/**
 * 環境変数スキーマ定義
 * Zodを使用した実行時バリデーション
 */
const envSchema = z.object({
  // Node.js環境
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // AWS S3設定（必須）
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_REGION: z.string().min(1, 'AWS_REGION is required').default('us-east-1'),
  AWS_S3_BUCKET_NAME: z.string().min(1, 'AWS_S3_BUCKET_NAME is required'),
  
  // Next.js内部環境変数（オプショナル）
  VERCEL: z.string().optional(),
  VERCEL_URL: z.string().optional(),
});

/**
 * 環境変数の型定義
 */
export type Environment = z.infer<typeof envSchema>;

/**
 * 環境変数パース結果の型
 */
type EnvParseResult = 
  | { success: true; data: Environment; error?: never }
  | { success: false; data?: never; error: z.ZodError };

/**
 * 環境変数をパースし、バリデーションを実行
 * 
 * @returns パース結果とエラー情報
 */
function parseEnvironmentVariables(): EnvParseResult {
  try {
    const data = envSchema.parse(process.env);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * 環境変数エラーメッセージをフォーマット
 * 
 * @param error - Zodエラーオブジェクト
 * @returns フォーマット済みエラーメッセージ
 */
function formatEnvironmentError(error: z.ZodError): string {
  const messages = error.errors.map(err => {
    const path = err.path.join('.');
    return `  - ${path}: ${err.message}`;
  });
  
  return [
    '❌ Environment variable validation failed:',
    ...messages,
    '',
    '💡 Please check your .env.local file and ensure all required variables are set.',
    '📝 See .env.local.example for reference.'
  ].join('\n');
}

/**
 * 検証済み環境変数の取得
 * アプリケーション起動時に一度だけ実行され、以降はキャッシュされた値を返す
 */
let cachedEnv: Environment | null = null;

export function getEnvironment(): Environment {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = parseEnvironmentVariables();
  
  if (!result.success) {
    const errorMessage = formatEnvironmentError(result.error);
    console.error(errorMessage);
    
    // テスト環境では例外を投げずにデフォルト値を返す
    if (process.env.NODE_ENV === 'test') {
      cachedEnv = {
        NODE_ENV: 'test',
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        AWS_REGION: 'us-east-1',
        AWS_S3_BUCKET_NAME: 'test-bucket',
      };
      return cachedEnv;
    }
    
    throw new Error(`Environment validation failed\n${errorMessage}`);
  }
  
  cachedEnv = result.data;
  return cachedEnv;
}

/**
 * 開発環境判定
 */
export function isDevelopment(): boolean {
  return getEnvironment().NODE_ENV === 'development';
}

/**
 * 本番環境判定
 */
export function isProduction(): boolean {
  return getEnvironment().NODE_ENV === 'production';
}

/**
 * テスト環境判定
 */
export function isTest(): boolean {
  return getEnvironment().NODE_ENV === 'test';
}

/**
 * Vercel環境判定
 */
export function isVercel(): boolean {
  return !!getEnvironment().VERCEL;
}

/**
 * AWS設定の取得
 */
export function getAWSConfig() {
  const env = getEnvironment();
  return {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    bucketName: env.AWS_S3_BUCKET_NAME,
  };
}

/**
 * 環境変数の健全性チェック（開発用）
 * デバッグ時に環境変数の状態を確認するためのヘルパー
 */
export function validateEnvironment(): void {
  const result = parseEnvironmentVariables();
  
  if (result.success) {
    console.log('✅ Environment variables are valid');
    if (isDevelopment()) {
      console.log('🔧 Current environment:', result.data.NODE_ENV);
      console.log('🗺️  AWS Region:', result.data.AWS_REGION);
      console.log('🪣 S3 Bucket:', result.data.AWS_S3_BUCKET_NAME);
    }
  } else {
    console.error(formatEnvironmentError(result.error));
  }
}