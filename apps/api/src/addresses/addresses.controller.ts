import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  // 사용자의 모든 배송지 조회
  @Get()
  async findAll(@Request() req) {
    const userId = req.user.sub || req.user.id;
    //console.log(`배송지 목록 조회: userId=${userId}, 사용자 정보:`, req.user);
    return this.addressesService.findAllByUserId(userId);
  }

  // 사용자의 기본 배송지 조회
  @Get('default')
  async findDefault(@Request() req) {
    const userId = req.user.sub || req.user.id;
    //console.log(`기본 배송지 조회: userId=${userId}, 사용자 정보:`, req.user);
    return this.addressesService.findDefaultByUserId(userId);
  }

  // 특정 배송지 조회
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub || req.user.id;
    //console.log(`특정 배송지 조회: addressId=${id}, userId=${userId}, 사용자 정보:`, req.user);
    return this.addressesService.findOne(id, userId);
  }

  // 배송지 생성
  @Post()
  async create(@Body() createAddressDto: CreateAddressDto, @Request() req) {
    const userId = req.user.sub || req.user.id;
    //console.log(`배송지 생성 요청: userId=${userId}, 사용자 정보:`, req.user);
    return this.addressesService.create(userId, createAddressDto);
  }

  // 배송지 수정
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.id;
    //console.log(`배송지 수정: addressId=${id}, userId=${userId}, 사용자 정보:`, req.user);
    return this.addressesService.update(id, userId, updateAddressDto);
  }

  // 기본 배송지 설정
  @Put(':id/default')
  async setDefault(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub || req.user.id;
    //console.log(`기본 배송지 설정: addressId=${id}, userId=${userId}, 사용자 정보:`, req.user);
    return this.addressesService.setDefault(id, userId);
  }

  // 배송지 삭제
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.sub || req.user.id;
    //console.log(`배송지 삭제: addressId=${id}, userId=${userId}, 사용자 정보:`, req.user);
    return this.addressesService.remove(id, userId);
  }
}
