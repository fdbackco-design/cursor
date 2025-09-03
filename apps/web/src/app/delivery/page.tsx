'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui';
import { ArrowLeft, Search, Package, Truck, CheckCircle, Clock, AlertCircle, Filter, Calendar } from 'lucide-react';
import Link from 'next/link';
import { deliveryApi, DeliveryTrackingInfo, DeliveryStats } from '@/lib/api/delivery';
import { useAuth } from '@/contexts/AuthContext';
import { useToast, toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/utils/image';

export default function DeliveryPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [trackingData, setTrackingData] = useState<DeliveryTrackingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const loadDeliveryStats = useCallback(async () => {
    try {
      const response = await deliveryApi.getStats();
      if (response.success && response.data) {
        setDeliveryStats(response.data);
      } else {
        console.error('배송 통계 API 응답 오류:', response.error);
        // 기본값 설정
        setDeliveryStats({
          totalOrders: 0,
          statusBreakdown: {},
          recentOrders: []
        });
      }
    } catch (error) {
      console.error('배송 통계 로드 실패:', error);
      // 기본값 설정
      setDeliveryStats({
        totalOrders: 0,
        statusBreakdown: {},
        recentOrders: []
      });
    }
  }, []);

  const loadUserDeliveryTracking = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const query = {
        ...(selectedStatus && { status: selectedStatus }),
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
      };
      
      const response = await deliveryApi.getUserDeliveryTracking(query);
      if (response.success && response.data) {
        setTrackingData(response.data);
      } else {
        console.error('배송 추적 API 응답 오류:', response.error);
        setTrackingData([]);
      }
    } catch (error) {
      console.error('배송 추적 데이터 로드 실패:', error);
      setTrackingData([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedStatus, dateRange.start, dateRange.end]);

  useEffect(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated || !user) {
      router.push('/signin');
      return;
    }
    
    // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
    if (isAuthenticated && user && !user.approve) {
      router.push('/approval-pending');
      return;
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    loadDeliveryStats();
  }, [loadDeliveryStats]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserDeliveryTracking();
    }
  }, [isAuthenticated, loadUserDeliveryTracking]);

  const handleSearchByOrderNumber = async () => {
    if (!searchOrderNumber.trim()) return;
    
    try {
      setLoading(true);
      const response = await deliveryApi.trackByOrderNumber(searchOrderNumber.trim());
      if (response.success && response.data) {
        setTrackingData(response.data);
      } else {
        showToast(toast.warning('주문 없음', '주문을 찾을 수 없습니다.'));
        setTrackingData([]);
      }
    } catch (error) {
      console.error('주문 검색 실패:', error);
      showToast(toast.error('주문 검색 오류', '주문 검색 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    if (isAuthenticated) {
      loadUserDeliveryTracking();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'CONFIRMED':
      case 'PROCESSING':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'SHIPPED':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'DELIVERED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'CANCELLED':
      case 'REFUNDED':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'CONFIRMED':
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'SHIPPED':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'DELIVERED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated || !user) {
    return null;
  }
  
  // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
  if (isAuthenticated && user && !user.approve) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">배송 조회</h1>
          <p className="text-gray-600 mt-2">
            주문번호로 배송 상태를 확인하거나 내 배송 내역을 조회할 수 있습니다.
          </p>
        </div>

        {/* 주문번호 검색 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2 text-blue-600" />
              주문번호로 배송 조회
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="주문번호를 입력하세요 (예: ORD-20240101-001)"
                value={searchOrderNumber}
                onChange={(e) => setSearchOrderNumber(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearchByOrderNumber()}
              />
              <Button 
                onClick={handleSearchByOrderNumber}
                disabled={!searchOrderNumber.trim()}
                className="px-6"
              >
                <Search className="h-4 w-4 mr-2" />
                조회
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 배송 통계 */}
        {deliveryStats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">전체 주문</p>
                    <p className="text-2xl font-bold text-gray-900">{deliveryStats.totalOrders || 0}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">배송중</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {deliveryStats.statusBreakdown?.SHIPPED || 0}
                    </p>
                  </div>
                  <Truck className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">배송완료</p>
                    <p className="text-2xl font-bold text-green-600">
                      {deliveryStats.statusBreakdown?.DELIVERED || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">준비중</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(deliveryStats.statusBreakdown?.CONFIRMED || 0) + (deliveryStats.statusBreakdown?.PROCESSING || 0)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 로그인 사용자 전용 필터 */}
        {isAuthenticated && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2 text-gray-600" />
                내 배송 내역 필터
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">배송 상태</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">전체</option>
                    <option value="PENDING">주문 대기</option>
                    <option value="CONFIRMED">주문 확인</option>
                    <option value="PROCESSING">상품 준비중</option>
                    <option value="SHIPPED">배송중</option>
                    <option value="DELIVERED">배송 완료</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleFilterChange}>
                  <Filter className="h-4 w-4 mr-2" />
                  필터 적용
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 배송 추적 결과 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">배송 정보를 불러오는 중...</p>
          </div>
        ) : trackingData.length > 0 ? (
          <div className="space-y-6">
            {trackingData.map((tracking, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">주문번호: {tracking.orderNumber}</h3>
                      <p className="text-gray-600">{tracking.customerInfo.name} | {formatDate(tracking.createdAt)}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center ${getStatusColor(tracking.status)}`}>
                      {getStatusIcon(tracking.status)}
                      <span className="ml-2">{tracking.statusText}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* 주문 상품 정보 */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">주문 상품</h4>
                    <div className="space-y-2">
                      {tracking.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                          <div className="flex items-center">
                            {item.product?.images && item.product.images.length > 0 && (
                              <img 
                                src={getImageUrl(item.product.images[0])}
                                alt={item.product?.name || '상품'}
                                className="w-12 h-12 object-cover rounded mr-3"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.product?.name || '상품명 없음'}</p>
                              <p className="text-sm text-gray-600">수량: {item.quantity || 0}개</p>
                            </div>
                          </div>
                          <p className="font-medium">{formatCurrency(item.finalPrice || 0)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-right">
                      <p className="text-lg font-bold">총 결제금액: {formatCurrency(tracking.totalAmount)}</p>
                    </div>
                  </div>

                  {/* 배송 단계 */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-4">배송 진행 상황</h4>
                    <div className="relative">
                      {tracking.deliverySteps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-start mb-4 last:mb-0">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 mr-4 ${
                            step.completed 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                            {step.completed ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h5 className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                              {step.title}
                            </h5>
                            <p className={`text-sm ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                              {step.description}
                            </p>
                            {step.date && (
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(step.date)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 예상 배송일 */}
                  {tracking.estimatedDelivery && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium text-blue-900">예상 배송 완료일</span>
                      </div>
                      <p className="text-blue-700 mt-1">
                        {formatDate(tracking.estimatedDelivery)}
                      </p>
                    </div>
                  )}

                  {/* 배송 정보 */}
                  {tracking.shipment && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-3">배송 정보</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">택배사:</span> {tracking.shipment.carrier || '정보 없음'}
                          </p>
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">송장번호:</span> {tracking.shipment.trackingNumber || '정보 없음'}
                          </p>
                        </div>
                        <div>
                          {tracking.shipment.shippedAt && (
                            <p className="text-sm text-blue-700">
                              <span className="font-medium">발송일:</span> {formatDate(tracking.shipment.shippedAt)}
                            </p>
                          )}
                          {tracking.shipment.deliveredAt && (
                            <p className="text-sm text-blue-700">
                              <span className="font-medium">배송완료일:</span> {formatDate(tracking.shipment.deliveredAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 배송지 정보 */}
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">배송지 정보</h4>
                    <div className="text-sm text-gray-600">
                      <p>받는 분: {tracking.shippingAddress?.receiver_name || tracking.customerInfo?.name || '정보 없음'}</p>
                      <p>연락처: {tracking.customerInfo?.phone || '정보 없음'}</p>
                      <p>주소: {tracking.shippingAddress?.base_address || ''} {tracking.shippingAddress?.detail_address || ''}</p>
                      <p>우편번호: {tracking.shippingAddress?.zone_number || '정보 없음'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">배송 정보가 없습니다</h3>
              <p className="text-gray-600">
                {isAuthenticated 
                  ? '주문 내역이 없거나 검색 조건에 맞는 결과가 없습니다.' 
                  : '주문번호를 입력하여 배송 상태를 확인해보세요.'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* 배송 안내 */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>배송 안내</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📦 배송 시간</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 결제 완료 후 1-2일 내 상품 준비 (영업일 기준)</li>
                <li>• 배송 시작 후 1-3일 내 배송 완료 (도서산간 지역 제외)</li>
                <li>• 주말 및 공휴일은 배송이 중단됩니다</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🚚 배송비</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 3만원 이상 주문 시 무료배송</li>
                <li>• 3만원 미만 주문 시 배송비 3,000원</li>
                <li>• 제주/도서산간 지역 추가 배송비 별도</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📞 배송 문의</h4>
              <p className="text-sm text-gray-600">
                배송 관련 문의사항은 고객센터로 연락주시기 바랍니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}