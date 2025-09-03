export interface ShippingAddress {
  id: string;
  userId: string;
  name: string;
  receiverName: string;
  receiverPhoneNumber1: string;
  receiverPhoneNumber2?: string;
  zoneNumber: string; // 우편번호
  baseAddress: string;
  detailAddress: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 호환성을 위한 필드들 (기존 코드와의 호환성)
  type?: string;
  default?: boolean;
  receiver_name?: string;
  receiver_phone_number1?: string;
  receiver_phone_number2?: string;
  zone_number?: string;
  base_address?: string;
  detail_address?: string;
  is_default?: boolean;
  updated_at?: number;
}

export interface AddressFormData {
  name: string;
  receiver_name: string;
  receiver_phone_number1: string;
  receiver_phone_number2?: string;
  zone_number: string; // 우편번호
  base_address: string;
  detail_address: string;
  is_default: boolean;
}
