import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';
import { Request } from 'express';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // 사용자의 장바구니 조회
  @Get()
  async getCart(@Req() req: Request) {
    try {
      const user = req.user as any;
      const cart = await this.cartService.getCartByUserId(user.id);
      return {
        success: true,
        message: '장바구니를 성공적으로 조회했습니다.',
        data: cart
      };
    } catch (error) {
      return {
        success: false,
        message: '장바구니 조회에 실패했습니다.',
        data: null,
        error: error.message
      };
    }
  }

  // 장바구니에 상품 추가
  @Post('add')
  async addToCart(@Body() addToCartDto: Omit<AddToCartDto, 'userId'>, @Req() req: Request) {
    try {
      const user = req.user as any;
      const cartItem = await this.cartService.addToCart({
        ...addToCartDto,
        userId: user.id,
      });
      return {
        success: true,
        message: '상품이 장바구니에 추가되었습니다.',
        data: cartItem
      };
    } catch (error) {
      return {
        success: false,
        message: '장바구니 추가에 실패했습니다.',
        data: null,
        error: error.message
      };
    }
  }

  // 장바구니 아이템 수량 업데이트
  @Put('item/:itemId')
  async updateCartItem(
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto
  ) {
    try {
      const cartItem = await this.cartService.updateCartItem(itemId, updateCartItemDto);
      return {
        success: true,
        message: '장바구니 아이템이 업데이트되었습니다.',
        data: cartItem
      };
    } catch (error) {
      return {
        success: false,
        message: '장바구니 아이템 업데이트에 실패했습니다.',
        data: null,
        error: error.message
      };
    }
  }

  // 장바구니 아이템 삭제
  @Delete('item/:itemId')
  async removeFromCart(@Param('itemId') itemId: string) {
    try {
      await this.cartService.removeFromCart(itemId);
      return {
        success: true,
        message: '상품이 장바구니에서 제거되었습니다.',
        data: null
      };
    } catch (error) {
      return {
        success: false,
        message: '장바구니에서 제거에 실패했습니다.',
        data: null,
        error: error.message
      };
    }
  }

  // 장바구니 전체 비우기
  @Delete('clear')
  async clearCart(@Req() req: Request) {
    try {
      const user = req.user as any;
      await this.cartService.clearCart(user.id);
      return {
        success: true,
        message: '장바구니가 비워졌습니다.',
        data: null
      };
    } catch (error) {
      return {
        success: false,
        message: '장바구니 비우기에 실패했습니다.',
        data: null,
        error: error.message
      };
    }
  }
}
