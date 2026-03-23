/**
 * 상품 가격(회원가·비교가) 표시·할인 합계용 유틸
 */

export function toPriceNumber(v: unknown): number {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** 단가 기준 회원 할인액 (비교가가 판매가보다 클 때만) */
export function memberDiscountPerUnit(comparePrice: unknown, salePrice: unknown): number {
  const cp = toPriceNumber(comparePrice);
  const sp = toPriceNumber(salePrice);
  if (cp <= 0 || sp <= 0 || cp <= sp) return 0;
  return cp - sp;
}

export function totalMemberDiscountFromCartItems(
  items: Array<{
    quantity: number;
    product: { priceB2C: number | string; comparePrice?: number | string | null };
  }>,
): number {
  return items.reduce((sum, item) => {
    const unit = memberDiscountPerUnit(item.product.comparePrice, item.product.priceB2C);
    return sum + unit * item.quantity;
  }, 0);
}

export function totalMemberDiscountDirect(
  comparePrice: unknown,
  salePrice: unknown,
  quantity: number,
): number {
  const unit = memberDiscountPerUnit(comparePrice, salePrice);
  return unit * Math.max(0, quantity);
}
