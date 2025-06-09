import { uploadImageFile, uploadImageFileWithProgress } from '../imageUploadService';
import { API_ENDPOINTS } from '@/constants';
import type { ImageUploadResult } from '@/types';

// fetch のモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// XMLHttpRequest のモック
class MockXMLHttpRequest {
  upload = {
    addEventListener: vi.fn(),
  };
  status = 200;
  responseText = '';
  addEventListener = vi.fn();
  open = vi.fn();
  send = vi.fn();
}

global.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;

describe('imageUploadService', () => {
  const mockImageBlob = new Blob(['test image data'], { type: 'image/jpeg' });
  const mockSuccessResponse: ImageUploadResult = {
    success: true,
    url: 'https://example.com/image.jpg',
    signedUrl: 'https://example.com/signed-url',
    fileName: 'image-123.jpg',
    expiresAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadImageFile', () => {
    it('画像ファイルのアップロードが成功する', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await uploadImageFile(mockImageBlob);

      expect(mockFetch).toHaveBeenCalledWith(API_ENDPOINTS.UPLOAD_IMAGE, {
        method: 'POST',
        body: expect.any(FormData),
      });

      expect(result).toEqual(mockSuccessResponse);
    });

    it('アップロードが失敗した場合にエラーをスローする', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Upload failed' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(uploadImageFile(mockImageBlob)).rejects.toThrow('Upload failed');
    });

    it('ネットワークエラーが発生した場合にエラーをスローする', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(uploadImageFile(mockImageBlob)).rejects.toThrow('Network error');
    });

    it('レスポンスのJSONパースに失敗した場合のエラーハンドリング', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockRejectedValue(new Error('JSON parse error')),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(uploadImageFile(mockImageBlob)).rejects.toThrow('Upload failed');
    });

    it('無効なレスポンスの場合にエラーをスローする', async () => {
      const invalidResponse = {
        success: false, // success が false
        url: '',
      };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(invalidResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(uploadImageFile(mockImageBlob)).rejects.toThrow('Invalid response from upload service');
    });

    it('URLが不足している場合にエラーをスローする', async () => {
      const invalidResponse = {
        success: true,
        url: '', // URL が空
      };
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(invalidResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await expect(uploadImageFile(mockImageBlob)).rejects.toThrow('Invalid response from upload service');
    });

    it('FormDataが正しく設定される', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockSuccessResponse),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await uploadImageFile(mockImageBlob);

      const [[, options]] = mockFetch.mock.calls;
      const formData = options.body as FormData;
      const imageFile = formData.get('image') as File;
      
      expect(imageFile).toBeInstanceOf(File);
      expect(imageFile.type).toBe('image/jpeg');
      expect(imageFile.size).toBe(mockImageBlob.size);
    });
  });

  describe('uploadImageFileWithProgress', () => {
    let mockXHR: MockXMLHttpRequest;

    beforeEach(() => {
      mockXHR = new MockXMLHttpRequest();
      vi.spyOn(global, 'XMLHttpRequest').mockImplementation(() => mockXHR);
    });

    it('進行状況付きアップロードが成功する', async () => {
      const onProgress = vi.fn();
      mockXHR.responseText = JSON.stringify(mockSuccessResponse);

      const uploadPromise = uploadImageFileWithProgress(mockImageBlob, onProgress);

      // progress イベントをシミュレート
      const progressCallback = mockXHR.upload.addEventListener.mock.calls
        .find(([event]) => event === 'progress')?.[1];
      
      if (progressCallback) {
        progressCallback({ lengthComputable: true, loaded: 50, total: 100 });
      }

      // load イベントをシミュレート
      const loadCallback = mockXHR.addEventListener.mock.calls
        .find(([event]) => event === 'load')?.[1];
      
      if (loadCallback) {
        loadCallback();
      }

      const result = await uploadPromise;

      expect(onProgress).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('アップロードエラー時にエラーをスローする', async () => {
      mockXHR.status = 500;

      const uploadPromise = uploadImageFileWithProgress(mockImageBlob);

      // load イベントをシミュレート（ステータス500）
      const loadCallback = mockXHR.addEventListener.mock.calls
        .find(([event]) => event === 'load')?.[1];
      
      if (loadCallback) {
        loadCallback();
      }

      await expect(uploadPromise).rejects.toThrow('Upload failed with status: 500');
    });

    it('ネットワークエラー時にエラーをスローする', async () => {
      const uploadPromise = uploadImageFileWithProgress(mockImageBlob);

      // error イベントをシミュレート
      const errorCallback = mockXHR.addEventListener.mock.calls
        .find(([event]) => event === 'error')?.[1];
      
      if (errorCallback) {
        errorCallback();
      }

      await expect(uploadPromise).rejects.toThrow('Upload failed');
    });

    it('無効なJSONレスポンスの場合にエラーをスローする', async () => {
      mockXHR.responseText = 'invalid json';

      const uploadPromise = uploadImageFileWithProgress(mockImageBlob);

      // load イベントをシミュレート
      const loadCallback = mockXHR.addEventListener.mock.calls
        .find(([event]) => event === 'load')?.[1];
      
      if (loadCallback) {
        loadCallback();
      }

      await expect(uploadPromise).rejects.toThrow('Failed to parse response');
    });

    it('無効なレスポンス構造の場合にエラーをスローする', async () => {
      const invalidResponse = { success: false };
      mockXHR.responseText = JSON.stringify(invalidResponse);

      const uploadPromise = uploadImageFileWithProgress(mockImageBlob);

      // load イベントをシミュレート
      const loadCallback = mockXHR.addEventListener.mock.calls
        .find(([event]) => event === 'load')?.[1];
      
      if (loadCallback) {
        loadCallback();
      }

      await expect(uploadPromise).rejects.toThrow('Invalid response from upload service');
    });

    it('進行状況が適切に計算される', async () => {
      const onProgress = vi.fn();
      mockXHR.responseText = JSON.stringify(mockSuccessResponse);

      const uploadPromise = uploadImageFileWithProgress(mockImageBlob, onProgress);

      // progress イベントをシミュレート（複数回）
      const progressCallback = mockXHR.upload.addEventListener.mock.calls
        .find(([event]) => event === 'progress')?.[1];
      
      if (progressCallback) {
        progressCallback({ lengthComputable: true, loaded: 25, total: 100 });
        progressCallback({ lengthComputable: true, loaded: 75, total: 100 });
        progressCallback({ lengthComputable: false, loaded: 50, total: 100 }); // lengthComputable = false
      }

      // load イベントをシミュレート
      const loadCallback = mockXHR.addEventListener.mock.calls
        .find(([event]) => event === 'load')?.[1];
      
      if (loadCallback) {
        loadCallback();
      }

      await uploadPromise;

      expect(onProgress).toHaveBeenCalledWith(25);
      expect(onProgress).toHaveBeenCalledWith(75);
      expect(onProgress).toHaveBeenCalledTimes(2); // lengthComputable = false の場合は呼ばれない
    });
  });
});