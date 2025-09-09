'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cartApi, Cart, CartItem } from '@/lib/api/cart';
import { getImageUrl } from '@/lib/utils/image';
import { useRouter } from 'next/navigation';
import { useToast, toast } from '@/components/ui/toast';

export default function CartPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [inputQuantities, setInputQuantities] = useState<Record<string, string>>({});

  // 장바구니 로드
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadCart();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, authLoading]);

  const loadCart = async () => {
    try {
      const response = await cartApi.getCart();
      if (response.success && response.data) {
        setCart(response.data);
        
        // 초기 수량 설정
        const quantities: Record<string, string> = {};
        response.data.items?.forEach(item => {
          quantities[item.id] = item.quantity.toString();
        });
        setInputQuantities(quantities);
      }
    } catch (error) {
      console.error('장바구니 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId: string, value: string) => {
    // 숫자만 허용
    if (value === '' || /^\d+$/.test(value)) {
      setInputQuantities(prev => ({ ...prev, [itemId]: value }));
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    try {
      setUpdating(itemId);
      const response = await cartApi.updateCartItem(itemId, { quantity });
      if (response.success) {
        await loadCart(); // 장바구니 새로고침
      }
    } catch (error) {
      console.error('수량 업데이트 실패:', error);
      showToast(toast.error('수량 업데이트 실패', '수량 업데이트에 실패했습니다.'));
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setUpdating(itemId);
      const response = await cartApi.removeFromCart(itemId);
      if (response.success) {
        await loadCart(); // 장바구니 새로고침
      }
    } catch (error) {
      console.error('아이템 제거 실패:', error);
      showToast(toast.error('아이템 제거 실패', '아이템 제거에 실패했습니다.'));
    } finally {
      setUpdating(null);
    }
  };

  // 주문하기 함수 - 체크아웃 페이지로 이동
  const handleOrder = () => {
    if (!user || !cart || cartItems.length === 0) {
      showToast(toast.warning('장바구니 비어있음', '장바구니가 비어있습니다.'));
      return;
    }

    // 체크아웃 페이지로 이동
    router.push('/checkout');
  };

  // 로딩 상태
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">장바구니를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 안된 상태
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          <ShoppingBag className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">장바구니를 확인하려면 로그인해주세요.</p>
          <Button 
            onClick={() => window.location.href = '/signin'}
            className="w-full min-h-[44px] sm:min-h-[48px]"
          >
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.priceB2C * item.quantity), 0);
  const shippingFee = subtotal >= 50000 ? 0 : 3000;
  const total = subtotal + shippingFee;

  // 빈 장바구니
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-sm mx-auto">
            <ShoppingBag className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">장바구니가 비어있습니다</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">원하는 상품을 장바구니에 담아보세요.</p>
            <Button 
              onClick={() => router.push('/')}
              className="w-full min-h-[44px] sm:min-h-[48px]"
            >
              쇼핑 계속하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-8 sm:mb-12">
          장바구니
        </h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
          {/* 장바구니 아이템 */}
          <div className="lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">담은 상품 ({cartItems.length}개)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 sm:space-y-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 p-4 bg-white border rounded-lg">
                      {/* 상품 이미지와 정보 */}
                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                        {/* 상품 이미지 */}
                        <div className="flex-shrink-0">
                            <img
                            src={getImageUrl(item.product.images?.[0])}
                              alt={item.product.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                            />
                        </div>
                        
                        {/* 상품 정보 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 line-clamp-2">
                            {item.product.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 mb-2">
                            {item.product.category?.name}
                          </p>
                          <div className="flex items-center justify-between sm:block">
                            <span className="text-base sm:text-lg font-bold text-gray-900">
                              {item.product.priceB2C.toLocaleString()}원
                            </span>
                            {/* 모바일에서 제거 버튼을 여기에 배치 */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              disabled={updating === item.id}
                              className="sm:hidden h-8 w-8 p-0"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* 수량 조절과 제거 버튼 */}
                      <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
                        {/* 수량 조절 */}
                        <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                            onClick={() => {
                              const newQuantity = item.quantity - 1;
                              if (newQuantity > 0) {
                                updateQuantity(item.id, newQuantity);
                              }
                            }}
                            disabled={updating === item.id || item.quantity <= 1}
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 min-h-[32px] sm:min-h-[36px]"
                            >
                              -
                            </Button>
                            <input
                            type="text"
                              value={inputQuantities[item.id] || item.quantity}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            onBlur={() => {
                              const quantity = parseInt(inputQuantities[item.id] || '0');
                              if (quantity && quantity !== item.quantity && quantity > 0) {
                                updateQuantity(item.id, quantity);
                              }
                            }}
                            className="w-12 sm:w-16 text-center border rounded px-2 py-1 h-8 sm:h-9 text-sm"
                              disabled={updating === item.id}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updating === item.id}
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 min-h-[32px] sm:min-h-[36px]"
                            >
                              +
                            </Button>
                        </div>
                        
                        {/* 데스크톱에서 제거 버튼 */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={updating === item.id}
                          className="hidden sm:flex h-8 w-8 p-0"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 주문 요약 */}
          <div className="lg:col-span-5 mt-8 sm:mt-12 lg:mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">주문 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-600">상품 금액</span>
                    <span className="font-medium text-sm sm:text-base">{subtotal.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-600">배송비</span>
                    <span className="font-medium text-sm sm:text-base">
                      {shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}
                    </span>
                  </div>
                  {shippingFee > 0 && (
                    <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 p-2 rounded">
                      * 5만원 이상 구매 시 배송비 무료
                    </div>
                  )}
                  <div className="border-t pt-3 sm:pt-2">
                    <div className="flex justify-between items-center text-base sm:text-lg font-bold">
                      <span>총 결제금액</span>
                      <span className="text-primary">{total.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full min-h-[48px] sm:min-h-[52px]" 
                  size="lg" 
                  onClick={handleOrder}
                  disabled={cartItems.length === 0}
                >
                      주문하기
                      <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                
                <div className="text-xs sm:text-sm text-gray-500 text-center leading-relaxed">
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
