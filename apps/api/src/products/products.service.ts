import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // 모든 상품 조회
  async getAllProducts() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        vendor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 카테고리별 상품 조회
  async getProductsByCategory(categorySlug: string) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        category: {
          slug: categorySlug,
        },
      },
      include: {
        category: true,
        vendor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 상품 상세 조회
  async getProductById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        vendor: true,
      },
    });
  }

  // 상품 검색
  async searchProducts(query: string) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query} },
          { description: { contains: query} },
          { category: { name: { contains: query} } },
        ],
      },
      include: {
        category: true,
        vendor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // 새 상품 등록
  // 안전 파서: 문자열이면 JSON.parse, 아니면 그대로
  private parseJsonMaybe<T>(value: unknown, fallback: T): T {
    if (value == null || value === '') return fallback;
    if (typeof value === 'string') {
      try { return JSON.parse(value) as T; } catch { return fallback; }
    }
    return (value as T) ?? fallback;
  }

  private toIntMaybe(v: unknown, fallback: number | null = null): number | null {
    if (v === undefined || v === null || v === '') return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
  }

  // Prisma Decimal은 문자열로 넣는 것이 가장 안전
  private toDecimalString(v: unknown, required = false): string | null {
    if (v === undefined || v === null || v === '') {
      if (required) throw new Error('decimal value required');
      return null;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) {
      if (required) throw new Error('invalid decimal');
      return null;
    }
    return String(v); // "123.45" 식 문자열 유지
  }

  // SKU 자동생성 (카테고리/벤더/시퀀스 조합 등 원하는 규칙으로)
  private async generateSku(name: string, vendorName?: string): Promise<string> {
    const vendorCode = (vendorName ?? 'GEN').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'GEN';
    const base = name.replace(/\s+/g, '-').replace(/[^A-Za-z0-9-]/g, '').slice(0, 12).toUpperCase() || 'ITEM';
    // 중복 방지를 위해 시퀀스(or 난수) 부여
    const seq = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${vendorCode}-${base}-${seq}`;
  }

  async createProduct(createProductDto: any) {
    const { 
      name, 
      description, 
      shortDescription,
      priceB2B, 
      priceB2C, 
      comparePrice,
      sku: providedSku,
      weight,
      length,
      width,
      height,
      category,        // ← 컨트롤러에서 이름 그대로 전달된다고 가정(카테고리 '이름')
      vendor,          // ← 벤더 '이름'
      isActive = true,
      isFeatured = false,
      stockQuantity, 
      lowStockThreshold,
      tags,            // 문자열(예: '["A","B"]') 혹은 배열
      metadata,        // 문자열(예: '{"a":1}') 혹은 객체
      images = [],             // 컨트롤러에서 filename 배열
      descriptionImages = []   // 컨트롤러에서 filename 배열
    } = createProductDto;

    // 1) 카테고리(이름) → id
    let categoryRecord = await this.prisma.category.findFirst({ where: { name: category } });
    if (!categoryRecord) {
      categoryRecord = await this.prisma.category.create({
        data: { 
          name: category,
          slug: category.toLowerCase().replace(/\s+/g, '-')
        }
      });
    }

    // 2) 벤더(이름) → id (선택)
    let vendorRecord = null;
    if (vendor) {
      vendorRecord = await this.prisma.vendor.findFirst({ where: { name: vendor } });
      if (!vendorRecord) {
        vendorRecord = await this.prisma.vendor.create({
          data: { 
            name: vendor,
            code: vendor.substring(0, 4).toUpperCase() || 'VNDR'
          }
        });
      }
    }

    // 3) SKU 자동 생성 (없으면)
    const finalSku = providedSku && String(providedSku).trim().length > 0
      ? String(providedSku).trim()
      : await this.generateSku(name, vendorRecord?.name);

    // 4) 요청값 파싱/정규화
    const decimalPriceB2B = this.toDecimalString(priceB2B, true)!; // required
    const decimalPriceB2C = this.toDecimalString(priceB2C, true)!; // required
    const decimalCompare   = this.toDecimalString(comparePrice, false);

    const intStock    = this.toIntMaybe(stockQuantity, 0) ?? 0;
    const intLowStock = this.toIntMaybe(lowStockThreshold, null);

    const nWeight = this.toIntMaybe(weight, null);
    const nLength = this.toIntMaybe(length, null);
    const nWidth  = this.toIntMaybe(width, null);
    const nHeight = this.toIntMaybe(height, null);

    const tagsArr = this.parseJsonMaybe<string[]>(tags, []);
    const metaObj = this.parseJsonMaybe<any>(metadata, {});

    // 5) 생성
    const product = await this.prisma.product.create({
      data: {
        name,
        description,
        shortDescription: shortDescription ?? null,

        // Decimal 컬럼: 문자열로 전달
        priceB2B: decimalPriceB2B as unknown as Prisma.Decimal,
        priceB2C: decimalPriceB2C as unknown as Prisma.Decimal,
        comparePrice: (decimalCompare ?? undefined) as unknown as Prisma.Decimal,

        sku: finalSku,

        weight: nWeight,
        length: nLength,
        width:  nWidth,
        height: nHeight,

        images,                       // Json
        descriptionImages,            // Json
        tags: tagsArr,                // Json
        metadata: metaObj,            // Json

        categoryId: categoryRecord.id,
        vendorId: vendorRecord?.id ?? null,

        isActive: !!isActive,
        isFeatured: !!isFeatured,

        stockQuantity: intStock,
        lowStockThreshold: intLowStock,
      },
      include: {
        category: true,
        vendor: true,
      },
    });

    return product;
  }

  // 상품 수정
  async updateProduct(id: string, updateProductDto: any) {
    const { 
      name, 
      description, 
      shortDescription,
      priceB2B, 
      priceB2C, 
      comparePrice,
      sku: providedSku,
      weight,
      length,
      width,
      height,
      category, 
      vendor, 
      isActive,
      isFeatured,
      stockQuantity, 
      lowStockThreshold,
      tags,
      metadata,
      images,
      descriptionImages
    } = updateProductDto;

    // 기존 상품 조회
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, vendor: true }
    });

    if (!existingProduct) {
      throw new Error('상품을 찾을 수 없습니다.');
    }

    // 카테고리 찾기 또는 생성
    let categoryRecord = existingProduct.category;
    if (category && category !== existingProduct.category.name) {
      categoryRecord = await this.prisma.category.findFirst({
        where: { name: category }
      });
      
      if (!categoryRecord) {
        categoryRecord = await this.prisma.category.create({
          data: { 
            name: category,
            slug: category.toLowerCase().replace(/\s+/g, '-')
          }
        });
      }
    }

    // 벤더 찾기 또는 생성
    let vendorRecord = existingProduct.vendor;
    if (vendor && vendor !== existingProduct.vendor?.name) {
      vendorRecord = await this.prisma.vendor.findFirst({
        where: { name: vendor }
      });
      
      if (!vendorRecord) {
        vendorRecord = await this.prisma.vendor.create({
          data: { 
            name: vendor,
            code: vendor.substring(0, 4).toUpperCase() || 'VNDR'
          }
        });
      }
    }

    // 상품 업데이트
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: name || existingProduct.name,
        description: description || existingProduct.description,
        shortDescription: shortDescription !== undefined ? shortDescription : existingProduct.shortDescription,
        priceB2B: priceB2B ? parseFloat(priceB2B) : existingProduct.priceB2B,
        priceB2C: priceB2C ? parseFloat(priceB2C) : existingProduct.priceB2C,
        comparePrice: comparePrice !== undefined ? (comparePrice ? parseFloat(comparePrice) : null) : existingProduct.comparePrice,
        sku: providedSku || existingProduct.sku,
        weight: weight !== undefined ? (weight ? parseFloat(weight) : null) : existingProduct.weight,
        length: length !== undefined ? (length ? parseFloat(length) : null) : existingProduct.length,
        width: width !== undefined ? (width ? parseFloat(width) : null) : existingProduct.width,
        height: height !== undefined ? (height ? parseFloat(height) : null) : existingProduct.height,
        images: images !== undefined ? images : existingProduct.images,
        descriptionImages: descriptionImages !== undefined ? descriptionImages : existingProduct.descriptionImages,
        categoryId: categoryRecord.id,
        vendorId: vendorRecord?.id || null,
        isActive: isActive !== undefined ? isActive : existingProduct.isActive,
        isFeatured: isFeatured !== undefined ? isFeatured : existingProduct.isFeatured,
        stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : existingProduct.stockQuantity,
        lowStockThreshold: lowStockThreshold !== undefined ? (lowStockThreshold ? Number(lowStockThreshold) : null) : existingProduct.lowStockThreshold,
        tags: tags !== undefined ? (tags ? JSON.parse(tags) : []) : existingProduct.tags,
        metadata: metadata !== undefined ? (metadata ? JSON.parse(metadata) : null) : existingProduct.metadata
      },
      include: {
        category: true,
        vendor: true,
      },
    });

    return product;
  }

  // 상품 삭제 (소프트 삭제)
  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      throw new Error('상품을 찾을 수 없습니다.');
    }

    // 소프트 삭제: isActive를 false로 설정
    return await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      include: { category: true, vendor: true }
    });
  }
}
