import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getHomeOrder() {
    try {
      // DB에서 products.length 값이 있는 상품들을 순서대로 가져오기
      const productsWithOrder = await this.prisma.product.findMany({
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
          vendor: true
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
        if (product.length && product.length.toNumber() >= 1 && product.length.toNumber() <= 10) {
          mdPicks.push(product);
        }
      });

      return {
        success: true,
        data: {
          categoryProducts,
          mdPicks: mdPicks.sort((a, b) => (a.length?.toNumber() || 0) - (b.length?.toNumber() || 0))
        }
      };
    } catch (error) {
      console.error('홈페이지 순서 조회 실패:', error);
      return {
        success: false,
        error: 'Internal Server Error'
      };
    }
  }

  async updateHomeOrder(categoryProducts: any, mdPicks: string[]) {
    try {
      // 트랜잭션으로 모든 업데이트 처리
      await this.prisma.$transaction(async (tx) => {
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
                  data: { length: new Decimal(orderCounter) }
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
              data: { length: new Decimal(orderCounter) }
            });
            orderCounter += 1;
          }
        }
      });

      return {
        success: true,
        message: '홈페이지 상품 순서가 성공적으로 저장되었습니다.'
      };
    } catch (error) {
      console.error('홈페이지 순서 저장 실패:', error);
      return {
        success: false,
        error: 'Internal Server Error'
      };
    }
  }
}