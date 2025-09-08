/**
 * 가격 포맷팅 유틸리티 함수들
 */

/**
 * 숫자를 한국어 형식의 가격 문자열로 변환합니다.
 * @param price - 포맷팅할 가격 (숫자)
 * @param showCurrency - 통화 표시 여부 (기본값: true)
 * @returns 포맷팅된 가격 문자열 (예: "300,000원")
 */
export function formatPrice(price: number | string, showCurrency: boolean = true): string {
  // 문자열인 경우 숫자로 변환
  let numericPrice: number;
  if (typeof price === 'string') {
    numericPrice = parseFloat(price);
  } else {
    numericPrice = price;
  }
  
  if (typeof numericPrice !== 'number' || isNaN(numericPrice) || numericPrice < 0) {
    return showCurrency ? '0원' : '0';
  }
  
  const formatted = numericPrice.toLocaleString('ko-KR');
  return showCurrency ? `${formatted}원` : formatted;
}

/**
 * 가격을 간단한 형식으로 포맷팅합니다.
 * @param price - 포맷팅할 가격 (숫자 또는 문자열)
 * @returns 포맷팅된 가격 문자열 (예: "300,000")
 */
export function formatPriceNumber(price: number | string): string {
  return formatPrice(price, false);
}

/**
 * 가격을 통화 포함 형식으로 포맷팅합니다.
 * @param price - 포맷팅할 가격 (숫자 또는 문자열)
 * @returns 포맷팅된 가격 문자열 (예: "300,000원")
 */
export function formatPriceWithCurrency(price: number | string): string {
  return formatPrice(price, true);
}

/**
 * 할인율을 계산합니다.
 * @param originalPrice - 원래 가격
 * @param salePrice - 할인된 가격
 * @returns 할인율 (퍼센트)
 */
export function calculateDiscountPercentage(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0 || salePrice >= originalPrice) {
    return 0;
  }
  
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * 가격 범위를 포맷팅합니다.
 * @param minPrice - 최소 가격
 * @param maxPrice - 최대 가격
 * @returns 포맷팅된 가격 범위 문자열 (예: "100,000원 ~ 300,000원")
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  if (minPrice === maxPrice) {
    return formatPriceWithCurrency(minPrice);
  }
  
  return `${formatPriceWithCurrency(minPrice)} ~ ${formatPriceWithCurrency(maxPrice)}`;
}
