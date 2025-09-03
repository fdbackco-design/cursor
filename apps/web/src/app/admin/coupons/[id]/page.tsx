'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeft, Save, Percent, DollarSign, Truck, Edit, ToggleLeft, ToggleRight, Calendar, Users, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { couponsApi, Coupon, UpdateCouponDto } from '@/lib/api/coupons';
import { useToast, toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-modal';

export default function CouponDetailPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params.id as string;
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateCouponDto>({});

  useEffect(() => {
    if (couponId) {
      loadCoupon();
    }
  }, [couponId]);

  const loadCoupon = async () => {
    try {
      setLoading(true);
      const response = await couponsApi.getAdminCouponById(couponId);
      if (!response.success || !response.data) {
        throw new Error(response.error || '쿠폰 정보를 불러올 수 없습니다.');
      }
      
      const couponData = response.data;
      setCoupon(couponData);
      
      // 편집 모드용 폼 데이터 초기화
      setFormData({
        code: couponData.code,
        name: couponData.name,
        description: couponData.description || '',
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        minAmount: couponData.minAmount || undefined,
        maxAmount: couponData.maxAmount || undefined,
        maxUses: couponData.maxUses || undefined,
        userMaxUses: couponData.userMaxUses || undefined,
        startsAt: couponData.startsAt ? new Date(couponData.startsAt).toISOString().slice(0, 16) : '',
        endsAt: couponData.endsAt ? new Date(couponData.endsAt).toISOString().slice(0, 16) : '',
        isActive: couponData.isActive
      });
    } catch (error) {
      console.error('쿠폰 조회 실패:', error);
      showToast(toast.error('쿠폰 조회 실패', '쿠폰 정보를 불러오는데 실패했습니다.'));
      router.push('/admin/coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === 'number') {
      processedValue = value === '' ? undefined : parseFloat(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleToggleStatus = async () => {
    try {
      await couponsApi.toggleCouponStatus(couponId);
      showToast(toast.success('쿠폰 상태 변경', '쿠폰 상태가 변경되었습니다.'));
      await loadCoupon();
    } catch (error) {
      console.error('쿠폰 상태 변경 실패:', error);
      showToast(toast.error('쿠폰 상태 변경 실패', '쿠폰 상태 변경에 실패했습니다.'));
    }
  };

  const validateForm = () => {
    if (!formData.code?.trim()) {
      showToast(toast.warning('쿠폰 코드 입력 필요', '쿠폰 코드를 입력해주세요.'));
      return false;
    }

    if (!formData.name?.trim()) {
      showToast(toast.warning('쿠폰명 입력 필요', '쿠폰명을 입력해주세요.'));
      return false;
    }

    if (!formData.discountValue || formData.discountValue <= 0) {
      showToast(toast.warning('할인값 오류', '할인값을 올바르게 입력해주세요.'));
      return false;
    }

    if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
      showToast(toast.warning('할인율 오류', '할인율은 100%를 초과할 수 없습니다.'));
      return false;
    }

    if (formData.minAmount && formData.maxAmount && formData.minAmount < formData.maxAmount) {
      showToast(toast.warning('주문 금액 오류', '최소 주문 금액은 최대 할인 금액보다 크거나 같아야 합니다.'));
      return false;
    }

    if (formData.startsAt && formData.endsAt && new Date(formData.startsAt) > new Date(formData.endsAt)) {
      showToast(toast.warning('날짜 오류', '시작일이 종료일보다 늦을 수 없습니다.'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {};
      
      // 문자열 필드
      if (formData.code !== undefined) updateData.code = formData.code.trim().toUpperCase();
      if (formData.name !== undefined) updateData.name = formData.name.trim();
      if (formData.description !== undefined) updateData.description = formData.description?.trim() || undefined;
      if (formData.discountType !== undefined) updateData.discountType = formData.discountType;
      if (formData.startsAt !== undefined) updateData.startsAt = formData.startsAt || undefined;
      if (formData.endsAt !== undefined) updateData.endsAt = formData.endsAt || undefined;
      if (formData.isActive !== undefined) updateData.isActive = formData.isActive;
      
      // 숫자 필드 - 명시적 변환
      if (formData.discountValue !== undefined) {
        updateData.discountValue = typeof formData.discountValue === 'string' 
          ? parseFloat(formData.discountValue) 
          : formData.discountValue;
      }
      if (formData.minAmount !== undefined) {
        updateData.minAmount = formData.minAmount 
          ? (typeof formData.minAmount === 'string' ? parseFloat(formData.minAmount) : formData.minAmount)
          : undefined;
      }
      if (formData.maxAmount !== undefined) {
        updateData.maxAmount = formData.maxAmount 
          ? (typeof formData.maxAmount === 'string' ? parseFloat(formData.maxAmount) : formData.maxAmount)
          : undefined;
      }
      if (formData.maxUses !== undefined) {
        updateData.maxUses = formData.maxUses 
          ? (typeof formData.maxUses === 'string' ? parseInt(formData.maxUses) : formData.maxUses)
          : undefined;
      }
      if (formData.userMaxUses !== undefined) {
        updateData.userMaxUses = formData.userMaxUses 
          ? (typeof formData.userMaxUses === 'string' ? parseInt(formData.userMaxUses) : formData.userMaxUses)
          : undefined;
      }

      await couponsApi.updateCoupon(couponId, updateData);
      showToast(toast.success('쿠폰 수정 완료', '쿠폰이 성공적으로 수정되었습니다.'));
      setEditing(false);
      await loadCoupon();
    } catch (error) {
      console.error('쿠폰 수정 실패:', error);
      showToast(toast.error('쿠폰 수정 실패', `쿠폰 수정에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`));
    } finally {
      setSaving(false);
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
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const isExpired = (endDate?: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">쿠폰 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">쿠폰을 찾을 수 없습니다.</p>
            <Link href="/admin/coupons">
              <Button className="mt-4">쿠폰 목록으로 돌아가기</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/admin/coupons">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                돌아가기
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{coupon.name}</h1>
              <p className="text-gray-600 mt-1 font-mono">{coupon.code}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleToggleStatus}
              className={coupon.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {coupon.isActive ? (
                <>
                  <ToggleLeft className="h-4 w-4 mr-2" />
                  비활성화
                </>
              ) : (
                <>
                  <ToggleRight className="h-4 w-4 mr-2" />
                  활성화
                </>
              )}
            </Button>
            <Button
              onClick={() => setEditing(!editing)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              {editing ? '편집 취소' : '편집'}
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">사용 횟수</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {coupon.currentUses}
                    {coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">사용자 수</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {coupon.userCoupons?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">상태</p>
                  <p className={`text-xl font-semibold ${
                    isExpired(coupon.endsAt) ? 'text-red-600' : 
                    coupon.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isExpired(coupon.endsAt) ? '만료됨' : 
                     coupon.isActive ? '활성' : '비활성'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  {getDiscountTypeIcon(coupon.discountType)}
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">할인</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatDiscountValue(coupon.discountType, coupon.discountValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {editing ? (
          // 편집 모드
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>기본 정보 수정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      쿠폰 코드 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      쿠폰명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    쿠폰 설명
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 할인 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>할인 정보 수정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    할인 유형 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'] as const).map((type) => (
                      <label
                        key={type}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.discountType === type
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="discountType"
                          value={type}
                          checked={formData.discountType === type}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="flex items-center">
                          {getDiscountTypeIcon(type)}
                          <span className="ml-2 font-medium">
                            {getDiscountTypeText(type)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      할인값 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="discountValue"
                        value={formData.discountValue || ''}
                        onChange={handleInputChange}
                        min="0"
                        max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                        step={formData.discountType === 'PERCENTAGE' ? 0.1 : 1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={formData.discountType === 'FREE_SHIPPING'}
                        required
                      />
                      <span className="absolute right-3 top-2 text-gray-500">
                        {formData.discountType === 'PERCENTAGE' && '%'}
                        {formData.discountType === 'FIXED_AMOUNT' && '원'}
                        {formData.discountType === 'FREE_SHIPPING' && '무료'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      최소 주문 금액
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="minAmount"
                        value={formData.minAmount || ''}
                        onChange={handleInputChange}
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-2 text-gray-500">원</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">최대 할인 금액보다 크거나 같아야 합니다</p>
                  </div>

                  {formData.discountType === 'PERCENTAGE' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        최대 할인 금액
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="maxAmount"
                          value={formData.maxAmount || ''}
                          onChange={handleInputChange}
                          min="0"
                          step="1000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-2 text-gray-500">원</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">최소 주문 금액보다 작거나 같아야 합니다</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 사용 제한 */}
            <Card>
              <CardHeader>
                <CardTitle>사용 제한 수정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      총 사용 가능 횟수
                    </label>
                    <input
                      type="number"
                      name="maxUses"
                      value={formData.maxUses || ''}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사용자당 사용 가능 횟수
                    </label>
                    <input
                      type="number"
                      name="userMaxUses"
                      value={formData.userMaxUses || ''}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 유효 기간 */}
            <Card>
              <CardHeader>
                <CardTitle>유효 기간 수정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      시작일
                    </label>
                    <input
                      type="datetime-local"
                      name="startsAt"
                      value={formData.startsAt || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      종료일
                    </label>
                    <input
                      type="datetime-local"
                      name="endsAt"
                      value={formData.endsAt || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 상태 설정 */}
            <Card>
              <CardHeader>
                <CardTitle>상태 설정</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive || false}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">쿠폰 활성화</span>
                </label>
              </CardContent>
            </Card>

            {/* 제출 버튼 */}
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          // 조회 모드
          <div className="space-y-6">
            {/* 쿠폰 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>쿠폰 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">기본 정보</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">쿠폰 코드:</span>
                        <span className="font-mono">{coupon.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">쿠폰명:</span>
                        <span>{coupon.name}</span>
                      </div>
                      {coupon.description && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">설명:</span>
                          <span className="text-right">{coupon.description}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">생성일:</span>
                        <span>{formatDate(coupon.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">할인 정보</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">할인 유형:</span>
                        <div className="flex items-center">
                          {getDiscountTypeIcon(coupon.discountType)}
                          <span className="ml-2">{getDiscountTypeText(coupon.discountType)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">할인값:</span>
                        <span className="font-semibold">
                          {formatDiscountValue(coupon.discountType, coupon.discountValue)}
                        </span>
                      </div>
                      {coupon.minAmount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">최소 주문 금액:</span>
                          <span>{coupon.minAmount.toLocaleString()}원</span>
                        </div>
                      )}
                      {coupon.maxAmount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">최대 할인 금액:</span>
                          <span>{coupon.maxAmount.toLocaleString()}원</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">사용 제한</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">총 사용 가능 횟수:</span>
                        <span>{coupon.maxUses || '무제한'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">현재 사용 횟수:</span>
                        <span className="font-semibold">{coupon.currentUses}회</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">사용자당 사용 가능 횟수:</span>
                        <span>{coupon.userMaxUses || '무제한'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">유효 기간</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">시작일:</span>
                        <span>{formatDate(coupon.startsAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">종료일:</span>
                        <span className={isExpired(coupon.endsAt) ? 'text-red-600 font-semibold' : ''}>
                          {formatDate(coupon.endsAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">상태:</span>
                        <span className={`font-semibold ${
                          isExpired(coupon.endsAt) ? 'text-red-600' : 
                          coupon.isActive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isExpired(coupon.endsAt) ? '만료됨' : 
                           coupon.isActive ? '활성' : '비활성'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 사용 현황 */}
            {coupon.userCoupons && coupon.userCoupons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>사용자별 사용 현황</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            사용자
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            이메일
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            등록일
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {coupon.userCoupons.map((userCoupon) => (
                          <tr key={userCoupon.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {userCoupon.user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {userCoupon.user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              -
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}


          </div>
        )}
      </div>
    </div>
  );
}
