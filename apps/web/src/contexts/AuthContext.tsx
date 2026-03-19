'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'BIZ' | 'CONSUMER' | 'ADMIN' | null;
  kakaoSub: string;
  referrerCodeUsed?: string;
  approve: boolean;
  originalApprove?: boolean;
  phoneNumber?: string;
  shippingAddress?: any;
  talkMessageAgreed?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/me`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // 사용자 정보 구조 정규화 및 유효성 검사
        let normalizedUser = null;
        
        if (userData.isAuthenticated && userData.id) {
          // getCurrentUser가 직접 반환하는 구조
          normalizedUser = userData;
        } else if (userData.user && userData.user.approve !== undefined) {
          // user.user 구조인 경우
          normalizedUser = userData.user;
        } else if (userData.approve !== undefined) {
          // user 직접 구조인 경우
          normalizedUser = userData;
        } else {
          // 기존 구조 유지
          normalizedUser = userData;
        }
        
        // 사용자 정보가 유효한지 확인 (필수 필드 존재 여부)
        if (normalizedUser && normalizedUser.id && normalizedUser.email && normalizedUser.name) {
          const hasValidReferralCode =
            typeof normalizedUser.referrerCodeUsed === 'string' &&
            normalizedUser.referrerCodeUsed.trim().length > 0;

          // 접근 제어 정책:
          // - 기존: approve=true 인 사용자만 접근 허용
          // - 변경: 유효 추천인 코드(referrerCodeUsed)가 있으면 approve와 무관하게 접근 허용
          // 승인 필드는 원본값을 originalApprove로 유지한다.
          const accessAwareUser: User = {
            ...normalizedUser,
            originalApprove: Boolean(normalizedUser.approve),
            approve: Boolean(normalizedUser.approve || hasValidReferralCode),
          };

          setUser(accessAwareUser);
        } else {
          setUser(null);
        }
      } else {
        // 401 Unauthorized인 경우 로그인되지 않은 상태로 처리
        setUser(null);
      }
    } catch (error) {
      // 네트워크 에러인 경우에만 로그인되지 않은 상태로 처리
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    setLoading(true);
    await fetchUser();
  };

  useEffect(() => {
    fetchUser();
  }, []);



  // isAuthenticated 상태를 더 정확하게 계산
  const isAuthenticated = !!(user && user.id && user.email && user.name);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading, 
      refetch 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
