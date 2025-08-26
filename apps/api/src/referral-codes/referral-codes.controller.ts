import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ReferralCodesService } from './referral-codes.service';
import { CreateReferralCodeDto, UpdateReferralCodeDto } from './dto';

@Controller('referral-codes')
export class ReferralCodesController {
  constructor(private readonly referralCodesService: ReferralCodesService) {}

  // 추천 코드 상세 조회
  @Get(':id')
  async getReferralCodeById(@Param('id') id: string) {
    try {
      const referralCode = await this.referralCodesService.getReferralCodeById(id);
      if (!referralCode) {
        return {
          success: false,
          message: '추천 코드를 찾을 수 없습니다.',
          data: null,
          error: 'Not Found',
        };
      }
      return {
        success: true,
        message: '추천 코드 정보를 성공적으로 불러왔습니다.',
        data: referralCode,
      };
    } catch (error) {
      console.error('추천 코드 조회 에러:', error);
      return {
        success: false,
        message: '추천 코드 정보를 불러오는데 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }

  // 새 추천 코드 생성
  @Post()
  async createReferralCode(@Body() createReferralCodeDto: CreateReferralCodeDto) {
    try {
      const referralCode = await this.referralCodesService.createReferralCode(createReferralCodeDto);
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

  // 추천 코드 수정
  @Put(':id')
  async updateReferralCode(@Param('id') id: string, @Body() updateReferralCodeDto: UpdateReferralCodeDto) {
    try {
      const referralCode = await this.referralCodesService.updateReferralCode(id, updateReferralCodeDto);
      return {
        success: true,
        message: '추천 코드가 성공적으로 수정되었습니다.',
        data: referralCode,
      };
    } catch (error) {
      console.error('추천 코드 수정 에러:', error);
      return {
        success: false,
        message: '추천 코드 수정에 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }

  // 추천 코드 삭제
  @Delete(':id')
  async deleteReferralCode(@Param('id') id: string) {
    try {
      await this.referralCodesService.deleteReferralCode(id);
      return {
        success: true,
        message: '추천 코드가 성공적으로 삭제되었습니다.',
        data: null,
      };
    } catch (error) {
      console.error('추천 코드 삭제 에러:', error);
      return {
        success: false,
        message: '추천 코드 삭제에 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }

  // 추천 코드 상태 토글
  @Put(':id/toggle-status')
  async toggleReferralCodeStatus(@Param('id') id: string) {
    try {
      const referralCode = await this.referralCodesService.toggleReferralCodeStatus(id);
      return {
        success: true,
        message: '추천 코드 상태가 성공적으로 변경되었습니다.',
        data: referralCode,
      };
    } catch (error) {
      console.error('추천 코드 상태 변경 에러:', error);
      return {
        success: false,
        message: '추천 코드 상태 변경에 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }
}
