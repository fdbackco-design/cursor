import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@repo/db';

const prisma = new PrismaClient();

// 관리자 인증 미들웨어 (간단한 예시)
async function authenticateAdmin(request: NextRequest) {
  // 실제 구현에서는 JWT 토큰이나 세션을 확인해야 합니다
  // 여기서는 간단히 쿠키나 헤더를 확인하는 예시입니다
  const authHeader = request.headers.get('authorization');
  const cookie = request.cookies.get('admin-session');
  
  // 실제 구현에서는 적절한 인증 로직을 추가하세요
  return true; // 임시로 항상 true 반환
}

// GET /api/admin/home-order
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

    // DB에서 products.length 값이 있는 상품들을 순서대로 가져오기
    const productsWithOrder = await prisma.product.findMany({
      where: {
        length: {
          not: null
        }
      },
      orderBy: [
        { length: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        category: true,
        vendor: true,
        images: true
      }
    });

    // 카테고리별 상품 분류
    const categoryProducts: { [key: string]: any[] } = {};
    const mdPicks: any[] = [];

    productsWithOrder.forEach(product => {
      if (product.category?.name) {
        if (!categoryProducts[product.category.name]) {
          categoryProducts[product.category.name] = [];
        }
        if (categoryProducts[product.category.name].length < 3) {
          categoryProducts[product.category.name].push(product);
        }
      }
      
      // MD's Pick은 length 값이 1-10 범위인 상품들로 가정
      if (product.length && product.length >= 1 && product.length <= 10) {
        mdPicks.push(product);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        categoryProducts,
        mdPicks: mdPicks.sort((a, b) => (a.length || 0) - (b.length || 0))
      }
    });

  } catch (error) {
    console.error('홈페이지 순서 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/home-order
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
    const { categoryProducts, mdPicks } = body;

    // 트랜잭션으로 모든 업데이트 처리
    await prisma.$transaction(async (tx) => {
      // 1. 모든 상품의 length 값을 null로 초기화
      await tx.product.updateMany({
        data: { length: null }
      });

      // 2. 카테고리별 상품들의 length 값 설정 (1.00, 2.00, 3.00...)
      let orderCounter = 1;
      if (categoryProducts) {
        for (const [category, products] of Object.entries(categoryProducts)) {
          if (Array.isArray(products)) {
            for (const product of products) {
              await tx.product.update({
                where: { id: product.id },
                data: { length: orderCounter }
              });
              orderCounter += 1;
            }
          }
        }
      }

      // 3. MD's Pick 상품들의 length 값 설정 (순서대로)
      if (Array.isArray(mdPicks)) {
        for (const productId of mdPicks) {
          await tx.product.update({
            where: { id: productId },
            data: { length: orderCounter }
          });
          orderCounter += 1;
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: '홈페이지 상품 순서가 성공적으로 저장되었습니다.'
    });

  } catch (error) {
    console.error('홈페이지 순서 저장 실패:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
