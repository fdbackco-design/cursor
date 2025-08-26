'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Trash2, ShoppingBag, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cartApi, Cart, CartItem } from '@/lib/api/cart';
import { getImageUrl } from '@/lib/utils/image';

export default function CartPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
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
      const cartData = await cartApi.getCart(user.id);
      setCart(cartData);
      
      // 입력 수량 초기화
      const quantities: Record<string, string> = {};
      cartData.items.forEach(item => {
        quantities[item.id] = item.quantity.toString();
      });
      setInputQuantities(quantities);
    } catch (error) {
      console.error('장바구니 로드 실패:', error);
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

  // 가격 계산 헬퍼 함수
  const getItemPrice = (item: CartItem, userRole?: string) => {
    return userRole === 'BIZ' ? item.product.priceB2C : item.product.priceB2C;
  };

  const cartItems = cart?.items || [];
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => 
    sum + (getItemPrice(item, user?.role) * item.quantity), 0);
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
                          {getItemPrice(item, user?.role).toLocaleString()}원
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
                
                <Button className="w-full" size="lg">
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
