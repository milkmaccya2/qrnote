import { describe, it, expect } from 'vitest';
import { isImageUrl } from '../utils';

describe('isImageUrl', () => {
  it('HTTPSの画像URLを正しく判定する', () => {
    expect(isImageUrl('https://example.com/image.jpg')).toBe(true);
    expect(isImageUrl('https://example.com/photo.jpeg')).toBe(true);
    expect(isImageUrl('https://example.com/pic.png')).toBe(true);
    expect(isImageUrl('https://example.com/animation.gif')).toBe(true);
    expect(isImageUrl('https://example.com/image.webp')).toBe(true);
    expect(isImageUrl('https://example.com/bitmap.bmp')).toBe(true);
  });

  it('HTTPの画像URLを正しく判定する', () => {
    expect(isImageUrl('http://example.com/image.jpg')).toBe(true);
    expect(isImageUrl('http://example.com/photo.png')).toBe(true);
  });

  it('大文字小文字を区別しない', () => {
    expect(isImageUrl('https://example.com/image.JPG')).toBe(true);
    expect(isImageUrl('https://example.com/photo.PNG')).toBe(true);
    expect(isImageUrl('HTTPS://example.com/pic.jpg')).toBe(true);
  });

  it('クエリパラメータ付きのURLを正しく判定する', () => {
    expect(isImageUrl('https://example.com/image.jpg?size=large')).toBe(true);
    expect(isImageUrl('https://example.com/photo.png?version=1.0')).toBe(true);
  });

  it('パスに拡張子が含まれる場合も判定する', () => {
    expect(isImageUrl('https://example.com/images/photo.jpg/view')).toBe(true);
    expect(isImageUrl('https://s3.amazonaws.com/bucket/file.png?signed=true')).toBe(true);
  });

  it('画像以外のURLはfalseを返す', () => {
    expect(isImageUrl('https://example.com/')).toBe(false);
    expect(isImageUrl('https://example.com/document.pdf')).toBe(false);
    expect(isImageUrl('https://example.com/video.mp4')).toBe(false);
    expect(isImageUrl('https://example.com/index.html')).toBe(false);
  });

  it('HTTPSでないURLはfalseを返す', () => {
    expect(isImageUrl('ftp://example.com/image.jpg')).toBe(false);
    expect(isImageUrl('file:///image.jpg')).toBe(false);
    expect(isImageUrl('/image.jpg')).toBe(false);
    expect(isImageUrl('image.jpg')).toBe(false);
  });

  it('空文字列はfalseを返す', () => {
    expect(isImageUrl('')).toBe(false);
  });
});