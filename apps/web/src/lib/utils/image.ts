import { S3Image, ProductImages } from '@repo/contracts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * 이미지 URL을 올바르게 구성합니다.
 * @param imagePath 이미지 경로 (파일명 또는 전체 URL)
 * @returns 완전한 이미지 URL
 */
export function getImageUrl(imagePath: string): string {
  // 이미 전체 URL인 경우 그대로 반환
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // 파일명만 있는 경우 API 서버의 uploads 경로와 결합
  if (imagePath.startsWith('/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  return `${API_BASE_URL}/uploads/${imagePath}`;
}

/**
 * S3 이미지 객체에서 CDN URL을 추출합니다.
 * @param s3Image S3 이미지 객체
 * @returns CDN URL
 */
export function getS3ImageUrl(s3Image: S3Image): string {
  return s3Image.cdnUrl;
}

/**
 * 상품 이미지 배열의 URL들을 올바르게 구성합니다.
 * @param images 이미지 경로 배열 또는 S3 이미지 배열
 * @returns 완전한 이미지 URL 배열
 */
export function getProductImageUrls(images: string[] | ProductImages): string[] {
  // S3 이미지 배열인지 확인
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'object' && 'cdnUrl' in images[0]) {
    return (images as ProductImages).map(image => getS3ImageUrl(image));
  }
  
  // 기존 문자열 배열인 경우
  return (images as string[]).map(image => getImageUrl(image));
}

/**
 * 상품의 첫 번째 이미지 URL을 가져옵니다.
 * @param images 이미지 경로 배열 또는 S3 이미지 배열
 * @returns 첫 번째 이미지의 URL 또는 기본 이미지
 */
export function getProductMainImageUrl(images: string[] | ProductImages | undefined): string {
  if (!images || images.length === 0) {
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
export function getProductThumbnailUrl(images: string[] | ProductImages | undefined, index: number = 0): string {
  if (!images || images.length === 0) {
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
