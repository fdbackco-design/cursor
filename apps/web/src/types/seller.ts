export interface Seller {
  id: string;
  userId: string;
  companyName: string;
  representativeName: string;
  phone: string;
  address: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 관계 필드
  user?: {
    id: string;
    email?: string;
    name: string;
    role: string;
    approve: boolean;
    isActive: boolean;
    createdAt: string;
  };
  
  referralCodes?: Array<{
    id: string;
    code: string;
    currentUses: number;
    isActive: boolean;
    createdAt?: string;
  }>;
  
  // 계산된 필드
  referralCodeCount?: number;
  totalReferralUses?: number;
}
