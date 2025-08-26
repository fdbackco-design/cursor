'use client';

import { useState } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Truck, Package, MapPin, Calendar, Search } from 'lucide-react';

export default function DeliveryPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Mock 배송 데이터
  const mockDeliveries = [
    {
      id: '1',
      trackingNumber: 'DL123456789',
      status: '배송중',
      product: '무선청소기',
      destination: '서울시 강남구 테헤란로 123',
      estimatedDelivery: '2025-08-25',
      currentLocation: '서울시 강남구 배송센터',
      courier: 'CJ대한통운',
    },
    {
      id: '2',
      trackingNumber: 'DL987654321',
      status: '배송완료',
      product: '공기청정기',
      destination: '부산시 해운대구 해운대로 456',
      estimatedDelivery: '2025-08-23',
      currentLocation: '부산시 해운대구 배송센터',
      courier: '한진택배',
    },
  ];

  const handleSearch = () => {
    if (trackingNumber.trim()) {
      // 실제로는 API 호출
      const result = mockDeliveries.filter(d => 
        d.trackingNumber.includes(trackingNumber) || 
        d.product.includes(trackingNumber)
      );
      setSearchResults(result);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '배송중':
        return 'text-blue-600 bg-blue-100';
      case '배송완료':
        return 'text-green-600 bg-green-100';
      case '배송준비중':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">배송 조회</h1>
          <p className="text-gray-600 mt-2">주문한 상품의 배송 상태를 확인하세요.</p>
        </div>

        {/* 배송 조회 검색 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              배송 조회
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="운송장번호 또는 상품명을 입력하세요"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={handleSearch}>
                조회하기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">검색 결과</h2>
            <div className="space-y-4">
              {searchResults.map((delivery) => (
                <Card key={delivery.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-gray-400" />
                          <span className="font-medium">{delivery.product}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600">{delivery.courier}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600">{delivery.destination}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            예상 배송일: {delivery.estimatedDelivery}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                            {delivery.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          현재 위치: {delivery.currentLocation}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 최근 배송 내역 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 배송 내역</CardTitle>
          </CardHeader>
          <CardContent>
            {mockDeliveries.length > 0 ? (
              <div className="space-y-4">
                {mockDeliveries.map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Truck className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{delivery.product}</h3>
                        <p className="text-sm text-gray-600">{delivery.trackingNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                        {delivery.status}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">{delivery.estimatedDelivery}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>배송 내역이 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
