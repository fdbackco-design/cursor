'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Trash2, ShoppingBag, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cartApi, Cart, CartItem } from '@/lib/api/cart';
import { getImageUrl } from '@/lib/utils/image';
import { useRouter } from 'next/navigation';
import { useToast, toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-modal';

export default function CartPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [inputQuantities, setInputQuantities] = useState<Record<string, string>>({}); // 업데이트 중인 아이템 ID

  // 장바구니 로드
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadCart();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, authLoading]);

  const loadCart = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await cartApi.getCart();
      
      if (response.success && response.data) {
        setCart(response.data);
        
        // 입력 수량 초기화
        const quantities: Record<string, string> = {};
        response.data.items?.forEach((item: any) => {
          quantities[item.id] = item.quantity.toString();
        });
        setInputQuantities(quantities);
      } else {
        console.error('장바구니 조회 실패:', response.message);
        setCart({ id: '', userId: user.id, items: [], createdAt: '', updatedAt: '' });
        setInputQuantities({});
      }
    } catch (error) {
      console.error('장바구니 로드 실패:', error);
      setCart({ id: '', userId: user.id, items: [], createdAt: '', updatedAt: '' });
      setInputQuantities({});
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number, maxStock?: number) => {
    if (newQuantity < 1) {
      alert('수량은 1개 이상이어야 합니다.');
      return;
    }
    
    if (maxStock && newQuantity > maxStock) {
      alert(`재고가 부족합니다. 최대 ${maxStock}개까지 담을 수 있습니다.`);
      return;
    }
    
    setUpdating(itemId);
    try {
      const updatedItem = await cartApi.updateCartItem(itemId, { quantity: newQuantity });
      
      // 로컬 상태 업데이트로 더 빠른 UI 반응
      if (cart) {
        setCart({
          ...cart,
          items: cart.items.map(item => 
            item.id === itemId 
              ? { ...item, quantity: newQuantity }
              : item
          )
        });
        // 입력 필드 값도 업데이트
        setInputQuantities(prev => ({
          ...prev,
          [itemId]: newQuantity.toString()
        }));
      }
    } catch (error) {
      console.error('수량 업데이트 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '수량 업데이트에 실패했습니다.';
      alert(errorMessage);
      // 실패 시 원래 상태로 복원
      await loadCart();
    } finally {
      setUpdating(null);
    }
  };

  // 수량 직접 입력 처리
  const handleQuantityInput = async (itemId: string, inputValue: string, maxStock?: number) => {
    const newQuantity = parseInt(inputValue);
    if (isNaN(newQuantity) || newQuantity < 1) {
      alert('올바른 수량을 입력해주세요.');
      return;
    }
    await updateQuantity(itemId, newQuantity, maxStock);
  };

  // Enter 키 처리
  const handleQuantityKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string, maxStock?: number) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      handleQuantityInput(itemId, target.value, maxStock);
    }
  };

  // 입력 필드 변경 처리 (실시간 업데이트)
  const handleQuantityChange = (itemId: string, value: string) => {
    setInputQuantities(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  // 포커스 아웃 시 처리
  const handleQuantityBlur = (e: React.FocusEvent<HTMLInputElement>, itemId: string, originalQuantity: number, maxStock?: number) => {
    const newValue = e.target.value;
    const newQuantity = parseInt(newValue);
    
    // 값이 변경되었고 유효한 경우에만 업데이트
    if (!isNaN(newQuantity) && newQuantity !== originalQuantity && newQuantity >= 1) {
      handleQuantityInput(itemId, newValue, maxStock);
    } else if (isNaN(newQuantity) || newQuantity < 1) {
      // 잘못된 값인 경우 원래 값으로 복원
      setInputQuantities(prev => ({
        ...prev,
        [itemId]: originalQuantity.toString()
      }));
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      await cartApi.removeFromCart(itemId);
      // 장바구니 다시 로드
      await loadCart();
    } catch (error) {
      console.error('아이템 제거 실패:', error);
      alert('아이템 제거에 실패했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  // 주문하기 함수 - 체크아웃 페이지로 이동
  const handleOrder = () => {
    if (!user || !cart || cartItems.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }

    // 체크아웃 페이지로 이동
    router.push('/checkout');
  };

  // 토스페이먼츠 결제위젯 v2 초기화 및 결제 요청
  const initializePayment = async (orderId: string, orderName: string) => {
    try {
      // 토스페이먼츠 결제위젯 연동 키 (문서 테스트 키)
      const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
      
      // 1. 토스페이먼츠 SDK 초기화
      const tossPayments = (window as any).TossPayments(clientKey);
      
      // 2. 결제위젯 인스턴스 생성
      const widgets = tossPayments.widgets({
        customerKey: user?.id || 'anonymous_' + Date.now(),
      });
      
      // 3. 결제 UI를 위한 DOM 요소 생성
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
      payButton.innerText = `${total.toLocaleString()}원 결제하기`;
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
      overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;';
      overlay.appendChild(paymentContainer);
      document.body.appendChild(overlay);

      // DOM이 완전히 렌더링된 후 위젯 렌더링
      await new Promise(resolve => requestAnimationFrame(resolve));

      // 4. 가장 간단한 방법으로 결제 UI 렌더링
      //console.log('결제 위젯 렌더링 시작, 금액:', total);
      
      // 올바른 형태로 금액 설정 (currency 필수)
      try {
        await widgets.setAmount({
          currency: 'KRW',
          value: total
        });
        //console.log('금액 설정 성공:', total);
      } catch (amountError) {
        console.error('금액 설정 실패:', amountError);
      }

      // 결제 UI 렌더링 - v2 정확한 객체 형태
      try {
        await widgets.renderPaymentMethods({
          selector: "#payment-method",
          variantKey: "DEFAULT"
        });
        //console.log('결제 UI 렌더링 성공');
      } catch (renderError) {
        console.error('결제 UI 렌더링 실패:', renderError);
        // 대안: variantKey 없이 시도
        try {
          await widgets.renderPaymentMethods({
            selector: "#payment-method"
          });
          //console.log('결제 UI 렌더링 성공 (대안)');
        } catch (renderError2) {
          console.error('결제 UI 렌더링 실패 (대안):', renderError2);
          throw renderError2;
        }
      }

      // 6. 이용약관 UI 렌더링 - v2 객체 형태
      try {
        await widgets.renderAgreement({
          selector: "#agreement",
          variantKey: "AGREEMENT"
        });
        //console.log('이용약관 UI 렌더링 성공');
      } catch (agreementError) {
        console.error('이용약관 UI 렌더링 실패:', agreementError);
        // 대안: variantKey 없이 시도
        try {
          await widgets.renderAgreement({
            selector: "#agreement"
          });
          //console.log('이용약관 UI 렌더링 성공 (대안)');
        } catch (agreementError2) {
          console.error('이용약관 UI 렌더링 실패 (대안):', agreementError2);
        }
      }

      // 7. 결제 버튼 이벤트 등록
      payButton.addEventListener('click', async () => {
        try {
          payButton.disabled = true;
          payButton.innerText = '결제 처리 중...';
          
          // 전화번호 정규화 함수
          const normalizePhoneNumber = (phone?: string | null): string | undefined => {
            if (!phone) return undefined;
            
            // 모든 공백, 하이픈, 특수문자 제거
            let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
            
            // +82 로 시작하는 경우 한국 번호로 변환
            if (cleaned.startsWith('82')) {
              cleaned = cleaned.substring(2); // 82 제거
              if (cleaned.startsWith('10')) {
                cleaned = '0' + cleaned; // 010으로 시작하도록
              }
            }
            
            // 01012345678 형식인지 검증
            const phoneRegex = /^01[0-9]\d{8}$/;
            if (phoneRegex.test(cleaned)) {
              return cleaned;
            }
            
            console.warn(`Invalid phone number format: ${phone} -> ${cleaned}`);
            return undefined;
          };

          const normalizedPhone = normalizePhoneNumber(user?.phoneNumber);
          //console.log(`전화번호 정규화: "${user?.phoneNumber}" -> "${normalizedPhone}"`);
          
          await widgets.requestPayment({
            orderId,
            orderName,
            successUrl: `${window.location.origin}/payment/success`,
            failUrl: `${window.location.origin}/payment/fail`,
            customerEmail: user?.email || undefined,
            customerName: user?.name || undefined,
            customerMobilePhone: normalizedPhone,
          });
        } catch (error) {
          console.error('결제 요청 실패:', error);
          alert('결제 요청에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
          payButton.disabled = false;
          payButton.innerText = `${total.toLocaleString()}원 결제하기`;
        }
      });

      // 8. 취소 버튼 이벤트 등록
      closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        setPaymentLoading(false);
      });

      // 9. ESC 키로 닫기
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
          setPaymentLoading(false);
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);

      // 10. 오버레이 클릭 시 닫기
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          setPaymentLoading(false);
          document.removeEventListener('keydown', handleEscape);
        }
      });

    } catch (error) {
      console.error('결제위젯 초기화 실패:', error);
      alert('결제위젯 초기화에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      setPaymentLoading(false);
    }
  };

  // 가격 계산 헬퍼 함수
  const getItemPrice = (item: CartItem, userRole?: string) => {
    return userRole === 'BIZ' ? item.product.priceB2C : item.product.priceB2C;
  };

  const cartItems = cart?.items || [];
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => 
    sum + (getItemPrice(item, user?.role || 'CONSUMER') * item.quantity), 0);
  const shippingFee = subtotal > 50000 ? 0 : 3000;
  const total = subtotal + shippingFee;

  // 로딩 상태
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">장바구니를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 상태
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
            <p className="text-gray-600 mb-8">장바구니를 이용하려면 로그인해주세요.</p>
            <Button asChild size="lg">
              <a href="/signin">로그인하기</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 장바구니가 비어있는 상태
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">장바구니가 비어있습니다</h1>
            <p className="text-gray-600 mb-8">원하는 상품을 장바구니에 담아보세요.</p>
            <Button asChild size="lg">
              <a href="/home">쇼핑 계속하기</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">장바구니</h1>
          <p className="text-gray-600 mt-2">총 {totalItems}개의 상품</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 장바구니 상품 목록 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>상품 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      {/* 상품 이미지 */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={getImageUrl(item.product.images[0])}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* 상품 정보 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{item.product.name}</h3>
                        {item.product.vendor?.name && (
                          <p className="text-sm text-gray-600">{item.product.vendor.name}</p>
                        )}
                        <p className="text-lg font-bold text-gray-900">
                          {getItemPrice(item, user?.role || 'CONSUMER').toLocaleString()}원
                        </p>
                        {/* 재고 정보 표시 */}
                        {item.product.stockQuantity <= (item.product.lowStockThreshold || 10) && (
                          <p className="text-xs text-orange-600 font-medium">
                            재고 부족 (남은 수량: {item.product.stockQuantity}개)
                          </p>
                        )}
                      </div>
                      
                      {/* 수량 조절 */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.product.stockQuantity)}
                            disabled={item.quantity <= 1 || updating === item.id}
                            className="w-8 h-8 p-0"
                          >
                            -
                          </Button>
                          <input
                            type="number"
                            min="1"
                            max={item.product.stockQuantity}
                            value={inputQuantities[item.id] || item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            onKeyPress={(e) => handleQuantityKeyPress(e, item.id, item.product.stockQuantity)}
                            onBlur={(e) => handleQuantityBlur(e, item.id, item.quantity, item.product.stockQuantity)}
                            disabled={updating === item.id}
                            className="w-16 h-8 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title={`재고: ${item.product.stockQuantity}개`}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.product.stockQuantity)}
                            disabled={updating === item.id || item.quantity >= item.product.stockQuantity}
                            className="w-8 h-8 p-0"
                            title={item.quantity >= item.product.stockQuantity ? '재고가 부족합니다' : '수량 증가'}
                          >
                            +
                          </Button>
                        </div>
                        {updating === item.id && (
                          <div className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin text-gray-400" />
                            <span className="text-xs text-gray-500">업데이트 중...</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 삭제 버튼 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={updating === item.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {updating === item.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 주문 요약 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>주문 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">상품 금액</span>
                    <span className="font-medium">{subtotal.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">배송비</span>
                    <span className="font-medium">
                      {shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}
                    </span>
                  </div>
                  {shippingFee > 0 && (
                    <div className="text-sm text-gray-500">
                      * 5만원 이상 구매 시 배송비 무료
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>총 결제금액</span>
                      <span>{total.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleOrder}
                  disabled={cartItems.length === 0}
                >
                  주문하기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                
                <div className="text-sm text-gray-500 text-center">
                  주문 전 상품 정보를 다시 한번 확인해주세요.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
