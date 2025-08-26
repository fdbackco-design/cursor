import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  HttpException, 
  HttpStatus,
  Query,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto } from './dto';

@Controller('coupons')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // 모든 쿠폰 조회
  @Get()
  async getAllCoupons() {
    try {
      const coupons = await this.couponsService.getAllCoupons();
      return {
        success: true,
        message: '쿠폰 목록을 성공적으로 조회했습니다.',
        data: coupons
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: '쿠폰 목록 조회에 실패했습니다.',
          data: null,
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 쿠폰 상세 조회
  @Get(':id')
  async getCouponById(@Param('id') id: string) {
    try {
      const coupon = await this.couponsService.getCouponById(id);
      return {
        success: true,
        message: '쿠폰 정보를 성공적으로 조회했습니다.',
        data: coupon
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: '쿠폰 조회에 실패했습니다.',
          data: null,
          error: error.message
        },
        HttpStatus.NOT_FOUND
      );
    }
  }

  // 쿠폰 생성
  @Post()
  async createCoupon(@Body() createCouponDto: CreateCouponDto) {
    try {
      const coupon = await this.couponsService.createCoupon(createCouponDto);
      return {
        success: true,
        message: '쿠폰이 성공적으로 생성되었습니다.',
        data: coupon
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: '쿠폰 생성에 실패했습니다.',
          data: null,
          error: error.message
        },
        error.message.includes('이미 사용 중') 
          ? HttpStatus.CONFLICT 
          : HttpStatus.BAD_REQUEST
      );
    }
  }

  // 쿠폰 수정
  @Put(':id')
  async updateCoupon(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto
  ) {
    try {
      const coupon = await this.couponsService.updateCoupon(id, updateCouponDto);
      return {
        success: true,
        message: '쿠폰이 성공적으로 수정되었습니다.',
        data: coupon
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: '쿠폰 수정에 실패했습니다.',
          data: null,
          error: error.message
        },
        error.message.includes('찾을 수 없습니다')
          ? HttpStatus.NOT_FOUND
          : error.message.includes('이미 사용 중')
          ? HttpStatus.CONFLICT
          : HttpStatus.BAD_REQUEST
      );
    }
  }

  // 쿠폰 삭제
  @Delete(':id')
  async deleteCoupon(@Param('id') id: string) {
    try {
      const result = await this.couponsService.deleteCoupon(id);
      return {
        success: true,
        message: '쿠폰이 성공적으로 삭제되었습니다.',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: '쿠폰 삭제에 실패했습니다.',
          data: null,
          error: error.message
        },
        error.message.includes('찾을 수 없습니다')
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 쿠폰 활성화/비활성화 토글
  @Put(':id/toggle-status')
  async toggleCouponStatus(@Param('id') id: string) {
    try {
      const coupon = await this.couponsService.toggleCouponStatus(id);
      return {
        success: true,
        message: `쿠폰이 ${coupon.isActive ? '활성화' : '비활성화'}되었습니다.`,
        data: coupon
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: '쿠폰 상태 변경에 실패했습니다.',
          data: null,
          error: error.message
        },
        error.message.includes('찾을 수 없습니다')
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 쿠폰 유효성 검증
  @Get('validate/:code')
  async validateCoupon(
    @Param('code') code: string,
    @Query('userId') userId: string,
    @Query('orderAmount') orderAmount: string
  ) {
    try {
      if (!userId || !orderAmount) {
        throw new Error('userId와 orderAmount가 필요합니다.');
      }

      const coupon = await this.couponsService.validateCoupon(
        code,
        userId,
        parseFloat(orderAmount)
      );

      return {
        success: true,
        message: '사용 가능한 쿠폰입니다.',
        data: coupon
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
          data: null,
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // 쿠폰 사용 처리
  @Post(':id/use')
  async useCoupon(
    @Param('id') couponId: string,
    @Body('userId') userId: string
  ) {
    try {
      if (!userId) {
        throw new Error('userId가 필요합니다.');
      }

      const result = await this.couponsService.useCoupon(couponId, userId);
      return {
        success: true,
        message: '쿠폰이 성공적으로 사용되었습니다.',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: '쿠폰 사용에 실패했습니다.',
          data: null,
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
