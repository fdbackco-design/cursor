'use client';

import { useState } from 'react';
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
  Filter
} from 'lucide-react';
import Link from 'next/link';

const AnalyticsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedSeller, setSelectedSeller] = useState('all');

  const sellerData = [
    {
      id: 1,
      name: '테크스토어',
      category: '전자제품',
      totalSales: 12500000,
      totalOrders: 156,
      totalProducts: 45,
      monthlyGrowth: 12.5,
      topProducts: ['프리미엄 커피머신', '스마트 블렌더', '무선 이어폰'],
      salesByMonth: [1200000, 1350000, 1420000, 1380000, 1250000, 1320000, 1280000, 1250000, 1300000, 1250000, 1200000, 1250000]
    },
    {
      id: 2,
      name: '홈키친',
      category: '주방용품',
      totalSales: 8900000,
      totalOrders: 98,
      totalProducts: 32,
      monthlyGrowth: 8.2,
      topProducts: ['스마트 블렌더', '전자레인지', '식기세척기'],
      salesByMonth: [850000, 920000, 880000, 900000, 870000, 890000, 920000, 900000, 880000, 890000, 870000, 890000]
    },
    {
      id: 3,
      name: '헬스스토어',
      category: '건강기능식품',
      totalSales: 3200000,
      totalOrders: 45,
      totalProducts: 18,
      monthlyGrowth: -2.1,
      topProducts: ['비타민C 1000mg', '오메가3', '프로바이오틱스'],
      salesByMonth: [320000, 310000, 300000, 290000, 280000, 270000, 260000, 250000, 240000, 230000, 220000, 320000]
    }
  ];

  const overallStats = {
    totalRevenue: 24600000,
    totalOrders: 299,
    totalProducts: 95,
    averageOrderValue: 82300,
    monthlyGrowth: 7.8
  };

  const periods = [
    { value: 'week', label: '주간' },
    { value: 'month', label: '월간' },
    { value: 'quarter', label: '분기' },
    { value: 'year', label: '연간' }
  ];

  const filteredSellerData = selectedSeller === 'all' 
    ? sellerData 
    : sellerData.filter(seller => seller.id === parseInt(selectedSeller));

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
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">전체 셀러</option>
                {sellerData.map(seller => (
                  <option key={seller.id} value={seller.id}>{seller.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 전체 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 매출</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(overallStats.totalRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                +{overallStats.monthlyGrowth}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 주문</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.totalOrders}건</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 상품</p>
                  <p className="text-2xl font-bold text-gray-900">{overallStats.totalProducts}개</p>
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
                    {formatCurrency(overallStats.averageOrderValue)}
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
                  <p className="text-2xl font-bold text-gray-900">{sellerData.length}명</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 셀러별 상세 분석 */}
        <div className="space-y-6">
          {filteredSellerData.map((seller) => (
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
                    <span className={`text-sm font-medium ${getGrowthColor(seller.monthlyGrowth)}`}>
                      {getGrowthIcon(seller.monthlyGrowth)}
                      {seller.monthlyGrowth >= 0 ? '+' : ''}{seller.monthlyGrowth}%
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
                    <p className="text-sm font-medium text-gray-600">인기 상품</p>
                    <div className="space-y-1">
                      {seller.topProducts.slice(0, 3).map((product, index) => (
                        <p key={index} className="text-sm text-gray-700">{product}</p>
                      ))}
                    </div>
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
          ))}
        </div>

        {/* 추가 분석 도구 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>기간별 비교</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">이전 기간과의 매출 비교 및 성장률 분석</p>
              <Button className="mt-4" variant="outline">
                상세 분석 보기
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>카테고리별 분석</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">카테고리별 매출 및 인기 상품 분석</p>
              <Button className="mt-4" variant="outline">
                카테고리 분석
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
