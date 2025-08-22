'use client';

import { useState } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { MessageCircle, Gift, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const loginSuccess = searchParams.get('login');

  const verifyReferralCode = async () => {
    if (!referralCode.trim()) {
      setError('추천인 코드를 입력해주세요.');
      return;
    }

    setIsVerifying(true);
    setError('');
    setVerificationStatus('idle');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/verify-referral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referralCode: referralCode.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.isValid) {
        setVerificationStatus('valid');
        setError('');
      } else {
        setVerificationStatus('invalid');
        setError(data.message || '유효하지 않은 추천인 코드입니다.');
      }
    } catch (error) {
      setVerificationStatus('invalid');
      setError('추천인 코드 검증에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKakaoLogin = () => {
    if (verificationStatus !== 'valid') {
      setError('먼저 추천인 코드를 확인해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // 추천인 코드와 함께 카카오 로그인 URL로 이동
    const loginUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/kakao?ref=${referralCode.trim()}`;
    window.location.href = loginUrl;
  };

  const isReferralCodeValid = referralCode.trim().length > 0;
  const canProceedToLogin = verificationStatus === 'valid';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>
            카카오 계정으로 간편하게 로그인하세요
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 추천인 코드 입력 */}
          <div className="space-y-2">
            <label htmlFor="referralCode" className="text-sm font-medium text-gray-700">
              추천인 코드 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="referralCode"
                  type="text"
                  placeholder="추천인 코드를 입력하세요"
                  value={referralCode}
                  onChange={(e) => {
                    setReferralCode(e.target.value);
                    setError('');
                    setVerificationStatus('idle');
                  }}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    error ? 'border-red-300 focus:ring-red-500' : 
                    verificationStatus === 'valid' ? 'border-green-300 focus:ring-green-500' :
                    verificationStatus === 'invalid' ? 'border-red-300 focus:ring-red-500' :
                    'border-gray-300'
                  }`}
                />
              </div>
              <Button
                onClick={verifyReferralCode}
                disabled={!isReferralCodeValid || isVerifying}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
              >
                {isVerifying ? '확인 중...' : '확인'}
              </Button>
            </div>
            
            {/* 검증 상태 표시 */}
            {verificationStatus === 'valid' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                유효한 추천인 코드입니다
              </div>
            )}
            
            {verificationStatus === 'invalid' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="h-4 w-4" />
                유효하지 않은 추천인 코드입니다
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              추천인 코드를 입력하고 확인 버튼을 눌러주세요.
            </p>
            
            {/* 에러 메시지 */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          {/* URL 에러 메시지 */}
          {urlError === 'login_failed' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                로그인에 실패했습니다. 다시 시도해주세요.
              </p>
            </div>
          )}

          {urlError === 'invalid_referral' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                유효하지 않은 추천인 코드입니다. 다시 확인해주세요.
              </p>
            </div>
          )}

          {/* 성공 메시지 */}
          {loginSuccess === 'success' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">
                로그인에 성공했습니다! 환영합니다.
              </p>
            </div>
          )}

          <Button 
            onClick={handleKakaoLogin}
            disabled={isLoading || !canProceedToLogin}
            className={`w-full text-black disabled:opacity-50 disabled:cursor-not-allowed ${
              canProceedToLogin 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            size="lg"
          >
            {isLoading ? (
              '로그인 중...'
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                </svg>
                카카오로 로그인
              </>
            )}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>계정이 없으신가요?</p>
            <p>카카오 로그인으로 자동 가입됩니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
