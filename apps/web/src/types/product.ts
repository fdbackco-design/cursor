export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  shortDescription?: string;
  priceB2B: number;
  priceB2C: number;
  comparePrice?: number;
  sku: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  images: string[];
  descriptionImages?: string[];
  categoryId: string;
  vendorId?: string;
  isActive: boolean;
  isFeatured: boolean;
  stockQuantity: number;
  lowStockThreshold?: number;
  tags: string[];
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  
  // 관계 데이터
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  vendor?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data?: Product | Product[];
}
