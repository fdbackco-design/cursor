// API 호출 관련 타입 및 함수
import { apiRequest } from './base';

export interface CreateAddressData {
  name: string;
  receiverName: string;
  receiverPhoneNumber1: string;
  receiverPhoneNumber2?: string;
  zoneNumber: string;
  baseAddress: string;
  detailAddress: string;
  isDefault?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {}

export interface Address {
  id: string;
  userId: string;
  name: string;
  receiverName: string;
  receiverPhoneNumber1: string;
  receiverPhoneNumber2?: string;
  zoneNumber: string;
  baseAddress: string;
  detailAddress: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const addressesApi = {
  // 사용자의 모든 배송지 조회
  async getAddresses(): Promise<{ success: boolean; data?: Address[]; error?: string }> {
    return apiRequest('/addresses', {
      method: 'GET',
    });
  },

  // 사용자의 기본 배송지 조회
  async getDefaultAddress(): Promise<{ success: boolean; data?: Address; error?: string }> {
    return apiRequest('/addresses/default', {
      method: 'GET',
    });
  },

  // 특정 배송지 조회
  async getAddress(id: string): Promise<{ success: boolean; data?: Address; error?: string }> {
    return apiRequest(`/addresses/${id}`, {
      method: 'GET',
    });
  },

  // 배송지 생성
  async createAddress(data: CreateAddressData): Promise<{ success: boolean; data?: Address; error?: string }> {
    return apiRequest('/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  // 배송지 수정
  async updateAddress(id: string, data: UpdateAddressData): Promise<{ success: boolean; data?: Address; error?: string }> {
    return apiRequest(`/addresses/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  // 기본 배송지 설정
  async setDefaultAddress(id: string): Promise<{ success: boolean; data?: Address; error?: string }> {
    return apiRequest(`/addresses/${id}/default`, {
      method: 'PUT',
    });
  },

  // 배송지 삭제
  async deleteAddress(id: string): Promise<{ success: boolean; data?: { message: string }; error?: string }> {
    return apiRequest(`/addresses/${id}`, {
      method: 'DELETE',
    });
  },
};
