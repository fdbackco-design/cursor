'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Percent, DollarSign, Truck, Calendar, Users, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { couponsApi, Coupon } from '@/lib/api/coupons';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const couponsData = await couponsApi.getAllCoupons();
      setCoupons(couponsData);
    } catch (error) {
      console.error('쿠폰 목록 조회 실패:', error);
      alert('쿠폰 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (couponId: string) => {
    try {
      await couponsApi.toggleCouponStatus(couponId);
      alert('쿠폰 상태가 변경되었습니다.');
      await loadCoupons(); // 목록 새로고침
    } catch (error) {
      console.error('쿠폰 상태 변경 실패:', error);
      alert('쿠폰 상태 변경에 실패했습니다.');
    }
  };

  const handleDeleteCoupon = async (couponId: string, couponName: string) => {
    if (!confirm(`'${couponName}' 쿠폰을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await couponsApi.deleteCoupon(couponId);
      alert('쿠폰이 삭제되었습니다.');
      await loadCoupons(); // 목록 새로고침
    } catch (error) {
      console.error('쿠폰 삭제 실패:', error);
      alert('쿠폰 삭제에 실패했습니다.');
    }
  };

  const getDiscountTypeIcon = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="h-4 w-4" />;
      case 'FIXED_AMOUNT':
        return <DollarSign className="h-4 w-4" />;
      case 'FREE_SHIPPING':
        return <Truck className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getDiscountTypeText = (type: string) => {
    switch (type) {
      case 'PERCENTAGE':
        return '할인율';
      case 'FIXED_AMOUNT':
        return '정액할인';
      case 'FREE_SHIPPING':
        return '무료배송';
      default:
        return type;
    }
  };

  const formatDiscountValue = (type: string, value: number) => {
    switch (type) {
      case 'PERCENTAGE':
        return `${value}%`;
      case 'FIXED_AMOUNT':
        return `${value.toLocaleString()}원`;
      case 'FREE_SHIPPING':
        return '무료배송';
      default:
        return value.toString();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const isExpired = (endDate?: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = 
      coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coupon.description && coupon.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === '' || coupon.discountType === selectedType;
    
    const matchesStatus = selectedStatus === '' || 
      (selectedStatus === 'active' && coupon.isActive) ||
      (selectedStatus === 'inactive' && !coupon.isActive) ||
      (selectedStatus === 'expired' && isExpired(coupon.endsAt));

    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">쿠폰 목록을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">쿠폰 관리</h1>
            <p className="text-gray-600 mt-1">할인 쿠폰을 생성하고 관리하세요</p>
          </div>
          <Link href="/admin/coupons/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              새 쿠폰 등록
            </Button>
          </Link>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">전체 쿠폰</p>
                  <p className="text-2xl font-semibold text-gray-900">{coupons.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ToggleRight className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">활성 쿠폰</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {coupons.filter(c => c.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">만료된 쿠폰</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {coupons.filter(c => isExpired(c.endsAt)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">총 사용 횟수</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {coupons.reduce((sum, c) => sum + c.currentUses, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="쿠폰명, 코드, 설명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">모든 할인 유형</option>
                <option value="PERCENTAGE">할인율</option>
                <option value="FIXED_AMOUNT">정액할인</option>
                <option value="FREE_SHIPPING">무료배송</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">모든 상태</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="expired">만료됨</option>
              </select>

              <Button 
                onClick={loadCoupons}
                className="bg-gray-600 hover:bg-gray-700"
              >
                새로고침
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 쿠폰 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>쿠폰 목록 ({filteredCoupons.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCoupons.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">등록된 쿠폰이 없습니다.</p>
                <Link href="/admin/coupons/new">
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    첫 번째 쿠폰 등록하기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        쿠폰 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        할인 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용 현황
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        유효 기간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCoupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{coupon.name}</div>
                            <div className="text-sm text-gray-600 font-mono">{coupon.code}</div>
                            {coupon.description && (
                              <div className="text-xs text-gray-500 mt-1">{coupon.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getDiscountTypeIcon(coupon.discountType)}
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDiscountValue(coupon.discountType, coupon.discountValue)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {getDiscountTypeText(coupon.discountType)}
                              </div>
                              {coupon.minAmount && (
                                <div className="text-xs text-gray-500">
                                  최소: {coupon.minAmount.toLocaleString()}원
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {coupon.currentUses}
                            {coupon.maxUses ? ` / ${coupon.maxUses}` : ' / 무제한'}
                          </div>
                          {coupon.userMaxUses && (
                            <div className="text-xs text-gray-500">
                              개인 한도: {coupon.userMaxUses}회
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(coupon.startsAt)} ~
                          </div>
                          <div className={`text-sm ${isExpired(coupon.endsAt) ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(coupon.endsAt)}
                          </div>
                          {isExpired(coupon.endsAt) && (
                            <div className="text-xs text-red-500">만료됨</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(coupon.id)}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              coupon.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {coupon.isActive ? (
                              <ToggleRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ToggleLeft className="h-3 w-3 mr-1" />
                            )}
                            {coupon.isActive ? '활성' : '비활성'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link href={`/admin/coupons/${coupon.id}`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCoupon(coupon.id, coupon.name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
    </div>
  );
}
