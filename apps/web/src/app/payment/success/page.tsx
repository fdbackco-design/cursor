'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { cartApi } from '@/lib/api/cart';
import { paymentsApi } from '@/lib/api/payments';
import { couponsApi } from '@/lib/api/coupons';
import { useAuth } from '@/contexts/AuthContext';

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
    // 이미 처리 중이거나 결제 완료 상태라면 무시
    if (isProcessing || orderCreated) {
      //console.log('주문 처리 중 또는 완료 상태:', { isProcessing, orderCreated });
      return;
    }

    // 사용자 정보가 없으면 대기
    if (!user) {
      //console.log('사용자 정보 로딩 중...');
      return;
    }

    const orderId = searchParams.get('orderId');
    const paymentKey = searchParams.get('paymentKey');
    const amount = searchParams.get('amount');

    // 결제 정보가 불완전하면 오류 처리
    if (!orderId || !paymentKey || !amount) {
      //console.log('결제 정보 부족:', { orderId, paymentKey, amount });
      setError('결제 정보가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    //console.log('주문 생성 시작 조건 충족:', { orderId, paymentKey, amount, userId: user.id });

    setPaymentInfo({
      orderId,
      paymentKey,
      amount,
    });

    // 주문 생성 처리 (중복 방지)
    createOrderFromPayment(orderId, paymentKey, parseInt(amount));
  }, [user, isProcessing, orderCreated]); // searchParams 제거하여 무한 루프 방지

  const createOrderFromPayment = async (orderId: string, paymentKey: string, amount: number) => {
    // 이미 처리 중이거나 완료된 상태면 중복 실행 방지
    if (isProcessing || orderCreated) {
      //console.log('주문 처리 중복 실행 방지:', { isProcessing, orderCreated });
      return;
    }

    // 같은 주문 번호로 이미 처리했는지 확인
    const lastProcessedOrderId = sessionStorage.getItem('lastProcessedOrderId');
    if (lastProcessedOrderId === orderId) {
      //console.log('이미 처리된 주문입니다:', orderId);
      setOrderCreated(true);
      setLoading(false);
      return;
    }

    try {
      //console.log('주문 생성 함수 시작:', { orderId, paymentKey, amount });
      setIsProcessing(true);
      setLoading(true);
      
      // 처리 시작 시점에 세션 스토리지에 기록
      sessionStorage.setItem('lastProcessedOrderId', orderId);

      // 바로결제 상품 정보 확인 (URL 파라미터에서)
      const directProductParam = searchParams.get('product');
      let directProduct = null;
      
      if (directProductParam) {
        try {
          directProduct = JSON.parse(decodeURIComponent(directProductParam));
          console.log('바로결제 상품 정보:', directProduct);
        } catch (error) {
          console.error('바로결제 상품 정보 파싱 실패:', error);
        }
      }

      let cartItems = [];
      let cart = null;

      if (directProduct) {
        // 바로결제 상품인 경우
        console.log('바로결제 주문 처리');
        cartItems = [{
          productId: directProduct.id,
          product: {
            id: directProduct.id,
            name: directProduct.name,
            priceB2C: directProduct.price,
            sku: directProduct.id
          },
          quantity: directProduct.quantity
        }];
        cart = { id: 'direct_purchase', items: cartItems };
      } else {
        // 일반 장바구니 주문인 경우
        console.log('장바구니 주문 처리');
        const cartResponse = await cartApi.getCart();
        console.log('장바구니 응답:', cartResponse);
        
        if (!cartResponse.success || !cartResponse.data || !cartResponse.data.items || cartResponse.data.items.length === 0) {
          console.log('장바구니가 비어있음. 기존 주문 확인...');
          
          // 장바구니가 비어있다면 이미 주문이 생성되었을 가능성 확인
          try {
            const existingOrderResponse = await ordersApi.getOrderByNumber(orderId);
            if (existingOrderResponse.success && existingOrderResponse.data) {
              console.log('기존 주문 발견:', existingOrderResponse.data);
              setOrderCreated(true);
              return; // 이미 주문이 생성되어 있으므로 종료
            }
          } catch (error) {
            console.log('기존 주문 조회 실패 (정상):', error);
          }
          
          throw new Error('장바구니 데이터를 찾을 수 없습니다. 이미 주문이 처리되었을 수 있습니다.');
        }

        cart = cartResponse.data;
        cartItems = cart.items;
      }

      // 쿠폰 정보 조회 (URL 파라미터 1순위, localStorage 2순위, 결제 정보 3순위)
      //console.log('쿠폰 정보 조회 시작...');
      let couponDiscount = 0;
      let couponId = null;
      
      // 0. URL 파라미터에서 쿠폰 정보 확인 (가장 확실한 방법)
      const urlCouponId = searchParams.get('couponId');
      const urlCouponDiscount = searchParams.get('couponDiscount');
      const urlCouponCode = searchParams.get('couponCode');
      
      if (urlCouponId) {
        couponId = urlCouponId;
        couponDiscount = parseInt(urlCouponDiscount || '0');
        // console.log('✅ URL 파라미터에서 쿠폰 정보 확인:', { 
        //   couponId, 
        //   couponDiscount, 
        //   couponCode: urlCouponCode 
        // });
      } else {
        //console.log('URL 파라미터에 쿠폰 정보 없음');
        
        // 1. localStorage에서 쿠폰 정보 확인 (백업 방법)
        try {
          const storedCouponInfo = localStorage.getItem('checkout_coupon_info');
          //console.log('localStorage 확인:', storedCouponInfo);
          
          if (storedCouponInfo) {
            const couponInfo = JSON.parse(storedCouponInfo);
            //console.log('localStorage에서 쿠폰 정보 발견:', couponInfo);
            
            // 주문 ID가 일치하는지 확인
            if (couponInfo.orderId === orderId) {
              couponId = couponInfo.couponId;
              couponDiscount = couponInfo.couponDiscount || 0;
              //console.log('localStorage에서 쿠폰 정보 사용:', { couponId, couponDiscount });
              
              // 사용 후 localStorage에서 제거
              localStorage.removeItem('checkout_coupon_info');
            } else {
              // console.log('주문 ID 불일치, localStorage 쿠폰 정보 무시:', {
              //   stored: couponInfo.orderId,
              //   current: orderId
              // });
            }
          } else {
            //console.log('localStorage에 쿠폰 정보 없음');
          }
        } catch (error) {
          //console.log('localStorage 쿠폰 정보 파싱 실패:', error);
        }
      }
      
      // 2. URL 파라미터와 localStorage에서 쿠폰 정보를 못 찾은 경우 최종 백업: 결제 정보에서 조회
      if (!couponId) {
        try {
          const paymentInfoResponse = await paymentsApi.getPaymentInfo(paymentKey);
          //console.log('결제 정보 응답:', paymentInfoResponse);
          
          if (paymentInfoResponse.success && paymentInfoResponse.data) {
            couponDiscount = paymentInfoResponse.data.couponDiscount || 0;
            couponId = paymentInfoResponse.data.couponId || null;
            //console.log('결제 정보에서 쿠폰 정보:', { couponDiscount, couponId });
          }
        } catch (error) {
          //console.log('결제 정보 조회 실패 (계속 진행):', error);
        }
      }

      // 장바구니 아이템을 주문 아이템으로 변환
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.id, // SKU가 없으면 ID 사용
        quantity: item.quantity,
        unitPrice: item.product.priceB2C,
        totalPrice: item.product.priceB2C * item.quantity,
        discountAmount: 0,
        finalPrice: item.product.priceB2C * item.quantity,
        metadata: {}
      }));

      // 주문 총액 계산
      const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const shippingAmount = subtotal >= 50000 ? 0 : 3000;
      const totalBeforeDiscount = subtotal + shippingAmount;
      
      // 실제 결제 금액을 기준으로 할인 금액 계산
      // amount는 실제 결제된 금액 (할인 적용 후)
      const totalAmount = amount; // 실제 결제 금액
      const actualDiscount = totalBeforeDiscount - totalAmount; // 실제 할인 금액
      
      // console.log('금액 계산:', {
      //   subtotal,
      //   shippingAmount,
      //   totalBeforeDiscount,
      //   actualDiscount,
      //   totalAmount,
      //   originalCouponDiscount: couponDiscount
      // });

      // 실제 배송지 정보 가져오기
      let shippingAddress = {
        receiver_name: user?.name || '수령인',
        base_address: '기본 주소',
        detail_address: '상세 주소',
        zone_number: '00000',
        phone: user?.phoneNumber || '010-0000-0000'
      };

      // 결제 정보에서 addressId를 가져와서 실제 배송지 정보 조회
      let addressId = null;
      try {
        const paymentInfoForAddress = await paymentsApi.getPaymentInfo(paymentKey);
        //console.log('배송지 조회를 위한 결제 정보:', paymentInfoForAddress);
        
        if (paymentInfoForAddress.success && paymentInfoForAddress.data) {
          addressId = paymentInfoForAddress.data.metadata?.addressId;
          //console.log('결제 정보에서 추출한 addressId:', addressId);
          //console.log('전체 결제 metadata:', paymentInfoForAddress.data.metadata);
        }
      } catch (error) {
        //console.log('배송지 조회용 결제 정보 가져오기 실패:', error);
      }
      
      if (addressId) {
        try {
          //console.log('배송지 정보 조회 시작:', addressId);
          const { addressesApi } = await import('@/lib/api/addresses');
          const addressResponse = await addressesApi.getAddress(addressId);
          
          if (addressResponse.success && addressResponse.data) {
            const addressData = addressResponse.data;
            shippingAddress = {
              receiver_name: addressData.receiverName || addressData.name,
              base_address: addressData.baseAddress,
              detail_address: addressData.detailAddress || '',
              zone_number: addressData.zoneNumber,
              phone: addressData.receiverPhoneNumber1 || user?.phoneNumber || '010-0000-0000'
            };
            //console.log('실제 배송지 정보 로드 성공:', shippingAddress);
          } else {
            console.warn('배송지 정보 조회 실패, 기본값 사용:', addressResponse.error);
          }
        } catch (error) {
          console.error('배송지 정보 조회 중 오류:', error);
          //console.log('기본 배송지 정보 사용');
        }
      } else {
        //console.log('addressId가 없어서 사용자의 기본 주소 조회');
        try {
          const { addressesApi } = await import('@/lib/api/addresses');
          const addressesResponse = await addressesApi.getAddresses();
          
          if (addressesResponse.success && addressesResponse.data) {
            const defaultAddress = addressesResponse.data.find(addr => addr.isDefault);
            if (defaultAddress) {
              shippingAddress = {
                receiver_name: defaultAddress.receiverName || defaultAddress.name,
                base_address: defaultAddress.baseAddress,
                detail_address: defaultAddress.detailAddress || '',
                zone_number: defaultAddress.zoneNumber,
                phone: defaultAddress.receiverPhoneNumber1 || user?.phoneNumber || '010-0000-0000'
              };
              //console.log('사용자 기본 주소로 배송지 설정:', shippingAddress);
            } else {
              //console.log('기본 주소가 없어서 기본 배송지 정보 사용');
            }
          } else {
            //console.log('주소 목록 조회 실패, 기본 배송지 정보 사용');
          }
        } catch (error) {
          console.error('기본 주소 조회 중 오류:', error);
          //console.log('기본 배송지 정보 사용');
        }
      }

      // 주문 데이터 검증
      // console.log('주문 생성 데이터 준비:', {
      //   orderNumber: orderId,
      //   subtotal,
      //   shippingAmount,
      //   totalBeforeDiscount,
      //   actualDiscount,
      //   totalAmount,
      //   couponId,
      //   itemsCount: orderItems.length,
      //   paymentKey,
      //   amount,
      //   shippingAddress,
      //   addressId: addressId
      // });

      // 데이터 타입 변환 및 검증
      const orderData = {
        orderNumber: orderId,
        ...(couponId && couponId !== 'null' && { couponId: couponId }),
        subtotal: Number(subtotal),
        discountAmount: Number(actualDiscount), // 실제 할인 금액 사용
        shippingAmount: Number(shippingAmount),
        totalAmount: Number(totalAmount),
        shippingAddress,
        billingAddress: shippingAddress,
        items: orderItems.map(item => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          finalPrice: Number(item.finalPrice),
          quantity: Number(item.quantity)
        })),
        // DTO에서 필요한 결제 정보 필드들
        paymentKey,
        paymentMethod: 'CARD',
        paidAmount: Number(amount),
        metadata: {
          createdFrom: 'payment_success_page',
          originalCartId: cart.id
        }
      };

      //console.log('검증된 주문 데이터:', orderData);

      // 주문 생성 요청
      const orderResponse = await ordersApi.createOrder(orderData);

      if (orderResponse.success) {
        setOrderCreated(true);
        //console.log('주문 생성 성공:', orderResponse.data);
        
        // 백엔드에서 이미 쿠폰 사용 처리를 완료했으므로 별도 API 호출 불필요
        if (couponId) {
          //console.log('✅ 쿠폰 사용 처리 완료 (백엔드에서 자동 처리됨):', couponId);
        }
      } else {
        throw new Error(orderResponse.error || '주문 생성에 실패했습니다.');
      }

    } catch (error) {
      console.error('주문 생성 실패:', error);
      setError(error instanceof Error ? error.message : '주문 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto px-4">
          <Card className="text-center">
            <CardContent className="py-12">
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">주문을 생성하는 중...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 오류 발생
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
                <Link href="/account" className="block">
                  <Button className="w-full">
                    고객센터 문의
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    메인 페이지로
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 성공
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
              {orderCreated ? (
                <p>주문이 정상적으로 접수되었습니다.</p>
              ) : (
                <p>주문 처리가 진행 중입니다.</p>
              )}
            </div>

            {paymentInfo.orderId && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">결제 정보</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>주문번호: {paymentInfo.orderId}</p>
                  {paymentInfo.amount && (
                    <p>결제금액: {parseInt(paymentInfo.amount).toLocaleString()}원</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Link href="/account" className="block">
                <Button className="w-full">
                  <Package className="h-4 w-4 mr-2" />
                  주문 내역 확인
                </Button>
              </Link>
              <Link href="/" className="block">
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