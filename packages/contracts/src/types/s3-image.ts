/**
 * S3에 저장된 이미지 정보 타입
 */
export interface S3Image {
  /** S3 객체 키 (파일 경로) */
  s3Key: string;
  /** CDN URL (실제 접근 가능한 URL) */
  cdnUrl: string;
  /** MIME 타입 (image/jpeg, image/png 등) */
  mime: string;
  /** 파일 크기 (바이트) */
  size: number;
  /** 원본 파일명 */
  originalName?: string;
  /** 이미지 너비 (픽셀) */
  width?: number;
  /** 이미지 높이 (픽셀) */
  height?: number;
  /** 업로드 시간 */
  uploadedAt?: string;
  /** 이미지 순서 (썸네일, 메인 이미지 등) */
  order?: number;
}

/**
 * Product의 images 필드 타입 (S3Image 배열)
 */
export type ProductImages = S3Image[];

/**
 * S3 업로드 요청 타입
 */
export interface S3UploadRequest {
  /** 파일 데이터 (Buffer 또는 base64) */
  file: Buffer | string;
  /** 파일명 */
  filename: string;
  /** MIME 타입 */
  mimeType: string;
  /** S3 버킷 경로 (예: products/2024/01/) */
  path?: string;
  /** 이미지 리사이징 옵션 */
  resizeOptions?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

/**
 * S3 업로드 응답 타입
 */
export interface S3UploadResponse {
  /** S3 객체 키 */
  s3Key: string;
  /** CDN URL */
  cdnUrl: string;
  /** 파일 크기 */
  size: number;
  /** 이미지 크기 정보 */
  dimensions?: {
    width: number;
    height: number;
  };
}
