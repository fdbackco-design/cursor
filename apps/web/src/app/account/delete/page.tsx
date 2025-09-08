'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { AlertTriangle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { usersApi } from '@/lib/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { useToast, toast } from '@/components/ui/toast';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { refetch } = useAuth();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleDeleteAccount = async () => {
    if (!agreedToTerms) {
      showToast(toast.error('회원탈퇴', '탈퇴 약관에 동의해주세요.'));
      return;
    }

    if (confirmText !== '탈퇴하겠습니다') {
      showToast(toast.error('회원탈퇴', '정확한 확인 문구를 입력해주세요.'));
      return;
    }

    setIsDeleting(true);
    try {
      const result = await usersApi.deleteAccount();
      
      if (result.success) {
        showToast(toast.success('회원탈퇴', '회원탈퇴가 완료되었습니다.'));
        
        // 완전한 로그아웃 처리
        // HttpOnly 쿠키들(access_token, refresh_token)은 서버에서 처리됨
        
        // 1. 클라이언트에서 접근 가능한 쿠키들 삭제
        const clientCookies = ['user_role', 'referral_code', 'auth_token', 'token', 'session', 'sessionid', 'user', 'login', 'auth'];
        clientCookies.forEach(cookieName => {
          const domains = ['', '.feedbackmall.com', '.api.feedbackmall.com', 'feedbackmall.com'];
          const paths = ['/', '/api', '/api/v1'];
          
          domains.forEach(domain => {
            paths.forEach(path => {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure;`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure; samesite=strict;`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; secure; samesite=lax;`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; samesite=strict;`;
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; samesite=lax;`;
            });
          });
        });
        
        // 2. 로컬 스토리지 완전 정리
        localStorage.clear();
        
        // 3. 세션 스토리지 완전 정리
        sessionStorage.clear();
        
        // 4. IndexedDB 정리 (있다면)
        if ('indexedDB' in window) {
          try {
            indexedDB.databases().then(databases => {
              databases.forEach(db => {
                if (db.name) {
                  indexedDB.deleteDatabase(db.name);
                }
              });
            });
          } catch (e) {
            console.log('IndexedDB cleanup failed:', e);
          }
        }
        
        // 5. 캐시 정리
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
        
        // 6. 사용자 상태 강제 초기화
        await refetch();
        
        // 7. 즉시 강제 리다이렉트 (새로고침 포함)
        window.location.replace('/');
      } else {
        showToast(toast.error('회원탈퇴', result.message));
      }
    } catch (error) {
      console.error('회원탈퇴 실패:', error);
      showToast(toast.error('회원탈퇴', error instanceof Error ? error.message : '회원탈퇴 처리 중 오류가 발생했습니다.'));
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </Button>
        </div>

        <Card className="border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-6 w-6" />
              회원탈퇴
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* 경고 메시지 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-2">회원탈퇴 시 주의사항</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>회원탈퇴는 <strong>되돌릴 수 없습니다</strong></li>
                    <li>진행 중인 주문이 있는 경우 탈퇴할 수 없습니다</li>
                    <li>개인정보는 즉시 익명화되며 복구할 수 없습니다</li>
                    <li>주문/결제 정보는 법적 보관 의무에 따라 보관됩니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 탈퇴 처리 방식 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">탈퇴 처리 방식</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>즉시 익명화:</strong> 이름, 이메일, 전화번호, 배송지 등 개인정보</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>완전 삭제:</strong> 장바구니, 위시리스트, 카카오 연동 정보</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span><strong>법적 보관:</strong> 주문/결제/배송 정보 (5년간 보관)</span>
                </div>
              </div>
            </div>

            {/* 탈퇴 약관 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">탈퇴 약관</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  회원탈퇴 시 개인정보는 「개인정보 보호법」에 따라 즉시 익명화 처리되며, 
                  주문/결제 정보는 「전자상거래법」에 따라 5년간 보관됩니다.
                </p>
                <p>
                  탈퇴 후에는 동일한 카카오 계정으로 재가입이 가능하지만, 
                  기존 데이터는 복구되지 않습니다.
                </p>
              </div>
              
              <div className="mt-4">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    위 내용을 확인했으며, 회원탈퇴에 동의합니다.
                  </span>
                </label>
              </div>
            </div>

            {/* 확인 입력 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                아래 문구를 정확히 입력해주세요:
              </label>
              <div className="bg-gray-100 p-3 rounded-lg text-center">
                <span className="font-mono text-lg text-gray-800">탈퇴하겠습니다</span>
              </div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="위 문구를 정확히 입력해주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* 탈퇴 버튼 */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
                disabled={isDeleting}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowConfirmModal(true)}
                disabled={!agreedToTerms || confirmText !== '탈퇴하겠습니다' || isDeleting}
                className="flex-1"
              >
                {isDeleting ? '처리 중...' : '회원탈퇴'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최종 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">최종 확인</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              정말로 회원탈퇴를 진행하시겠습니까?<br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1"
                disabled={isDeleting}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? '처리 중...' : '탈퇴 진행'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
