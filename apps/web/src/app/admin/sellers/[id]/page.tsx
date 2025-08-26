'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { ArrowLeft, Edit, Users, Shield, ShieldOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { sellersApi } from '@/lib/api/sellers';
import { Seller } from '@/types/seller';
import Link from 'next/link';

const SellerDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const sellerId = params.id as string;
  
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 셀러 데이터 로드
  useEffect(() => {
    const loadSeller = async () => {
      if (!sellerId) return;
      
      try {
        setLoading(true);
        const data = await sellersApi.getSellerById(sellerId);
        if (data) {
          setSeller(data);
        } else {
          alert('셀러를 찾을 수 없습니다.');
          router.push('/admin/sellers');
        }
      } catch (error) {
        console.error('셀러 로드 실패:', error);
        alert('셀러 정보를 불러오는데 실패했습니다.');
        router.push('/admin/sellers');
      } finally {
        setLoading(false);
      }
    };

    loadSeller();
  }, [sellerId, router]);

  // 셀러 상태 토글
  const handleStatusToggle = async () => {
    if (!seller) return;
    
    try {
      setUpdating(true);
      await sellersApi.toggleSellerStatus(seller.id);
      alert('셀러 상태가 성공적으로 변경되었습니다.');
      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error('셀러 상태 변경 실패:', error);
      alert('셀러 상태 변경에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  // 셀러 인증 상태 토글
  const handleVerificationToggle = async () => {
    if (!seller) return;
    
    try {
      setUpdating(true);
      await sellersApi.toggleSellerVerification(seller.id);
      alert('셀러 인증 상태가 성공적으로 변경되었습니다.');
      // 페이지 새로고침
      window.location.reload();
    } catch (error) {
      console.error('셀러 인증 상태 변경 실패:', error);
      alert('셀러 인증 상태 변경에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">셀러 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">셀러를 찾을 수 없습니다.</p>
          <Button onClick={() => router.push('/admin/sellers')} className="mt-4">
            셀러 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/admin/sellers')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로가기
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">셀러 상세 정보</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                onClick={handleStatusToggle}
                disabled={updating}
                className="flex items-center"
              >
                {seller.isActive ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                {seller.isActive ? '비활성화' : '활성화'}
              </Button>
              <Button 
                variant="outline"
                onClick={handleVerificationToggle}
                disabled={updating}
                className="flex items-center"
              >
                {seller.isVerified ? <ShieldOff className="h-4 w-4 mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                {seller.isVerified ? '인증 해제' : '인증 승인'}
              </Button>
              <Link href={`/admin/sellers/${seller.id}/edit`}>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Edit className="h-4 w-4 mr-2" />
                  수정
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">회사명</p>
                  <p className="text-lg font-semibold text-gray-900">{seller.companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">대표자명</p>
                  <p className="text-lg font-semibold text-gray-900">{seller.representativeName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">전화번호</p>
                  <p className="text-lg font-semibold text-gray-900">{seller.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">주소</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {seller.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 상태 및 메타 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                상태 및 메타 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">활성 상태</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      seller.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {seller.isActive ? '활성' : '비활성'}
                    </span>
                    {seller.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">인증 상태</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      seller.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {seller.isVerified ? '인증됨' : '미인증'}
                    </span>
                    {seller.isVerified ? (
                      <Shield className="h-5 w-5 text-green-600" />
                    ) : (
                      <ShieldOff className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">등록일</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(seller.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">수정일</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(seller.updatedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 연결된 사용자 정보 */}
          {seller.user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  연결된 사용자
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">사용자명</p>
                    <p className="text-lg font-semibold text-gray-900">{seller.user.name}</p>
                  </div>
                  {seller.user.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">이메일</p>
                      <p className="text-lg font-semibold text-gray-900">{seller.user.email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">역할</p>
                    <p className="text-lg font-semibold text-gray-900">{seller.user.role}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">승인 상태</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        seller.user.approve ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {seller.user.approve ? '승인됨' : '승인 대기'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 추천 코드 정보 */}
          {seller.referralCodes && seller.referralCodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  추천 코드 ({seller.referralCodeCount || 0}개)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {seller.referralCodes.map((code) => (
                    <div key={code.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{code.code}</p>
                        <p className="text-sm text-gray-500">사용 횟수: {code.currentUses}회</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        code.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {code.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                  ))}
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-500">
                      총 사용 횟수: {seller.totalReferralUses || 0}회
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDetailPage;
