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
 * 상품 이미지 배열의 URL들을 올바르게 구성합니다.
 * @param images 이미지 경로 배열
 * @returns 완전한 이미지 URL 배열
 */
export function getProductImageUrls(images: string[]): string[] {
  return images.map(image => getImageUrl(image));
}
