import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, GetReviewsDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // 리뷰 목록 조회 (상품별)
  @Get('product/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query() query: GetReviewsDto
  ) {
    return this.reviewsService.getProductReviews(productId, query);
  }

  // 내 리뷰 목록 조회
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyReviews(
    @Req() req: Request,
    @Query() query: GetReviewsDto
  ) {
    const user = req.user as any;
    return this.reviewsService.getUserReviews(user.id, query);
  }

  // 관리자용 리뷰 목록 조회
  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async getAdminReviews(
    @Req() req: Request,
    @Query() query: any
  ) {
    const user = req.user as any;
    
    // 관리자 권한 확인
    if (user.role !== 'ADMIN') {
      throw new Error('관리자 권한이 필요합니다.');
    }
    
    return this.reviewsService.getAdminReviews(query);
  }

  // 주문 상품별 리뷰 작성 가능 여부 확인
  @Get('order/:orderId/available')
  @UseGuards(JwtAuthGuard)
  async getAvailableReviewItems(
    @Param('orderId') orderId: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    return this.reviewsService.getAvailableReviewItems(orderId, user.id);
  }

  // 리뷰 상세 조회
  @Get(':id')
  async getReviewById(@Param('id') id: string) {
    return this.reviewsService.getReviewById(id);
  }

  // 리뷰 작성
  @Post()
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Req() req: Request,
    @Body() createReviewDto: CreateReviewDto
  ) {
    const user = req.user as any;
    return this.reviewsService.createReview(user.id, createReviewDto);
  }

  // 리뷰 수정
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() updateReviewDto: UpdateReviewDto
  ) {
    const user = req.user as any;
    return this.reviewsService.updateReview(id, user.id, updateReviewDto);
  }

  // 리뷰 삭제
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteReview(
    @Param('id') id: string,
    @Req() req: Request
  ) {
    const user = req.user as any;
    return this.reviewsService.deleteReview(id, user.id);
  }
}
