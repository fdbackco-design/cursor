export interface ReferralCode {
  id: string;
  code: string;
  currentUses: number;
  isActive: boolean;
  createdAt?: string;
  sellerId?: string;
}

export interface CreateReferralCodeDto {
  code: string;
  isActive?: boolean;
}

export interface UpdateReferralCodeDto {
  code?: string;
  isActive?: boolean;
}
