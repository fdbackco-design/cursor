'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ApprovalPendingPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {

    
    // 로그인하지 않은 사용자는 자동으로 로그인 페이지로 이동하지 않음
    // 사용자가 직접 로그인 버튼을 클릭하도록 함

    if (user?.approve) {

      router.push('/home');
      return;
    }

    // 3초마다 사용자 승인 상태 확인
    const checkApprovalStatus = async () => {
      try {

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/me`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();

          
          // 승인 상태가 true로 변경되었는지 확인
          if (userData.approve) {
      
            router.push('/home');
            return;
          } else {

          }
        } else {

        }
      } catch (error) {
        console.error('승인 상태 확인 실패:', error);
      }
    };

    // 즉시 한 번 확인
    checkApprovalStatus();

    // 3초마다 승인 상태 확인
    const approvalCheckInterval = setInterval(() => {

      checkApprovalStatus();
    }, 3000);

    return () => {

      clearInterval(approvalCheckInterval);
    };
  }, [isAuthenticated, user, router]);

  // 로그인하지 않은 사용자
  if (!isAuthenticated) {

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              특별한 공간
            </h1>
            <p className="text-gray-600">
              오직 선택받은 고객만을 위한 프리미엄 서비스
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              오직 선택받은 고객만을 위한 특별한 공간
            </h2>
            <p className="text-gray-700 leading-relaxed">
              지금 로그인하고 숨겨진 할인 혜택을 확인하세요.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium">프리미엄 혜택</span>
              </div>
              <p className="text-blue-800 font-semibold mt-1">
                특별한 할인과 혜택을 누려보세요
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-purple-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">선별된 상품</span>
              </div>
              <p className="text-purple-800 font-semibold mt-1">
                최고 품질의 상품만을 엄선하여 제공
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/signin')}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl mb-4"
          >
            로그인하기
          </button>

          <p className="text-sm text-gray-500">
            이미 계정이 있으신가요? <button onClick={() => router.push('/signin')} className="text-blue-600 hover:underline">로그인</button>
          </p>
        </div>
      </div>
    );
  }

  // 승인된 사용자는 홈 페이지로 리다이렉트
  if (user?.approve) {

    router.push('/home');
    return null;
  }

  // 로그인 후: 승인 대기 메시지 (간소화된 버전)
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            승인 대기 중
          </h1>
          <p className="text-gray-600">
            관리자 승인을 기다리고 있습니다
          </p>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            승인 후 카카오톡 이메일로 알려드릴게요
          </h2>
          <p className="text-gray-700 leading-relaxed">
            이메일이 오면 다시 로그인해주세요.
          </p>
        </div>

        <button
          onClick={() => router.push('/signin')}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl mb-4"
        >
          로그인하기
        </button>

        <p className="text-sm text-gray-500">
          다른 계정으로 로그인하려면 <button onClick={() => router.push('/signin')} className="text-blue-600 hover:underline">여기</button>를 클릭하세요
        </p>
      </div>
    </div>
  );
}
