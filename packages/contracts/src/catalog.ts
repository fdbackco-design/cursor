import { z } from "zod";

// 상품 카테고리
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  parentId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Category = z.infer<typeof CategorySchema>;

// 상품 스키마
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  shortDescription: z.string().optional(),
  priceB2B: z.number().positive(),
  priceB2C: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  sku: z.string(),
  barcode: z.string().optional(),
  weight: z.number().optional(),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  images: z.array(z.string()),
  categoryId: z.string(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  stockQuantity: z.number().nonnegative(),
  lowStockThreshold: z.number().nonnegative().optional(),
  tags: z.array(z.string()),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;

// 상품 생성 요청
export const CreateProductRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  shortDescription: z.string().optional(),
  priceB2B: z.number().positive(),
  priceB2C: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  }).optional(),
  images: z.array(z.string().url()),
  categoryId: z.string(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  stockQuantity: z.number().nonnegative(),
  lowStockThreshold: z.number().nonnegative().optional(),
  tags: z.array(z.string()),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

// 상품 수정 요청
export const UpdateProductRequestSchema = CreateProductRequestSchema.partial();

export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

// 상품 목록 조회 요청
export const GetProductsRequestSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(20),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  sortBy: z.enum(["name", "price", "createdAt", "popularity"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export type GetProductsRequest = z.infer<typeof GetProductsRequestSchema>;

// 상품 목록 응답
export const GetProductsResponseSchema = z.object({
  products: z.array(ProductSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type GetProductsResponse = z.infer<typeof GetProductsResponseSchema>;
