'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { User, Settings, ShoppingBag, Heart, MapPin, CreditCard, LogOut, Trash2 } from 'lucide-react';
import { wishlistApi } from '@/lib/api/wishlist';
import { WishlistItem } from '@/types/wishlist';
import { ProductCard } from '@/components/products/product-card';

export default function AccountPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // 디버깅을 위한 로깅
  useEffect(() => {
    console.log('AccountPage - 인증 상태:', { 
      isAuthenticated, 
      user, 
      userApprove: user?.approve,
      loading 
    });
  }, [isAuthenticated, user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600 mb-6">마이페이지를 이용하려면 로그인해주세요.</p>
          <Button asChild>
            <a href="/signin">로그인하기</a>
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: '프로필', icon: User },
    { id: 'orders', label: '주문내역', icon: ShoppingBag },
    { id: 'wishlist', label: '찜목록', icon: Heart },
    { id: 'address', label: '배송지', icon: MapPin },
    { id: 'payment', label: '결제수단', icon: CreditCard },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  // 찜목록 로드
  useEffect(() => {
    if (activeTab === 'wishlist' && isAuthenticated && user) {
      loadWishlist();
    }
  }, [activeTab, isAuthenticated, user]);

  const loadWishlist = async () => {
    setWishlistLoading(true);
    try {
      const response = await wishlistApi.getWishlist();
      if (response.success && response.data) {
        setWishlist(response.data);
      }
    } catch (error) {
      console.error('찜목록 로드 실패:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      await wishlistApi.removeFromWishlist({ productId });
      // 찜목록에서 제거
      setWishlist(prev => prev.filter(item => item.productId !== productId));
    } catch (error) {
      console.error('찜하기 제거 실패:', error);
      alert('찜하기 제거에 실패했습니다.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">사용자 유형</label>
                    <input
                      type="text"
                      value={user.role === 'BIZ' ? '기업 사용자' : '일반 사용자'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">가입일</label>
                    <input
                      type="text"
                      value={new Date().toLocaleDateString('ko-KR')}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>주문 내역</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>아직 주문 내역이 없습니다.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'wishlist':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>찜 목록</span>
                  {wishlist.length > 0 && (
                    <span className="text-sm text-gray-500">
                      총 {wishlist.length}개 상품
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {wishlistLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">찜목록을 불러오는 중...</p>
                  </div>
                ) : wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((item) => (
                      <div key={item.id} className="relative">
                        <ProductCard product={item.product} />
                        <button
                          onClick={() => removeFromWishlist(item.productId)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                          title="찜하기 제거"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>찜한 상품이 없습니다.</p>
                    <p className="text-sm mt-2">상품을 찜하면 여기에 표시됩니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'address':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>배송지 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>등록된 배송지가 없습니다.</p>
                  <Button className="mt-4">배송지 추가</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>결제 수단</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>등록된 결제 수단이 없습니다.</p>
                  <Button className="mt-4">결제 수단 추가</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>계정 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium">이메일 알림</h3>
                    <p className="text-sm text-gray-600">주문 상태 및 프로모션 알림</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium">SMS 알림</h3>
                    <p className="text-sm text-gray-600">배송 및 주문 상태 알림</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
          <p className="text-gray-600 mt-2">계정 정보를 관리하고 주문 내역을 확인하세요.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors duration-200 ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
