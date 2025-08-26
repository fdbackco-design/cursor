import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { uploadConfig } from '../common/middleware/upload.middleware';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 모든 상품 조회
  @Get()
  async getAllProducts() {
    const products = await this.productsService.getAllProducts();
    return {
      success: true,
      message: '상품 목록을 성공적으로 불러왔습니다.',
      data: products,
    };
  }

  // 카테고리별 상품 조회
  @Get('category/:categorySlug')
  async getProductsByCategory(@Param('categorySlug') categorySlug: string) {
    const products = await this.productsService.getProductsByCategory(categorySlug);
    return {
      success: true,
      message: '카테고리별 상품 목록을 성공적으로 불러왔습니다.',
      data: products,
    };
  }

  // 상품 상세 조회
  @Get(':id')
  async getProductById(@Param('id') id: string) {
    const product = await this.productsService.getProductById(id);
    if (!product) {
      return {
        success: false,
        message: '상품을 찾을 수 없습니다.',
        data: null,
      };
    }
    return {
      success: true,
      message: '상품 상세 정보를 성공적으로 불러왔습니다.',
      data: product,
    };
  }

  // 상품 검색
  @Get('search')
  async searchProducts(@Query('q') query: string) {
    if (!query || query.trim() === '') {
      return {
        success: false,
        message: '검색어를 입력해주세요.',
        data: [],
      };
    }
    
    const products = await this.productsService.searchProducts(query.trim());
    return {
      success: true,
      message: '검색 결과를 성공적으로 불러왔습니다.',
      data: products,
    };
  }

  // 새 상품 등록 (관리자 전용) - 임시로 인증 제거
  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 5 },
    { name: 'descriptionImages', maxCount: 10 }
  ], uploadConfig))
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files?: { images?: Express.Multer.File[], descriptionImages?: Express.Multer.File[] }
  ) {
    try {
      // 이미지 파일 처리 (files가 undefined일 수 있음)
      const imageUrls = files?.images ? files.images.map(file => file.filename) : [];
      const descriptionImageUrls = files?.descriptionImages ? files.descriptionImages.map(file => file.filename) : [];
      
      // 데이터 변환 및 정규화
      const productData = {
        ...createProductDto,
        // 숫자 필드 변환
        stockQuantity: Number(createProductDto.stockQuantity),
        lowStockThreshold: createProductDto.lowStockThreshold ? Number(createProductDto.lowStockThreshold) : undefined,
        // 불린 필드 변환
        isActive: createProductDto.isActive !== undefined ? Boolean(createProductDto.isActive) : true,
        isFeatured: createProductDto.isFeatured !== undefined ? Boolean(createProductDto.isFeatured) : false,
        // 이미지 배열
        images: imageUrls,
        descriptionImages: descriptionImageUrls
      };

      const product = await this.productsService.createProduct(productData);
      return {
        success: true,
        message: '상품이 성공적으로 등록되었습니다.',
        data: product,
      };
    } catch (error) {
      console.error('상품 등록 에러:', error);
      return {
        success: false,
        message: '상품 등록에 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }

  // 상품 수정 (관리자 전용)
  @Put(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 5 },
    { name: 'descriptionImages', maxCount: 10 }
  ], uploadConfig))
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: any,
    @UploadedFiles() files?: { images?: Express.Multer.File[], descriptionImages?: Express.Multer.File[] }
  ) {
    try {
      // 이미지 파일 처리 (files가 undefined일 수 있음)
      const imageUrls = files?.images ? files.images.map(file => file.filename) : undefined;
      const descriptionImageUrls = files?.descriptionImages ? files.descriptionImages.map(file => file.filename) : undefined;
      
      const productData = {
        ...updateProductDto,
        images: imageUrls,
        descriptionImages: descriptionImageUrls
      };

      const product = await this.productsService.updateProduct(id, productData);
      return {
        success: true,
        message: '상품이 성공적으로 수정되었습니다.',
        data: product,
      };
    } catch (error) {
      console.error('상품 수정 에러:', error);
      return {
        success: false,
        message: '상품 수정에 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }

  // 상품 삭제 (관리자 전용)
  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    try {
      await this.productsService.deleteProduct(id);
      return {
        success: true,
        message: '상품이 성공적으로 삭제되었습니다.',
        data: null,
      };
    } catch (error) {
      console.error('상품 삭제 에러:', error);
      return {
        success: false,
        message: '상품 삭제에 실패했습니다.',
        data: null,
        error: error.message,
      };
    }
  }
}
