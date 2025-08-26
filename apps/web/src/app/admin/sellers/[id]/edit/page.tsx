'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { ArrowLeft, Save, Users, Loader2, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { sellersApi } from '@/lib/api/sellers';
import { referralCodesApi } from '@/lib/api/referral-codes';
import { Seller } from '@/types/seller';
import { ReferralCode, CreateReferralCodeDto, UpdateReferralCodeDto } from '@/types/referral-code';

const EditSellerPage = () => {
  const router = useRouter();
  const params = useParams();
  const sellerId = params.id as string;
  
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    representativeName: '',
    phone: '',
    address: ''
  });

  // 추천 코드 관련 상태
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [editingReferralCode, setEditingReferralCode] = useState<string | null>(null);
  const [newReferralCode, setNewReferralCode] = useState({ code: '', isActive: true });
  const [showNewReferralCodeForm, setShowNewReferralCodeForm] = useState(false);

  // 셀러 데이터 로드
  useEffect(() => {
    const loadSeller = async () => {
      if (!sellerId) return;
      
      try {
        setLoading(true);
        const data = await sellersApi.getSellerById(sellerId);
        if (data) {
          setSeller(data);
          setFormData({
            companyName: data.companyName || '',
            representativeName: data.representativeName || '',
            phone: data.phone || '',
            address: data.address || ''
          });
          // 추천 코드 설정
          if (data.referralCodes) {
            setReferralCodes(data.referralCodes);
          }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!seller) return;
    
    try {
      setSaving(true);
      
      const sellerData = {
        companyName: formData.companyName.trim(),
        representativeName: formData.representativeName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim()
      };

      await sellersApi.updateSeller(seller.id, sellerData);
      alert('셀러가 성공적으로 수정되었습니다.');
      router.push('/admin/sellers');
    } catch (error) {
      console.error('셀러 수정 실패:', error);
      alert('셀러 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 추천 코드 관련 함수들
  const handleNewReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewReferralCode(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateReferralCode = async () => {
    if (!newReferralCode.code.trim()) {
      alert('추천 코드를 입력해주세요.');
      return;
    }

    try {
      const result = await referralCodesApi.createReferralCode(sellerId, {
        code: newReferralCode.code.trim(),
        isActive: newReferralCode.isActive
      });

      if (result.success) {
        // 새 추천 코드를 목록에 추가
        setReferralCodes(prev => [...prev, result.data]);
        setNewReferralCode({ code: '', isActive: true });
        setShowNewReferralCodeForm(false);
        alert('추천 코드가 성공적으로 생성되었습니다.');
      }
    } catch (error) {
      console.error('추천 코드 생성 실패:', error);
      alert('추천 코드 생성에 실패했습니다.');
    }
  };

  const handleUpdateReferralCode = async (referralCodeId: string, updatedData: UpdateReferralCodeDto) => {
    try {
      const result = await referralCodesApi.updateReferralCode(referralCodeId, updatedData);
      if (result.success) {
        // 목록에서 해당 추천 코드 업데이트
        setReferralCodes(prev => prev.map(code => 
          code.id === referralCodeId ? { ...code, ...updatedData } : code
        ));
        setEditingReferralCode(null);
        alert('추천 코드가 성공적으로 수정되었습니다.');
      }
    } catch (error) {
      console.error('추천 코드 수정 실패:', error);
      alert('추천 코드 수정에 실패했습니다.');
    }
  };

  const handleDeleteReferralCode = async (referralCodeId: string) => {
    if (!confirm('정말로 이 추천 코드를 삭제하시겠습니까?')) return;

    try {
      const result = await referralCodesApi.deleteReferralCode(referralCodeId);
      if (result.success) {
        // 목록에서 해당 추천 코드 제거
        setReferralCodes(prev => prev.filter(code => code.id !== referralCodeId));
        alert('추천 코드가 성공적으로 삭제되었습니다.');
      }
    } catch (error) {
      console.error('추천 코드 삭제 실패:', error);
      alert('추천 코드 삭제에 실패했습니다.');
    }
  };

  const handleToggleReferralCodeStatus = async (referralCodeId: string) => {
    try {
      const result = await referralCodesApi.toggleReferralCodeStatus(referralCodeId);
      if (result.success) {
        // 목록에서 해당 추천 코드 상태 토글
        setReferralCodes(prev => prev.map(code => 
          code.id === referralCodeId ? { ...code, isActive: !code.isActive } : code
        ));
        alert('추천 코드 상태가 성공적으로 변경되었습니다.');
      }
    } catch (error) {
      console.error('추천 코드 상태 변경 실패:', error);
      alert('추천 코드 상태 변경에 실패했습니다.');
    }
  };

  const isFormValid = () => {
    return formData.companyName.trim().length > 0 &&
           formData.representativeName.trim().length > 0 &&
           formData.phone.trim().length > 0 &&
           formData.address.trim().length > 0;
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
              <h1 className="text-2xl font-bold text-gray-900">셀러 수정</h1>
            </div>
            <Button 
              type="submit" 
              form="edit-seller-form"
              disabled={!isFormValid() || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="edit-seller-form" onSubmit={handleSubmit} className="space-y-6">
          {/* 현재 셀러 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                현재 셀러 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">회사명</p>
                  <p className="font-medium">{seller.companyName}</p>
                </div>
                <div>
                  <p className="text-gray-500">대표자명</p>
                  <p className="font-medium">{seller.representativeName}</p>
                </div>
                <div>
                  <p className="text-gray-500">전화번호</p>
                  <p className="font-medium">{seller.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">상태</p>
                  <p className="font-medium">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      seller.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {seller.isActive ? '활성' : '비활성'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">인증 상태</p>
                  <p className="font-medium">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      seller.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {seller.isVerified ? '인증됨' : '미인증'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">등록일</p>
                  <p className="font-medium">{new Date(seller.createdAt).toLocaleDateString('ko-KR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 수정할 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                수정할 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회사명 *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    placeholder="예: 테크스토어 주식회사"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    대표자명 *
                  </label>
                  <input
                    type="text"
                    name="representativeName"
                    value={formData.representativeName}
                    onChange={handleInputChange}
                    required
                    placeholder="예: 김철수"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호 *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="02-1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소 *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="서울시 강남구 테헤란로 123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* 추천 코드 관리 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  추천 코드 관리 ({referralCodes.length}개)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewReferralCodeForm(!showNewReferralCodeForm)}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  새 추천 코드
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 새 추천 코드 생성 폼 */}
              {showNewReferralCodeForm && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        추천 코드 *
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={newReferralCode.code}
                        onChange={handleNewReferralCodeChange}
                        placeholder="예: WELCOME10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={newReferralCode.isActive}
                        onChange={handleNewReferralCodeChange}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">활성 상태</label>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        onClick={handleCreateReferralCode}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        생성
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewReferralCodeForm(false)}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 기존 추천 코드 목록 */}
              <div className="space-y-3">
                {referralCodes.map((referralCode) => (
                  <div key={referralCode.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {editingReferralCode === referralCode.id ? (
                        // 수정 모드
                        <>
                          <input
                            type="text"
                            value={referralCode.code}
                            onChange={(e) => {
                              setReferralCodes(prev => prev.map(code => 
                                code.id === referralCode.id ? { ...code, code: e.target.value } : code
                              ));
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={referralCode.isActive}
                              onChange={(e) => {
                                setReferralCodes(prev => prev.map(code => 
                                  code.id === referralCode.id ? { ...code, isActive: e.target.checked } : code
                                ));
                              }}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">활성</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            사용 횟수: {referralCode.currentUses}회
                          </div>
                        </>
                      ) : (
                        // 보기 모드
                        <>
                          <span className="font-medium text-gray-900">{referralCode.code}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            referralCode.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {referralCode.isActive ? '활성' : '비활성'}
                          </span>
                          <span className="text-sm text-gray-500">
                            사용 횟수: {referralCode.currentUses}회
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {editingReferralCode === referralCode.id ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleUpdateReferralCode(referralCode.id, {
                              code: referralCode.code,
                              isActive: referralCode.isActive
                            })}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            저장
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingReferralCode(null)}
                          >
                            취소
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingReferralCode(referralCode.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleReferralCodeStatus(referralCode.id)}
                            className={referralCode.isActive ? 'text-yellow-600' : 'text-green-600'}
                          >
                            {referralCode.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReferralCode(referralCode.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                {referralCodes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    등록된 추천 코드가 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default EditSellerPage;
