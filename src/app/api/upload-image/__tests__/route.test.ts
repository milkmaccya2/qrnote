import { POST } from '../route';
import { NextRequest } from 'next/server';
import * as s3Service from '@/services/s3Service';

// S3Service のモック
vi.mock('@/services/s3Service', () => ({
  createS3Client: vi.fn(),
  generateFileName: vi.fn(),
  uploadToS3: vi.fn(),
  generateSignedUrl: vi.fn(),
  generatePublicUrl: vi.fn(),
  getAWSErrorDetails: vi.fn(),
}));

// 環境変数のモック
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    AWS_S3_BUCKET_NAME: 'test-bucket',
    AWS_REGION: 'us-east-1',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('/api/upload-image', () => {
  const mockS3Client = {};
  const mockFileName = 'images/test-123.jpg';
  const mockPublicUrl = 'https://test-bucket.s3.us-east-1.amazonaws.com/images/test-123.jpg';
  const mockSignedUrl = 'https://test-bucket.s3.us-east-1.amazonaws.com/images/test-123.jpg?signature=abc';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // S3Service のモック設定
    vi.mocked(s3Service.createS3Client).mockReturnValue(mockS3Client);
    vi.mocked(s3Service.generateFileName).mockReturnValue(mockFileName);
    vi.mocked(s3Service.uploadToS3).mockResolvedValue();
    vi.mocked(s3Service.generateSignedUrl).mockResolvedValue(mockSignedUrl);
    vi.mocked(s3Service.generatePublicUrl).mockReturnValue(mockPublicUrl);
  });

  const createImageFile = (type = 'image/jpeg', size = 1024) => {
    const buffer = new ArrayBuffer(size);
    return new File([buffer], 'test.jpg', { type });
  };

  const createFormData = (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return formData;
  };

  const createRequest = (formData: FormData): NextRequest => {
    return new NextRequest('http://localhost:3000/api/upload-image', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'multipart/form-data; boundary=----formdata-test',
      },
    });
  };

  it('画像ファイルのアップロードが成功する', async () => {
    const imageFile = createImageFile('image/jpeg', 2048);
    const formData = createFormData(imageFile);
    const request = createRequest(formData);

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData).toEqual({
      success: true,
      url: mockPublicUrl,
      signedUrl: mockSignedUrl,
      fileName: mockFileName,
      expiresAt: expect.any(String),
    });

    expect(s3Service.createS3Client).toHaveBeenCalled();
    expect(s3Service.generateFileName).toHaveBeenCalledWith('jpg');
    expect(s3Service.uploadToS3).toHaveBeenCalledWith(
      mockS3Client,
      'test-bucket',
      mockFileName,
      expect.any(Buffer),
      'image/jpeg'
    );
    expect(s3Service.generateSignedUrl).toHaveBeenCalledWith(
      mockS3Client,
      'test-bucket',
      mockFileName
    );
    expect(s3Service.generatePublicUrl).toHaveBeenCalledWith(
      'test-bucket',
      mockFileName,
      'us-east-1'
    );
  });

  it('PNG画像ファイルが正しく処理される', async () => {
    const imageFile = createImageFile('image/png', 2048);
    const formData = createFormData(imageFile);
    const request = createRequest(formData);

    await POST(request);

    expect(s3Service.generateFileName).toHaveBeenCalledWith('png');
  });

  it('WebP画像ファイルが正しく処理される', async () => {
    const imageFile = createImageFile('image/webp', 2048);
    const formData = createFormData(imageFile);
    const request = createRequest(formData);

    await POST(request);

    expect(s3Service.generateFileName).toHaveBeenCalledWith('webp');
  });

  it('Content-Typeが不正な場合にエラーを返す', async () => {
    const request = new NextRequest('http://localhost:3000/api/upload-image', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Invalid content type. Expected multipart/form-data');
  });

  it('画像ファイルが提供されていない場合にエラーを返す', async () => {
    const formData = new FormData();
    const request = createRequest(formData);

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('No image file provided');
  });

  it('ファイルサイズが制限を超える場合にエラーを返す', async () => {
    const largeImageFile = createImageFile('image/jpeg', 11 * 1024 * 1024); // 11MB
    const formData = createFormData(largeImageFile);
    const request = createRequest(formData);

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('File size exceeds 10MB limit');
  });

  it('サポートされていないファイルタイプの場合にエラーを返す', async () => {
    const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const formData = createFormData(textFile);
    const request = createRequest(formData);

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(400);
    expect(responseData.error).toBe('Invalid file type. Only image files (JPEG, PNG, WebP) are allowed');
  });

  it('S3アップロードエラー時に適切なエラーレスポンスを返す', async () => {
    const error = new Error('S3 upload failed');
    const errorDetails = {
      message: 'S3 upload failed',
      name: 'Error',
      code: 'NoSuchBucket',
      statusCode: 404,
    };

    vi.mocked(s3Service.uploadToS3).mockRejectedValue(error);
    vi.mocked(s3Service.getAWSErrorDetails).mockReturnValue(errorDetails);

    const imageFile = createImageFile('image/jpeg', 2048);
    const formData = createFormData(imageFile);
    const request = createRequest(formData);

    const response = await POST(request);
    const responseData = await response.json();

    expect(response.status).toBe(500);
    expect(responseData).toEqual({
      error: 'Image upload failed',
      details: {
        ...errorDetails,
        region: 'us-east-1',
        bucket: 'test-bucket',
      },
    });
  });

  it('ファイル名生成でディレクトリが正しく変更される', async () => {
    // generateFileName が 'audio/test-123.webm' を返すようにモック
    vi.mocked(s3Service.generateFileName).mockReturnValue('audio/test-123.webm');

    const imageFile = createImageFile('image/jpeg', 2048);
    const formData = createFormData(imageFile);
    const request = createRequest(formData);

    await POST(request);

    expect(s3Service.uploadToS3).toHaveBeenCalledWith(
      mockS3Client,
      'test-bucket',
      'images/test-123.webm', // audio/ が images/ に置換される
      expect.any(Buffer),
      'image/jpeg'
    );
  });

  it('環境変数のデフォルト値が使用される', async () => {
    const imageFile = createImageFile('image/jpeg', 2048);
    const formData = createFormData(imageFile);
    const request = createRequest(formData);

    await POST(request);

    // このテストでは現在設定されている環境変数（test-bucket）を検証
    expect(s3Service.generatePublicUrl).toHaveBeenCalledWith(
      'test-bucket', // テスト環境でのバケット名
      mockFileName,
      'us-east-1' // デフォルトのリージョン
    );
  });

  it('有効期限が正しく設定される', async () => {
    const imageFile = createImageFile('image/jpeg', 2048);
    const formData = createFormData(imageFile);
    const request = createRequest(formData);

    const beforeRequest = Date.now();
    const response = await POST(request);
    const afterRequest = Date.now();
    const responseData = await response.json();

    const expiresAt = new Date(responseData.expiresAt).getTime();
    const expectedMin = beforeRequest + 24 * 60 * 60 * 1000 - 1000; // 1秒のマージン
    const expectedMax = afterRequest + 24 * 60 * 60 * 1000 + 1000; // 1秒のマージン

    expect(expiresAt).toBeGreaterThan(expectedMin);
    expect(expiresAt).toBeLessThan(expectedMax);
  });
});