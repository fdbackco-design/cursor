'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui';
import { Search, LogIn, User, LogOut, Settings, Truck, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();



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
                  //console.log('헤더 검색 실행:', query);
                  if (query.trim()) {
                    //console.log('검색어로 이동:', query.trim());
                    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                  }
                }}
                className="relative w-full"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="상품명, 브랜드, 카테고리로 검색"
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Search className="h-4 w-4" />
                </button>
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

            {/* 모바일 장바구니 버튼만 표시 */}
            <div className="md:hidden flex items-center">
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
            </div>
          </div>
        </div>

      </header>


      {/* 카테고리 네비게이션 - 고정 헤더 */}
      <nav className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-3 sm:space-x-6 h-10 sm:h-12 overflow-x-auto">
            <Link 
              href="/category/all" 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm sm:text-base whitespace-nowrap"
            >
              전체상품
            </Link>
            <Link 
              href="/category/featured" 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm sm:text-base whitespace-nowrap flex items-center"
            >
              <span className="text-yellow-500 mr-1">★</span>
              추천상품
            </Link>
            <Link 
              href="/category/top10" 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm sm:text-base whitespace-nowrap flex items-center"
            >
              <span className="text-orange-500 mr-1">🏆</span>
              Top 10
            </Link>
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
            <Link 
              href="/category/cosmetics" 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm sm:text-base whitespace-nowrap"
            >
              화장품
            </Link>
            <Link 
              href="/category/miscellaneous" 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm sm:text-base whitespace-nowrap"
            >
              잡화
            </Link>
            <Link 
              href="/category/sports" 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium text-sm sm:text-base whitespace-nowrap"
            >
              스포츠용품
            </Link>
          </div>
        </div>
      </nav>

      {/* 모바일 하단 고정 네비게이션 바 */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {/* 검색 */}
          <Link href="/search" className="flex flex-col items-center justify-center flex-1 py-2">
            <Search className="h-5 w-5 text-gray-600 mb-1" />
            <span className="text-xs text-gray-600">검색</span>
          </Link>

          {/* 마이페이지 */}
          {!loading && (
            <>
              {isAuthenticated ? (
                <Link href="/account" className="flex flex-col items-center justify-center flex-1 py-2">
                  <User className="h-5 w-5 text-gray-600 mb-1" />
                  <span className="text-xs text-gray-600">마이페이지</span>
                </Link>
              ) : (
                <Link href="/signin" className="flex flex-col items-center justify-center flex-1 py-2">
                  <LogIn className="h-5 w-5 text-gray-600 mb-1" />
                  <span className="text-xs text-gray-600">로그인</span>
                </Link>
              )}
            </>
          )}

          {/* 배송 */}
          {isAuthenticated && (
            <Link href="/delivery" className="flex flex-col items-center justify-center flex-1 py-2">
              <Truck className="h-5 w-5 text-gray-600 mb-1" />
              <span className="text-xs text-gray-600">배송</span>
            </Link>
          )}

          {/* 관리자 (ADMIN만) */}
          {isAuthenticated && user && user.role === 'ADMIN' && (
            <Link href="/admin" className="flex flex-col items-center justify-center flex-1 py-2">
              <Settings className="h-5 w-5 text-gray-600 mb-1" />
              <span className="text-xs text-gray-600">관리자</span>
            </Link>
          )}

          {/* 로그아웃 (로그인된 사용자만) */}
          {isAuthenticated && (
            <button 
              onClick={handleLogout}
              className="flex flex-col items-center justify-center flex-1 py-2"
            >
              <LogOut className="h-5 w-5 text-red-600 mb-1" />
              <span className="text-xs text-red-600">로그아웃</span>
            </button>
          )}
        </div>
      </div>

    </>
  );
};

export default Header;