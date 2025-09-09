'use client';

import Link from 'next/link';
import { Button } from '@repo/ui';
import { Search, LogIn, User, LogOut, Settings, Menu, X, Truck, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const Header = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);



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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">
            {/* 로고 */}
            <Link href="/" className="flex items-center">
              <span className="text-lg sm:text-2xl font-normal text-black italic" style={{ 
                fontFamily: 'Georgia, "Times New Roman", serif',
                letterSpacing: '-0.5px'
              }}>
                feedbackmall
              </span>
            </Link>

            {/* 데스크톱 검색바 */}
            <div className="hidden md:flex flex-1 max-w-[360px] mx-8">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const query = formData.get('search') as string;
                  if (query.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
                  }
                }}
                className="relative w-full"
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

                        {/* 데스크톱 오른쪽 버튼 영역 */}
            <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
              {/* 관리자 페이지 버튼 (ADMIN 역할 사용자만 표시) */}
              {isAuthenticated && user && user.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button 
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 px-3 lg:px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                  >
                    관리자
                  </Button>
                </Link>
              )}
              
              {/* 로그인 상태에 따른 버튼 */}
              {!loading && (
                <>
                  {isAuthenticated ? (
                    <>
                      {/* 사용자 정보 표시 */}
                      <span className="hidden lg:block text-sm text-gray-600">
                        {user?.name ? `${user.name}님` : (user?.role === 'BIZ' ? '기업 사용자' : '일반 사용자')}
                      </span>
                      
                      {/* 마이페이지 버튼 */}
                      <Link href="/account">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                          title="마이페이지"
                        >
                          <User className="h-4 w-4" />
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
                          <Truck className="h-5 w-5" />
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
                          <ShoppingCart className="h-5 w-5" />
                        </Button>
                      </Link>
                      
                      {/* 로그아웃 버튼 */}
                      <Button 
                        onClick={handleLogout}
                        variant="outline" 
                        size="sm"
                        className="text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-900 transition-colors duration-200"
                      >
                        <LogOut className="h-4 w-4 lg:mr-2" />
                        <span className="hidden lg:inline">로그아웃</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* 개발용 로그인 버튼 (개발 환경에서만) */}
                      {process.env.NODE_ENV === 'development' && (
                        <Button 
                          onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/dev-login-consumer`}
                          variant="outline"
                          className="mr-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100 text-xs px-2 py-1"
                        >
                          Dev
                        </Button>
                      )}
                      
                      {/* 로그인 버튼 */}
                      <Link href="/signin">
                        <Button 
                          className="bg-gray-900 text-white hover:bg-gray-800 border-0 px-3 lg:px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                        >
                          <LogIn className="h-4 w-4 lg:mr-2" />
                          <span className="hidden lg:inline">로그인</span>
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>

            {/* 모바일 메뉴 버튼 */}
            <div className="md:hidden flex items-center space-x-2">
              {/* 모바일 검색 버튼 */}
              <Link href="/search">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </Link>
              
              {/* 모바일 장바구니 버튼 */}
              {isAuthenticated && (
                <Link href="/cart">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              
              {/* 모바일 메뉴 토글 */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200">
            <div className="px-4 py-4 space-y-4">
              {/* 모바일 검색바 */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const query = formData.get('search') as string;
                  if (query.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
                  }
                  setIsMobileMenuOpen(false);
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

              {/* 로그인 상태에 따른 메뉴 */}
              {!loading && (
                <>
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 pb-2 border-b border-gray-100">
                        {user?.name ? `${user.name}님` : (user?.role === 'BIZ' ? '기업 사용자' : '일반 사용자')}
                      </div>
                      <Link href="/account" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full justify-start bg-primary text-white hover:bg-primary/90">
                          <User className="h-4 w-4 mr-3" />
                          마이페이지
                        </Button>
                      </Link>
                      <Link href="/delivery" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start">
                          <Truck className="h-4 w-4 mr-3" />
                          배송
                        </Button>
                      </Link>
                      {isAuthenticated && user && user.role === 'ADMIN' && (
                        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full justify-start">
                            <Settings className="h-4 w-4 mr-3" />
                            관리자
                          </Button>
                        </Link>
                      )}
                      <Button 
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        variant="outline" 
                        className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        로그아웃
                      </Button>
                    </div>
                  ) : (
                    <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-gray-900 text-white hover:bg-gray-800">
                        <LogIn className="h-4 w-4 mr-3" />
                        로그인
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </header>


      {/* 카테고리 네비게이션 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-4 sm:space-x-8 h-10 sm:h-12 overflow-x-auto">
            <Link 
              href="/category/home-appliances" 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm sm:text-base whitespace-nowrap"
            >
              생활가전
            </Link>
            <Link 
              href="/category/kitchen" 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm sm:text-base whitespace-nowrap"
            >
              주방용품
            </Link>
            <Link 
              href="/category/electronics" 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm sm:text-base whitespace-nowrap"
            >
              전자제품
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;