'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { ArrowLeft, Save, Users, User, Plus, X, Tag } from 'lucide-react';
import { sellersApi } from '@/lib/api/sellers';
import { usersApi, User as UserType } from '@/lib/api/users';



const NewSellerPage = () => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [formData, setFormData] = useState({
    userId: '',
    companyName: '',
    representativeName: '',
    phone: '',
    address: ''
  });

  // 추천 코드 관련 state
  const [referralCodes, setReferralCodes] = useState<string[]>([]);
  const [newReferralCode, setNewReferralCode] = useState('');

  // 사용자 목록 로드 (셀러로 등록 가능한 사용자)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        // 아직 셀러로 등록되지 않은 사용자들만 가져오기
        const availableUsers = await usersApi.getAvailableUsersForSeller();
        setUsers(availableUsers);
      } catch (error) {
        console.error('사용자 목록 로드 실패:', error);
        alert('사용자 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 추천 코드 관련 핸들러
  const handleAddReferralCode = () => {
    if (newReferralCode.trim() && !referralCodes.includes(newReferralCode.trim())) {
      setReferralCodes(prev => [...prev, newReferralCode.trim()]);
      setNewReferralCode('');
    }
  };

  const handleRemoveReferralCode = (index: number) => {
    setReferralCodes(prev => prev.filter((_, i) => i !== index));
  };

  const handleNewReferralCodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddReferralCode();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const sellerData = {
        userId: formData.userId,
        companyName: formData.companyName.trim(),
        representativeName: formData.representativeName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        referralCodes: referralCodes.length > 0 ? referralCodes : undefined
      };

      await sellersApi.createSeller(sellerData);
      alert('셀러가 성공적으로 생성되었습니다.');
      router.push('/admin/sellers');
    } catch (error) {
      console.error('셀러 생성 실패:', error);
      alert('셀러 생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = () => {
    return formData.userId && 
           formData.companyName.trim().length > 0 &&
           formData.representativeName.trim().length > 0 &&
           formData.phone.trim().length > 0 &&
           formData.address.trim().length > 0;
  };

  if (loadingUsers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">사용자 목록을 불러오는 중...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">새 셀러 등록</h1>
            </div>
            <Button 
              type="submit" 
              form="new-seller-form"
              disabled={!isFormValid() || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="new-seller-form" onSubmit={handleSubmit} className="space-y-6">
          {/* 사용자 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                사용자 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  셀러로 등록할 사용자 *
                </label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">사용자를 선택하세요</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email || '이메일 없음'}) - {user.role}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">셀러로 등록할 사용자를 선택하세요.</p>
              </div>
            </CardContent>
          </Card>

          {/* 회사 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                회사 정보
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
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                추천 코드 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 사용자 지정 추천 코드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  추천 코드
                </label>
                
                {/* 추천 코드 입력 */}
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={newReferralCode}
                    onChange={(e) => setNewReferralCode(e.target.value)}
                    onKeyPress={handleNewReferralCodeKeyPress}
                    placeholder="예: TECHSTORE2024"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Button
                    type="button"
                    onClick={handleAddReferralCode}
                    disabled={!newReferralCode.trim() || referralCodes.includes(newReferralCode.trim())}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    추가
                  </Button>
                </div>

                {/* 추가된 추천 코드 목록 */}
                {referralCodes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">추가된 추천 코드:</p>
                    <div className="flex flex-wrap gap-2">
                      {referralCodes.map((code, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                        >
                          <span>{code}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveReferralCode(index)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  추천 코드는 영문, 숫자, 언더스코어(_)만 사용 가능하며, 중복될 수 없습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default NewSellerPage;
