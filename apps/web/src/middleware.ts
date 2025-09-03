import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // 추천인 코드 처리 - signin 페이지가 아닌 경우에만 리다이렉트
  const referralCode = searchParams.get('ref');
  if (referralCode && pathname !== '/signin') {
    const response = NextResponse.next();
    response.cookies.set('referral_code', referralCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    // signin 페이지가 아닌 경우에만 추천인 코드 제거하고 리디렉트
    const newUrl = new URL(request.url);
    newUrl.searchParams.delete('ref');
    return NextResponse.redirect(newUrl);
  }
  
  // signin 페이지에서 ref 파라미터가 있는 경우 쿠키에만 저장하고 리다이렉트하지 않음
  if (referralCode && pathname === '/signin') {
    const response = NextResponse.next();
    response.cookies.set('referral_code', referralCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response; // 리다이렉트하지 않고 그대로 진행
  }

  // 가격 가림 가드 - 로그인하지 않은 사용자가 상품 페이지 접근 시
  const accessToken = request.cookies.get('access_token');
  const sessionToken = request.cookies.get('session');
  
  if (pathname.startsWith('/products') && !accessToken && !sessionToken) {
    // console.log('Middleware - 상품 페이지 접근 차단:', {
    //   pathname,
    //   hasAccessToken: !!accessToken,
    //   hasSessionToken: !!sessionToken,
    //   allCookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value]))
    // });
    // 메인 페이지로 리디렉트
    return NextResponse.redirect(new URL('/', request.url));
  }


  // // 관리자 페이지 가드 (임시로 비활성화 - 테스트 목적)
  // if (pathname.startsWith('/admin')) {
  //   const session = request.cookies.get('session');
  //   const userRole = request.cookies.get('user_role');
    
  //   if (!session || userRole?.value !== 'BIZ') {
  //     return NextResponse.redirect(new URL('/signin', request.url));
  //   }
  // }

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
