import { Controller, Get, Post, Body, Delete, Param, UseGuards, Req, UseInterceptors, UploadedFile, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('home-order')
  @UseGuards(JwtAuthGuard)
  async getHomeOrder() {
    return this.adminService.getHomeOrder();
  }

  @Post('home-order')
  @UseGuards(JwtAuthGuard)
  async updateHomeOrder(@Body() body: { categoryProducts: any; mdPicks: string[] }) {
    return this.adminService.updateHomeOrder(body.categoryProducts, body.mdPicks);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getAdminStats() {
    return this.adminService.getAdminStats();
  }

  @Get('product-attributes')
  @UseGuards(JwtAuthGuard)
  async getProductAttributes() {
    return this.adminService.getProductAttributes();
  }

  @Post('product-attributes')
  @UseGuards(JwtAuthGuard)
  async updateProductAttributes(@Body() body: { shortDescription: string }) {
    return this.adminService.updateProductAttributes(body.shortDescription);
  }

  // 배너 목록 조회 (공개 접근 가능)
  @Get('banners')
  async getBanners() {
    return this.adminService.getBanners();
  }

  // 배너 추가/수정
  @Post('banners')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    storage: memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }))
  async saveBanner(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: any
  ) {
    // 새 배너 추가 시에만 이미지 필수
    if (!body.id && !file) {
      return {
        success: false,
        error: '새 배너를 추가하려면 이미지 파일이 필요합니다.'
      };
    }

    const bannerData = {
      id: body.id ? parseInt(body.id) : undefined,
      image: file,
      title: body.title,
      description: body.description,
      buttonText: body.buttonText,
      buttonLink: body.buttonLink,
    };

    return this.adminService.saveBanner(bannerData);
  }

  // 배너 삭제
  @Delete('banners/:id')
  @UseGuards(JwtAuthGuard)
  async deleteBanner(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteBanner(id);
  }
}