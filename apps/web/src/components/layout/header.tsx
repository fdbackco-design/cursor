'use client';

import Link from 'next/link';
import { Button } from '@repo/ui';
import { ShoppingCart, User, LogIn } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] border-b border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 영역 */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#00A651] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-[32px] font-[700] text-[#000000] font-['Noto_Sans_KR',sans-serif]">
              feedbackmall
            </span>
          </Link>

          {/* 네비게이션 메뉴 */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/products" 
              className="text-[16px] font-[400] text-[#333333] hover:text-[#00A651] transition-colors duration-200 font-['Noto_Sans_KR',sans-serif] relative group"
            >
              상품
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#00A651] transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link 
              href="/categories" 
              className="text-[16px] font-[400] text-[#333333] hover:text-[#00A651] transition-colors duration-200 font-['Noto_Sans_KR',sans-serif] relative group"
            >
              카테고리
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#00A651] transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link 
              href="/about" 
              className="text-[16px] font-[400] text-[#333333] hover:text-[#00A651] transition-colors duration-200 font-['Noto_Sans_KR',sans-serif] relative group"
            >
              소개
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#00A651] transition-all duration-200 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* 오른쪽 버튼 영역 */}
          <div className="flex items-center space-x-4">
            {/* 장바구니 버튼 */}
            <Link href="/cart">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-[#333333] hover:text-[#00A651] hover:bg-[#F5F5F5] transition-colors duration-200"
              >
                <ShoppingCart className="h-6 w-6" />
              </Button>
            </Link>

            {/* 로그인 버튼 */}
            <Link href="/signin">
              <Button 
                className="bg-[#00A651] text-white hover:bg-[#008A45] border-0 px-4 py-2 rounded-[4px] font-[500] text-[14px] font-['Noto_Sans_KR',sans-serif] transition-colors duration-200"
              >
                <LogIn className="h-4 w-4 mr-2" />
                로그인
              </Button>
            </Link>

            {/* 마이페이지 버튼 */}
            <Link href="/account">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-[#333333] hover:text-[#00A651] hover:bg-[#F5F5F5] transition-colors duration-200"
              >
                <User className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;