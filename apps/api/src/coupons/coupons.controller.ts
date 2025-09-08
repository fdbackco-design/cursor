import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Patch,
  Body, 
  Param, 
  HttpException, 
  HttpStatus,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

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

  // 사용자의 쿠폰 목록 조회 (인증 필요) - 동적 라우트보다 먼저 배치
  @Get('my-coupons')
  @UseGuards(JwtAuthGuard)
  async getMyCoupons(@Req() req: Request) {
    try {
      const user = req.user as any;
      // console.log('내 쿠폰 조회 - 사용자 정보:', user);
      // console.log('내 쿠폰 조회 - userId:', user.id || user.sub);
      
      const userId = user.id || user.sub;
      const coupons = await this.couponsService.getUserCoupons(userId);
      
      //console.log('내 쿠폰 조회 결과:', coupons);
      
      return {
        success: true,
        message: '내 쿠폰 목록을 성공적으로 조회했습니다.',
        data: coupons
      };
    } catch (error) {
      //console.error('내 쿠폰 조회 실패:', error);
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

  // 쿠폰 사용 처리 (소프트 딜리트)
  @Post(':couponId/use')
  @UseGuards(JwtAuthGuard)
  async useCoupon(
    @Req() req: Request,
    @Param('couponId') couponId: string
  ) {
    try {
      const user = req.user as any;
      //('쿠폰 사용 처리 요청:', { userId: user.id, couponId });
      
      const result = await this.couponsService.useCoupon(user.id, couponId);
      
      return {
        success: true,
        message: '쿠폰이 성공적으로 사용 처리되었습니다.',
        data: result
      };
    } catch (error) {
      console.error('쿠폰 사용 처리 실패:', error);
      throw new HttpException(
        {
          success: false,
          message: '쿠폰 사용 처리에 실패했습니다.',
          data: null,
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 쿠폰 코드로 쿠폰 등록 (인증 필요)
  @Post('register')
  @UseGuards(JwtAuthGuard)
  async registerCoupon(
    @Req() req: Request,
    @Body('couponCode') couponCode: string
  ) {
    try {
      const user = req.user as any;
      if (!couponCode) {
        throw new Error('쿠폰 코드가 필요합니다.');
      }

      const result = await this.couponsService.registerCouponForUser(user.id, couponCode);
      return {
        success: true,
        message: '쿠폰이 성공적으로 등록되었습니다.',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '쿠폰 등록에 실패했습니다.',
          data: null,
          error: error.message
        },
        error.message.includes('찾을 수 없습니다') || error.message.includes('존재하지 않습니다')
          ? HttpStatus.NOT_FOUND
          : error.message.includes('이미') || error.message.includes('중복')
          ? HttpStatus.CONFLICT
          : HttpStatus.BAD_REQUEST
      );
    }
  }

  // ===== 관리자용 엔드포인트 =====

  // 관리자용: 모든 쿠폰 목록 조회
  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async getAdminCoupons(@Req() req: Request) {
    try {
      const user = req.user as any;
      if (user.role !== 'ADMIN') {
        throw new Error('관리자 권한이 필요합니다.');
      }

      const coupons = await this.couponsService.getAllCoupons();
      return {
        success: true,
        message: '관리자용 쿠폰 목록을 성공적으로 조회했습니다.',
        data: coupons
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '쿠폰 목록 조회에 실패했습니다.',
          data: null,
          error: error.message
        },
        error.message.includes('권한') ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 관리자용: 쿠폰 생성
  @Post('admin')
  @UseGuards(JwtAuthGuard)
  async createAdminCoupon(
    @Req() req: Request,
    @Body() createCouponDto: CreateCouponDto
  ) {
    try {
      const user = req.user as any;
      if (user.role !== 'ADMIN') {
        throw new Error('관리자 권한이 필요합니다.');
      }

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
          message: error.message || '쿠폰 생성에 실패했습니다.',
          data: null,
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 관리자용: 쿠폰 수정
  @Put('admin/:id')
  @UseGuards(JwtAuthGuard)
  async updateAdminCoupon(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto
  ) {
    try {
      const user = req.user as any;
      if (user.role !== 'ADMIN') {
        throw new Error('관리자 권한이 필요합니다.');
      }

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
          message: error.message || '쿠폰 수정에 실패했습니다.',
          data: null,
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 관리자용: 쿠폰 상태 토글
  @Patch('admin/:id/toggle')
  @UseGuards(JwtAuthGuard)
  async toggleAdminCouponStatus(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    try {
      const user = req.user as any;
      if (user.role !== 'ADMIN') {
        throw new Error('관리자 권한이 필요합니다.');
      }

      const coupon = await this.couponsService.toggleCouponStatus(id);
      return {
        success: true,
        message: '쿠폰 상태가 성공적으로 변경되었습니다.',
        data: coupon
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '쿠폰 상태 변경에 실패했습니다.',
          data: null,
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 관리자용: 쿠폰 상세 조회 (ID로)
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  async getAdminCouponById(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    try {
      const user = req.user as any;
      if (user.role !== 'ADMIN') {
        throw new Error('관리자 권한이 필요합니다.');
      }

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
          message: error.message || '쿠폰 조회에 실패했습니다.',
          data: null,
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 관리자용: 쿠폰 삭제
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard)
  async deleteAdminCoupon(
    @Req() req: Request,
    @Param('id') id: string
  ) {
    try {
      const user = req.user as any;
      if (user.role !== 'ADMIN') {
        throw new Error('관리자 권한이 필요합니다.');
      }

      await this.couponsService.deleteCoupon(id);
      return {
        success: true,
        message: '쿠폰이 성공적으로 삭제되었습니다.',
        data: null
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '쿠폰 삭제에 실패했습니다.',
          data: null,
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
