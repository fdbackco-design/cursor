import { NextRequest, NextResponse } from 'next/server';

// 관리자 인증 미들웨어
async function authenticateAdmin(request: NextRequest) {
  // 실제 구현에서는 JWT 토큰이나 세션을 확인해야 합니다
  return true; // 임시로 항상 true 반환
}

// GET /api/admin/banners
export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await authenticateAdmin(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.feedbackmall.com';
    const response = await fetch(`${apiUrl}/api/v1/admin/banners`, {
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
    console.error('배너 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/banners
export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await authenticateAdmin(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const incomingFormData = await request.formData();

    // FormData를 명시적으로 재구성하여 백엔드로 전달 (필드 누락 방지)
    const formData = new FormData();
    Array.from(incomingFormData.entries()).forEach(([key, value]) => {
      if (value instanceof Blob) {
        const filename = value instanceof File ? value.name : 'image';
        formData.append(key, value, filename);
      } else {
        formData.append(key, String(value));
      }
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.feedbackmall.com';
    const response = await fetch(`${apiUrl}/api/v1/admin/banners`, {
      method: 'POST',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('배너 저장 실패:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
