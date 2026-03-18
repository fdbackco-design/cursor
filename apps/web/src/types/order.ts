export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  couponId?: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: {
    receiver_name?: string;
    phone?: string;
    base_address?: string;
    detail_address?: string;
    zone_number?: string;
    // 호환성을 위해 기존 필드도 유지
    name?: string;
    address?: string;
    detailAddress?: string;
    zipCode?: string;
  };
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: {
    name: string;
    email: string;
    phoneNumber?: string;
  };
  shipments?: Shipment[];
  metadata?: {
    paymentKey?: string;
    paymentMethod?: string;
    [key: string]: any;
  };
}

/**
 * 토스페이먼츠 결제수단 코드 → 한글 라벨
 * @see https://docs.tosspayments.com - Payment 객체의 method 필드, 결제수단 이해하기
 * 토스 API는 method를 한글로 반환: 카드, 가상계좌, 간편결제, 휴대폰, 계좌이체, 문화상품권, 도서문화상품권, 게임문화상품권, 해외간편결제
 */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  // 영문 코드 (일부 레거시/외부 연동)
  CARD: '카드',
  VIRTUAL_ACCOUNT: '가상계좌',
  TRANSFER: '계좌이체',
  MOBILE_PHONE: '휴대폰',
  CULTURE_GIFT_CERTIFICATE: '문화상품권',
  BOOK_GIFT_CERTIFICATE: '도서문화상품권',
  GAME_GIFT_CERTIFICATE: '게임문화상품권',
  TOSS_PAY: '토스페이',
  KAKAO_PAY: '카카오페이',
  NAVER_PAY: '네이버페이',
  PAYCO: '페이코',
  SAMSUNG_PAY: '삼성페이',
  APPLE_PAY: '애플페이',
  // 토스 API 한글 값 (결제 승인/조회 응답)
  카드: '카드',
  가상계좌: '가상계좌',
  간편결제: '간편결제',
  휴대폰: '휴대폰',
  계좌이체: '계좌이체',
  문화상품권: '문화상품권',
  도서문화상품권: '도서문화상품권',
  게임문화상품권: '게임문화상품권',
  해외간편결제: '해외간편결제',
};

/**
 * 결제 수단 한글 라벨 반환
 * @param method - 토스 Payment.method (카드, 가상계좌, 간편결제 등)
 * @param easyPayProvider - 간편결제 시 easyPay.provider (토스페이, 카카오페이 등)
 */
export function getPaymentMethodLabel(
  method: string | null | undefined,
  easyPayProvider?: string | null
): string {
  if (!method) return '카드';
  // 간편결제인 경우 provider가 있으면 더 구체적으로 표시 (토스페이, 카카오페이 등)
  if (method === '간편결제' && easyPayProvider) {
    return PAYMENT_METHOD_LABELS[easyPayProvider] ?? easyPayProvider;
  }
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  shippedAt?: string;
  deliveredAt?: string;
  metadata?: any;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    description?: string;
    images?: any;
    priceB2C: number;
    category?: {
      name: string;
    };
  };
  returns?: {
    id: string;
    type: 'RETURN' | 'EXCHANGE' | 'CANCEL';
    status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
    reason: string;
    createdAt: string;
  }[];
}

export interface Payment {
  paymentKey: string;
  amount: number;
  status: string;
  method?: string;
  approvedAt?: string;
  metadata?: any;
}

export const ORDER_STATUS_LABELS = {
  PENDING: '결제 대기',
  CONFIRMED: '주문 확인',
  PROCESSING: '상품 준비중',
  SHIPPED: '배송중',
  DELIVERED: '배송 완료',
  CANCELLED: '주문 취소',
} as const;

export const ORDER_STATUS_COLORS = {
  PENDING: 'text-yellow-600 bg-yellow-50',
  CONFIRMED: 'text-blue-600 bg-blue-50',
  PROCESSING: 'text-orange-600 bg-orange-50',
  SHIPPED: 'text-indigo-600 bg-indigo-50',
  DELIVERED: 'text-green-600 bg-green-50',
  CANCELLED: 'text-red-600 bg-red-50',
} as const;
