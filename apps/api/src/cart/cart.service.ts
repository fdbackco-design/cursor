import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // 사용자의 장바구니 조회 (없으면 생성)
  async getCartByUserId(userId: string) {
    // 장바구니가 없으면 생성
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                priceB2C: true,
                images: true,
                isActive: true,
                stockQuantity: true,
                lowStockThreshold: true,
                vendor: {
                  select: {
                    name: true
                  }
                },
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  priceB2C: true,
                  images: true,
                  isActive: true,
                  vendor: {
                    select: {
                      name: true
                    }
                  },
                  category: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    }

    return cart;
  }

  // 장바구니에 상품 추가
  async addToCart(addToCartDto: AddToCartDto) {
    const { userId, productId, quantity } = addToCartDto;

    // 사용자의 장바구니 확인/생성
    const cart = await this.getCartByUserId(userId);

    // 이미 장바구니에 있는 상품인지 확인
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      }
    });

    if (existingItem) {
      // 이미 있으면 수량 업데이트
      return await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              priceB2C: true,
              images: true,
              isActive: true,
              vendor: {
                select: {
                  name: true
                }
              },
              category: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
    } else {
      // 새로운 아이템 추가
      return await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              priceB2C: true,
              images: true,
              isActive: true,
              vendor: {
                select: {
                  name: true
                }
              },
              category: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
    }
  }

  // 장바구니 아이템 수량 업데이트
  async updateCartItem(itemId: string, updateCartItemDto: UpdateCartItemDto) {
    const { quantity } = updateCartItemDto;

    // 먼저 기존 아이템과 상품 정보 조회
    const existingItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        product: {
          select: {
            stockQuantity: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    if (!existingItem) {
      throw new Error('장바구니 아이템을 찾을 수 없습니다.');
    }

    if (!existingItem.product.isActive) {
      throw new Error('이 상품은 현재 판매중이 아닙니다.');
    }

    // 재고 수량 확인
    if (quantity > existingItem.product.stockQuantity) {
      throw new Error(`재고가 부족합니다. 현재 재고: ${existingItem.product.stockQuantity}개`);
    }

    return await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            priceB2C: true,
            images: true,
            isActive: true,
            stockQuantity: true,
            lowStockThreshold: true,
            vendor: {
              select: {
                name: true
              }
            },
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
  }

  // 장바구니에서 상품 제거
  async removeFromCart(itemId: string) {
    return await this.prisma.cartItem.delete({
      where: { id: itemId }
    });
  }

  // 장바구니 전체 비우기
  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId }
    });

    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
    }
  }
}
