import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { SellersService } from './sellers.service';
import { CreateSellerDto, UpdateSellerDto } from './dto';
import { CreateReferralCodeDto } from '../referral-codes/dto';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  // 모든 셀러 조회
  @Get()
  async getAllSellers() {
    try {
      const sellers = await this.sellersService.getAllSellers();
      return {
        success: true,
        message: '셀러 목록을 성공적으로 불러왔습니다.',
        data: sellers,
      };
    } catch (error) {
      console.error('셀러 목록 조회 에러:', error);
      return {
        success: false,
        message: '셀러 목록을 불러오는데 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }

  // 셀러 상세 조회
  @Get(':id')
  async getSellerById(@Param('id') id: string) {
    try {
      const seller = await this.sellersService.getSellerById(id);
      if (!seller) {
        return {
          success: false,
          message: '셀러를 찾을 수 없습니다.',
          data: null,
          error: 'Not Found',
        };
      }
      return {
        success: true,
        message: '셀러 정보를 성공적으로 불러왔습니다.',
        data: seller,
      };
    } catch (error) {
      console.error('셀러 조회 에러:', error);
      return {
        success: false,
        message: '셀러 정보를 불러오는데 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }

  // 새 셀러 생성
  @Post()
  async createSeller(@Body() createSellerDto: CreateSellerDto) {
    try {
      const seller = await this.sellersService.createSeller(createSellerDto);
      return {
        success: true,
        message: '셀러가 성공적으로 생성되었습니다.',
        data: seller,
      };
    } catch (error) {
      console.error('셀러 생성 에러:', error);
      return {
        success: false,
        message: '셀러 생성에 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }

  // 셀러 수정
  @Put(':id')
  async updateSeller(@Param('id') id: string, @Body() updateSellerDto: UpdateSellerDto) {
    try {
      const seller = await this.sellersService.updateSeller(id, updateSellerDto);
      return {
        success: true,
        message: '셀러가 성공적으로 수정되었습니다.',
        data: seller,
      };
    } catch (error) {
      console.error('셀러 수정 에러:', error);
      return {
        success: false,
        message: '셀러 수정에 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }

  // 셀러 삭제 (소프트 삭제)
  @Delete(':id')
  async deleteSeller(@Param('id') id: string) {
    try {
      await this.sellersService.deleteSeller(id);
      return {
        success: true,
        message: '셀러가 성공적으로 삭제되었습니다.',
        data: null,
      };
    } catch (error) {
      console.error('셀러 삭제 에러:', error);
      return {
        success: false,
        message: '셀러 삭제에 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }

  // 셀러 상태 토글
  @Put(':id/toggle-status')
  async toggleSellerStatus(@Param('id') id: string) {
    try {
      const seller = await this.sellersService.toggleSellerStatus(id);
      return {
        success: true,
        message: '셀러 상태가 성공적으로 변경되었습니다.',
        data: seller,
      };
    } catch (error) {
      console.error('셀러 상태 변경 에러:', error);
      return {
        success: false,
        message: '셀러 상태 변경에 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }

  // 셀러 인증 상태 토글
  @Put(':id/toggle-verification')
  async toggleSellerVerification(@Param('id') id: string) {
    try {
      const seller = await this.sellersService.toggleSellerVerification(id);
      return {
        success: true,
        message: '셀러 인증 상태가 성공적으로 변경되었습니다.',
        data: seller,
      };
    } catch (error) {
      console.error('셀러 인증 상태 변경 에러:', error);
      return {
        success: false,
        message: '셀러 인증 상태 변경에 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }

  // 셀러별 추천 코드 생성
  @Post(':id/referral-codes')
  async createSellerReferralCode(@Param('id') sellerId: string, @Body() createReferralCodeDto: CreateReferralCodeDto) {
    try {
      const referralCode = await this.sellersService.createReferralCode(sellerId, createReferralCodeDto);
      return {
        success: true,
        message: '추천 코드가 성공적으로 생성되었습니다.',
        data: referralCode,
      };
    } catch (error) {
      console.error('추천 코드 생성 에러:', error);
      return {
        success: false,
        message: '추천 코드 생성에 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }
}
