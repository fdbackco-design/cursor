'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, Home, User, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/delivery', label: '배송', icon: Truck },
  { href: '/', label: '홈', icon: Home },
  { href: '/account', label: '마이페이지', icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-1 sm:px-2 gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/' || pathname === '/home'
              : pathname.startsWith(href);
          const showItem =
            href !== '/delivery' || isAuthenticated;

          if (!showItem && href === '/delivery') return null;

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 py-2 min-w-0 ${
                isActive
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              } transition-colors`}
            >
              <Icon
                className={`h-5 w-5 mb-1 flex-shrink-0 ${
                  isActive ? 'text-[#FF6F0F]' : ''
                }`}
              />
              <span className="text-xs truncate max-w-full">{label}</span>
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center flex-1 py-2 min-w-0 ${
              pathname.startsWith('/admin')
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-700'
            } transition-colors`}
          >
            <Shield
              className={`h-5 w-5 mb-1 flex-shrink-0 ${
                pathname.startsWith('/admin') ? 'text-[#FF6F0F]' : ''
              }`}
            />
            <span className="text-xs truncate max-w-full">관리자</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
