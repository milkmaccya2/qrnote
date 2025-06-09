import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioRecording } from '../useAudioRecording'

// uploadAudioFile をモック
vi.mock('@/services/audioUploadService', () => ({
  uploadAudioFile: vi.fn()
}))

// MediaRecorder をモック
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  ondataavailable: null as any,
  onstop: null as any,
  state: 'inactive',
}

const mockGetUserMedia = vi.fn()
const mockTracks = [{ stop: vi.fn() }]
const mockStream = {
  getTracks: () => mockTracks
}

// グローバルなモック設定
Object.defineProperty(global, 'MediaRecorder', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockMediaRecorder)
})

Object.defineProperty(global.MediaRecorder, 'isTypeSupported', {
  writable: true,
  value: vi.fn().mockReturnValue(true)
})

Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia
  }
})

describe('useAudioRecording', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUserMedia.mockResolvedValue(mockStream)
    mockTracks[0].stop.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAudioRecording())

    expect(result.current.isRecording).toBe(false)
    expect(result.current.isUploading).toBe(false)
    expect(result.current.isSupported).toBe(true)
    expect(typeof result.current.startRecording).toBe('function')
    expect(typeof result.current.stopRecording).toBe('function')
    expect(typeof result.current.cleanup).toBe('function')
  })

  it('should start recording successfully', async () => {
    const { result } = renderHook(() => useAudioRecording())

    await act(async () => {
      await result.current.startRecording()
    })

    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(global.MediaRecorder).toHaveBeenCalled()
    expect(mockMediaRecorder.start).toHaveBeenCalled()
    expect(result.current.isRecording).toBe(true)
  })

  it('should handle getUserMedia error', async () => {
    const onUploadError = vi.fn()
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'))

    const { result } = renderHook(() => useAudioRecording({ onUploadError }))

    await act(async () => {
      await result.current.startRecording()
    })

    expect(result.current.isSupported).toBe(false)
    expect(onUploadError).toHaveBeenCalledWith('マイクへのアクセスが許可されていません')
  })

  it('should stop recording', async () => {
    const { result } = renderHook(() => useAudioRecording())

    // 録音開始
    await act(async () => {
      await result.current.startRecording()
    })

    // 録音停止
    act(() => {
      result.current.stopRecording()
    })

    expect(mockMediaRecorder.stop).toHaveBeenCalled()
    expect(result.current.isRecording).toBe(false)
  })

  it('should handle audio upload after recording stops', async () => {
    const { uploadAudioFile } = await import('@/services/audioUploadService')
    const onUploadSuccess = vi.fn()
    
    vi.mocked(uploadAudioFile).mockResolvedValue({
      success: true,
      url: 'https://test-url.com',
      signedUrl: 'https://signed-url.com',
      fileName: 'test.webm',
      expiresAt: new Date().toISOString()
    })

    const { result } = renderHook(() => useAudioRecording({ onUploadSuccess }))

    // 録音開始
    await act(async () => {
      await result.current.startRecording()
    })

    // MediaRecorderのonstopイベントをシミュレート
    act(() => {
      const audioBlob = new Blob(['test'], { type: 'audio/webm' })
      // ondataavailableイベントをシミュレート
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: audioBlob } as any)
      }
      // onstopイベントをシミュレート
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop(new Event('stop'))
      }
    })

    // アップロード完了まで待機
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(uploadAudioFile).toHaveBeenCalled()
    expect(onUploadSuccess).toHaveBeenCalledWith('https://test-url.com')
  })

  it('should handle upload error', async () => {
    const { uploadAudioFile } = await import('@/services/audioUploadService')
    const onUploadError = vi.fn()
    
    vi.mocked(uploadAudioFile).mockRejectedValue(new Error('Upload failed'))

    const { result } = renderHook(() => useAudioRecording({ onUploadError }))

    // 録音開始
    await act(async () => {
      await result.current.startRecording()
    })

    // MediaRecorderのonstopイベントをシミュレート
    act(() => {
      const audioBlob = new Blob(['test'], { type: 'audio/webm' })
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: audioBlob } as any)
      }
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop(new Event('stop'))
      }
    })

    // エラー処理完了まで待機
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(onUploadError).toHaveBeenCalledWith('Upload failed')
  })

  it('should cleanup resources', async () => {
    const { result } = renderHook(() => useAudioRecording())

    // 録音開始
    await act(async () => {
      await result.current.startRecording()
    })

    // クリーンアップ実行
    act(() => {
      result.current.cleanup()
    })

    expect(mockTracks[0].stop).toHaveBeenCalled()
    expect(mockMediaRecorder.stop).toHaveBeenCalled()
    expect(result.current.isRecording).toBe(false)
  })

  it('should use fallback MIME type when preferred type is not supported', async () => {
    global.MediaRecorder.isTypeSupported = vi.fn()
      .mockReturnValueOnce(false) // 最初のMIMEタイプはサポートされていない
      .mockReturnValue(true) // フォールバックはサポートされている

    const { result } = renderHook(() => useAudioRecording({
      mimeType: 'audio/unsupported'
    }))

    await act(async () => {
      await result.current.startRecording()
    })

    expect(global.MediaRecorder.isTypeSupported).toHaveBeenCalledWith('audio/unsupported')
    expect(global.MediaRecorder).toHaveBeenCalledWith(
      mockStream,
      { mimeType: 'audio/webm' } // フォールバックのMIMEタイプ
    )
  })
})