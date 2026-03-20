'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { paymentsApi } from '@/lib/api/payments';
import { cartApi } from '@/lib/api/cart';
import { useAuth } from '@/contexts/AuthContext';
import { formatNumber } from '@/lib/utils/price';
import { DEFAULT_SHIPPING_FEE } from '@/lib/constants/shipping';

export default function PaymentSuccessPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<{
    orderId?: string;
    paymentKey?: string;
    amount?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [orderCreated, setOrderCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isProcessing || orderCreated) return;
    if (!user) return;

    const orderId = searchParams.get('orderId');
    const paymentKey = searchParams.get('paymentKey');
    const amount = searchParams.get('amount');

    if (!orderId || !paymentKey || !amount) {
      setError('결제 정보가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    setPaymentInfo({ orderId, paymentKey, amount });
    confirmAndCreateOrder(orderId, paymentKey, parseInt(amount, 10));
  }, [user, isProcessing, orderCreated]);

  const confirmAndCreateOrder = async (orderId: string, paymentKey: string, amount: number) => {
    if (isProcessing || orderCreated) return;

    const lastProcessed = sessionStorage.getItem('lastProcessedOrderId');
    if (lastProcessed === orderId) {
      setOrderCreated(true);
      setLoading(false);
      return;
    }

    try {
      setIsProcessing(true);
      setLoading(true);
      sessionStorage.setItem('lastProcessedOrderId', orderId);

      // 1. 장바구니 또는 바로결제 상품 수집
      const directProductParam = searchParams.get('product');
      let orderItems: Array<{
        productId: string;
        productName: string;
        productSku: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        finalPrice: number;
      }> = [];

      if (directProductParam) {
        try {
          const directProduct = JSON.parse(decodeURIComponent(directProductParam));
          orderItems = [{
            productId: directProduct.id,
            productName: directProduct.name,
            productSku: String(directProduct.id),
            quantity: directProduct.quantity,
            unitPrice: directProduct.price,
            totalPrice: directProduct.price * directProduct.quantity,
            finalPrice: directProduct.price * directProduct.quantity,
          }];
        } catch {
          setError('바로결제 상품 정보를 읽을 수 없습니다.');
          return;
        }
      } else {
        const cartResponse = await cartApi.getCart();
        if (!cartResponse.success || !cartResponse.data?.items?.length) {
          setError('장바구니 데이터를 찾을 수 없습니다. 이미 주문이 처리되었을 수 있습니다.');
          return;
        }
        const cart = cartResponse.data;
        orderItems = cart.items.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          productSku: item.productId,
          quantity: item.quantity,
          unitPrice: Number(item.product.priceB2C),
          totalPrice: Number(item.product.priceB2C) * item.quantity,
          finalPrice: Number(item.product.priceB2C) * item.quantity,
        }));
      }

      // 2. 쿠폰 정보
      let couponId: string | null = null;
      let couponDiscount = 0;
      const urlCouponId = searchParams.get('couponId');
      const urlCouponDiscount = searchParams.get('couponDiscount');
      if (urlCouponId) {
        couponId = urlCouponId;
        couponDiscount = parseInt(urlCouponDiscount || '0', 10);
      } else {
        try {
          const stored = localStorage.getItem('checkout_coupon_info');
          if (stored) {
            const info = JSON.parse(stored);
            if (info.orderId === orderId) {
              couponId = info.couponId;
              couponDiscount = info.couponDiscount || 0;
              localStorage.removeItem('checkout_coupon_info');
            }
          }
        } catch {
          /* ignore */
        }
      }

      // 3. 배송지 정보
      const addressId = searchParams.get('addressId') || undefined;
      let shippingAddress: Record<string, unknown> = {
        receiver_name: user?.name || '수령인',
        base_address: '기본 주소',
        detail_address: '상세 주소',
        zone_number: '00000',
        phone: user?.phoneNumber || '010-0000-0000',
      };

      if (addressId) {
        try {
          const { addressesApi } = await import('@/lib/api/addresses');
          const addrRes = await addressesApi.getAddress(addressId);
          if (addrRes.success && addrRes.data) {
            const a = addrRes.data;
            shippingAddress = {
              receiver_name: a.receiverName || a.name,
              base_address: a.baseAddress,
              detail_address: a.detailAddress || '',
              zone_number: a.zoneNumber || '',
              phone: a.receiverPhoneNumber1 || user?.phoneNumber || '010-0000-0000',
            };
          }
        } catch {
          /* use default */
        }
      } else {
        try {
          const { addressesApi } = await import('@/lib/api/addresses');
          const addrsRes = await addressesApi.getAddresses();
          if (addrsRes.success && addrsRes.data?.length) {
            const defaultAddr = addrsRes.data.find((a) => a.isDefault);
            if (defaultAddr) {
              shippingAddress = {
                receiver_name: defaultAddr.receiverName || defaultAddr.name,
                base_address: defaultAddr.baseAddress,
                detail_address: defaultAddr.detailAddress || '',
                zone_number: defaultAddr.zoneNumber || '',
                phone: defaultAddr.receiverPhoneNumber1 || user?.phoneNumber || '010-0000-0000',
              };
            }
          }
        } catch {
          /* use default */
        }
      }

      const subtotal = orderItems.reduce((s, i) => s + i.totalPrice, 0);
      const shippingAmount = DEFAULT_SHIPPING_FEE;
      const totalBeforeDiscount = subtotal + shippingAmount;
      const actualDiscount = totalBeforeDiscount - amount;

      // 4. 결제 승인 API 호출 (주문은 승인 성공 시에만 백엔드에서 생성됨)
      const confirmRes = await paymentsApi.confirmPayment({
        paymentKey,
        orderId,
        amount,
        orderMetadata: {
          items: orderItems,
          shippingAddress,
          billingAddress: shippingAddress,
          ...(addressId ? { addressId } : {}),
          ...(couponId ? { couponId } : {}),
          discountAmount: actualDiscount,
          shippingAmount,
        },
      });

      if (confirmRes.success && confirmRes.data) {
        setOrderCreated(true);
      } else {
        throw new Error(confirmRes.error || '결제 승인에 실패했습니다.');
      }
    } catch (err) {
      console.error('결제 승인/주문 생성 실패:', err);
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-4">
          <Card className="text-center">
            <CardContent className="py-12">
              <Loader2 className="h-12 w-12 text-gray-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">결제 확인 및 주문 처리 중...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-4">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-red-500 mx-auto" />
              </div>
              <CardTitle className="text-2xl text-red-600">주문 처리 실패</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-gray-600">
                <p className="mb-2">결제는 완료되었지만 주문 처리 중 오류가 발생했습니다.</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <div className="space-y-3">
                <Link href="/account">
                  <Button className="w-full">고객센터 문의</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">메인 페이지로</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-auto px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              {orderCreated ? '주문 완료!' : '결제 완료!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-gray-600">
              <p className="mb-2">결제가 성공적으로 완료되었습니다.</p>
              <p>{orderCreated ? '주문이 정상적으로 접수되었습니다.' : '주문 처리가 진행 중입니다.'}</p>
            </div>
            {paymentInfo.orderId && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">결제 정보</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>주문번호: {paymentInfo.orderId}</p>
                  {paymentInfo.amount && (
                    <p>결제금액: {formatNumber(parseInt(paymentInfo.amount, 10))}원</p>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-3">
              <Link href="/account">
                <Button className="w-full">
                  <Package className="h-4 w-4 mr-2" />
                  주문 내역 확인
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  쇼핑 계속하기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="text-sm text-gray-500">
              <p>주문 확인 이메일이 발송될 예정입니다.</p>
              <p>배송 관련 문의사항은 고객센터로 연락주세요.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
