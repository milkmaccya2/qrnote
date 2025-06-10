/**
 * URLが画像URLかどうかを判定する
 * @param url - チェックするURL
 * @returns 画像URLの場合true
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const lowerUrl = url.toLowerCase();
  
  // HTTPまたはHTTPSで始まるかチェック
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    return false;
  }
  
  // 画像拡張子を含むかチェック
  return imageExtensions.some(ext => lowerUrl.includes(ext));
}