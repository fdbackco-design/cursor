'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'BIZ' | 'CONSUMER' | null;
  kakaoSub: string;
  referrerCodeUsed?: string;
  approve: boolean;
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
        console.log('AuthContext - 사용자 정보 로드:', userData);
        
        // 사용자 정보 구조 정규화 및 유효성 검사
        let normalizedUser = null;
        
        if (userData.user && userData.user.approve !== undefined) {
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
          console.log('AuthContext - 유효한 사용자 정보 설정:', normalizedUser);
          setUser(normalizedUser);
        } else {
          console.log('AuthContext - 유효하지 않은 사용자 정보:', normalizedUser);
          setUser(null);
        }
      } else {
        console.log('AuthContext - 사용자 정보 로드 실패:', response.status);
        setUser(null);
      }
    } catch (error) {
      // API 서버가 아직 준비되지 않았거나 네트워크 에러인 경우
      console.log('API 서버 연결 중... 잠시 후 다시 시도합니다.');
      setUser(null);
      
      // 5초 후 재시도
      setTimeout(() => {
        if (loading) {
          fetchUser();
        }
      }, 5000);
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

  // 사용자 정보 변경 시 로깅
  useEffect(() => {
    const isAuthenticated = !!(user && user.id && user.email && user.name);
    console.log('AuthContext - 사용자 상태 변경:', { 
      user, 
      isAuthenticated, 
      loading,
      userApprove: user?.approve,
      hasValidFields: {
        hasId: !!user?.id,
        hasEmail: !!user?.email,
        hasName: !!user?.name
      }
    });
  }, [user, loading]);

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
