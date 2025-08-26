// wishlist.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWishlistDto, RemoveWishlistDto } from './dto/wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId }, // 스칼라 FK가 없으면 Prisma가 무시; 있으면 필터에 사용됨
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ 여기 수정
  async addToWishlist(userId: string, dto: CreateWishlistDto) {
    const { productId } = dto;
    console.log('WishlistService.addToWishlist - userId:', userId, 'productId:', productId);

    // 1) 상품 존재 확인
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다.');

    // 2) 중복 확인 (스키마에 @@unique([userId, productId])가 없더라도 소프트 체크)
    const existing = await this.prisma.wishlist.findFirst({
      where: { userId, productId },
    });
    if (existing) throw new ConflictException('이미 찜한 상품입니다.');

    // 3) 생성 — 직접 userId와 productId 사용
    const wishlist = await this.prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
      include: { product: true },
    });

    console.log('WishlistService.addToWishlist - 생성됨:', wishlist.id);
    return wishlist;
  }

  async removeFromWishlist(userId: string, dto: RemoveWishlistDto) {
    const { productId } = dto;

    const wishlist = await this.prisma.wishlist.findFirst({
      where: { userId, productId },
    });
    if (!wishlist) throw new NotFoundException('찜한 상품을 찾을 수 없습니다.');

    await this.prisma.wishlist.delete({ where: { id: wishlist.id } });
    return { message: '찜하기가 제거되었습니다.' };
  }

  async checkWishlistStatus(userId: string, productId: string) {
    const wishlist = await this.prisma.wishlist.findFirst({
      where: { userId, productId },
    });
    return { isWishlisted: !!wishlist };
  }
}