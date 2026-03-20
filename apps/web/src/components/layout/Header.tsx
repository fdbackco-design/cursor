'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui';
import { Search, LogIn, User, LogOut, Truck, ShoppingCart, Menu, X, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORY_MENU = [
  { label: '생활가전', href: '/category/home-appliances' },
  { label: '주방용품', href: '/category/kitchen' },
  { label: '피부&미용', href: '/category/cosmetics' },
  { label: '잡화', href: '/category/miscellaneous' },
  { label: '마사지기', href: '/category/massager' },
  { label: '침구류', href: '/category/bedding' },
];

const Header = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      window.location.reload();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleCategoryClick = (href: string) => {
    router.push(href);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-[72px]">
            {/* 햄버거 + 로고 */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setMenuOpen(true)}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="카테고리 메뉴"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <Link href="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
                <span
                  className="text-base sm:text-lg md:text-2xl font-normal text-black italic"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.5px' }}
                >
                  feedbackmall
                </span>
              </Link>
            </div>

            {/* 데스크톱 검색바 */}
            <div className="hidden md:flex flex-1 max-w-[360px] mx-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const query = formData.get('search') as string;
                  if (query?.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
                className="relative w-full"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="상품명, 브랜드, 카테고리로 검색"
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* 오른쪽: 검색(모바일), 찜, 장바구니 + 기존 버튼들 */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* 모바일 검색 */}
              <Link href="/search" className="md:hidden flex flex-col items-center p-2 text-gray-600 hover:text-gray-900">
                <Search className="h-5 w-5 mb-0.5" />
                <span className="text-[10px]">검색</span>
              </Link>

              {/* 찜목록 - 모바일만 */}
              {isAuthenticated && (
                <Link href="/account?tab=wishlist" className="md:hidden flex flex-col items-center p-2 text-gray-600 hover:text-gray-900">
                  <Heart className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px]">찜</span>
                </Link>
              )}

              {/* 장바구니 - 모바일만 */}
              {isAuthenticated && (
                <Link href="/cart" className="md:hidden flex flex-col items-center p-2 text-gray-600 hover:text-gray-900">
                  <ShoppingCart className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px]">장바구니</span>
                </Link>
              )}

              {/* 모바일: 비로그인 시 로그인 버튼 */}
              {!loading && !isAuthenticated && (
                <Link href="/signin" className="md:hidden flex flex-col items-center p-2 text-gray-600 hover:text-gray-900">
                  <User className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px]">로그인</span>
                </Link>
              )}

              {/* 데스크톱: 관리자, 마이페이지, 배송, 로그아웃 등 */}
              <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
                {isAuthenticated && user?.role === 'ADMIN' && (
                  <Link href="/admin">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-3 lg:px-4 py-2 rounded-lg font-medium text-sm">
                      관리자
                    </Button>
                  </Link>
                )}
                {!loading && (
                  <>
                    {isAuthenticated ? (
                      <>
                        <span className="hidden lg:block text-sm text-gray-600">
                          {user?.name ? `${user.name}님` : user?.role === 'BIZ' ? '기업 사용자' : '일반 사용자'}
                        </span>
                        <Link href="/account" title="마이페이지">
                          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                            <User className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href="/delivery" title="배송">
                          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                            <Truck className="h-5 w-5" />
                          </Button>
                        </Link>
                        <Link href="/cart" title="장바구니">
                          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                            <ShoppingCart className="h-5 w-5" />
                          </Button>
                        </Link>
                        <Button onClick={handleLogout} variant="outline" size="sm" className="text-gray-600 hover:text-gray-900 border-gray-300">
                          <LogOut className="h-4 w-4 lg:mr-2" />
                          <span className="hidden lg:inline">로그아웃</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        {process.env.NODE_ENV === 'development' && (
                          <Button
                            onClick={() => (window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/dev-login-consumer`)}
                            variant="outline"
                            className="mr-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100 text-xs px-2 py-1"
                          >
                            Dev
                          </Button>
                        )}
                        <Link href="/signin">
                          <Button className="bg-gray-900 text-white hover:bg-gray-800 border-0 px-3 lg:px-4 py-2 rounded-lg font-medium text-sm">
                            <LogIn className="h-4 w-4 lg:mr-2" />
                            <span className="hidden lg:inline">로그인</span>
                          </Button>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 햄버거 카테고리 메뉴 오버레이 - 모바일/데스크톱 공통 */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 left-0 w-[280px] max-w-[85vw] h-full bg-white shadow-xl z-[70]">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-semibold text-gray-900">카테고리</span>
              <button onClick={() => setMenuOpen(false)} className="p-2 text-gray-600 hover:text-gray-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-4">
              {CATEGORY_MENU.map(({ label, href }) => (
                <button
                  key={href}
                  onClick={() => handleCategoryClick(href)}
                  className="block w-full text-left py-3 px-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg font-medium transition-colors"
                >
                  {label}
                </button>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link href="/category/top10" onClick={() => setMenuOpen(false)} className="block py-3 px-3 text-orange-600 hover:bg-orange-50 rounded-lg font-medium">
                  3월달 한정수량
                </Link>
                <Link href="/category/all" onClick={() => setMenuOpen(false)} className="block py-3 px-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium">
                  전체상품
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
