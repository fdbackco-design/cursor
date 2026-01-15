import { NextRequest, NextResponse } from 'next/server';

// 관리자 인증 미들웨어
async function authenticateAdmin(request: NextRequest) {
  return true; // 임시로 항상 true 반환
}

// DELETE /api/admin/banners/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthenticated = await authenticateAdmin(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.feedbackmall.com';
    const response = await fetch(`${apiUrl}/api/v1/admin/banners/${params.id}`, {
      method: 'DELETE',
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
    console.error('배너 삭제 실패:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
