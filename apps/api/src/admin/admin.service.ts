import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getHomeOrder() {
    try {
      // 카테고리별 상품을 위해 length 값이 있는 상품들을 가져오기
      const categoryProductsWithOrder = await this.prisma.product.findMany({
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

      // MD's Pick을 위해 width 값이 있는 상품들을 가져오기
      const mdPicksWithOrder = await this.prisma.product.findMany({
        where: {
          width: {
            not: null
          }
        },
        orderBy: [
          { width: 'asc' },
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

      // 카테고리별 상품 처리
      categoryProductsWithOrder.forEach(product => {
        if (product.category?.name) {
          if (!categoryProducts[product.category.name]) {
            categoryProducts[product.category.name] = [];
          }
          if (categoryProducts[product.category.name].length < 3) {
            categoryProducts[product.category.name].push(product);
          }
        }
      });

      // MD's Pick 상품 처리
      mdPicksWithOrder.forEach(product => {
        mdPicks.push(product);
      });

      return {
        success: true,
        data: {
          categoryProducts,
          mdPicks: mdPicks.sort((a, b) => (a.width?.toNumber() || 0) - (b.width?.toNumber() || 0))
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
      //console.log('updateHomeOrder 호출됨:', { categoryProducts, mdPicks });
      
      // 트랜잭션으로 모든 업데이트 처리
      await this.prisma.$transaction(async (tx) => {
        // 1. 모든 상품의 length와 width 값을 null로 초기화
        await tx.product.updateMany({
          data: { 
            length: null,
            width: null
          }
        });

        // 2. 카테고리별 상품들의 length 값 설정 (1.00, 2.00, 3.00...)
        let categoryOrderCounter = 1;
        if (categoryProducts) {
          for (const [category, products] of Object.entries(categoryProducts)) {
            if (Array.isArray(products)) {
              for (const product of products) {
                await tx.product.update({
                  where: { id: product.id },
                  data: { length: new Decimal(categoryOrderCounter) }
                });
                categoryOrderCounter += 1;
              }
            }
          }
        }

        // 3. MD's Pick 상품들의 width 값 설정 (순서대로)
        let mdPickOrderCounter = 1;
        if (Array.isArray(mdPicks)) {
          //console.log('MD\'s Pick 상품들 처리 중:', mdPicks);
          for (const productId of mdPicks) {
            //console.log(`상품 ${productId}에 width ${mdPickOrderCounter} 설정`);
            await tx.product.update({
              where: { id: productId },
              data: { width: new Decimal(mdPickOrderCounter) }
            });
            mdPickOrderCounter += 1;
          }
        } else {
          //console.log('MD\'s Pick 배열이 비어있거나 유효하지 않음:', mdPicks);
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

  async getAdminStats() {
    try {
      // 총 상품 수
      const totalProducts = await this.prisma.product.count();
      
      // 활성 셀러 수
      const activeSellers = await this.prisma.seller.count({
        where: { isActive: true }
      });
      
      // 오늘 주문 수
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayOrders = await this.prisma.order.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      });
      
      // 재고 부족 상품 수 (재고가 10개 이하)
      const lowStockProducts = await this.prisma.product.count({
        where: {
          stockQuantity: {
            lte: 10
          }
        }
      });

      return {
        success: true,
        data: {
          totalProducts: {
            value: totalProducts.toString(),
            change: '0%',
            changeType: 'positive'
          },
          activeSellers: {
            value: activeSellers.toString(),
            change: '0%',
            changeType: 'positive'
          },
          todayOrders: {
            value: todayOrders.toString(),
            change: '0%',
            changeType: 'positive'
          },
          lowStockProducts: {
            value: lowStockProducts.toString(),
            change: '0%',
            changeType: 'positive'
          }
        }
      };
    } catch (error) {
      console.error('관리자 통계 조회 실패:', error);
      return {
        success: false,
        error: 'Internal Server Error'
      };
    }
  }

  async getProductAttributes() {
    try {
      // 첫 번째 상품의 shortDescription을 가져와서 공통속성으로 사용
      const firstProduct = await this.prisma.product.findFirst({
        select: { shortDescription: true }
      });

      return {
        success: true,
        data: {
          shortDescription: firstProduct?.shortDescription || ''
        }
      };
    } catch (error) {
      console.error('상품 공통속성 조회 실패:', error);
      return {
        success: false,
        error: 'Internal Server Error'
      };
    }
  }

  async updateProductAttributes(shortDescription: string) {
    try {
      // 모든 상품의 shortDescription을 업데이트
      await this.prisma.product.updateMany({
        data: { shortDescription }
      });

      return {
        success: true,
        message: '상품 공통속성이 성공적으로 저장되었습니다.'
      };
    } catch (error) {
      console.error('상품 공통속성 저장 실패:', error);
      return {
        success: false,
        error: 'Internal Server Error'
      };
    }
  }
}