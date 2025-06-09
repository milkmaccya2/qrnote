import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// AWS SDK エラー型定義
interface AWSError extends Error {
  code?: string;
  statusCode?: number;
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'qr-note';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // ファイル名を生成（タイムスタンプ + ランダム文字列）
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `audio/${timestamp}-${randomString}.webm`;

    // ファイルをBufferに変換
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // S3にアップロード
    const putObjectCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: audioFile.type || 'audio/webm',
      // 24時間後に自動削除
      Expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await s3Client.send(putObjectCommand);

    // 署名付きURLを生成（24時間有効）
    const getObjectCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });
    
    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { 
      expiresIn: 24 * 60 * 60 // 24時間
    });

    // 公開アクセス用のURLを生成
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      signedUrl,
      fileName,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // デバッグ用の詳細エラー情報
    const awsError = error as AWSError;
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      code: awsError.code,
      statusCode: awsError.statusCode,
      region: process.env.AWS_REGION,
      bucket: BUCKET_NAME,
    };
    
    return NextResponse.json({ 
      error: 'Upload failed',
      details: errorDetails
    }, { status: 500 });
  }
}