import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto, RemoveWishlistDto } from './dto/wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  private getUserId(req: any) {
    const userId = req.user?.id ?? req.user?.sub ?? req.user?.userId;
    if (!userId) throw new UnauthorizedException('인증 정보가 없습니다.');
    return userId;
  }

  @Get()
  async getWishlist(@Req() req: any) {
    const userId = this.getUserId(req);
    const wishlist = await this.wishlistService.getWishlist(userId);
    return { success: true, message: '찜목록을 성공적으로 불러왔습니다.', data: wishlist };
  }

  @Post()
  async addToWishlist(@Req() req: any, @Body() dto: CreateWishlistDto) {
    const userId = this.getUserId(req);
    const wishlist = await this.wishlistService.addToWishlist(userId, dto);
    return { success: true, message: '상품을 찜목록에 추가했습니다.', data: wishlist };
  }

  @Delete()
  async removeFromWishlist(@Req() req: any, @Body() dto: RemoveWishlistDto) {
    const userId = this.getUserId(req);
    await this.wishlistService.removeFromWishlist(userId, dto);
    return { success: true, message: '찜목록에서 상품을 제거했습니다.' };
  }

  @Get('check/:productId')
  async checkWishlistStatus(@Req() req: any, @Param('productId') productId: string) {
    const userId = this.getUserId(req);
    const status = await this.wishlistService.checkWishlistStatus(userId, productId);
    return { success: true, message: '찜하기 상태를 확인했습니다.', data: status };
  }
}