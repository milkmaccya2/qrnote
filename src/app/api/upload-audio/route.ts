import { NextRequest, NextResponse } from 'next/server';
import { 
  createS3Client,
  generateFileName,
  uploadToS3,
  generateSignedUrl,
  generatePublicUrl,
  getAWSErrorDetails
} from '@/services/s3Service';
import { getAWSConfig } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    // 環境変数を安全に取得
    const awsConfig = getAWSConfig();
    
    // バリデーション: Content-Type チェック
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック（最大10MB）
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // ファイルタイプチェック
    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/wav'];
    if (!allowedTypes.some(type => audioFile.type.includes(type))) {
      return NextResponse.json(
        { error: 'Invalid file type. Only audio files are allowed' },
        { status: 400 }
      );
    }

    // S3クライアントを作成
    const s3Client = createS3Client();
    
    // ファイル名を生成
    const fileName = generateFileName('webm');

    // ファイルをBufferに変換
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // S3にアップロード
    await uploadToS3(
      s3Client,
      awsConfig.bucketName,
      fileName,
      buffer,
      audioFile.type || 'audio/webm'
    );

    // URLを生成
    const [signedUrl, publicUrl] = await Promise.all([
      generateSignedUrl(s3Client, awsConfig.bucketName, fileName),
      Promise.resolve(generatePublicUrl(awsConfig.bucketName, fileName, awsConfig.region))
    ]);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      signedUrl,
      fileName,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    const errorDetails = getAWSErrorDetails(error);
    const awsConfig = getAWSConfig(); // catch文でも環境変数を取得
    
    return NextResponse.json({ 
      error: 'Upload failed',
      details: {
        ...errorDetails,
        region: awsConfig.region,
        bucket: awsConfig.bucketName,
      }
    }, { status: 500 });
  }
}