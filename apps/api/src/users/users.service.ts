import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async getAllUsers(role?: string, excludeSellerUsers: boolean = false) {
    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (excludeSellerUsers) {
      // 이미 셀러로 등록된 사용자는 제외
      where.seller = null;
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            companyName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getAvailableUsersForSeller() {
    // 아직 셀러로 등록되지 않은 사용자들만 반환
    return this.prisma.user.findMany({
      where: {
        seller: null, // 아직 셀러로 등록되지 않은 사용자
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * 회원탈퇴 - 익명화 + 소프트 딜리트 방식
   * 개인정보는 즉시 익명화하되, 주문/결제 등 법적 보관 의무가 있는 데이터는 보관
   */
  async deleteUserAccount(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 사용자 존재 여부 확인
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          orders: true,
          cart: true,
          wishlist: true,
          reviews: true,
          qnas: true,
        }
      });

      if (!user) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }

      // 2. 활성 주문이 있는지 확인 (배송 중이거나 처리 중인 주문)
      const activeOrders = await this.prisma.order.findMany({
        where: {
          userId: userId,
          status: {
            in: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']
          }
        }
      });

      if (activeOrders.length > 0) {
        return { 
          success: false, 
          message: '진행 중인 주문이 있어 탈퇴할 수 없습니다. 주문 처리가 완료된 후 다시 시도해주세요.' 
        };
      }

      // 3. 카카오 연결 끊기 (트랜잭션 전에 실행)
      if (user.kakaoSub) {
        try {
          const unlinkResult = await this.unlinkKakaoAccount(user.kakaoSub);
          if (!unlinkResult.success) {
            this.logger.warn(`카카오 연결 끊기 실패: ${unlinkResult.message}`);
            // 카카오 연결 끊기 실패해도 회원탈퇴는 계속 진행
          } else {
            this.logger.log(`카카오 연결 끊기 성공: kakaoSub=${user.kakaoSub}`);
          }
        } catch (error) {
          this.logger.error(`카카오 연결 끊기 중 예외 발생:`, error);
          // 예외가 발생해도 회원탈퇴는 계속 진행
        }
      }

      // 4. 트랜잭션으로 익명화 및 소프트 딜리트 실행
      await this.prisma.$transaction(async (tx) => {
        const anonymizedId = `deleted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const anonymizedEmail = `deleted_${anonymizedId}@deleted.com`;
        const anonymizedName = '탈퇴한 사용자';
        const anonymizedPhone = '000-0000-0000';

        // 3-1. 사용자 개인정보 익명화
        await tx.user.update({
          where: { id: userId },
          data: {
            name: anonymizedName,
            email: anonymizedEmail,
            phoneNumber: anonymizedPhone,
            // 배송지 정보도 익명화
            shippingAddress: null,
          }
        });

        // 3-2. 장바구니 삭제 (개인정보)
        await tx.cart.deleteMany({
          where: { userId: userId }
        });

        // 3-3. 위시리스트 삭제 (개인정보)
        await tx.wishlist.deleteMany({
          where: { userId: userId }
        });

        // 3-4. 리뷰는 사용자와의 관계만 유지 (개인정보는 User 테이블에서 익명화됨)
        // Review 테이블 자체에는 개인정보가 없으므로 별도 처리 불필요

        // 3-5. Q&A는 사용자와의 관계만 유지 (개인정보는 User 테이블에서 익명화됨)
        // QnA 테이블 자체에는 개인정보가 없으므로 별도 처리 불필요

        // 3-6. 포인트 내역 익명화
        await tx.pointsLedger.updateMany({
          where: { userId: userId },
          data: {
            description: '탈퇴한 사용자의 포인트 내역',
          }
        });

        // 3-7. 쿠폰 사용 내역은 UserCoupon 테이블에 개인정보가 없으므로 별도 처리 불필요
        // usageCount는 통계 목적으로 유지

        // 주문/결제/배송 정보는 법적 보관 의무로 인해 보관
        // shippingAddress와 billingAddress는 JSON 형태이므로 개별 주문을 조회하여 익명화
        const userOrders = await tx.order.findMany({
          where: { userId: userId },
          select: { id: true, shippingAddress: true, billingAddress: true }
        });

        for (const order of userOrders) {
          const anonymizedShippingAddress = {
            ...(order.shippingAddress as any || {}),
            name: anonymizedName,
            phone: anonymizedPhone,
            address: '탈퇴한 사용자의 배송지'
          };

          const anonymizedBillingAddress = {
            ...(order.billingAddress as any || {}),
            name: anonymizedName,
            phone: anonymizedPhone,
            email: anonymizedEmail
          };

          await tx.order.update({
            where: { id: order.id },
            data: {
              shippingAddress: anonymizedShippingAddress,
              billingAddress: anonymizedBillingAddress,
            }
          });
        }
      });

      return { 
        success: true, 
        message: '회원탈퇴가 완료되었습니다. 개인정보는 즉시 익명화되었으며, 주문/결제 정보는 법적 보관 의무에 따라 보관됩니다.' 
      };

    } catch (error) {
      console.error('회원탈퇴 처리 중 오류:', error);
      return { 
        success: false, 
        message: '회원탈퇴 처리 중 오류가 발생했습니다. 관리자에게 문의해주세요.' 
      };
    }
  }

  /**
   * 카카오 연결 끊기 API 호출
   * @param kakaoSub 카카오 사용자 ID
   * @param accessToken 카카오 액세스 토큰 (선택사항)
   */
  async unlinkKakaoAccount(kakaoSub: string, accessToken?: string): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`카카오 연결 끊기 시작: kakaoSub=${kakaoSub}`);
      
      // 카카오 연결 끊기 API 호출
      const kakaoAdminKey = this.configService.get<string>('KAKAO_ADMIN_KEY');
      
      if (!kakaoAdminKey) {
        this.logger.error('KAKAO_ADMIN_KEY 환경 변수가 설정되지 않았습니다!');
        return {
          success: false,
          message: '카카오 API 설정이 올바르지 않습니다.'
        };
      }
      
      this.logger.log(`카카오 Admin Key 로드됨: ${kakaoAdminKey.substring(0, 10)}...`);
      
      // 요청 데이터 준비
      const requestData = new URLSearchParams({
        target_id_type: 'user_id',
        target_id: kakaoSub
      });
      
      const requestHeaders = {
        'Authorization': `KakaoAK ${kakaoAdminKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      
      this.logger.log(`카카오 API 요청 정보:`, {
        url: 'https://kapi.kakao.com/v1/user/unlink',
        headers: {
          'Authorization': `KakaoAK ${kakaoAdminKey.substring(0, 10)}...`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: {
          target_id_type: 'user_id',
          target_id: kakaoSub
        }
      });
      
      // Admin Key로 먼저 시도
      try {
        const response = await axios.post('https://kapi.kakao.com/v1/user/unlink', requestData, {
          headers: requestHeaders
        });

        this.logger.log(`카카오 연결 끊기 성공 (Admin Key): kakaoSub=${kakaoSub}, status=${response.status}`);
        
        return {
          success: true,
          message: '카카오 계정 연결이 해제되었습니다.'
        };
      } catch (adminKeyError: any) {
        this.logger.warn(`Admin Key로 연결 끊기 실패: ${adminKeyError.response?.status} - ${adminKeyError.response?.data?.msg}`);
        
        // Admin Key 실패 시 사용자 액세스 토큰으로 시도 (만약 있다면)
        if (accessToken) {
          this.logger.log(`사용자 액세스 토큰으로 연결 끊기 시도: kakaoSub=${kakaoSub}`);
          
          try {
            const userResponse = await axios.post('https://kapi.kakao.com/v1/user/unlink', null, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            });
            
            this.logger.log(`카카오 연결 끊기 성공 (사용자 토큰): kakaoSub=${kakaoSub}, status=${userResponse.status}`);
            
            return {
              success: true,
              message: '카카오 계정 연결이 해제되었습니다.'
            };
          } catch (userTokenError: any) {
            this.logger.error(`사용자 토큰으로도 연결 끊기 실패: ${userTokenError.response?.status} - ${userTokenError.response?.data?.msg}`);
            throw userTokenError;
          }
        } else {
          throw adminKeyError;
        }
      }

    } catch (error: any) {
      this.logger.error(`카카오 연결 끊기 실패: kakaoSub=${kakaoSub}`, error);
      
      // 카카오 API 에러 응답 처리
      if (error.response) {
        const { status, data } = error.response;
        this.logger.error(`카카오 API 에러: ${status} - ${JSON.stringify(data)}`);
        
        if (status === 400) {
          return {
            success: false,
            message: '카카오 계정 정보가 올바르지 않습니다.'
          };
        } else if (status === 401) {
          return {
            success: false,
            message: '카카오 API 인증에 실패했습니다.'
          };
        } else if (status === 403) {
          return {
            success: false,
            message: '카카오 계정 연결 해제 권한이 없습니다.'
          };
        }
      }
      
      return {
        success: false,
        message: '카카오 계정 연결 해제 중 오류가 발생했습니다.'
      };
    }
  }
}
