import type { ImageUploadResult } from '@/types';
import { API_ENDPOINTS } from '@/constants';

/**
 * 画像ファイルをS3にアップロードする
 * 
 * @param imageBlob - アップロードする画像ファイルのBlobオブジェクト
 * @returns アップロード結果
 * @throws アップロードに失敗した場合はErrorをスロー
 */
export async function uploadImageFile(imageBlob: Blob): Promise<ImageUploadResult> {
  const formData = new FormData();
  formData.append('image', imageBlob, `photo-${Date.now()}.jpg`);
  
  const response = await fetch(API_ENDPOINTS.UPLOAD_IMAGE, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(errorData.error || '画像のアップロードに失敗しました');
  }
  
  const result = await response.json();
  
  // レスポンスの型検証
  if (!result.success || !result.url) {
    throw new Error('Invalid response from upload service');
  }
  
  return result as ImageUploadResult;
}

/**
 * アップロードの進行状況を監視しながら画像ファイルをS3にアップロードする（将来の拡張用）
 * 
 * @param imageBlob - アップロードする画像ファイルのBlobオブジェクト
 * @param onProgress - 進行状況を受け取るコールバック関数（パーセンテージで受け取る）
 * @returns アップロード結果
 * @throws アップロードに失敗した場合はErrorをスロー
 */
export async function uploadImageFileWithProgress(
  imageBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<ImageUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('image', imageBlob, `photo-${Date.now()}.jpg`);
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          if (result.success && result.url) {
            resolve(result as ImageUploadResult);
          } else {
            reject(new Error('Invalid response from upload service'));
          }
        } catch {
          reject(new Error('Failed to parse response'));
        }
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    
    xhr.open('POST', API_ENDPOINTS.UPLOAD_IMAGE);
    xhr.send(formData);
  });
}