'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { Clock, Check, X, User, Mail, Calendar, Hash, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  kakaoSub: string;
  referrerCodeUsed?: string;
  approve: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  phoneNumber?: string;
  shippingAddress?: any;
  talkMessageAgreed?: boolean;
}

interface ReferralCode {
  id: string;
  code: string;
  isActive: boolean;
  currentUses: number;
  seller?: {
    id: string;
    companyName: string;
    representativeName: string;
  };
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [referralFilter, setReferralFilter] = useState<string>('all');
  const [searchCode, setSearchCode] = useState<string>('');

  useEffect(() => {
    fetchUsers();
    fetchReferralCodes();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('https://api.feedbackmall.com/api/v1/auth/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralCodes = async () => {
    try {
      const response = await fetch('https://api.feedbackmall.com/api/v1/referral-codes', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setReferralCodes(data);
      }
    } catch (error) {
      console.error('추천인 코드 목록 조회 실패:', error);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch(`https://api.feedbackmall.com/api/v1/auth/users/${userId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        await fetchUsers(); // 목록 새로고침
      }
    } catch (error) {
      console.error('사용자 승인 실패:', error);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const response = await fetch(`https://api.feedbackmall.com/api/v1/auth/users/${userId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        await fetchUsers(); // 목록 새로고침
      }
    } catch (error) {
      console.error('사용자 거부 실패:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    // 검색 코드 필터 (최우선)
    if (searchCode.trim()) {
      return user.referrerCodeUsed?.toLowerCase().includes(searchCode.toLowerCase());
    }
    
    // 승인 상태 필터
    if (filter === 'pending') return !user.approve;
    if (filter === 'approved') return user.approve;
    
    // 추천인 코드 필터
    if (referralFilter === 'all') return true;
    if (referralFilter === 'none') return !user.referrerCodeUsed;
    return user.referrerCodeUsed === referralFilter;
  });

  const pendingCount = users.filter(u => !u.approve).length;
  const approvedCount = users.filter(u => u.approve).length;
  const referralUserCount = users.filter(u => u.referrerCodeUsed).length;
  const noReferralUserCount = users.filter(u => !u.referrerCodeUsed).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">

      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2">
                  <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                  관리자 메인
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">사용자 승인 관리</h1>
                <p className="text-sm sm:text-base text-gray-600">신규 가입 사용자의 승인 및 관리</p>
              </div>
            </div>
            
            {/* 추천인 코드 검색 */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="추천인 코드 검색 (예: WELCOME10)"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // 엔터 키를 누르면 검색 실행 (이미 실시간 검색이므로 추가 로직 불필요)
                      e.currentTarget.blur(); // 포커스 해제
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchCode && (
                  <button
                    onClick={() => setSearchCode('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">총 사용자</CardTitle>
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">승인 대기</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">추천인 사용</CardTitle>
              <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{referralUserCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">추천인 미사용</CardTitle>
              <X className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-gray-600">{noReferralUserCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 결과 정보 */}
        {searchCode.trim() && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">
                      "{searchCode}" 추천인 코드 검색 결과
                    </h3>
                    <p className="text-sm text-blue-700">
                      {filteredUsers.length}명의 사용자를 찾았습니다
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchCode('')}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  <X className="h-4 w-4 mr-1" />
                  검색 초기화
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 필터 */}
        {!searchCode.trim() && (
          <div className="mb-4 sm:mb-6">
            <div className="space-y-4">
              {/* 승인 상태 필터 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">승인 상태</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                  >
                    전체 ({users.length})
                  </Button>
                  <Button
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    onClick={() => setFilter('pending')}
                    className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                  >
                    승인 대기 ({pendingCount})
                  </Button>
                  <Button
                    variant={filter === 'approved' ? 'default' : 'outline'}
                    onClick={() => setFilter('approved')}
                    className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                  >
                    승인 완료 ({approvedCount})
                  </Button>
                </div>
              </div>
              
              {/* 추천인 코드 필터 */}
              {/* <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">추천인 코드</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={referralFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setReferralFilter('all')}
                    className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                  >
                    전체 ({users.length})
                  </Button>
                  <Button
                    variant={referralFilter === 'none' ? 'default' : 'outline'}
                    onClick={() => setReferralFilter('none')}
                    className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                  >
                    추천인 미사용 ({noReferralUserCount})
                  </Button>
                  {referralCodes.map((code) => {
                    const count = users.filter(u => u.referrerCodeUsed === code.code).length;
                    return (
                      <Button
                        key={code.id}
                        variant={referralFilter === code.code ? 'default' : 'outline'}
                        onClick={() => setReferralFilter(code.code)}
                        className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
                      >
                        {code.code} ({count})
                      </Button>
                    );
                  })}
                </div>
              </div> */}
            </div>
          </div>
        )}

        {/* 사용자 목록 */}
        <div className="grid gap-4 sm:gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg">{user.name}</CardTitle>
                      <CardDescription className="flex items-center space-x-2 text-xs sm:text-sm">
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">{user.email || '이메일 없음'}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.approve ? (
                      <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        승인됨
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        승인 대기
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <span className="text-xs sm:text-sm text-gray-600 truncate">ID: {user.id}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <span className="text-xs sm:text-sm text-gray-600">
                      가입일: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm text-gray-600">
                      추천인: {user.referrerCodeUsed ? (
                        <span className="font-medium text-blue-600">{user.referrerCodeUsed}</span>
                      ) : (
                        <span className="text-gray-400">없음</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  {!user.approve ? (
                    <>
                      <Button
                        onClick={() => handleApprove(user.id)}
                        className="bg-green-600 hover:bg-green-700 text-sm w-full sm:w-auto"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        승인
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleReject(user.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50 text-sm w-full sm:w-auto"
                      >
                        <X className="h-4 w-4 mr-2" />
                        거부
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleReject(user.id)}
                      className="border-yellow-300 text-yellow-600 hover:bg-yellow-50 text-sm w-full sm:w-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      승인 취소
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {searchCode.trim() ? `"${searchCode}" 추천인 코드를 사용한 사용자가 없습니다` :
               filter === 'pending' ? '승인 대기 중인 사용자가 없습니다' : 
               filter === 'approved' ? '승인된 사용자가 없습니다' : 
               referralFilter === 'none' ? '추천인을 사용하지 않은 사용자가 없습니다' :
               referralFilter !== 'all' ? `"${referralFilter}" 추천인 코드를 사용한 사용자가 없습니다` :
               '사용자가 없습니다'}
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              {searchCode.trim() ? '다른 추천인 코드를 검색해보세요' :
               filter === 'pending' ? '새로운 사용자 가입을 기다려주세요' : 
               filter === 'approved' ? '아직 승인된 사용자가 없습니다' : 
               referralFilter === 'none' ? '모든 사용자가 추천인 코드를 사용했습니다' :
               referralFilter !== 'all' ? '다른 추천인 코드를 선택해보세요' :
               '시스템에 등록된 사용자가 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
