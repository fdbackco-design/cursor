'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function DebugAuthPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    setCookies(document.cookie);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">인증 상태 디버깅</h1>
        
        <div className="grid gap-6">
          {/* AuthContext 상태 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">AuthContext 상태</h2>
            <div className="space-y-2">
              <div><strong>loading:</strong> {loading ? 'true' : 'false'}</div>
              <div><strong>isAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}</div>
              <div><strong>user:</strong> {user ? '존재함' : 'null'}</div>
              {user && (
                <div className="ml-4 space-y-1">
                  <div><strong>id:</strong> {user.id}</div>
                  <div><strong>email:</strong> {user.email}</div>
                  <div><strong>name:</strong> {user.name}</div>
                  <div><strong>role:</strong> {user.role}</div>
                  <div><strong>approve:</strong> {user.approve ? 'true' : 'false'}</div>
                  <div><strong>kakaoSub:</strong> {user.kakaoSub}</div>
                </div>
              )}
            </div>
          </div>

          {/* 쿠키 정보 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">쿠키 정보</h2>
            <div className="bg-gray-100 p-4 rounded font-mono text-sm break-all">
              {cookies || '쿠키가 없습니다'}
            </div>
          </div>

          {/* 사용자 객체 상세 */}
          {user && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">사용자 객체 상세</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">액션</h2>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                페이지 새로고침
              </button>
              <button 
                onClick={() => window.location.href = '/approval-pending'} 
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                승인 대기 페이지로 이동
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
