import { S3Image, ProductImages } from '@repo/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * 이미지 URL을 올바르게 구성합니다.
 * @param imagePath 이미지 경로 (파일명, 전체 URL, 또는 S3 이미지 객체)
 * @returns 완전한 이미지 URL
 */
export function getImageUrl(imagePath: any): string {
  // null, undefined, 빈 문자열 처리
  if (!imagePath) {
    return '/images/placeholder-product.jpg';
  }

  // S3 이미지 객체인 경우
  if (typeof imagePath === 'object' && imagePath !== null) {
    return getS3ImageUrl(imagePath);
  }

  // 문자열인 경우
  if (typeof imagePath === 'string') {
    const path = imagePath.trim();
    
    // 빈 문자열 처리
    if (path.length === 0) {
      return '/images/placeholder-product.jpg';
    }

    // 이미 전체 URL인 경우 그대로 반환
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // 파일명만 있는 경우 API 서버의 uploads 경로와 결합
    if (path.startsWith('/')) {
      return `${API_BASE_URL}${path}`;
    }
    
    return `${API_BASE_URL}/uploads/${path}`;
  }

  // 다른 타입인 경우 기본 이미지 반환
  return '/images/placeholder-product.jpg';
}

/**
 * S3 이미지 객체에서 CDN URL을 추출합니다.
 * @param s3Image S3 이미지 객체
 * @returns CDN URL
 */
export function getS3ImageUrl(s3Image: any): string {
  if (!s3Image || typeof s3Image !== 'object') {
    return '/images/placeholder-product.jpg';
  }

  // cdnUrl이 있는 경우
  if (s3Image.cdnUrl && typeof s3Image.cdnUrl === 'string') {
    return s3Image.cdnUrl.trim();
  }

  // s3Key만 있는 경우 CDN URL 생성
  if (s3Image.s3Key && typeof s3Image.s3Key === 'string') {
    const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_URL || 'https://dbf9mgv9dy7hl.cloudfront.net';
    return `${cdnBaseUrl}/${s3Image.s3Key}`.trim();
  }

  return '/images/placeholder-product.jpg';
}

/**
 * 이미지 URL에 최적화 파라미터를 추가합니다.
 * @param imageUrl 원본 이미지 URL
 * @param width 원하는 너비 (기본값: 400)
 * @param height 원하는 높이 (기본값: 400)
 * @param quality 품질 (기본값: 80)
 * @returns 최적화된 이미지 URL
 */
export function getOptimizedImageUrl(
  imageUrl: string, 
  width: number = 400, 
  height: number = 400, 
  quality: number = 80
): string {
  if (!imageUrl || imageUrl.includes('/images/placeholder-product.jpg')) {
    return imageUrl;
  }

  // CloudFront URL인 경우 최적화 파라미터 추가
  if (imageUrl.includes('cloudfront.net')) {
    const url = new URL(imageUrl);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('h', height.toString());
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('f', 'webp'); // WebP 포맷 사용
    return url.toString();
  }

  return imageUrl;
}

/**
 * 상품 이미지 배열의 URL들을 올바르게 구성합니다.
 * @param images 이미지 경로 배열 또는 S3 이미지 배열
 * @returns 완전한 이미지 URL 배열
 */
export function getProductImageUrls(images: any): string[] {
  // null, undefined, 빈 배열 처리
  if (!images || !Array.isArray(images) || images.length === 0) {
    return ['/images/placeholder-product.jpg'];
  }

  // S3 이미지 배열인지 확인
  if (images.length > 0 && typeof images[0] === 'object' && images[0] !== null) {
    return images.map((image: any) => getS3ImageUrl(image)).filter(url => url.length > 0);
  }
  
  // 기존 문자열 배열인 경우
  return images.map((image: any) => getImageUrl(image)).filter(url => url.length > 0);
}

/**
 * 상품의 첫 번째 이미지 URL을 가져옵니다.
 * @param images 이미지 경로 배열 또는 S3 이미지 배열
 * @returns 첫 번째 이미지의 URL 또는 기본 이미지
 */
export function getProductMainImageUrl(images: any): string {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return '/images/placeholder-product.jpg'; // 기본 이미지
  }

  const urls = getProductImageUrls(images);
  return urls[0] || '/images/placeholder-product.jpg';
}

/**
 * 상품 이미지의 썸네일 URL을 가져옵니다.
 * @param images 이미지 경로 배열 또는 S3 이미지 배열
 * @param index 이미지 인덱스 (기본값: 0)
 * @returns 썸네일 URL
 */
export function getProductThumbnailUrl(images: any, index: number = 0): string {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return '/images/placeholder-product.jpg';
  }

  const urls = getProductImageUrls(images);
  return urls[index] || urls[0] || '/images/placeholder-product.jpg';
}

/**
 * 이미지가 S3 이미지 객체인지 확인합니다.
 * @param image 이미지 객체
 * @returns S3 이미지 객체 여부
 */
export function isS3Image(image: any): image is S3Image {
  return image && typeof image === 'object' && 'cdnUrl' in image && 's3Key' in image;
}

/**
 * 이미지 배열이 S3 이미지 배열인지 확인합니다.
 * @param images 이미지 배열
 * @returns S3 이미지 배열 여부
 */
export function isS3ImageArray(images: any): images is ProductImages {
  return Array.isArray(images) && images.length > 0 && isS3Image(images[0]);
}
