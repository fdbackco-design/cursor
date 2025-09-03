'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cartApi, Cart, CartItem } from '@/lib/api/cart';
import { getImageUrl } from '@/lib/utils/image';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
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
      const response = await cartApi.updateQuantity(itemId, quantity);
      if (response.success) {
        await loadCart(); // 장바구니 새로고침
      }
    } catch (error) {
      console.error('수량 업데이트 실패:', error);
      alert('수량 업데이트에 실패했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setUpdating(itemId);
      const response = await cartApi.removeItem(itemId);
      if (response.success) {
        await loadCart(); // 장바구니 새로고침
      }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">장바구니를 확인하려면 로그인해주세요.</p>
          <Button onClick={() => window.location.href = '/signin'}>
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
  const shippingFee = subtotal >= 50000 ? 0 : 3000;
  const total = subtotal + shippingFee;

  // 빈 장바구니
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">장바구니가 비어있습니다</h2>
            <p className="text-gray-600 mb-6">원하는 상품을 장바구니에 담아보세요.</p>
            <Button onClick={() => router.push('/')}>
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
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-12">
          장바구니
        </h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
          {/* 장바구니 아이템 */}
          <div className="lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle>담은 상품 ({cartItems.length}개)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 bg-white border rounded-lg">
                      {/* 상품 이미지 */}
                      <div className="flex-shrink-0">
                        <img
                          src={getImageUrl(item.product.images?.[0])}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {item.product.category?.name}
                        </p>
                        <div className="flex items-center space-x-4">
                          <span className="text-lg font-bold text-gray-900">
                            {item.finalPrice.toLocaleString()}원
                          </span>
                          {item.discountAmount > 0 && (
                            <span className="text-sm text-gray-500 line-through">
                              {item.unitPrice.toLocaleString()}원
                            </span>
                          )}
                        </div>
                      </div>

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
                        >
                          -
                        </Button>
                        <input
                          type="text"
                          value={inputQuantities[item.id] || item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          onBlur={() => {
                            const quantity = parseInt(inputQuantities[item.id]);
                            if (quantity && quantity !== item.quantity && quantity > 0) {
                              updateQuantity(item.id, quantity);
                            }
                          }}
                          className="w-16 text-center border rounded px-2 py-1"
                          disabled={updating === item.id}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={updating === item.id}
                        >
                          +
                        </Button>
                      </div>

                      {/* 제거 버튼 */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={updating === item.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 주문 요약 */}
          <div className="lg:col-span-5 mt-16 lg:mt-0">
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
