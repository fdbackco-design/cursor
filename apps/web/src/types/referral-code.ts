export type UserRole = 'BIZ' | 'CONSUMER' | 'ADMIN';

export interface ReferralCode {
  id: string;
  code: string;
  displayCode?: string; // 접두사 제거된 코드 (UI 표시용)
  roleType?: UserRole; // BIZ 또는 CONSUMER
  currentUses: number;
  isActive: boolean;
  createdAt?: string;
  sellerId?: string;
}

export interface CreateReferralCodeDto {
  code: string;
  isActive?: boolean;
  roleType?: UserRole; // BIZ 또는 CONSUMER
}

export interface UpdateReferralCodeDto {
  code?: string;
  isActive?: boolean;
  roleType?: UserRole; // BIZ 또는 CONSUMER
}
