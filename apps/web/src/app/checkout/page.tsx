'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeft, CreditCard, MapPin, Tag, User, Check, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { cartApi, Cart, CartItem } from '@/lib/api/cart';
import { addressesApi } from '@/lib/api/addresses';
import { paymentsApi } from '@/lib/api/payments';
import { couponsApi, UserCoupon } from '@/lib/api/coupons';
import { getImageUrl } from '@/lib/utils/image';
import { AddressFormModal, AddressCard } from '@/components/address';
import { useToast, toast } from '@/components/ui/toast';

interface UserAddress {
  id: string;
  name: string;
  receiverName: string;
  receiverPhoneNumber1: string;
  receiverPhoneNumber2?: string;
  zoneNumber: string;
  baseAddress: string;
  detailAddress: string;
  isDefault: boolean;
}

interface OrdererInfo {
  name: string;
  email: string;
  phone: string;
}

interface PaymentInfo {
  couponDiscount: number;
  selectedCouponId?: string;
}

export default function CheckoutPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  // 기본 상태
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // 직접 결제 상품 정보
  const [directProduct, setDirectProduct] = useState<any>(null);
//  const [isDirectPurchase, setIsDirectPurchase] = useState(false);
  
  // 주문자 정보
  const [ordererInfo, setOrdererInfo] = useState<OrdererInfo>({
    name: '',
    email: '',
    phone: ''
  });
  
  // 배송지 정보
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  // 결제 정보
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    couponDiscount: 0
  });
  
  
  // 사용 가능한 쿠폰
  const [availableCoupons, setAvailableCoupons] = useState<UserCoupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // // URL 파라미터에서 직접 결제 상품 정보 확인
      // const productParam = searchParams.get('product');
      // if (productParam) {
      //   try {
      //     const productData = JSON.parse(productParam);
      //     //console.log('Parsed product data in checkout:', productData);
      //     setDirectProduct(productData);
      //     setIsDirectPurchase(true);
      //   } catch (error) {
      //     console.error('상품 정보 파싱 실패:', error);
      //     showToast(toast.error('상품 정보 오류', '상품 정보를 불러올 수 없습니다.'));
      //     setIsDirectPurchase(false);
      //   }
      // } else {
      //   setIsDirectPurchase(false);
      // }
      
      // loadCheckoutData();
      // ✅ 바로구매 여부를 즉시 계산해서 loadCheckoutData에 전달
      const productParam = searchParams.get('product');
      let isDirect = false;
      if (productParam) {
        try {
          const productData = JSON.parse(productParam);
          console.log('바로결제 상품 정보 파싱 성공:', productData);
          setDirectProduct(productData);   // UI 표시에만 사용
          isDirect = !!productData?.id;
          console.log('바로결제 여부:', isDirect);
        } catch (error) {
          console.error('상품 정보 파싱 실패:', error);
          showToast(toast.error('상품 정보 오류', '상품 정보를 불러올 수 없습니다.'));
          isDirect = false;
        }
      } else {
        console.log('URL에 product 파라미터 없음');
      }
      loadCheckoutData(isDirect);
    } else if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, user, authLoading, router, searchParams, showToast]);

  const loadCheckoutData = async (isDirectPurchase: boolean) => {
    try {
      setLoading(true);
      
      // 병렬로 데이터 로드
      const [cartResponse, couponsResponse] = await Promise.all([
        cartApi.getCart(),
        couponsApi.getMyCoupons()
      ]);

      // 장바구니 데이터 처리
      if (cartResponse.success) {
        // 장바구니 데이터가 있는 경우
        if (cartResponse.data) {
          setCart(cartResponse.data);
          
          // 바로구매가 아닌 경우에만 장바구니가 비어있으면 장바구니 페이지로 리다이렉트
          if (!isDirectPurchase && (!cartResponse.data.items || cartResponse.data.items.length === 0)) {
            showToast(toast.warning('장바구니 비어있음', '장바구니가 비어있습니다.'));
            router.push('/cart');
            return;
          }
        } else {
          // 장바구니 데이터가 null인 경우 (빈 장바구니)
          setCart(null);
          
          // 바로구매가 아닌 경우에만 장바구니가 비어있으면 장바구니 페이지로 리다이렉트
          if (!isDirectPurchase) {
            showToast(toast.warning('장바구니 비어있음', '장바구니가 비어있습니다.'));
            router.push('/cart');
            return;
          }
        }
      } else {
        // 장바구니 로드 실패
        if (!isDirectPurchase) {
          showToast(toast.error('장바구니 로드 실패', '장바구니 정보를 불러올 수 없습니다.'));
          router.push('/cart');
          return;
        } else {
          // 바로구매인 경우 장바구니 로드 실패해도 계속 진행
          setCart(null);
        }
      }

      // 배송지 데이터는 loadAddresses 함수에서 처리
      await loadAddresses();

      // 쿠폰 데이터
      if (couponsResponse.success && couponsResponse.data) {
        // 사용 가능한 쿠폰만 필터링 (만료되지 않고 사용 가능한 쿠폰)
        const usableCoupons = couponsResponse.data.filter(userCoupon => 
          userCoupon.coupon.isUsable && 
          !userCoupon.coupon.isExpired &&
          !userCoupon.coupon.isUsageLimitReached
        );
        setAvailableCoupons(usableCoupons);
      } else if (isDirectPurchase) {
        // 바로구매인 경우 쿠폰 데이터가 없어도 계속 진행
        setAvailableCoupons([]);
      }

      // 사용자 정보 초기화
      if (user) {
        setOrdererInfo({
          name: user.name || '',
          email: user.email || '',
          phone: user.phoneNumber || ''
        });
      }
      
      // 바로구매인 경우 장바구니 데이터가 없어도 계속 진행
      if (isDirectPurchase && !cart) {
        //console.log('바로구매 모드: 장바구니 데이터 없이 계속 진행');
      }

    } catch (error) {
      console.error('체크아웃 데이터 로드 실패:', error);
      
      // 바로구매가 아닌 경우에만 장바구니 페이지로 리다이렉트
      if (!isDirectPurchase) {
        showToast(toast.error('페이지 로드 오류', '페이지 로드 중 오류가 발생했습니다.'));
        router.push('/cart');
      } else {
        // 바로구매인 경우 에러를 무시하고 계속 진행
        console.warn('바로구매 모드에서 일부 데이터 로드 실패, 계속 진행:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await addressesApi.getAddresses();
      if (response.success && response.data) {
        setAddresses(response.data);
        
        // 기본 주소가 있으면 자동으로 선택
        const defaultAddress = response.data.find(addr => addr.isDefault);
        if (defaultAddress && (!selectedAddressId || selectedAddressId === '')) {
          setSelectedAddressId(defaultAddress.id);
          //console.log('기본 주소 자동 선택:', defaultAddress);
        }
      }
    } catch (error) {
      console.error('배송지 로드 실패:', error);
    }
  };

  const handleAddAddress = async (addressData: any) => {
    try {
      // AddressFormData를 CreateAddressData 형식으로 변환
      const createAddressData = {
        name: addressData.name,
        receiverName: addressData.receiver_name,
        receiverPhoneNumber1: addressData.receiver_phone_number1,
        receiverPhoneNumber2: addressData.receiver_phone_number2,
        zoneNumber: addressData.zone_number,
        baseAddress: addressData.base_address,
        detailAddress: addressData.detail_address,
        isDefault: addressData.is_default,
      };

      console.log('전송할 주소 데이터:', createAddressData);

      const response = await addressesApi.createAddress(createAddressData);
      if (response.success) {
        await loadAddresses();
        setShowAddressModal(false);
        
        // 새로 추가된 주소가 기본 주소이거나 유일한 주소인 경우 자동 선택
        if (response.data?.id) {
          const newAddress = response.data;
          if (newAddress.isDefault || addresses.length === 0) {
            setSelectedAddressId(newAddress.id);
            //console.log('새로 추가된 주소 자동 선택:', newAddress);
          }
        }
      } else {
        showToast(toast.error('배송지 추가 실패', '배송지 추가에 실패했습니다.'));
      }
    } catch (error) {
      console.error('배송지 추가 실패:', error);
      showToast(toast.error('배송지 추가 오류', '배송지 추가 중 오류가 발생했습니다.'));
    }
  };

  // 장바구니 소계 계산
  const calculateSubtotal = (): number => {
    // 직접 결제 상품이 있는 경우
    if (directProduct) {
      return directProduct.price * directProduct.quantity;
    }
    
    // 장바구니 상품들 계산
    if (!cart || !cart.items) return 0;
    
    return cart.items.reduce((total, item) => {
      return total + (item.product.priceB2C * item.quantity);
    }, 0);
  };

  // 쿠폰 선택 처리
  const handleCouponSelect = (coupon: UserCoupon | null) => {
    setSelectedCoupon(coupon);
    
    if (coupon && cart) {
      const cartSubtotal = calculateSubtotal();
      const discount = calculateCouponDiscount(coupon, cartSubtotal);
      
      setPaymentInfo(prev => ({
        ...prev,
        couponDiscount: discount,
        selectedCouponId: coupon.id
      }));
    } else {
      setPaymentInfo(prev => ({
        ...prev,
        couponDiscount: 0,
        selectedCouponId: ''
      }));
    }
  };

  // 쿠폰 할인 계산
  const calculateCouponDiscount = (userCoupon: UserCoupon, subtotal: number): number => {
    const coupon = userCoupon.coupon;
    
    // 최소 주문 금액 확인
    if (coupon.minAmount && subtotal < coupon.minAmount) {
      return 0;
    }

    let discount = 0;
    
    if (coupon.discountType === 'PERCENTAGE') {
      // 퍼센트 할인
      discount = Math.floor(subtotal * (coupon.discountValue / 100));
      
      // 최대 할인 금액 제한
      if (coupon.maxAmount) {
        discount = Math.min(discount, coupon.maxAmount);
      }
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      // 고정 금액 할인
      discount = coupon.discountValue;
      
      // 주문 금액보다 큰 할인은 불가
      discount = Math.min(discount, subtotal);
    }

    return discount;
  };

  const handleOrder = async () => {
    // 직접 결제 상품이 있는 경우 장바구니 체크 생략
    if (!directProduct && (!cart || !selectedAddress || !ordererInfo.name || !ordererInfo.email || !ordererInfo.phone)) {
      showToast(toast.warning('주문 정보 부족', '주문 정보를 모두 입력해주세요.'));
      return;
    }

    // 직접 결제 상품이 있는 경우 기본 정보 체크
    if (directProduct && (!selectedAddress || !ordererInfo.name || !ordererInfo.email || !ordererInfo.phone)) {
      showToast(toast.warning('주문 정보 부족', '주문 정보를 모두 입력해주세요.'));
      return;
    }

    setPaymentLoading(true);
    
    try {
      // 1. 고유한 주문 ID 생성
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 2. 주문명 생성
      let orderName: string;
      if (directProduct) {
        orderName = directProduct.name;
      } else {
        const cartItems = cart?.items || [];
        orderName = cartItems.length === 1 
          ? cartItems[0]?.product.name || '상품명 없음'
          : `${cartItems[0]?.product.name || '상품명 없음'} 외 ${cartItems.length - 1}건`;
      }

      // 전화번호 정규화
      const normalizePhoneNumber = (phone: string): string | undefined => {
        if (!phone) return undefined;
        
        let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
        
        if (cleaned.startsWith('82')) {
          cleaned = cleaned.substring(2);
          if (cleaned.startsWith('10')) {
            cleaned = '0' + cleaned;
          }
        }
        
        const phoneRegex = /^01[0-9]\d{8}$/;
        if (phoneRegex.test(cleaned)) {
          return cleaned;
        }
        
        return undefined;
      };

      const normalizedPhone = normalizePhoneNumber(ordererInfo.phone);

      // 3. 결제 준비
      await paymentsApi.preparePayment({
        orderId,
        orderName,
        amount: finalTotal,
        customerEmail: ordererInfo.email,
        customerName: ordererInfo.name,
        customerMobilePhone: normalizedPhone || undefined,
      });

      // 4. 토스페이먼츠 위젯 연동
      if (typeof window !== 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://js.tosspayments.com/v2/standard';
        script.onload = () => {
          initializePayment(orderId, orderName);
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('결제 준비 실패:', error);
      showToast(toast.error('결제 준비 실패', '결제 준비에 실패했습니다. 다시 시도해주세요.'));
      setPaymentLoading(false);
    }
  };

  // 토스페이먼츠 결제위젯 초기화
  const initializePayment = async (orderId: string, orderName: string) => {
    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
      
      const tossPayments = (window as any).TossPayments(clientKey);
      const widgets = tossPayments.widgets({
        customerKey: user?.id || 'anonymous_' + Date.now(),
      });
      
      // 결제 UI DOM 요소 생성
      const paymentMethodContainer = document.createElement('div');
      paymentMethodContainer.id = 'payment-method';
      paymentMethodContainer.style.cssText = 'margin-bottom: 20px; min-height: 200px;';
      
      const agreementContainer = document.createElement('div');
      agreementContainer.id = 'agreement';
      agreementContainer.style.cssText = 'margin-bottom: 20px;';
      
      const titleContainer = document.createElement('div');
      titleContainer.innerHTML = '<h3 style="margin: 0 0 20px 0; text-align: center; color: #191F28;">결제 수단 선택</h3>';
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'margin-top: 20px; text-align: center;';
      
      const payButton = document.createElement('button');
      payButton.innerText = `${finalTotal.toLocaleString()}원 결제하기`;
      payButton.style.cssText = 'background: #3182F6; color: white; border: none; padding: 16px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; width: 100%;';
      
      const closeButton = document.createElement('button');
      closeButton.innerText = '취소';
      closeButton.style.cssText = 'background: #F2F4F6; color: #4E5968; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; width: 100%; margin-top: 8px;';
      
      const paymentContainer = document.createElement('div');
      paymentContainer.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); width: 500px; max-width: 90vw; max-height: 80vh; overflow-y: auto;';
      
      // DOM 구조 생성
      paymentContainer.appendChild(titleContainer);
      paymentContainer.appendChild(paymentMethodContainer);
      paymentContainer.appendChild(agreementContainer);
      buttonContainer.appendChild(payButton);
      buttonContainer.appendChild(closeButton);
      paymentContainer.appendChild(buttonContainer);
      
      // 오버레이 생성
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999;';
      
      // DOM에 추가
      document.body.appendChild(overlay);
      document.body.appendChild(paymentContainer);
      
      // 결제 금액 설정
      await widgets.setAmount({
        currency: 'KRW',
        value: finalTotal,
      });

      // 결제위젯 렌더링
      await widgets.renderPaymentMethods({
        selector: '#payment-method',
        variantKey: 'DEFAULT'
      });
      
      await widgets.renderAgreement({
        selector: '#agreement',
        variantKey: 'AGREEMENT'
      });
      
      // 결제 버튼 이벤트
      payButton.addEventListener('click', async () => {
        try {
          payButton.disabled = true;
          payButton.innerText = '결제 처리 중...';
          
          // 쿠폰 정보를 localStorage에 저장 (확실한 전달을 위해)
          // console.log('결제 시점 상태 확인:', {
          //   selectedCoupon: selectedCoupon,
          //   selectedCouponId: selectedCoupon?.id,
          //   couponDiscount: paymentInfo.couponDiscount,
          //   paymentInfo: paymentInfo,
          //   selectedAddressId: selectedAddressId,
          //   selectedAddress: selectedAddress
          // });
          
          if (selectedCoupon?.id) {
            const couponInfoToStore = {
              couponId: selectedCoupon.id,
              couponDiscount: paymentInfo.couponDiscount,
              couponCode: selectedCoupon.coupon.code,
              orderId: orderId,
              timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('checkout_coupon_info', JSON.stringify(couponInfoToStore));
            //console.log('✅ 쿠폰 정보 localStorage 저장 성공:', couponInfoToStore);
            
            // 저장 확인
            const stored = localStorage.getItem('checkout_coupon_info');
            //console.log('저장 확인:', stored);
          } else {
            //console.log('❌ 선택된 쿠폰이 없어서 localStorage 저장 안 함');
            localStorage.removeItem('checkout_coupon_info');
          }
          
          // successUrl에 쿠폰 정보를 URL 파라미터로 추가 (가장 확실한 방법)
          const successUrl = new URL(`${window.location.origin}/payment/success`);
          if (selectedCoupon?.id) {
            successUrl.searchParams.set('couponId', selectedCoupon.id);
            successUrl.searchParams.set('couponDiscount', paymentInfo.couponDiscount.toString());
            successUrl.searchParams.set('couponCode', selectedCoupon.coupon.code);
            //console.log('✅ successUrl에 쿠폰 정보 추가:', successUrl.toString());
          }
          
          // 바로결제 상품 정보를 successUrl에 추가
          if (directProduct) {
            successUrl.searchParams.set('product', encodeURIComponent(JSON.stringify(directProduct)));
            console.log('✅ successUrl에 바로결제 상품 정보 추가:', directProduct);
          }
          
          await widgets.requestPayment({
            orderId: orderId,
            orderName: orderName,
            successUrl: successUrl.toString(),
            failUrl: `${window.location.origin}/payment/fail`,
            customerEmail: ordererInfo.email,
            customerName: ordererInfo.name,
            customerMobilePhone: ordererInfo.phone?.replace(/\D/g, ''),
            metadata: {
              ...(selectedCoupon?.id && { couponId: selectedCoupon.id }),
              couponDiscount: paymentInfo.couponDiscount || 0,
              addressId: selectedAddressId || ''
            }
          });
          
        } catch (error) {
          console.error('결제 실패:', error);
          showToast(toast.error('결제 실패', '결제에 실패했습니다. 다시 시도해주세요.'));
          payButton.disabled = false;
          payButton.innerText = `${finalTotal.toLocaleString()}원 결제하기`;
        }
      });
      
      // 취소 버튼 이벤트
      const closeHandler = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(paymentContainer);
        setPaymentLoading(false);
      };
      
      closeButton.addEventListener('click', closeHandler);
      overlay.addEventListener('click', closeHandler);
      
    } catch (error) {
      console.error('토스페이먼츠 초기화 실패:', error);
      showToast(toast.error('결제 서비스 초기화 실패', '결제 서비스 초기화에 실패했습니다.'));
      setPaymentLoading(false);
    }
  };

  // 로딩 상태
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 안된 상태
  if (!isAuthenticated) {
    return null; // useEffect에서 리다이렉트 처리
  }

  const cartItems = cart?.items || [];
  const subtotal = calculateSubtotal();
  const shippingFee = subtotal >= 50000 ? 0 : 3000;
  const totalBeforeDiscount = subtotal + shippingFee;
  const finalTotal = totalBeforeDiscount - paymentInfo.couponDiscount;
  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link 
            href="/cart" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            장바구니로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">주문/결제</h1>
          <p className="text-gray-600 mt-2">
            주문 정보를 확인하고 결제를 진행해주세요.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* 왼쪽: 주문 정보 입력 */}
          <div className="lg:col-span-8 space-y-8">
            {/* 주문자 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  주문자 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                  <input
                    type="text"
                    value={ordererInfo.name}
                    onChange={(e) => setOrdererInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="주문자 이름을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                  <input
                    type="email"
                    value={ordererInfo.email}
                    onChange={(e) => setOrdererInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="이메일을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">휴대폰 번호</label>
                  <input
                    type="tel"
                    value={ordererInfo.phone}
                    onChange={(e) => setOrdererInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="휴대폰 번호를 입력하세요"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 배송지 선택 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-green-600" />
                    배송지 선택
                  </CardTitle>
                  <Button variant="outline" onClick={() => setShowAddressModal(true)}>
                    새 주소 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">등록된 배송지가 없습니다.</p>
                    <Button onClick={() => setShowAddressModal(true)}>
                      배송지 추가하기
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!selectedAddressId && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                          <p className="text-yellow-800 text-sm">
                            배송지를 선택해주세요. 기본 주소가 자동으로 선택되지 않았습니다.
                          </p>
                        </div>
                      </div>
                    )}
                    {addresses.map((address) => (
                      <div 
                        key={address.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedAddressId === address.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium">{address.name}</span>
                              {address.isDefault && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                                  기본
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 mb-1">{address.receiverName}</p>
                            <p className="text-gray-600 text-sm mb-1">
                              ({address.zoneNumber}) {address.baseAddress} {address.detailAddress}
                            </p>
                            <p className="text-gray-600 text-sm">{address.receiverPhoneNumber1}</p>
                          </div>
                          {selectedAddressId === address.id && (
                            <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 쿠폰 적용 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-purple-600" />
                  쿠폰 적용
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableCoupons.length === 0 ? (
                  <p className="text-gray-600">사용 가능한 쿠폰이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {/* 쿠폰 미사용 옵션 */}
                    <div 
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        !selectedCoupon ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCouponSelect(null)}
                    >
                      <div>
                        <p className="font-medium">쿠폰 사용 안함</p>
                        <p className="text-sm text-gray-600">할인 없음</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        !selectedCoupon ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {!selectedCoupon && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>

                    {/* 사용 가능한 쿠폰 목록 */}
                    {availableCoupons.map((userCoupon) => {
                      const coupon = userCoupon.coupon;
                      const subtotal = calculateSubtotal();
                      const canUse = !coupon.minAmount || subtotal >= coupon.minAmount;
                      const discount = canUse ? calculateCouponDiscount(userCoupon, subtotal) : 0;
                      
                      return (
                        <div 
                          key={userCoupon.id} 
                          className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                            !canUse 
                              ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' 
                              : selectedCoupon?.id === userCoupon.id 
                                ? 'border-blue-500 bg-blue-50 cursor-pointer' 
                                : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                          }`}
                          onClick={() => canUse && handleCouponSelect(userCoupon)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{coupon.name}</p>
                              <span className={`text-xs px-2 py-1 rounded ${
                                coupon.discountType === 'PERCENTAGE' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {coupon.discountType === 'PERCENTAGE' 
                                  ? `${coupon.discountValue}%` 
                                  : `${coupon.discountValue.toLocaleString()}원`}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{coupon.description}</p>
                            
                            {/* 할인 정보 */}
                            {canUse ? (
                              <p className="text-sm font-medium text-blue-600 mt-1">
                                {discount.toLocaleString()}원 할인
                              </p>
                            ) : (
                              <p className="text-sm text-red-500 mt-1">
                                최소 주문금액 {(coupon.minAmount || 0).toLocaleString()}원 이상
                              </p>
                            )}
                            
                            {/* 사용 조건 */}
                            <div className="text-xs text-gray-500 mt-1 space-y-1">
                              {coupon.minAmount && (
                                <div>최소 주문금액: {coupon.minAmount.toLocaleString()}원</div>
                              )}
                              {coupon.maxAmount && coupon.discountType === 'PERCENTAGE' && (
                                <div>최대 할인금액: {coupon.maxAmount.toLocaleString()}원</div>
                              )}
                              {coupon.endsAt && (
                                <div>만료일: {new Date(coupon.endsAt).toLocaleDateString()}</div>
                              )}
                            </div>    
                          </div>
                          
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-3 ${
                            !canUse 
                              ? 'border-gray-300' 
                              : selectedCoupon?.id === userCoupon.id 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300'
                          }`}>
                            {selectedCoupon?.id === userCoupon.id && canUse && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>


          </div>

          {/* 오른쪽: 주문 요약 */}
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>주문 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 상품 목록 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    주문 상품 ({directProduct ? 1 : cartItems.length}개)
                  </h4>
                  <div className="space-y-3">
                    {/* 직접 결제 상품 */}
                    {directProduct && (
                      <div className="flex items-center space-x-3">
                        <img
                          src={directProduct.image}
                          alt={directProduct.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {directProduct.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {directProduct.price.toLocaleString()}원 × {directProduct.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {(directProduct.price * directProduct.quantity).toLocaleString()}원
                        </p>
                      </div>
                    )}
                    
                    {/* 장바구니 상품들 */}
                    {!directProduct && cartItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <img
                          src={getImageUrl(item.product.images?.[0])}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.product.priceB2C.toLocaleString()}원 × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {(item.product.priceB2C * item.quantity).toLocaleString()}원
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 금액 계산 */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">상품 금액</span>
                    <span>{subtotal.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">배송비</span>
                    <span>{shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}</span>
                  </div>
                  {paymentInfo.couponDiscount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>쿠폰 할인</span>
                      <span>-{paymentInfo.couponDiscount.toLocaleString()}원</span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>최종 결제금액</span>
                      <span className="text-blue-600">{finalTotal.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>

                {/* 결제하기 버튼 */}
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleOrder}
                  disabled={!selectedAddress || !ordererInfo.name || !ordererInfo.email || !ordererInfo.phone || paymentLoading}
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      결제 준비 중...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {finalTotal.toLocaleString()}원 결제하기
                    </>
                  )}
                </Button>

                <div className="text-sm text-gray-500 text-center">
                  결제 진행 시 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 배송지 추가 모달 */}
        {showAddressModal && (
          <AddressFormModal
            isOpen={showAddressModal}
            onSubmit={handleAddAddress}
            onClose={() => setShowAddressModal(false)}
          />
        )}
      </div>
    </div>
  );
}
