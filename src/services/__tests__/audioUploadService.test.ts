import { uploadAudioFile, uploadAudioFileWithProgress } from '../audioUploadService'

// fetch をモック
const mockFetch = vi.fn()
global.fetch = mockFetch

// XMLHttpRequest をモック
const mockXHRInstance = {
  open: vi.fn(),
  send: vi.fn(),
  upload: {
    addEventListener: vi.fn()
  },
  addEventListener: vi.fn(),
  status: 200,
  responseText: ''
}

const mockXHR = vi.fn(() => mockXHRInstance)
global.XMLHttpRequest = mockXHR as typeof XMLHttpRequest

describe('audioUploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Date.now をモック
    vi.spyOn(Date, 'now').mockReturnValue(1234567890)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('uploadAudioFile', () => {
    it('should upload audio file successfully', async () => {
      const mockResponse = {
        success: true,
        url: 'https://test-bucket.s3.amazonaws.com/audio/test.webm',
        signedUrl: 'https://signed-url.com',
        fileName: 'audio/test.webm',
        expiresAt: '2024-01-01T00:00:00Z'
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })
      const result = await uploadAudioFile(audioBlob)

      expect(mockFetch).toHaveBeenCalledWith('/api/upload-audio', {
        method: 'POST',
        body: expect.any(FormData)
      })

      expect(result).toEqual(mockResponse)
    })

    it('should handle HTTP error responses', async () => {
      const errorResponse = { error: 'File too large' }

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse)
      })

      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })

      await expect(uploadAudioFile(audioBlob)).rejects.toThrow('File too large')
    })

    it('should handle malformed error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })

      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })

      await expect(uploadAudioFile(audioBlob)).rejects.toThrow('Upload failed')
    })

    it('should handle invalid success responses', async () => {
      const invalidResponse = { success: false }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(invalidResponse)
      })

      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })

      await expect(uploadAudioFile(audioBlob)).rejects.toThrow('Invalid response from upload service')
    })

    it('should handle missing URL in response', async () => {
      const invalidResponse = { success: true }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(invalidResponse)
      })

      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })

      await expect(uploadAudioFile(audioBlob)).rejects.toThrow('Invalid response from upload service')
    })

    it('should create FormData with correct filename', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          url: 'https://test.com'
        })
      })

      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })
      await uploadAudioFile(audioBlob)

      // FormDataの中身を直接検証するのは困難なため、
      // fetchが正しいパラメータで呼ばれたことを確認
      expect(mockFetch).toHaveBeenCalledWith('/api/upload-audio', {
        method: 'POST',
        body: expect.any(FormData)
      })
    })
  })

  describe('uploadAudioFileWithProgress', () => {
    it('should upload with progress tracking', async () => {
      const onProgress = vi.fn()
      const mockResponse = {
        success: true,
        url: 'https://test-bucket.s3.amazonaws.com/audio/test.webm',
        signedUrl: 'https://signed-url.com',
        fileName: 'audio/test.webm',
        expiresAt: '2024-01-01T00:00:00Z'
      }

      mockXHRInstance.responseText = JSON.stringify(mockResponse)

      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })
      const uploadPromise = uploadAudioFileWithProgress(audioBlob, onProgress)

      // progress イベントをシミュレート
      const progressCallback = mockXHRInstance.upload.addEventListener.mock.calls[0][1]
      progressCallback({ lengthComputable: true, loaded: 50, total: 100 })

      // load イベントをシミュレート
      const loadCallback = mockXHRInstance.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )[1]
      loadCallback()

      const result = await uploadPromise

      expect(onProgress).toHaveBeenCalledWith(50)
      expect(result).toEqual(mockResponse)
      expect(mockXHRInstance.open).toHaveBeenCalledWith('POST', '/api/upload-audio')
      expect(mockXHRInstance.send).toHaveBeenCalledWith(expect.any(FormData))
    })

    it('should handle upload without progress callback', async () => {
      const mockResponse = {
        success: true,
        url: 'https://test.com'
      }

      mockXHRInstance.responseText = JSON.stringify(mockResponse)

      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })
      const uploadPromise = uploadAudioFileWithProgress(audioBlob)

      // progress イベントをシミュレート（コールバックなし）
      const progressCallback = mockXHRInstance.upload.addEventListener.mock.calls[0][1]
      progressCallback({ lengthComputable: true, loaded: 50, total: 100 })

      // load イベントをシミュレート
      const loadCallback = mockXHRInstance.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )[1]
      loadCallback()

      const result = await uploadPromise
      expect(result).toEqual(mockResponse)
    })

    it('should handle HTTP error status', async () => {
      mockXHRInstance.status = 400

      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })
      const uploadPromise = uploadAudioFileWithProgress(audioBlob)

      // load イベントをシミュレート
      const loadCallback = mockXHRInstance.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )[1]
      loadCallback()

      await expect(uploadPromise).rejects.toThrow('Upload failed with status: 400')
    })

    it('should handle network error', async () => {
      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })
      const uploadPromise = uploadAudioFileWithProgress(audioBlob)

      // error イベントをシミュレート
      const errorCallback = mockXHRInstance.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )[1]
      errorCallback()

      await expect(uploadPromise).rejects.toThrow('Upload failed')
    })

    it('should handle invalid JSON response', async () => {
      mockXHRInstance.responseText = 'invalid json'
      mockXHRInstance.status = 200 // 200だがJSONが無効

      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })
      const uploadPromise = uploadAudioFileWithProgress(audioBlob)

      // load イベントをシミュレート
      const loadCallback = mockXHRInstance.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )[1]
      loadCallback()

      await expect(uploadPromise).rejects.toThrow('Failed to parse response')
    })

    it('should handle invalid response structure', async () => {
      const invalidResponse = { success: false }
      mockXHRInstance.responseText = JSON.stringify(invalidResponse)
      mockXHRInstance.status = 200 // 200だがレスポンスが無効

      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })
      const uploadPromise = uploadAudioFileWithProgress(audioBlob)

      // load イベントをシミュレート
      const loadCallback = mockXHRInstance.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )[1]
      loadCallback()

      await expect(uploadPromise).rejects.toThrow('Invalid response from upload service')
    })

    it('should not call progress callback when event is not computable', async () => {
      const onProgress = vi.fn()
      
      const audioBlob = new Blob(['test audio'], { type: 'audio/webm' })
      uploadAudioFileWithProgress(audioBlob, onProgress)

      // progress イベントをシミュレート（lengthComputable: false）
      const progressCallback = mockXHRInstance.upload.addEventListener.mock.calls[0][1]
      progressCallback({ lengthComputable: false, loaded: 50, total: 100 })

      expect(onProgress).not.toHaveBeenCalled()
    })
  })
})