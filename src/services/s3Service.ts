import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AWSError } from '@/types';

/**
 * S3クライアントを作成する
 * 
 * @returns 設定されたS3クライアント
 */
export function createS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

/**
 * ユニークなファイル名を生成する
 * 
 * @param extension - ファイルの拡張子（デフォルト: 'webm'）
 * @returns 生成されたファイル名
 */
export function generateFileName(extension: string = 'webm'): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `audio/${timestamp}-${randomString}.${extension}`;
}

/**
 * S3にファイルをアップロードする
 * 
 * @param s3Client - S3クライアント
 * @param bucketName - バケット名
 * @param fileName - アップロードするファイル名
 * @param buffer - ファイルのバイナリデータ
 * @param contentType - ファイルのMIMEタイプ
 */
export async function uploadToS3(
  s3Client: S3Client,
  bucketName: string,
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
    // 24時間後に自動削除
    Expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await s3Client.send(putObjectCommand);
}

/**
 * 署名付きURLを生成する
 * 
 * @param s3Client - S3クライアント
 * @param bucketName - バケット名
 * @param fileName - ファイル名
 * @param expiresIn - URLの有効期限（秒、デフォルト: 24時間）
 * @returns 署名付きURL
 */
export async function generateSignedUrl(
  s3Client: S3Client,
  bucketName: string,
  fileName: string,
  expiresIn: number = 24 * 60 * 60
): Promise<string> {
  const getObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });
  
  return await getSignedUrl(s3Client, getObjectCommand, { expiresIn });
}

/**
 * 公開URLを生成する
 * 
 * @param bucketName - バケット名
 * @param fileName - ファイル名
 * @param region - AWSリージョン（デフォルト: 'us-east-1'）
 * @returns 公開URL
 */
export function generatePublicUrl(
  bucketName: string,
  fileName: string,
  region: string = 'us-east-1'
): string {
  return `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
}

/**
 * AWSエラーの詳細情報を取得する
 * 
 * @param error - エラーオブジェクト
 * @returns エラーの詳細情報
 */
export function getAWSErrorDetails(error: unknown): {
  message: string;
  name: string;
  code?: string;
  statusCode?: number;
} {
  const awsError = error as AWSError;
  return {
    message: error instanceof Error ? error.message : 'Unknown error',
    name: error instanceof Error ? error.name : 'Unknown',
    code: awsError.code,
    statusCode: awsError.statusCode,
  };
}