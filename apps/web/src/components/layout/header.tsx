'use client';

import Link from 'next/link';
import { Button } from '@repo/ui';
import { Search, LogIn, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // 디버깅을 위한 로깅
  console.log('Header - 인증 상태:', { 
    isAuthenticated, 
    user, 
    userApprove: user?.approve,
    loading 
  });

  const handleLogout = async () => {
    try {
      // 로그아웃 API 호출
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      // 페이지 새로고침으로 상태 업데이트
      window.location.reload();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center justify-between h-[72px]">
            {/* 로고 */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-extrabold text-gray-900 tracking-[1.5px]">FEEDBACK</span>
            </Link>

            {/* 검색바 */}
            <div className="flex-1 max-w-[360px] mx-8">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const query = formData.get('search') as string;
                  if (query.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
                  }
                }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="상품명, 브랜드, 카테고리로 검색"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </form>
            </div>

                        {/* 오른쪽 버튼 영역 */}
            <div className="flex items-center space-x-4">
              {/* 관리자 페이지 버튼 (임시로 항상 표시) */}
              <Link href="/admin">
                <Button 
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                >
                  관리자 (테스트)
                </Button>
              </Link>
              
              {/* 로그인 상태에 따른 버튼 */}
              {!loading && (
                <>
                  {isAuthenticated ? (
                    <>
                      {/* 사용자 정보 표시 */}
                      <span className="text-sm text-gray-600 mr-2">
                        {user?.role === 'BIZ' ? '기업 사용자' : '일반 사용자'}
                      </span>
                      
                      {/* 마이페이지 버튼 */}
                      <Link href="/account">
                        <Button 
                          className="bg-primary text-white hover:bg-primary/90 border-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center gap-2"
                          title="마이페이지"
                        >
                          <Settings className="h-4 w-4" />
                          마이페이지
                        </Button>
                      </Link>
                      
                      {/* 배송 버튼 */}
                      <Link href="/delivery">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                          title="배송"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-14 0a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2" />
                          </svg>
                        </Button>
                      </Link>
                      
                      {/* 장바구니 버튼 */}
                      <Link href="/cart">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                          title="장바구니"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                          </svg>
                        </Button>
                      </Link>
                      
                      {/* 로그아웃 버튼 */}
                      <Button 
                        onClick={handleLogout}
                        variant="outline" 
                        size="sm"
                        className="text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-900 transition-colors duration-200"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        로그아웃
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* 로그인 버튼 */}
                      <Link href="/signin">
                        <Button 
                          className="bg-gray-900 text-white hover:bg-gray-800 border-0 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          로그인
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 카테고리 네비게이션 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center space-x-8 h-12">
            <Link 
              href="/category/home-appliances" 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
            >
              생활가전
            </Link>
            <Link 
              href="/category/kitchen" 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
            >
              주방용품
            </Link>
            <Link 
              href="/category/health" 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
            >
              건강기능식품
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;