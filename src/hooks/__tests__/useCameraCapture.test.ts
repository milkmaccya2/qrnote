import { renderHook, act, waitFor } from '@testing-library/react';
import { useCameraCapture } from '../useCameraCapture';
import type { UseCameraCaptureOptions } from '@/types';

// MediaDevicesのモック
const mockGetUserMedia = vi.fn();
const mockVideoElement = {
  play: vi.fn().mockResolvedValue(undefined),
  srcObject: null,
  videoWidth: 640,
  videoHeight: 480,
};

const mockCanvasContext = {
  drawImage: vi.fn(),
};

const mockCanvas = {
  getContext: vi.fn().mockReturnValue(mockCanvasContext),
  toBlob: vi.fn(),
  width: 0,
  height: 0,
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

// MediaRecorderのモック
class MockMediaRecorder {
  static isTypeSupported = vi.fn().mockReturnValue(true);
  ondataavailable = null;
  onstop = null;
  start = vi.fn();
  stop = vi.fn();
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_stream: MediaStream, _options?: MediaRecorderOptions) {
    // コンストラクタの実装
  }
}

global.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder;

describe('useCameraCapture', () => {
  const mockTrack = { stop: vi.fn() };
  const mockStream = {
    getTracks: vi.fn().mockReturnValue([mockTrack])
  } as unknown as MediaStream;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(mockStream);
    mockTrack.stop.mockClear();
    mockStream.getTracks.mockClear();
    mockStream.getTracks.mockReturnValue([mockTrack]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useCameraCapture());

    expect(result.current.isActive).toBe(false);
    expect(result.current.isSupported).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.videoRef.current).toBeNull();
    expect(result.current.canvasRef.current).toBeNull();
  });

  it('オプションが正しく設定される', () => {
    const options: UseCameraCaptureOptions = {
      width: 1280,
      height: 720,
      facingMode: 'user',
      onCapture: vi.fn(),
      onError: vi.fn(),
    };

    const { result } = renderHook(() => useCameraCapture(options));

    expect(result.current.isSupported).toBe(true);
  });

  it('カメラの起動が正常に動作する', async () => {
    const { result } = renderHook(() => useCameraCapture());

    // videoRefにモック要素を設定
    result.current.videoRef.current = mockVideoElement as unknown as HTMLVideoElement;

    await act(async () => {
      await result.current.startCamera();
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'environment'
      }
    });

    await waitFor(() => {
      expect(result.current.isActive).toBe(true);
    });
  });

  it('カメラが利用できない場合にエラーを適切に処理する', async () => {
    const onError = vi.fn();
    mockGetUserMedia.mockRejectedValue(new Error('Camera not available'));

    const { result } = renderHook(() => useCameraCapture({ onError }));

    await act(async () => {
      await result.current.startCamera();
    });

    await waitFor(() => {
      expect(result.current.isSupported).toBe(false);
      expect(result.current.error).toBe('Camera not available');
      expect(onError).toHaveBeenCalledWith('Camera not available');
    });
  });

  it('カメラの停止が正常に動作する', async () => {
    const { result } = renderHook(() => useCameraCapture());

    // videoRefにモック要素を設定
    result.current.videoRef.current = mockVideoElement as unknown as HTMLVideoElement;

    // まずカメラを起動
    await act(async () => {
      await result.current.startCamera();
    });

    // カメラを停止
    act(() => {
      result.current.stopCamera();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('写真撮影が正常に動作する', async () => {
    const onCapture = vi.fn();
    const { result } = renderHook(() => useCameraCapture({ onCapture }));

    // refs にモック要素を設定
    result.current.videoRef.current = mockVideoElement as unknown as HTMLVideoElement;
    result.current.canvasRef.current = mockCanvas as unknown as HTMLCanvasElement;

    // カメラを起動
    await act(async () => {
      await result.current.startCamera();
    });

    // キャンバスのモックを確実に設定
    mockCanvas.getContext.mockReturnValue(mockCanvasContext);
    
    // toBlob をモック
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    mockCanvas.toBlob.mockImplementation((callback: BlobCallback | null) => {
      if (callback) {
        callback(mockBlob);
      }
    });

    // 写真撮影
    let captureResult: Blob | null = null;
    await act(async () => {
      captureResult = await result.current.capturePhoto();
    });

    // キャンバスの設定を確認
    expect(mockCanvas.width).toBe(640);
    expect(mockCanvas.height).toBe(480);
    expect(mockCanvasContext.drawImage).toHaveBeenCalledWith(
      mockVideoElement,
      0,
      0,
      640,
      480
    );
    expect(onCapture).toHaveBeenCalledWith(mockBlob);
    expect(captureResult).toBe(mockBlob);
  });

  it('カメラが起動していない状態で撮影するとエラーになる', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useCameraCapture({ onError }));

    await act(async () => {
      await result.current.capturePhoto();
    });

    expect(onError).toHaveBeenCalledWith('カメラが起動していません');
  });

  it('カメラの切り替えが正常に動作する', async () => {
    const { result } = renderHook(() => useCameraCapture());

    // videoRefにモック要素を設定
    result.current.videoRef.current = mockVideoElement as unknown as HTMLVideoElement;

    // まずカメラを起動
    await act(async () => {
      await result.current.startCamera();
    });

    // カメラを切り替え
    await act(async () => {
      await result.current.switchCamera();
    });

    // getUserMedia が2回呼ばれることを確認（起動時と切り替え時）
    expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
  });

  it('クリーンアップが正常に動作する', async () => {
    const { result } = renderHook(() => useCameraCapture());

    // videoRefにモック要素を設定
    result.current.videoRef.current = mockVideoElement as unknown as HTMLVideoElement;

    // カメラを起動
    await act(async () => {
      await result.current.startCamera();
    });

    // クリーンアップ実行
    act(() => {
      result.current.cleanup();
    });

    expect(result.current.isActive).toBe(false);
  });

  it('MediaDevices APIがサポートされていない場合', async () => {
    const onError = vi.fn();
    
    // MediaDevices API を無効化
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => useCameraCapture({ onError }));

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.isSupported).toBe(false);
    expect(onError).toHaveBeenCalledWith('このブラウザはカメラ機能をサポートしていません');
  });
});