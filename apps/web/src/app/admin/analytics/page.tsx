'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Calendar,
  Filter,
  RefreshCw,
  ShoppingCart,
  Award,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { 
  analyticsApi, 
  SellerSales, 
  VendorSales, 
  ProductSales, 
  PopularProduct, 
  ReturnRateData, 
  AnalyticsOverview 
} from '@/lib/api/analytics';

const AnalyticsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'seller' | 'vendor' | 'product' | 'return'>('seller');

  // 데이터 상태
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [sellerData, setSellerData] = useState<SellerSales[]>([]);
  const [vendorData, setVendorData] = useState<VendorSales[]>([]);
  const [productData, setProductData] = useState<ProductSales[]>([]);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [returnRateData, setReturnRateData] = useState<ReturnRateData[]>([]);

  const periods = [
    { value: 'week', label: '주간' },
    { value: 'month', label: '월간' },
    { value: 'quarter', label: '분기' },
    { value: 'year', label: '연간' }
  ];

  // 데이터 로딩 함수
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [
        overviewResponse,
        sellerResponse,
        vendorResponse,
        productResponse,
        popularResponse,
        returnResponse
      ] = await Promise.all([
        analyticsApi.getOverview(selectedPeriod),
        analyticsApi.getSellerSales(selectedPeriod),
        analyticsApi.getVendorSales(selectedPeriod),
        analyticsApi.getProductSales(selectedPeriod),
        analyticsApi.getPopularProducts(selectedPeriod, 10),
        analyticsApi.getReturnRate(selectedPeriod)
      ]);

      console.log('분석 데이터 응답:', {
        overview: overviewResponse,
        seller: sellerResponse,
        vendor: vendorResponse,
        product: productResponse,
        popular: popularResponse,
        return: returnResponse
      });

      // apiRequest가 래핑한 데이터 구조 처리
      setOverview(overviewResponse.success ? overviewResponse.data : overviewResponse as any);
      setSellerData(sellerResponse.success ? sellerResponse.data : sellerResponse as any);
      setVendorData(vendorResponse.success ? vendorResponse.data : vendorResponse as any);
      setProductData(productResponse.success ? productResponse.data : productResponse as any);
      setPopularProducts(popularResponse.success ? popularResponse.data : popularResponse as any);
      setReturnRateData(returnResponse.success ? returnResponse.data : returnResponse as any);
    } catch (error) {
      console.error('분석 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                ← 뒤로가기
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">판매량 분석</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>{period.label}</option>
                ))}
              </select>
              <Button onClick={loadAnalyticsData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 전체 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {loading ? (
            // 로딩 스켈레톤
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : overview ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">총 매출</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(overview.totalRevenue)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className={`mt-2 flex items-center text-sm ${getGrowthColor(overview.monthlyGrowth || 0)}`}>
                    {getGrowthIcon(overview.monthlyGrowth || 0)}
                    {(overview.monthlyGrowth || 0) >= 0 ? '+' : ''}{(overview.monthlyGrowth || 0).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">총 주문</p>
                      <p className="text-2xl font-bold text-gray-900">{overview.totalOrders}건</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">총 상품</p>
                      <p className="text-2xl font-bold text-gray-900">{overview.totalProducts}개</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">평균 주문액</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(overview.averageOrderValue)}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">활성 셀러</p>
                      <p className="text-2xl font-bold text-gray-900">{overview.totalSellers}명</p>
                    </div>
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <Users className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'seller', label: '셀러별 매출', icon: Users },
              { id: 'vendor', label: '벤더별 매출', icon: Package },
              { id: 'product', label: '상품별 매출 & 인기상품', icon: Award },
              { id: 'return', label: '반품율 분석', icon: AlertTriangle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'seller' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">셀러별 매출 분석</h2>
              <Button onClick={loadAnalyticsData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
            </div>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="h-8 bg-gray-200 rounded"></div>
                          <div className="h-8 bg-gray-200 rounded"></div>
                          <div className="h-8 bg-gray-200 rounded"></div>
                          <div className="h-8 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              sellerData.map((seller) => (
            <Card key={seller.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{seller.name}</h3>
                      <p className="text-sm text-gray-500">{seller.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm font-medium ${getGrowthColor(seller.monthlyGrowth || 0)}`}>
                      {getGrowthIcon(seller.monthlyGrowth || 0)}
                      {(seller.monthlyGrowth || 0) >= 0 ? '+' : ''}{seller.monthlyGrowth || 0}%
                    </span>
                    <Button variant="outline" size="sm">
                      상세보기
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">총 매출</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(seller.totalSales)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">총 주문</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {seller.totalOrders}건
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">등록 상품</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {seller.totalProducts}개
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">평균 주문액</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(seller.averageOrderValue)}
                    </p>
                  </div>
                </div>

                {/* 월별 매출 차트 (간단한 바 차트) */}
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-600 mb-3">월별 매출 추이</p>
                  <div className="flex items-end space-x-1 h-32">
                    {seller.salesByMonth.map((monthlySales, index) => {
                      const maxSales = Math.max(...seller.salesByMonth);
                      const height = (monthlySales / maxSales) * 100;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-teal-500 rounded-t"
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-xs text-gray-500 mt-1">
                            {index + 1}월
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
              ))
            )}
          </div>
        )}

        {/* 벤더별 매출 탭 */}
        {activeTab === 'vendor' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">벤더별 매출 분석</h2>
              <Button onClick={loadAnalyticsData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
            </div>
            {loading ? (
              <div className="text-center py-8">로딩 중...</div>
            ) : (
              <div className="grid gap-6">
                {vendorData.map((vendor) => (
                  <Card key={vendor.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                            <p className="text-sm text-gray-500">코드: {vendor.code}</p>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${getGrowthColor(vendor.monthlyGrowth || 0)}`}>
                          {getGrowthIcon(vendor.monthlyGrowth || 0)}
                          {(vendor.monthlyGrowth || 0) >= 0 ? '+' : ''}{(vendor.monthlyGrowth || 0).toFixed(1)}%
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">총 매출</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(vendor.totalSales)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">총 주문</p>
                          <p className="text-2xl font-bold text-gray-900">{vendor.totalOrders}건</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">등록 상품</p>
                          <p className="text-2xl font-bold text-gray-900">{vendor.totalProducts}개</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">평균 주문액</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(vendor.averageOrderValue)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">인기 상품</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {vendor.topProducts.map((product, index) => (
                            <div key={index} className="bg-gray-50 p-2 rounded text-sm text-gray-700">
                              {product}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 상품별 매출 & 인기상품 탭 */}
        {activeTab === 'product' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">상품별 매출 & 인기상품 분석</h2>
              <Button onClick={loadAnalyticsData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
            </div>

            {/* 인기 상품 랭킹 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <span>인기 상품 TOP 10</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">로딩 중...</div>
                ) : (
                  <div className="space-y-4">
                    {popularProducts.slice(0, 10).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-yellow-600">#{product.rank}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.vendor} • {product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{product.unitsSold}개 판매</p>
                          <p className="text-sm text-gray-500">{formatCurrency(product.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 상품별 매출 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>상품별 매출 현황</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">로딩 중...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">상품명</th>
                          <th className="text-left py-2">벤더</th>
                          <th className="text-left py-2">카테고리</th>
                          <th className="text-right py-2">판매수량</th>
                          <th className="text-right py-2">총 매출</th>
                          <th className="text-right py-2">반품율</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productData.slice(0, 20).map((product) => (
                          <tr key={product.id} className="border-b">
                            <td className="py-2 font-medium">{product.name}</td>
                            <td className="py-2 text-gray-600">{product.vendor}</td>
                            <td className="py-2 text-gray-600">{product.category}</td>
                            <td className="py-2 text-right">{product.unitsSold}개</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(product.totalRevenue)}</td>
                            <td className="py-2 text-right">
                              <span className={`${product.returnRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                                {product.returnRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 반품율 분석 탭 */}
        {activeTab === 'return' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">상품별 반품율 분석</h2>
              <Button onClick={loadAnalyticsData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">로딩 중...</div>
            ) : (
              <div className="grid gap-6">
                {returnRateData.map((product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.vendor} • {product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${product.returnRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                            {product.returnRate}%
                          </p>
                          <p className="text-sm text-gray-500">반품율</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-4">판매/반품 현황</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">총 판매수량</span>
                              <span className="font-medium">{product.totalSold}개</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">총 반품수량</span>
                              <span className="font-medium text-red-600">{product.totalReturns}개</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-4">반품 사유</h4>
                          <div className="space-y-2">
                            {product.returnReasons.map((reason, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">{reason.reason}</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-red-400 h-2 rounded-full" 
                                      style={{ width: `${(reason.count / product.totalReturns) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">{reason.count}개</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
