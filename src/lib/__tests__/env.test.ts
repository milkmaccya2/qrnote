import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// 環境変数をモック
const mockProcessEnv = (envVars: Record<string, string>) => {
  Object.keys(envVars).forEach(key => {
    process.env[key] = envVars[key];
  });
};

describe('env', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    // 現在の環境変数を保存
    originalEnv = { ...process.env };
    // モジュールキャッシュをクリア
    vi.resetModules();
  });

  afterEach(() => {
    // 環境変数を復元
    process.env = originalEnv;
  });

  describe('getEnvironment', () => {
    it('should return valid environment configuration', async () => {
      mockProcessEnv({
        NODE_ENV: 'test',
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        AWS_REGION: 'us-east-1',
        AWS_S3_BUCKET_NAME: 'test-bucket',
      });

      // 動的インポートでキャッシュを回避
      const { getEnvironment } = await import('../env');
      const env = getEnvironment();
      
      expect(env).toEqual({
        NODE_ENV: 'test',
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        AWS_REGION: 'us-east-1',
        AWS_S3_BUCKET_NAME: 'test-bucket',
      });
    });

    it('should use default values for optional fields', async () => {
      // NODE_ENVを明示的にundefinedに設定
      delete process.env.NODE_ENV;
      mockProcessEnv({
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        AWS_S3_BUCKET_NAME: 'test-bucket',
      });

      const { getEnvironment } = await import('../env');
      const env = getEnvironment();
      
      expect(env.NODE_ENV).toBe('development');
      expect(env.AWS_REGION).toBe('us-east-1');
    });
  });

  describe('getAWSConfig', () => {
    it('should return AWS configuration', async () => {
      mockProcessEnv({
        AWS_ACCESS_KEY_ID: 'test-access-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        AWS_REGION: 'ap-northeast-1',
        AWS_S3_BUCKET_NAME: 'test-bucket',
      });

      const { getAWSConfig } = await import('../env');
      const config = getAWSConfig();
      
      expect(config).toEqual({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        region: 'ap-northeast-1',
        bucketName: 'test-bucket',
      });
    });
  });

  describe('environment detection', () => {
    it('should correctly identify test environment', async () => {
      mockProcessEnv({ 
        NODE_ENV: 'test',
        AWS_ACCESS_KEY_ID: 'test-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret',
        AWS_S3_BUCKET_NAME: 'test-bucket',
      });
      const { isTest, isDevelopment, isProduction } = await import('../env');
      expect(isTest()).toBe(true);
      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(false);
    });

    it('should correctly identify development environment', async () => {
      mockProcessEnv({ 
        NODE_ENV: 'development',
        AWS_ACCESS_KEY_ID: 'test-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret',
        AWS_S3_BUCKET_NAME: 'test-bucket',
      });
      const { isDevelopment, isTest, isProduction } = await import('../env');
      expect(isDevelopment()).toBe(true);
      expect(isTest()).toBe(false);
      expect(isProduction()).toBe(false);
    });

    it('should correctly identify production environment', async () => {
      mockProcessEnv({ 
        NODE_ENV: 'production',
        AWS_ACCESS_KEY_ID: 'test-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret',
        AWS_S3_BUCKET_NAME: 'test-bucket',
      });
      const { isProduction, isDevelopment, isTest } = await import('../env');
      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
      expect(isTest()).toBe(false);
    });
  });
});