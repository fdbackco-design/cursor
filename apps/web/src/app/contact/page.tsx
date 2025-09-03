'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeft, Phone, Mail, Clock, MessageCircle, Headphones } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ContactPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated || !user) {
      router.push('/signin');
      return;
    }
    
    // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
    if (isAuthenticated && user && !user.approve) {
      router.push('/approval-pending');
      return;
    }
  }, [isAuthenticated, user, router]);

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated || !user) {
    return null;
  }
  
  // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
  if (isAuthenticated && user && !user.approve) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">고객센터</h1>
          <p className="text-gray-600 mt-2">
            궁금한 점이 있으시면 언제든지 연락주세요. 친절하게 도와드리겠습니다.
          </p>
        </div>

        <div className="grid gap-8">
          {/* 고객센터 연락처 */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Headphones className="h-6 w-6 mr-3" />
                고객센터 연락처
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <Phone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">1544-9537</h2>
                  <p className="text-gray-600 mb-4">고객센터 전화번호</p>
                  <div className="flex justify-center">
                    
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 운영시간 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-600" />
                운영시간
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-700">평일</span>
                  <span className="text-gray-600">10:00 - 19:00</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium text-gray-700">주말 및 공휴일</span>
                  <span className="text-gray-600">휴무</span>
                </div>
              </div>
              
            </CardContent>
          </Card>

          
        </div>
      </div>
    </div>
  );
}
