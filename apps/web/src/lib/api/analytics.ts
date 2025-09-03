import { apiRequest } from './base';

export interface SellerSales {
  id: string;
  name: string;
  category: string;
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  monthlyGrowth: number;
  averageOrderValue: number;
  salesByMonth: number[];
}

export interface VendorSales {
  id: string;
  name: string;
  code: string;
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  monthlyGrowth: number;
  averageOrderValue: number;
  topProducts: string[];
  salesByMonth: number[];
}

export interface ProductSales {
  id: string;
  name: string;
  vendor: string;
  category: string;
  price: number;
  unitsSold: number;
  totalRevenue: number;
  returnRate: number;
  salesTrend: number[];
}

export interface PopularProduct extends ProductSales {
  rank: number;
}

export interface ReturnRateData {
  id: string;
  name: string;
  vendor: string;
  category: string;
  totalSold: number;
  totalReturns: number;
  returnRate: number;
  returnReasons: Array<{
    reason: string;
    count: number;
  }>;
}

export interface AnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalSellers: number;
  totalVendors: number;
  averageOrderValue: number;
  monthlyGrowth: number;
  period: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export const analyticsApi = {
  // 셀러별 매출 분석
  async getSellerSales(period: string = 'month', sellerId?: string): Promise<SellerSales[]> {
    const params = new URLSearchParams();
    params.append('period', period);
    if (sellerId) params.append('sellerId', sellerId);

    const queryString = params.toString();
    const endpoint = `/analytics/seller-sales${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<SellerSales[]>(endpoint, {
      method: 'GET',
    }) as Promise<SellerSales[]>;
  },

  // 벤더별 매출 분석
  async getVendorSales(period: string = 'month', vendorId?: string): Promise<VendorSales[]> {
    const params = new URLSearchParams();
    params.append('period', period);
    if (vendorId) params.append('vendorId', vendorId);

    const queryString = params.toString();
    const endpoint = `/analytics/vendor-sales${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<VendorSales[]>(endpoint, {
      method: 'GET',
    }) as Promise<VendorSales[]>;
  },

  // 상품별 매출 분석
  async getProductSales(period: string = 'month', productId?: string): Promise<ProductSales[]> {
    const params = new URLSearchParams();
    params.append('period', period);
    if (productId) params.append('productId', productId);

    const queryString = params.toString();
    const endpoint = `/analytics/product-sales${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<ProductSales[]>(endpoint, {
      method: 'GET',
    }) as Promise<ProductSales[]>;
  },

  // 인기 상품 분석
  async getPopularProducts(period: string = 'month', limit: number = 10): Promise<PopularProduct[]> {
    const params = new URLSearchParams();
    params.append('period', period);
    params.append('limit', limit.toString());

    const queryString = params.toString();
    const endpoint = `/analytics/popular-products${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<PopularProduct[]>(endpoint, {
      method: 'GET',
    }) as Promise<PopularProduct[]>;
  },

  // 상품별 반품율 분석
  async getReturnRate(period: string = 'month', productId?: string): Promise<ReturnRateData[]> {
    const params = new URLSearchParams();
    params.append('period', period);
    if (productId) params.append('productId', productId);

    const queryString = params.toString();
    const endpoint = `/analytics/return-rate${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<ReturnRateData[]>(endpoint, {
      method: 'GET',
    }) as Promise<ReturnRateData[]>;
  },

  // 전체 개요
  async getOverview(period: string = 'month'): Promise<AnalyticsOverview> {
    const params = new URLSearchParams();
    params.append('period', period);

    const queryString = params.toString();
    const endpoint = `/analytics/overview${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<AnalyticsOverview>(endpoint, {
      method: 'GET',
    }) as Promise<AnalyticsOverview>;
  },
};
