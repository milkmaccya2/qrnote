import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

// S3 サービスをモック
vi.mock('@/services/s3Service', () => ({
  createS3Client: vi.fn(() => ({})),
  generateFileName: vi.fn(() => 'audio/test-123.webm'),
  uploadToS3: vi.fn(),
  generateSignedUrl: vi.fn(() => Promise.resolve('https://signed-url.com')),
  generatePublicUrl: vi.fn(() => 'https://public-url.com'),
  getAWSErrorDetails: vi.fn(() => ({
    message: 'Test error',
    name: 'TestError',
    code: 'TEST_CODE',
    statusCode: 500
  }))
}))

describe('/api/upload-audio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST', () => {
    it('should return 400 if content type is not multipart/form-data', async () => {
      const request = new NextRequest('http://localhost:3000/api/upload-audio', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid content type. Expected multipart/form-data')
    })

    it('should return 400 if no audio file is provided', async () => {
      const formData = new FormData()
      
      const request = new NextRequest('http://localhost:3000/api/upload-audio', {
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data'
        },
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No audio file provided')
    })

    it('should return 400 if file size exceeds 10MB', async () => {
      const largeBuffer = new ArrayBuffer(11 * 1024 * 1024) // 11MB
      const largeFile = new File([largeBuffer], 'large-audio.webm', { type: 'audio/webm' })
      
      const formData = new FormData()
      formData.append('audio', largeFile)
      
      const request = new NextRequest('http://localhost:3000/api/upload-audio', {
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data'
        },
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('File size exceeds 10MB limit')
    })

    it('should return 400 if file type is not allowed', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      const formData = new FormData()
      formData.append('audio', invalidFile)
      
      const request = new NextRequest('http://localhost:3000/api/upload-audio', {
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data'
        },
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid file type. Only audio files are allowed')
    })

    it('should successfully upload valid audio file', async () => {
      const audioBuffer = new ArrayBuffer(1024) // 1KB
      const audioFile = new File([audioBuffer], 'test-audio.webm', { type: 'audio/webm' })
      
      const formData = new FormData()
      formData.append('audio', audioFile)
      
      const request = new NextRequest('http://localhost:3000/api/upload-audio', {
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data'
        },
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.url).toBe('https://public-url.com')
      expect(data.signedUrl).toBe('https://signed-url.com')
      expect(data.fileName).toBe('audio/test-123.webm')
      expect(data.expiresAt).toBeDefined()
    })

    it('should handle upload errors', async () => {
      // uploadToS3 を失敗させる
      const { uploadToS3 } = await import('@/services/s3Service')
      vi.mocked(uploadToS3).mockRejectedValueOnce(new Error('Upload failed'))

      const audioBuffer = new ArrayBuffer(1024)
      const audioFile = new File([audioBuffer], 'test-audio.webm', { type: 'audio/webm' })
      
      const formData = new FormData()
      formData.append('audio', audioFile)
      
      const request = new NextRequest('http://localhost:3000/api/upload-audio', {
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data'
        },
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Upload failed')
      expect(data.details).toBeDefined()
    })

    it('should accept different audio formats', async () => {
      const testCases = [
        { type: 'audio/webm', filename: 'test.webm' },
        { type: 'audio/mp4', filename: 'test.mp4' },
        { type: 'audio/wav', filename: 'test.wav' }
      ]

      for (const testCase of testCases) {
        const audioBuffer = new ArrayBuffer(1024)
        const audioFile = new File([audioBuffer], testCase.filename, { type: testCase.type })
        
        const formData = new FormData()
        formData.append('audio', audioFile)
        
        const request = new NextRequest('http://localhost:3000/api/upload-audio', {
          method: 'POST',
          headers: {
            'content-type': 'multipart/form-data'
          },
          body: formData
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      }
    })
  })
})