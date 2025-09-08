/**
 * 이미지 URL 정규화 유틸리티
 * S3 이미지 데이터를 안전하게 처리하고 표준화된 URL을 반환합니다.
 */

export interface S3ImageData {
  s3Key?: string;
  cdnUrl?: string;
  mime?: string;
  size?: number;
  uploadedAt?: string;
  originalName?: string;
  width?: number;
  height?: number;
  order?: number;
}

/**
 * 이미지 URL을 정규화합니다.
 * @param image - 이미지 데이터 (문자열, 객체, 또는 null/undefined)
 * @returns 정규화된 이미지 URL 문자열
 */
export function normalizeImageUrl(image: any): string {
  // null, undefined, 빈 문자열 처리
  if (!image) {
    return '';
  }

  // 이미 문자열인 경우
  if (typeof image === 'string') {
    return image.trim();
  }

  // 객체인 경우
  if (typeof image === 'object') {
    // S3ImageData 형태인 경우
    if (image.cdnUrl && typeof image.cdnUrl === 'string') {
      return image.cdnUrl.trim();
    }

    const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
    // s3Key만 있는 경우 (CDN URL 생성)
    if (image.s3Key && typeof image.s3Key === 'string') {
      return `${cdnBaseUrl}/${image.s3Key}`.trim();
    }

    // 다른 속성들 확인
    const possibleUrlFields = ['url', 'src', 'imageUrl', 'image_url'];
    for (const field of possibleUrlFields) {
      if (image[field] && typeof image[field] === 'string') {
        return image[field].trim();
      }
    }
  }

  // 배열인 경우 (첫 번째 요소 사용)
  if (Array.isArray(image) && image.length > 0) {
    return normalizeImageUrl(image[0]);
  }

  // 변환할 수 없는 경우 빈 문자열 반환
  console.warn('이미지 URL 정규화 실패:', image);
  return '';
}

/**
 * 이미지 URL 배열을 정규화합니다.
 * @param images - 이미지 데이터 배열
 * @returns 정규화된 이미지 URL 배열
 */
export function normalizeImageUrls(images: any[]): string[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map(image => normalizeImageUrl(image))
    .filter(url => url.length > 0); // 빈 URL 제거
}

/**
 * 단일 이미지 URL을 안전하게 가져옵니다.
 * @param image - 이미지 데이터
 * @param fallback - 기본값 (선택사항)
 * @returns 정규화된 이미지 URL 또는 기본값
 */
export function getImageUrl(image: any, fallback: string = ''): string {
  const normalized = normalizeImageUrl(image);
  return normalized || fallback;
}

/**
 * 이미지 URL이 유효한지 확인합니다.
 * @param url - 확인할 URL
 * @returns 유효한 URL인지 여부
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) {
    return false;
  }

  // 기본적인 URL 형식 확인
  try {
    new URL(trimmedUrl);
    return true;
  } catch {
    // 상대 경로도 허용 (예: /images/photo.jpg)
    return trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./');
  }
}

/**
 * S3 이미지 데이터를 표준화합니다.
 * @param imageData - 원본 이미지 데이터
 * @returns 표준화된 S3ImageData 객체
 */
export function standardizeS3ImageData(imageData: any): S3ImageData {
  if (!imageData) {
    return {};
  }

  // 이미 S3ImageData 형태인 경우
  if (typeof imageData === 'object' && !Array.isArray(imageData)) {
    return {
      s3Key: imageData.s3Key || '',
      cdnUrl: imageData.cdnUrl || '',
      mime: imageData.mime || '',
      size: imageData.size || 0,
      uploadedAt: imageData.uploadedAt || '',
      originalName: imageData.originalName || '',
      width: imageData.width || undefined,
      height: imageData.height || undefined,
      order: imageData.order || undefined,
    };
  }

  // 문자열인 경우
  if (typeof imageData === 'string') {
    return {
      cdnUrl: imageData,
      s3Key: '',
      mime: '',
      size: 0,
      uploadedAt: '',
    };
  }

  return {};
}

/**
 * 이미지 URL에서 파일 확장자를 추출합니다.
 * @param url - 이미지 URL
 * @returns 파일 확장자 (예: .jpg, .png)
 */
export function getImageExtension(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match && match[1] ? `.${match[1].toLowerCase()}` : '';
}

/**
 * 이미지 URL에서 파일명을 추출합니다.
 * @param url - 이미지 URL
 * @returns 파일명
 */
export function getImageFilename(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || '';
    
    // 쿼리 파라미터 제거
    return filename.split('?')[0] || '';
  } catch {
    // URL 파싱 실패 시 경로에서 직접 추출
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1] || '';
    return lastPart.split('?')[0] || '';
  }
}
