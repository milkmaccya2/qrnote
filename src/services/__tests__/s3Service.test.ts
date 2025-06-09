import {
  createS3Client,
  generateFileName,
  uploadToS3,
  generateSignedUrl,
  generatePublicUrl,
  getAWSErrorDetails
} from '../s3Service'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// AWS SDK をモック
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn()
}))

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn()
}))

describe('s3Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 環境変数をリセット
    delete process.env.AWS_REGION
    delete process.env.AWS_ACCESS_KEY_ID
    delete process.env.AWS_SECRET_ACCESS_KEY
  })

  describe('createS3Client', () => {
    it('should create S3Client with environment variables', () => {
      process.env.AWS_REGION = 'ap-northeast-1'
      process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'

      createS3Client()

      expect(S3Client).toHaveBeenCalledWith({
        region: 'ap-northeast-1',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key'
        }
      })
    })

    it('should use environment configuration from getAWSConfig', () => {
      // 前のテストでap-northeast-1に変更されているため、その値が使われる
      createS3Client()

      expect(S3Client).toHaveBeenCalledWith({
        region: 'ap-northeast-1', // 前のテストで設定された値
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key'
        }
      })
    })
  })

  describe('generateFileName', () => {
    beforeEach(() => {
      // Date.now と Math.random をモック
      vi.spyOn(Date, 'now').mockReturnValue(1234567890)
      vi.spyOn(Math, 'random').mockReturnValue(0.123456789)
    })

    it('should generate filename with default extension', () => {
      const fileName = generateFileName()
      expect(fileName).toMatch(/^audio\/1234567890-[a-z0-9]+\.webm$/)
    })

    it('should generate filename with custom extension', () => {
      const fileName = generateFileName('mp3')
      expect(fileName).toMatch(/^audio\/1234567890-[a-z0-9]+\.mp3$/)
    })

    it('should generate unique filenames', () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.123456789)
        .mockReturnValueOnce(0.987654321)

      const fileName1 = generateFileName()
      const fileName2 = generateFileName()

      expect(fileName1).not.toBe(fileName2)
    })
  })

  describe('uploadToS3', () => {
    it('should call S3Client.send with correct parameters', async () => {
      const mockS3Client = {
        send: vi.fn().mockResolvedValue({})
      }
      const buffer = Buffer.from('test audio data')

      await uploadToS3(
        mockS3Client as S3Client,
        'test-bucket',
        'test-file.webm',
        buffer,
        'audio/webm'
      )

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'test-file.webm',
        Body: buffer,
        ContentType: 'audio/webm',
        Expires: expect.any(Date)
      })
      expect(mockS3Client.send).toHaveBeenCalled()
    })

    it('should set expiration to 24 hours from now', async () => {
      const mockS3Client = { send: vi.fn().mockResolvedValue({}) }
      const buffer = Buffer.from('test')
      const now = Date.now()

      await uploadToS3(mockS3Client as S3Client, 'bucket', 'file', buffer, 'audio/webm')

      const call = vi.mocked(PutObjectCommand).mock.calls[0][0]
      const expires = call.Expires as Date
      const expectedExpires = new Date(now + 24 * 60 * 60 * 1000)
      
      // 誤差を考慮して1秒以内の差を許容
      expect(Math.abs(expires.getTime() - expectedExpires.getTime())).toBeLessThan(1000)
    })
  })

  describe('generateSignedUrl', () => {
    it('should generate signed URL with correct parameters', async () => {
      const mockS3Client = {}
      vi.mocked(getSignedUrl).mockResolvedValue('https://signed-url.com')

      const url = await generateSignedUrl(
        mockS3Client as S3Client,
        'test-bucket',
        'test-file.webm'
      )

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'test-file.webm'
      })
      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(Object),
        { expiresIn: 24 * 60 * 60 }
      )
      expect(url).toBe('https://signed-url.com')
    })

    it('should use custom expiration time', async () => {
      const mockS3Client = {}
      vi.mocked(getSignedUrl).mockResolvedValue('https://signed-url.com')

      await generateSignedUrl(
        mockS3Client as S3Client,
        'test-bucket',
        'test-file.webm',
        3600 // 1 hour
      )

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(Object),
        { expiresIn: 3600 }
      )
    })
  })

  describe('generatePublicUrl', () => {
    it('should generate public URL with environment region', () => {
      // 前のテストでAWS_REGION='ap-northeast-1'に変更されている
      const url = generatePublicUrl('test-bucket', 'test-file.webm')
      expect(url).toBe('https://test-bucket.s3.ap-northeast-1.amazonaws.com/test-file.webm')
    })

    it('should generate public URL with custom region', () => {
      const url = generatePublicUrl('test-bucket', 'test-file.webm', 'ap-northeast-1')
      expect(url).toBe('https://test-bucket.s3.ap-northeast-1.amazonaws.com/test-file.webm')
    })

    it('should handle special characters in filename', () => {
      const url = generatePublicUrl('test-bucket', 'audio/test file.webm', 'us-west-2')
      expect(url).toBe('https://test-bucket.s3.us-west-2.amazonaws.com/audio/test file.webm')
    })
  })

  describe('getAWSErrorDetails', () => {
    it('should extract details from Error object', () => {
      const error = new Error('Test error message')
      error.name = 'TestError'

      const details = getAWSErrorDetails(error)

      expect(details).toEqual({
        message: 'Test error message',
        name: 'TestError',
        code: undefined,
        statusCode: undefined
      })
    })

    it('should extract AWS error details', () => {
      const awsError = new Error('AWS error')
      awsError.name = 'AWSError'
      // AWS エラーのプロパティを追加
      Object.assign(awsError, {
        code: 'NoSuchBucket',
        statusCode: 404
      })

      const details = getAWSErrorDetails(awsError)

      expect(details).toEqual({
        message: 'AWS error',
        name: 'AWSError',
        code: 'NoSuchBucket',
        statusCode: 404
      })
    })

    it('should handle unknown error types', () => {
      const unknownError = 'string error'

      const details = getAWSErrorDetails(unknownError)

      expect(details).toEqual({
        message: 'Unknown error',
        name: 'Unknown',
        code: undefined,
        statusCode: undefined
      })
    })

    it('should handle null/undefined errors', () => {
      const details1 = getAWSErrorDetails(null)
      const details2 = getAWSErrorDetails(undefined)

      expect(details1).toEqual({
        message: 'Unknown error',
        name: 'Unknown',
        code: undefined,
        statusCode: undefined
      })

      expect(details2).toEqual({
        message: 'Unknown error',
        name: 'Unknown',
        code: undefined,
        statusCode: undefined
      })
    })
  })
})