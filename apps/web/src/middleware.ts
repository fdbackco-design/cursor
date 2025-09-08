// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// export function middleware(request: NextRequest) {
//   const { pathname, searchParams } = request.nextUrl;
  
//   // 추천인 코드 처리 - signin 페이지가 아닌 경우에만 리다이렉트
//   const referralCode = searchParams.get('ref');
//   if (referralCode && pathname !== '/signin') {
//     const response = NextResponse.next();
//     response.cookies.set('referral_code', referralCode, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax',
//       maxAge: 60 * 60 * 24 * 7, // 7 days
//     });
    
//     // signin 페이지가 아닌 경우에만 추천인 코드 제거하고 리디렉트
//     const newUrl = new URL(request.url);
//     newUrl.searchParams.delete('ref');
//     return NextResponse.redirect(newUrl);
//   }
  
//   // signin 페이지에서 ref 파라미터가 있는 경우 쿠키에만 저장하고 리다이렉트하지 않음
//   if (referralCode && pathname === '/signin') {
//     const response = NextResponse.next();
//     response.cookies.set('referral_code', referralCode, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'lax',
//       maxAge: 60 * 60 * 24 * 7, // 7 days
//     });
//     return response; // 리다이렉트하지 않고 그대로 진행
//   }

//   // 가격 가림 가드 - 로그인하지 않은 사용자가 상품 페이지 접근 시
//   const accessToken = request.cookies.get('access_token');
//   const sessionToken = request.cookies.get('session');
  
//   if (pathname.startsWith('/products') && !accessToken && !sessionToken) {
//     // console.log('Middleware - 상품 페이지 접근 차단:', {
//     //   pathname,
//     //   hasAccessToken: !!accessToken,
//     //   hasSessionToken: !!sessionToken,
//     //   allCookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value]))
//     // });
//     // 메인 페이지로 리디렉트
//     return NextResponse.redirect(new URL('/', request.url));
//   }


//   // // 관리자 페이지 가드 (임시로 비활성화 - 테스트 목적)
//   // if (pathname.startsWith('/admin')) {
//   //   const session = request.cookies.get('session');
//   //   const userRole = request.cookies.get('user_role');
    
//   //   if (!session || userRole?.value !== 'BIZ') {
//   //     return NextResponse.redirect(new URL('/signin', request.url));
//   //   }
//   // }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     '/((?!api|_next/static|_next/image|favicon.ico).*)',
//   ],
// };
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, searchParams, origin } = req.nextUrl;

  // 0) Next 내부/정적은 전부 통과
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/manifest') ||
    pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)$/i)
  ) {
    return NextResponse.next();
  }

  // 1) ref 저장 로직 (그대로 사용)
  const ref = searchParams.get('ref');
  if (ref && pathname !== '/signin') {
    const url = new URL(pathname, origin);
    const res = NextResponse.redirect(url);
    res.cookies.set('referral_code', ref, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      domain: '.feedbackmall.com',
    });
    return res;
  }
  if (ref && pathname === '/signin') {
    const res = NextResponse.next();
    res.cookies.set('referral_code', ref, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      domain: '.feedbackmall.com',
    });
    return res;
  }

  // 2) 로그인 여부: access_token만 본다
  const loggedIn = req.cookies.has('access_token');

  // 3) 공개 페이지들 (로그인 불필요)
  const publicPages = ['/signin', '/privacy', '/contact', '/delivery', '/return'];
  const isPublicPage = publicPages.some(page => pathname.startsWith(page));
  
  if (isPublicPage) {
    // /signin은 로그인 상태면 홈으로
    if (pathname.startsWith('/signin') && loggedIn) {
      return NextResponse.redirect(new URL('/home', origin));
    }
    return NextResponse.next();
  }

  // 4) 나머지 전부 로그인 필요
  if (!loggedIn) {
    const url = new URL('/signin', origin);
    url.searchParams.set('redirect', pathname + (req.nextUrl.search || ''));
    return NextResponse.redirect(url);
  }

  // (선택) 디버그 헤더: 미들웨어가 로그인으로 판정했는지 확인용
  const res = NextResponse.next();
  res.headers.set('x-auth-mw', 'ok');
  return res;
}

// ✅ matcher에서 _next 전체를 제외하도록 단순화
export const config = {
  matcher: ['/((?!_next/|api/|favicon.ico|robots.txt|sitemap|manifest).*)'],
};