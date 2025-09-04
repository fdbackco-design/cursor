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
