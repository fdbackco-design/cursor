'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // 인증 체크
  useEffect(() => {
    // 인증 로딩 중이면 아무것도 하지 않음
    if (authLoading) {
      return;
    }

    // 로그인하지 않은 사용자는 홈으로 리다이렉트
    if (!isAuthenticated || !user) {
      router.push('/home');
      return;
    }

    // ADMIN 역할이 아닌 사용자는 홈으로 리다이렉트
    if (user.role !== 'ADMIN') {
      router.push('/home');
      return;
    }
  }, [isAuthenticated, user, router, authLoading]);

  // 인증 로딩 중이면 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자나 ADMIN 역할이 아닌 사용자는 리다이렉트 중이므로 아무것도 렌더링하지 않음
  if (!isAuthenticated || !user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
