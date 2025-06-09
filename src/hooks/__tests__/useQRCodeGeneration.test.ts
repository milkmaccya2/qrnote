import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQRCodeGeneration } from '../useQRCodeGeneration'

// QRCode ライブラリをモック
vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn(),
    toDataURL: vi.fn()
  }
}))

describe('useQRCodeGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with canvasRef and functions', () => {
    const { result } = renderHook(() => useQRCodeGeneration())

    expect(result.current.canvasRef).toBeDefined()
    expect(typeof result.current.generateQRCode).toBe('function')
    expect(typeof result.current.generateQRCodeDataURL).toBe('function')
  })

  it('should generate QR code on canvas successfully', async () => {
    const QRCode = await import('qrcode')
    vi.mocked(QRCode.default.toCanvas).mockResolvedValue(undefined)

    const { result } = renderHook(() => useQRCodeGeneration())
    
    // モックのキャンバス要素を作成
    const mockCanvas = document.createElement('canvas')
    Object.defineProperty(result.current.canvasRef, 'current', {
      value: mockCanvas,
      writable: true
    })

    let success: boolean = false
    await act(async () => {
      success = await result.current.generateQRCode('https://example.com')
    })

    expect(success).toBe(true)
    expect(QRCode.default.toCanvas).toHaveBeenCalledWith(
      mockCanvas,
      'https://example.com',
      expect.objectContaining({
        width: 240,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
    )
  })

  it('should return false when canvas ref is null', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useQRCodeGeneration({ onError }))

    let success: boolean = true
    await act(async () => {
      success = await result.current.generateQRCode('https://example.com')
    })

    expect(success).toBe(false)
    expect(onError).toHaveBeenCalledWith('Canvas element not found')
  })

  it('should use default message for empty text', async () => {
    const QRCode = await import('qrcode')
    vi.mocked(QRCode.default.toCanvas).mockResolvedValue(undefined)

    const { result } = renderHook(() => useQRCodeGeneration())
    
    const mockCanvas = document.createElement('canvas')
    Object.defineProperty(result.current.canvasRef, 'current', {
      value: mockCanvas,
      writable: true
    })

    await act(async () => {
      await result.current.generateQRCode('   ')
    })

    expect(QRCode.default.toCanvas).toHaveBeenCalledWith(
      mockCanvas,
      'QRノートへようこそ！',
      expect.any(Object)
    )
  })

  it('should handle QR code generation error', async () => {
    const QRCode = await import('qrcode')
    const onError = vi.fn()
    vi.mocked(QRCode.default.toCanvas).mockRejectedValue(new Error('Generation failed'))

    const { result } = renderHook(() => useQRCodeGeneration({ onError }))
    
    const mockCanvas = document.createElement('canvas')
    Object.defineProperty(result.current.canvasRef, 'current', {
      value: mockCanvas,
      writable: true
    })

    let success: boolean = true
    await act(async () => {
      success = await result.current.generateQRCode('https://example.com')
    })

    expect(success).toBe(false)
    expect(onError).toHaveBeenCalledWith('Generation failed')
  })

  it('should generate QR code data URL successfully', async () => {
    const QRCode = await import('qrcode')
    vi.mocked(QRCode.default.toDataURL).mockResolvedValue('data:image/png;base64,test')

    const { result } = renderHook(() => useQRCodeGeneration())

    let dataURL: string | null = null
    await act(async () => {
      dataURL = await result.current.generateQRCodeDataURL('https://example.com')
    })

    expect(dataURL).toBe('data:image/png;base64,test')
    expect(QRCode.default.toDataURL).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        width: 240,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
    )
  })

  it('should handle data URL generation error', async () => {
    const QRCode = await import('qrcode')
    const onError = vi.fn()
    vi.mocked(QRCode.default.toDataURL).mockRejectedValue(new Error('Data URL generation failed'))

    const { result } = renderHook(() => useQRCodeGeneration({ onError }))

    let dataURL: string | null = 'initial'
    await act(async () => {
      dataURL = await result.current.generateQRCodeDataURL('https://example.com')
    })

    expect(dataURL).toBe(null)
    expect(onError).toHaveBeenCalledWith('Data URL generation failed')
  })

  it('should use custom options', async () => {
    const QRCode = await import('qrcode')
    vi.mocked(QRCode.default.toCanvas).mockResolvedValue(undefined)

    const customOptions = {
      width: 512,
      margin: 8,
      errorCorrectionLevel: 'H' as const
    }

    const { result } = renderHook(() => useQRCodeGeneration(customOptions))
    
    const mockCanvas = document.createElement('canvas')
    Object.defineProperty(result.current.canvasRef, 'current', {
      value: mockCanvas,
      writable: true
    })

    await act(async () => {
      await result.current.generateQRCode('https://example.com')
    })

    expect(QRCode.default.toCanvas).toHaveBeenCalledWith(
      mockCanvas,
      'https://example.com',
      expect.objectContaining({
        width: 512,
        margin: 8,
        errorCorrectionLevel: 'H'
      })
    )
  })

  it('should use default message for empty text in data URL generation', async () => {
    const QRCode = await import('qrcode')
    vi.mocked(QRCode.default.toDataURL).mockResolvedValue('data:image/png;base64,test')

    const { result } = renderHook(() => useQRCodeGeneration())

    await act(async () => {
      await result.current.generateQRCodeDataURL('   ')
    })

    expect(QRCode.default.toDataURL).toHaveBeenCalledWith(
      'QRノートへようこそ！',
      expect.any(Object)
    )
  })
})