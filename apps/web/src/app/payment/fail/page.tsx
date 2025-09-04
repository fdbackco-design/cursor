'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentFailPage() {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorInfo, setErrorInfo] = useState<{
    code?: string;
    message?: string;
    orderId?: string;
  }>({});

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

    const code = searchParams.get('code');
    const message = searchParams.get('message');
    const orderId = searchParams.get('orderId');

    setErrorInfo({
      ...(code ? { code } : {}),
      ...(message ? { message } : {}),
      ...(orderId ? { orderId } : {}),
    });
  }, [searchParams, isAuthenticated, user, router]);

  const handleRetry = () => {
    // 체크아웃 페이지로 돌아가기
    router.push('/checkout');
  };

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated || !user) {
    return null;
  }
  
  // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
  if (isAuthenticated && user && !user.approve) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-auto px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            </div>
            <CardTitle className="text-2xl text-red-600">결제 실패</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-gray-600">
              <p className="mb-2">결제 처리 중 문제가 발생했습니다.</p>
              <p>다시 시도해주세요.</p>
            </div>

            {(errorInfo.code || errorInfo.message) && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-left">
                <h3 className="font-medium text-red-900 mb-2">오류 정보</h3>
                <div className="space-y-1 text-sm text-red-700">
                  {errorInfo.code && <p>오류 코드: {errorInfo.code}</p>}
                  {errorInfo.message && <p>오류 메시지: {errorInfo.message}</p>}
                  {errorInfo.orderId && <p>주문번호: {errorInfo.orderId}</p>}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                결제 다시 시도
              </Button>
              <Link href="/cart" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  장바구니로 돌아가기
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="ghost" className="w-full">
                  메인 페이지로
                </Button>
              </Link>
            </div>

            <div className="text-sm text-gray-500">
              <p>문제가 지속되면 고객센터로 문의주세요.</p>
              <p>결제는 취소되었으며 별도 처리가 필요하지 않습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}