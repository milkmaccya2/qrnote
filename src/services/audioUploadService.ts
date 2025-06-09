import type { AudioUploadResult } from '@/types';
import { API_ENDPOINTS } from '@/constants';

/**
 * 音声ファイルをS3にアップロードする
 * 
 * @param audioBlob - アップロードする音声ファイルのBlobオブジェクト
 * @returns アップロード結果
 * @throws アップロードに失敗した場合はErrorをスロー
 */
export async function uploadAudioFile(audioBlob: Blob): Promise<AudioUploadResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, `recording-${Date.now()}.webm`);
  
  const response = await fetch(API_ENDPOINTS.UPLOAD_AUDIO, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(errorData.error || 'アップロードに失敗しました');
  }
  
  const result = await response.json();
  
  // レスポンスの型検証
  if (!result.success || !result.url) {
    throw new Error('Invalid response from upload service');
  }
  
  return result as AudioUploadResult;
}

/**
 * アップロードの進行状況を監視しながら音声ファイルをS3にアップロードする（将来の拡張用）
 * 
 * @param audioBlob - アップロードする音声ファイルのBlobオブジェクト
 * @param onProgress - 進行状況を受け取るコールバック関数（パーセンテージで受け取る）
 * @returns アップロード結果
 * @throws アップロードに失敗した場合はErrorをスロー
 */
export async function uploadAudioFileWithProgress(
  audioBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<AudioUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('audio', audioBlob, `recording-${Date.now()}.webm`);
    
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
            resolve(result as AudioUploadResult);
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
    
    xhr.open('POST', API_ENDPOINTS.UPLOAD_AUDIO);
    xhr.send(formData);
  });
}