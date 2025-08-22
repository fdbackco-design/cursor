import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // 추천인 코드 처리
  const referralCode = searchParams.get('ref');
  if (referralCode) {
    const response = NextResponse.next();
    response.cookies.set('referral_code', referralCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    // 추천인 코드 제거하고 리디렉트
    const newUrl = new URL(request.url);
    newUrl.searchParams.delete('ref');
    return NextResponse.redirect(newUrl);
  }

  // 가격 가림 가드 - 로그인하지 않은 사용자가 상품 페이지 접근 시
  if (pathname.startsWith('/products') && !request.cookies.get('session')) {
    // 메인 페이지로 리디렉트
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 관리자 페이지 가드
  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('session');
    const userRole = request.cookies.get('user_role');
    
    if (!session || userRole?.value !== 'BIZ') {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
