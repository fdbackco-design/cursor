'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { MessageCircle, Gift, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// 유틸리티 함수들
const saveReferralCodeToCookie = (code: string) => {
  // 쿠키에 30일간 저장
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  document.cookie = `referral_code=${encodeURIComponent(code)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
};

const saveReferralCodeToSessionStorage = (code: string) => {
  // 세션 스토리지에도 백업 저장
  try {
    sessionStorage.setItem('referral_code', code);
  } catch (error) {
    console.warn('세션 스토리지 저장 실패:', error);
  }
};

const getReferralCodeFromStorage = (): string => {
  // 1. 쿠키에서 확인 (middleware 또는 프론트엔드에서 설정)
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/referral_code=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  
  // 2. 세션 스토리지에서 확인
  if (typeof window !== 'undefined') {
    try {
      return sessionStorage.getItem('referral_code') || '';
    } catch {
      return '';
    }
  }
  
  return '';
};

function SignInPageInner() {
  const { user, isAuthenticated } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [autoVerificationDone, setAutoVerificationDone] = useState(false);
  const [urlRef, setUrlRef] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 파라미터 읽기를 별도 useEffect에서 처리
  useEffect(() => {
    const parseUrlParams = () => {
      if (typeof window === 'undefined') return;
      
      try {
        // window.location을 직접 사용
        const url = new URL(window.location.href);
        const ref = url.searchParams.get('ref');
        const error = url.searchParams.get('error');
        const login = url.searchParams.get('login');
        

        
        setUrlRef(ref);
        setUrlError(error);
        setLoginSuccess(login);
        
        // useSearchParams도 시도
        try {
          const searchRef = searchParams.get('ref');
          const searchError = searchParams.get('error');
          const searchLogin = searchParams.get('login');
          

          
          // useSearchParams가 작동한다면 그 값을 우선 사용
          if (searchRef !== null || searchError !== null || searchLogin !== null) {
            setUrlRef(searchRef);
            setUrlError(searchError);
            setLoginSuccess(searchLogin);
          }
        } catch (searchError) {
          console.warn('useSearchParams 실패, window.location 사용:', searchError);
        }
      } catch (error) {
        console.error('URL 파라미터 읽기 실패:', error);
      }
    };

    parseUrlParams();
  }, [searchParams]);

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.approve) {
        // 승인된 사용자는 홈으로 리다이렉트
        router.push('/home');
      } else {
        // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
        router.push('/approval-pending');
      }
    }
  }, [isAuthenticated, user, router]);

  // 로그인 성공 시 자동 리다이렉트
  useEffect(() => {
    if (loginSuccess === 'success') {
      // 2초 후 리다이렉트 (URL 파라미터 확인)
      const timer = setTimeout(() => {
        // URL에서 redirect 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        
        if (redirectUrl) {
          // 원래 접근하려던 페이지로 리다이렉트
          window.location.href = redirectUrl;
        } else {
          // 리다이렉트 URL이 없으면 홈으로
          window.location.href = '/home';
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    // cleanup 함수가 필요하지 않은 경우 undefined 반환
    return undefined;
  }, [loginSuccess, router]);

  // 추천인 코드 유효성 검증 함수
  const validateReferralCode = async (code: string, silent = false): Promise<boolean> => {
    if (!code.trim()) {
      if (!silent) setError('추천인 코드를 입력해주세요.');
      return false;
    }

    if (!silent) {
      setIsVerifying(true);
      setError('');
      setVerificationStatus('idle');
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/validate-referral/${encodeURIComponent(code.trim())}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setVerificationStatus('valid');
        setError('');
        
        // 유효한 코드면 쿠키와 세션 스토리지에 저장
        saveReferralCodeToCookie(code.trim());
        saveReferralCodeToSessionStorage(code.trim());
        
        return true;
      } else {
        setVerificationStatus('invalid');
        if (!silent) setError(data.message || '유효하지 않은 추천인 코드입니다.');
        return false;
      }
    } catch (error) {
      setVerificationStatus('invalid');
      if (!silent) setError('추천인 코드 검증에 실패했습니다. 다시 시도해주세요.');
      return false;
    } finally {
      if (!silent) setIsVerifying(false);
    }
  };

  const verifyReferralCode = () => validateReferralCode(referralCode);

  // 카카오 로그인 함수 (useEffect보다 먼저 정의)
  const handleKakaoLogin = (bypassValidation = false) => {
    if (!bypassValidation && verificationStatus !== 'valid') {
      setError('먼저 추천인 코드를 확인해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // 추천인 코드와 함께 카카오 로그인 URL로 이동
    const loginUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/kakao?ref=${encodeURIComponent(referralCode.trim())}`;

    window.location.href = loginUrl;
  };

  // 페이지 로드시 URL ref 파라미터 또는 저장된 코드 처리
  useEffect(() => {
    // urlRef가 아직 설정되지 않았으면 기다림
    if (urlRef === null && typeof window !== 'undefined') {
      return;
    }
    
    const initializeReferralCode = async () => {
      let codeToUse = '';
      
      // 1. URL ref 파라미터 우선 확인
      if (urlRef) {
        codeToUse = urlRef;
        setReferralCode(urlRef);
        
        // URL ref가 있으면 즉시 유효성 검증
        const isValid = await validateReferralCode(urlRef, true);
        
        if (isValid) {
          setAutoVerificationDone(true);
          // 유효하면 바로 카카오 로그인으로 이동 (유효성 검증 우회)
          setTimeout(() => {
            handleKakaoLogin(true);
          }, 1000); // 1초 후 자동 로그인
        } else {
          setAutoVerificationDone(true);
        }
      } else {
        // 2. URL ref가 없으면 저장된 코드 확인
        const storedCode = getReferralCodeFromStorage();
        if (storedCode) {
          codeToUse = storedCode;
          setReferralCode(storedCode);
        }
        setAutoVerificationDone(true);
      }
    };

    initializeReferralCode();
  }, [urlRef]);

  // 입력 필드 blur 시 자동 유효성 검증
  const handleReferralCodeBlur = () => {
    if (referralCode.trim() && verificationStatus === 'idle') {
      validateReferralCode(referralCode);
    }
  };



  const isReferralCodeValid = referralCode.trim().length > 0;
  const canProceedToLogin = verificationStatus === 'valid';

  // 이미 로그인된 사용자는 리다이렉트 중이므로 로딩 표시
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4 py-8 sm:py-12">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-6 sm:py-8 px-4 sm:px-6">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-3 sm:mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600">이미 로그인되어 있습니다. 홈으로 이동합니다...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4 py-8 sm:py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
          <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">로그인</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            카카오 계정으로 간편하게 로그인하세요
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 px-4 sm:px-6 pb-6 sm:pb-8">
          {/* 추천인 코드 입력 */}
          <div className="space-y-2">
            <label htmlFor="referralCode" className="text-xs sm:text-sm font-medium text-gray-700">
              추천인 코드 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
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
                  onBlur={handleReferralCodeBlur}
                  className={`w-full pl-8 sm:pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
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
                className="whitespace-nowrap text-xs sm:text-sm w-full sm:w-auto"
              >
                {isVerifying ? '확인 중...' : '확인'}
              </Button>
            </div>
            
            {/* 검증 상태 표시 */}
            {verificationStatus === 'valid' && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="flex-1">유효한 추천인 코드입니다</span>
                {urlRef && autoVerificationDone && (
                  <span className="text-blue-600 text-xs">(자동 로그인 진행 중...)</span>
                )}
              </div>
            )}
            
            {verificationStatus === 'invalid' && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                유효하지 않은 추천인 코드입니다
              </div>
            )}
            
            {/* URL ref 자동 검증 상태 */}
            {urlRef && !autoVerificationDone && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                URL 추천인 코드 검증 중...
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              추천인 코드를 입력하고 확인 버튼을 눌러주세요.
            </p>
            
            {/* 에러 메시지 */}
            {error && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                {error}
              </div>
            )}
          </div>

          {/* URL 에러 메시지 */}
          {urlError === 'login_failed' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs sm:text-sm text-red-600">
                로그인에 실패했습니다. 다시 시도해주세요.
              </p>
            </div>
          )}

          {urlError === 'invalid_referral' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs sm:text-sm text-red-600">
                유효하지 않은 추천인 코드입니다. 다시 확인해주세요.
              </p>
            </div>
          )}

          {/* 성공 메시지 */}
          {loginSuccess === 'success' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs sm:text-sm text-green-600">
                로그인에 성공했습니다! 환영합니다.
              </p>
              <p className="text-xs text-green-500 mt-1">
                잠시 후 홈 페이지로 이동합니다...
              </p>
            </div>
          )}

          <Button 
            onClick={() => handleKakaoLogin()}
            disabled={isLoading || !canProceedToLogin}
            className={`w-full text-black disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
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
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                </svg>
                카카오로 로그인
              </>
            )}
          </Button>
          
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            <p>계정이 없으신가요?</p>
            <p>카카오 로그인으로 자동 가입됩니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Suspense 경계로 감싼 기본 내보내기
export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4 py-8 sm:py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">페이지 로딩 중...</p>
        </div>
      </div>
    }>
      <SignInPageInner />
    </Suspense>
  );
}
