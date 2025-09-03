'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  kakaoSub: string;
  referrerCodeUsed: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  phoneNumber?: string;
  shippingAddress?: any;
  talkMessageAgreed?: boolean;
}

export default function TestUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/users`);
      
      if (!response.ok) {
        throw new Error('사용자 목록을 가져오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('사용자 목록 조회 에러:', error);
      setError('사용자 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">사용자 목록 테스트</h1>
          <p className="text-gray-600">카카오 로그인으로 가입한 사용자들의 정보를 확인할 수 있습니다.</p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            총 {users.length}명의 사용자가 있습니다.
          </div>
          <button 
            onClick={fetchUsers}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            새로고침
          </button>
        </div>

        <div className="grid gap-6">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{user.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'CONSUMER' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'CONSUMER' ? '일반 사용자' : '기업 사용자'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">기본 정보</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">이메일:</span>
                        <span className="ml-2 text-gray-900">{user.email || '없음'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">카카오 ID:</span>
                        <span className="ml-2 text-gray-900">{user.kakaoSub}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">추천인 코드:</span>
                        <span className="ml-2 text-gray-900">
                          {user.referrerCodeUsed ? (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                              {user.referrerCodeUsed}
                            </span>
                          ) : (
                            '사용하지 않음'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">시스템 정보</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">사용자 ID:</span>
                        <span className="ml-2 text-gray-900 font-mono text-xs">{user.id}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">가입일:</span>
                        <span className="ml-2 text-gray-900">{formatDate(user.createdAt)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">수정일:</span>
                        <span className="ml-2 text-gray-900">{formatDate(user.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">아직 등록된 사용자가 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">
                카카오 로그인을 통해 첫 번째 사용자를 만들어보세요!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
