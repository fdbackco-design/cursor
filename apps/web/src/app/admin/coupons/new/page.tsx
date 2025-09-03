'use client';

import { useState } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeft, Save, Percent, DollarSign, Truck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { couponsApi, CreateCouponDto } from '@/lib/api/coupons';
import { useToast, toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-modal';

export default function NewCouponPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [formData, setFormData] = useState<CreateCouponDto>({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minAmount: undefined,
    maxAmount: undefined,
    maxUses: undefined,
    userMaxUses: undefined,
    startsAt: '',
    endsAt: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

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

  const validateForm = () => {
    if (!formData.code.trim()) {
      showToast(toast.warning('쿠폰 코드 입력 필요', '쿠폰 코드를 입력해주세요.'));
      return false;
    }

    if (!formData.name.trim()) {
      showToast(toast.warning('쿠폰명 입력 필요', '쿠폰명을 입력해주세요.'));
      return false;
    }

    if (formData.discountValue <= 0) {
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

    setLoading(true);
    try {
      const couponData = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        discountType: formData.discountType,
        discountValue: typeof formData.discountValue === 'string' 
          ? parseFloat(formData.discountValue) 
          : formData.discountValue,
        minAmount: formData.minAmount 
          ? (typeof formData.minAmount === 'string' ? parseFloat(formData.minAmount) : formData.minAmount)
          : undefined,
        maxAmount: formData.maxAmount 
          ? (typeof formData.maxAmount === 'string' ? parseFloat(formData.maxAmount) : formData.maxAmount)
          : undefined,
        maxUses: formData.maxUses 
          ? (typeof formData.maxUses === 'string' ? parseInt(formData.maxUses) : formData.maxUses)
          : undefined,
        userMaxUses: formData.userMaxUses 
          ? (typeof formData.userMaxUses === 'string' ? parseInt(formData.userMaxUses) : formData.userMaxUses)
          : undefined,
        startsAt: formData.startsAt || undefined,
        endsAt: formData.endsAt || undefined,
        isActive: formData.isActive
      };

      await couponsApi.createCoupon(couponData);
      showToast(toast.success('쿠폰 생성 완료', '쿠폰이 성공적으로 생성되었습니다.'));
      router.push('/admin/coupons');
    } catch (error) {
      console.error('쿠폰 생성 실패:', error);
      showToast(toast.error('쿠폰 생성 실패', `쿠폰 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`));
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">새 쿠폰 등록</h1>
              <p className="text-gray-600 mt-1">할인 쿠폰을 생성하세요</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
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
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="예: SUMMER2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">영문, 숫자, 특수문자 조합 가능</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    쿠폰명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="예: 여름 특가 할인"
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
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="쿠폰에 대한 상세 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* 할인 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>할인 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  할인 유형 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'].map((type) => (
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
                          {type === 'PERCENTAGE' && '할인율'}
                          {type === 'FIXED_AMOUNT' && '정액할인'}
                          {type === 'FREE_SHIPPING' && '무료배송'}
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
                      placeholder="0"
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
                        placeholder="무제한"
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
              <CardTitle>사용 제한</CardTitle>
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
                    placeholder="무제한"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">미입력 시 무제한</p>
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
                    placeholder="무제한"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">미입력 시 무제한</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 유효 기간 */}
          <Card>
            <CardHeader>
              <CardTitle>유효 기간</CardTitle>
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
                    value={formData.startsAt}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">미입력 시 즉시 사용 가능</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    종료일
                  </label>
                  <input
                    type="datetime-local"
                    name="endsAt"
                    value={formData.endsAt}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">미입력 시 무기한 사용 가능</p>
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
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">쿠폰 활성화</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">비활성화된 쿠폰은 사용할 수 없습니다</p>
            </CardContent>
          </Card>

          {/* 제출 버튼 */}
          <div className="flex justify-end space-x-4">
            <Link href="/admin/coupons">
              <Button type="button" variant="ghost">
                취소
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  생성 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  쿠폰 생성
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
