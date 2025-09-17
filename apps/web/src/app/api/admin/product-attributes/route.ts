import { NextRequest, NextResponse } from 'next/server';

// 관리자 인증 미들웨어 (간단한 예시)
async function authenticateAdmin(request: NextRequest) {
  // 실제 구현에서는 JWT 토큰이나 세션을 확인해야 합니다
  // 여기서는 간단히 쿠키나 헤더를 확인하는 예시입니다
  const authHeader = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');
  
  // 실제 구현에서는 적절한 인증 로직을 추가하세요
  return true; // 임시로 항상 true 반환
}

// GET /api/admin/product-attributes
export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const isAuthenticated = await authenticateAdmin(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 백엔드 API로 요청 전달
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.feedbackmall.com';
    const response = await fetch(`${apiUrl}/api/v1/admin/product-attributes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('상품 공통속성 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/product-attributes
export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const isAuthenticated = await authenticateAdmin(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 백엔드 API로 요청 전달
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.feedbackmall.com';
    const response = await fetch(`${apiUrl}/api/v1/admin/product-attributes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('상품 공통속성 저장 실패:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
