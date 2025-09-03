import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto, GetReviewsDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // 상품별 리뷰 목록 조회
  async getProductReviews(productId: string, query: GetReviewsDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    //console.log(`상품 리뷰 조회: productId=${productId}, page=${page}, limit=${limit}`);

    const [reviews, total, stats] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      this.prisma.review.count({ where: { productId } }),
      this.getProductReviewStats(productId)
    ]);

    // console.log(`리뷰 조회 결과: total=${total}, reviews.length=${reviews.length}`);
    // console.log('리뷰 데이터:', reviews);
    // console.log('통계 데이터:', stats);

    return {
      success: true,
      data: {
        reviews,
        stats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    };
  }

  // 상품별 리뷰 통계 조회
  async getProductReviewStats(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      select: { rating: true }
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // 별점별 분포 계산
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
      percentage: totalReviews > 0 
        ? Math.round((reviews.filter(r => r.rating === rating).length / totalReviews) * 100)
        : 0
    }));

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // 소수점 첫째자리까지
      ratingDistribution
    };
  }

  // 사용자별 리뷰 목록 조회
  async getUserReviews(userId: string, query: GetReviewsDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      this.prisma.review.count({ where: { userId } })
    ]);

    return {
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    };
  }

  // 리뷰 상세 조회
  async getReviewById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true
          }
        }
      }
    });

    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    return {
      success: true,
      data: review
    };
  }

  // 리뷰 작성
  async createReview(userId: string, createReviewDto: CreateReviewDto) {
    const { productId, rating, title, content, orderId, orderItemId } = createReviewDto;

    // 주문별로 이미 리뷰를 작성했는지 확인
    const existingReview = await this.prisma.review.findUnique({
      where: {
        orderId_orderItemId: {
          orderId,
          orderItemId
        }
      }
    });

    if (existingReview) {
      throw new BadRequestException('이미 이 주문 상품에 대한 리뷰를 작성했습니다.');
    }

    // 상품이 존재하는지 확인
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    // 주문과 주문 상품이 존재하는지 확인
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { id: orderItemId }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('자신의 주문에 대해서만 리뷰를 작성할 수 있습니다.');
    }

    if (order.items.length === 0) {
      throw new NotFoundException('주문 상품을 찾을 수 없습니다.');
    }

    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('배송이 완료된 주문만 리뷰를 작성할 수 있습니다.');
    }

    // 리뷰 생성
    const review = await this.prisma.review.create({
      data: {
        productId,
        userId,
        orderId,
        orderItemId,
        rating,
        title,
        content
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true
          }
        }
      }
    });

    return {
      success: true,
      data: review,
      message: '리뷰가 성공적으로 작성되었습니다.'
    };
  }

  // 리뷰 수정
  async updateReview(id: string, userId: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('자신이 작성한 리뷰만 수정할 수 있습니다.');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true
          }
        }
      }
    });

    return {
      success: true,
      data: updatedReview,
      message: '리뷰가 성공적으로 수정되었습니다.'
    };
  }

  // 리뷰 삭제
  async deleteReview(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('자신이 작성한 리뷰만 삭제할 수 있습니다.');
    }

    await this.prisma.review.delete({
      where: { id }
    });

    return {
      success: true,
      message: '리뷰가 성공적으로 삭제되었습니다.'
    };
  }

  // 주문 상품별 리뷰 작성 가능 여부 확인
  async getAvailableReviewItems(orderId: string, userId: string) {
    // 주문이 존재하고 사용자의 것인지 확인
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('자신의 주문만 확인할 수 있습니다.');
    }

    // 배송 완료된 주문만 리뷰 작성 가능
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('배송이 완료된 주문만 리뷰를 작성할 수 있습니다.');
    }

    // 각 상품별로 리뷰 작성 여부 확인
    const availableItems = await Promise.all(
      order.items.map(async (item) => {
        const existingReview = await this.prisma.review.findUnique({
          where: {
            orderId_orderItemId: {
              orderId: order.id,
              orderItemId: item.id
            }
          }
        });

        return {
          orderItemId: item.id,
          productId: item.productId,
          productName: item.product.name,
          productImages: item.product.images,
          quantity: item.quantity,
          finalPrice: item.finalPrice,
          hasReview: !!existingReview,
          reviewId: existingReview?.id || null
        };
      })
    );

    return {
      success: true,
      data: {
        orderId,
        orderStatus: order.status,
        items: availableItems
      }
    };
  }

  // 관리자용 리뷰 목록 조회
  async getAdminReviews(query: any) {
    //console.log('관리자 리뷰 조회 요청:', query);
    
    const {
      page = 1,
      limit = 20,
      rating,
      search,
      productId,
      userId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // 필터 조건 구성
    const where: any = {};

    if (rating) {
      where.rating = parseInt(rating);
    }

    if (productId) {
      where.productId = productId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { product: { name: { contains: search } } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } }
      ];
    }

    // 정렬 조건 구성
    const orderBy: any = {};
    if (sortBy === 'product.name') {
      orderBy.product = { name: sortOrder };
    } else if (sortBy === 'user.name') {
      orderBy.user = { name: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    //console.log('Prisma 쿼리 조건:', { where, orderBy, skip, take });

    try {
      // 리뷰 목록 조회
      const [reviews, total] = await Promise.all([
        this.prisma.review.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        this.prisma.review.count({ where })
      ]);

      //console.log('조회된 리뷰 수:', reviews.length, '전체 수:', total);

      const totalPages = Math.ceil(total / take);

      return {
        success: true,
        data: {
          reviews,
          pagination: {
            page: parseInt(page),
            limit: take,
            total,
            totalPages
          }
        }
      };
    } catch (error) {
      console.error('관리자 리뷰 조회 실패:', error);
      console.error('오류 상세:', error.message);
      console.error('오류 스택:', error.stack);
      return {
        success: false,
        error: '리뷰 조회에 실패했습니다.'
      };
    }
  }
}
