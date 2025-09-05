'use client';

import { useState, useEffect } from 'react';

export default function DebugJwtPage() {
  const [jwtToken, setJwtToken] = useState<string>('');
  const [decodedPayload, setDecodedPayload] = useState<any>(null);
  const [cookies, setCookies] = useState<string>('');

  useEffect(() => {
    // 쿠키에서 JWT 토큰 추출
    const cookies = document.cookie;
    setCookies(cookies);
    
    const accessToken = cookies
      .split(';')
      .find(cookie => cookie.trim().startsWith('access_token='))
      ?.split('=')[1];
    
    if (accessToken) {
      setJwtToken(accessToken);
      decodeJwt(accessToken);
    }
  }, []);

  const decodeJwt = (token: string) => {
    try {
      // JWT 토큰의 payload 부분 추출 (두 번째 점 이후)
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        throw new Error('Invalid JWT token format');
      }
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      setDecodedPayload(payload);
    } catch (error) {
      console.error('JWT 디코딩 실패:', error);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch('https://api.feedbackmall.com/api/v1/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        //console.log('새로운 사용자 데이터:', userData);
        
        // 쿠키 새로고침
        const newCookies = document.cookie;
        setCookies(newCookies);
        
        const newAccessToken = newCookies
          .split(';')
          .find(cookie => cookie.trim().startsWith('access_token='))
          ?.split('=')[1];
        
        if (newAccessToken) {
          setJwtToken(newAccessToken);
          decodeJwt(newAccessToken);
        }
      }
    } catch (error) {
      console.error('토큰 새로고침 실패:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">JWT 토큰 디버깅</h1>
        
        <div className="grid gap-6">
          {/* JWT 토큰 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">JWT 토큰</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-sm font-mono break-all">{jwtToken || '토큰이 없습니다'}</p>
            </div>
          </div>

          {/* 디코딩된 페이로드 */}
          {decodedPayload && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">디코딩된 페이로드</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(decodedPayload, null, 2)}
              </pre>
              
              {/* approve 필드 강조 */}
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-semibold text-yellow-800 mb-2">승인 상태 분석</h3>
                <p><strong>approve 필드:</strong> {decodedPayload.approve ? '✅ true' : '❌ false'}</p>
                <p><strong>토큰 발급 시간:</strong> {new Date(decodedPayload.iat * 1000).toLocaleString()}</p>
                <p><strong>토큰 만료 시간:</strong> {new Date(decodedPayload.exp * 1000).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* 쿠키 정보 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">쿠키 정보</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-sm font-mono break-all">{cookies || '쿠키가 없습니다'}</p>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">액션</h2>
            <div className="space-x-4">
              <button
                onClick={refreshToken}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                토큰 새로고침
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
