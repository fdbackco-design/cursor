'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { User, Settings, ShoppingBag, Heart, MapPin, LogOut, Trash2, Package, ChevronRight, Calendar, Ticket, Plus, AlertTriangle } from 'lucide-react';
import { wishlistApi } from '@/lib/api/wishlist';
import { WishlistItem } from '@/types/wishlist';
import { ProductCard } from '@/components/products/product-card';
import { ordersApi } from '@/lib/api/orders';
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types/order';
import { ShippingAddress, AddressFormData } from '@/types/address';
import { AddressCard } from '@/components/address/address-card';
import { AddressFormModal } from '@/components/address/address-form-modal';
import { addressesApi } from '@/lib/api/addresses';
import { couponsApi, UserCoupon, couponUtils } from '@/lib/api/coupons';
import { useToast, toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-modal';
import { getImageUrl } from '@/lib/utils/image';

export default function AccountPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState('profile');
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(0);
  
  // 배송지 관리 상태
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);

  // 쿠폰 관리 상태
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [registering, setRegistering] = useState(false);

  // 디버깅을 위한 로깅
  useEffect(() => {
    // console.log('AccountPage - 인증 상태:', { 
    //   isAuthenticated, 
    //   user, 
    //   userApprove: user?.approve,
    //   loading 
    // });
  }, [isAuthenticated, user, loading]);

  // 찜목록 로드
  useEffect(() => {
    if (activeTab === 'wishlist' && isAuthenticated && user) {
      loadWishlist();
    }
  }, [activeTab, isAuthenticated, user]);

  // 주문내역 로드
  useEffect(() => {
    if (activeTab === 'orders' && isAuthenticated && user) {
      loadOrders();
    }
  }, [activeTab, isAuthenticated, user, ordersPage]);

  // 배송지 로드
  useEffect(() => {
    if (activeTab === 'address' && isAuthenticated && user) {
      loadAddresses();
    }
  }, [activeTab, isAuthenticated, user]);

  // 쿠폰 로드
  useEffect(() => {
    if (activeTab === 'coupons' && isAuthenticated && user) {
      loadCoupons();
    }
  }, [activeTab, isAuthenticated, user]);

  // 함수 정의들
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

  const loadOrders = async (page = 1) => {
    setOrdersLoading(true);
    try {
      //console.log('주문내역 로드 시작:', { page, limit: 10 });
      const response = await ordersApi.getOrders({
        page,
        limit: 10,
      });
      //console.log('주문내역 API 응답:', response);
      
      if (response.success && response.data) {
        // API 응답을 기존 Order 타입으로 변환
        const orders = response.data.orders || [];
        //console.log('조회된 주문 수:', orders.length);
        
        const convertedOrders: Order[] = orders.map(order => ({
          ...order,
          status: order.status as 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
          items: order.items.map(item => ({
            ...item,
            id: item.productId, // productId를 id로 매핑
            product: {
              id: item.productId,
              name: item.productName,
              description: '',
              images: [], // API에서 이미지 정보가 없으므로 빈 배열
              priceB2C: item.unitPrice,
              category: {
                name: ''
              }
            }
          }))
        }));
        setOrders(convertedOrders);
        setOrdersTotalPages(response.data.pagination?.totalPages || 0);
      } else {
        // 응답이 없거나 실패한 경우 빈 배열로 설정
        //console.log('주문내역 없음 또는 응답 실패:', response);
        setOrders([]);
        setOrdersTotalPages(0);
      }
    } catch (error) {
      //console.error('주문내역 로드 실패:', error);
      // 오류 발생 시에도 빈 배열로 설정
      setOrders([]);
      setOrdersTotalPages(0);
    } finally {
      setOrdersLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      await wishlistApi.removeFromWishlist({ productId });
      // 찜목록에서 제거
      setWishlist(prev => prev.filter(item => item.productId !== productId));
    } catch (error) {
      //console.error('찜하기 제거 실패:', error);
      showToast(toast.error('찜하기 제거 실패', '찜하기 제거에 실패했습니다.'));
    }
  };

  // 배송지 관리 함수들
  const loadAddresses = async () => {
    try {
      const response = await addressesApi.getAddresses();
      if (response.success && response.data) {
        // API 응답 데이터를 기존 인터페이스와 호환되도록 변환
        const addresses = response.data.map((addr): ShippingAddress => ({
          ...addr,
          // 호환성을 위한 필드 매핑
          receiver_name: addr.receiverName,
          receiver_phone_number1: addr.receiverPhoneNumber1,
          receiver_phone_number2: addr.receiverPhoneNumber2 || '',
          zone_number: addr.zoneNumber,
          base_address: addr.baseAddress,
          detail_address: addr.detailAddress,
          is_default: addr.isDefault,
          updated_at: new Date(addr.updatedAt).getTime(),
          type: addr.isDefault ? 'DEFAULT' : 'ADDITIONAL',
          default: addr.isDefault,
        }));
        
        setAddresses(addresses);
      } else {
        // API에서 배송지가 없는 경우, 사용자 기본 배송지를 표시 (호환성)
        const addressList: ShippingAddress[] = [];
        
        if (user?.shippingAddress) {
          const defaultAddress: ShippingAddress = {
            id: 'default', // 기본 배송지는 ID 'default'로 설정
            userId: user.id || '',
            name: '기본 배송지',
            receiverName: user.shippingAddress.receiver_name || user.name,
            receiverPhoneNumber1: user.shippingAddress.receiver_phone_number1 || user.phoneNumber || '',
            receiverPhoneNumber2: user.shippingAddress.receiver_phone_number2 || '',
            zoneNumber: user.shippingAddress.zone_number || '',
            baseAddress: user.shippingAddress.base_address || '',
            detailAddress: user.shippingAddress.detail_address || '',
            isDefault: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // 호환성 필드
            type: 'DEFAULT',
            default: true,
            receiver_name: user.shippingAddress.receiver_name || user.name,
            receiver_phone_number1: user.shippingAddress.receiver_phone_number1 || user.phoneNumber || '',
            receiver_phone_number2: user.shippingAddress.receiver_phone_number2 || '',
            zone_number: user.shippingAddress.zone_number || '',
            base_address: user.shippingAddress.base_address || '',
            detail_address: user.shippingAddress.detail_address || '',
            is_default: true,
            updated_at: Date.now(),
          };
          addressList.push(defaultAddress);
        }
        
        setAddresses(addressList);
      }
    } catch (error) {
      console.error('배송지 로드 실패:', error);
    }
  };

  const handleAddAddress = async (data: AddressFormData) => {
    try {
      const createData = {
        name: data.name,
        receiverName: data.receiver_name,
        receiverPhoneNumber1: data.receiver_phone_number1,
        receiverPhoneNumber2: data.receiver_phone_number2 || '',
        zoneNumber: data.zone_number,
        baseAddress: data.base_address,
        detailAddress: data.detail_address,
        isDefault: data.is_default || false,
      };

      const response = await addressesApi.createAddress(createData);
      
      if (response.success && response.data) {
        // 배송지 목록 새로고침
        await loadAddresses();
        showToast(toast.success('배송지 추가', '배송지가 추가되었습니다.'));
      } else {
        throw new Error(response.error || '배송지 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('배송지 추가 실패:', error);
      showToast(toast.error('배송지 추가 실패', error instanceof Error ? error.message : '배송지 추가에 실패했습니다.'));
      throw error;
    }
  };

  const handleEditAddress = async (data: AddressFormData) => {
    if (!editingAddress) return;

    try {
      const updateData = {
        name: data.name,
        receiverName: data.receiver_name,
        receiverPhoneNumber1: data.receiver_phone_number1,
        receiverPhoneNumber2: data.receiver_phone_number2 || '',
        zoneNumber: data.zone_number,
        baseAddress: data.base_address,
        detailAddress: data.detail_address,
        isDefault: data.is_default || false,
      };

      const response = await addressesApi.updateAddress(editingAddress.id, updateData);
      
      if (response.success && response.data) {
        // 배송지 목록 새로고침
        await loadAddresses();
        setEditingAddress(null);
        showToast(toast.success('배송지 수정', '배송지가 수정되었습니다.'));
      } else {
        throw new Error(response.error || '배송지 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('배송지 수정 실패:', error);
      showToast(toast.error('배송지 수정 실패', error instanceof Error ? error.message : '배송지 수정에 실패했습니다.'));
      throw error;
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (addressId === 'default') {
      showToast(toast.warning('삭제 불가', '기본 배송지는 삭제할 수 없습니다.'));
      return;
    }

    const confirmed = await confirm({
      title: '배송지 삭제',
      message: '이 배송지를 삭제하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      type: 'danger'
    });
    if (confirmed) {
      try {
        const response = await addressesApi.deleteAddress(addressId);
        
        if (response.success) {
          // 배송지 목록 새로고침
          await loadAddresses();
          showToast(toast.success('배송지 삭제', '배송지가 삭제되었습니다.'));
        } else {
          throw new Error(response.error || '배송지 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('배송지 삭제 실패:', error);
        showToast(toast.error('배송지 삭제 실패', error instanceof Error ? error.message : '배송지 삭제에 실패했습니다.'));
      }
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (addressId === 'default') {
      showToast(toast.warning('이미 기본 배송지', '이미 기본 배송지입니다.'));
      return;
    }

    try {
      const response = await addressesApi.setDefaultAddress(addressId);
      
      if (response.success) {
        // 배송지 목록 새로고침
        await loadAddresses();
        showToast(toast.success('기본 배송지 변경', '기본 배송지가 변경되었습니다.'));
      } else {
        throw new Error(response.error || '기본 배송지 설정에 실패했습니다.');
      }
    } catch (error) {
      console.error('기본 배송지 설정 실패:', error);
      showToast(toast.error('기본 배송지 설정 실패', error instanceof Error ? error.message : '기본 배송지 설정에 실패했습니다.'));
    }
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setAddressModalOpen(true);
  };

  const openEditModal = (address: ShippingAddress) => {
    setEditingAddress(address);
    setAddressModalOpen(true);
  };

  const closeModal = () => {
    setAddressModalOpen(false);
    setEditingAddress(null);
  };

  // 탭 정의
  // 쿠폰 관련 함수들
  const loadCoupons = async () => {
    setCouponsLoading(true);
    try {
      //console.log('쿠폰 목록 로드 시작');
      const response = await couponsApi.getMyCoupons();
      //console.log('쿠폰 API 응답:', response);
      
      if (response.success && response.data) {
        setCoupons(response.data);
      } else {
        //console.log('쿠폰 없음 또는 응답 실패:', response);
        setCoupons([]);
      }
    } catch (error) {
      console.error('쿠폰 목록 로드 실패:', error);
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  };

  const handleRegisterCoupon = async () => {
    if (!couponCode.trim()) {
      showToast(toast.warning('쿠폰 코드 입력 필요', '쿠폰 코드를 입력해주세요.'));
      return;
    }

    setRegistering(true);
    try {
      //console.log('쿠폰 등록 시작:', couponCode);
      const response = await couponsApi.registerCoupon(couponCode.trim());
      //console.log('쿠폰 등록 응답:', response);
      
      if (response.success) {
        showToast(toast.success('쿠폰 등록 완료', '쿠폰이 성공적으로 등록되었습니다!'));
        setCouponCode('');
        await loadCoupons(); // 쿠폰 목록 새로고침
      } else {
        throw new Error(response.error || '쿠폰 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('쿠폰 등록 실패:', error);
      showToast(toast.error('쿠폰 등록 실패', error instanceof Error ? error.message : '쿠폰 등록에 실패했습니다.'));
    } finally {
      setRegistering(false);
    }
  };

  // 교환/반품 상태 확인 함수
  const getReturnStatus = (order: Order) => {
    const activeReturns = order.items?.flatMap(item => 
      item.returns?.filter(returnItem => 
        ['PENDING', 'APPROVED', 'PROCESSING'].includes(returnItem.status)
      ) || []
    ) || [];

    if (activeReturns.length === 0) return null;

    const hasExchange = activeReturns.some(r => r.type === 'EXCHANGE');
    const hasReturn = activeReturns.some(r => r.type === 'RETURN');
    const hasCancel = activeReturns.some(r => r.type === 'CANCEL');

    if (hasExchange) {
      return { type: 'exchange', text: '교환 진행중', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    } else if (hasReturn) {
      return { type: 'return', text: '반품 진행중', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (hasCancel) {
      return { type: 'cancel', text: '취소 진행중', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }

    return null;
  };

  const tabs = [
    { id: 'profile', label: '프로필', icon: User },
    { id: 'orders', label: '주문내역', icon: ShoppingBag },
    { id: 'wishlist', label: '찜목록', icon: Heart },
    { id: 'address', label: '배송지', icon: MapPin },
    { id: 'coupons', label: '쿠폰', icon: Ticket },
    { id: 'settings', label: '설정', icon: Settings },
    { id: 'delete', label: '회원탈퇴', icon: AlertTriangle },
  ];

  // 로딩 상태 처리
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

  // 인증되지 않은 사용자 처리
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
                <CardTitle className="flex items-center justify-between">
                  <span>주문 내역</span>
                  {orders.length > 0 && (
                    <span className="text-sm text-gray-500">
                      총 {orders.length}개 주문
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">주문 내역을 불러오는 중...</p>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                      >
                        {/* 주문 헤더 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                주문번호: {order.orderNumber}
                              </h3>
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(order.createdAt).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] ||
                                'text-gray-600 bg-gray-50'
                              }`}
                            >
                              {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                            </span>
                            {(() => {
                              const returnStatus = getReturnStatus(order);
                              return returnStatus ? (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${returnStatus.color}`}>
                                  {returnStatus.text}
                                </span>
                              ) : null;
                            })()}
                            <span className="font-semibold text-lg text-gray-900">
                              {order.totalAmount.toLocaleString()}원
                            </span>
                          </div>
                        </div>

                        {/* 주문 상품 목록 */}
                        <div className="space-y-3">
                          {order.items.slice(0, 2).map((item) => (
                            <div key={item.id} className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                {item.product.images && Array.isArray(item.product.images) && item.product.images.length > 0 ? (
                                  <img
                                    src={getImageUrl(item.product.images[0])}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {item.quantity}개 × {item.unitPrice.toLocaleString()}원
                                </p>
                                {item.returns && item.returns.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {item.returns
                                      .filter(returnItem => ['PENDING', 'APPROVED', 'PROCESSING'].includes(returnItem.status))
                                      .map((returnItem) => (
                                        <span
                                          key={returnItem.id}
                                          className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                            returnItem.type === 'EXCHANGE' 
                                              ? 'bg-orange-100 text-orange-800 border-orange-200'
                                              : returnItem.type === 'RETURN'
                                              ? 'bg-red-100 text-red-800 border-red-200'
                                              : 'bg-gray-100 text-gray-800 border-gray-200'
                                          }`}
                                        >
                                          {returnItem.type === 'EXCHANGE' ? '교환' : 
                                           returnItem.type === 'RETURN' ? '반품' : '취소'} 진행중
                                        </span>
                                      ))}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  {item.totalPrice.toLocaleString()}원
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          {order.items.length > 2 && (
                            <div className="text-center py-2 text-sm text-gray-500">
                              외 {order.items.length - 2}개 상품
                            </div>
                          )}
                        </div>

                        {/* 주문 상세 보기 버튼 */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              window.location.href = `/orders/${order.orderNumber}`;
                            }}
                          >
                            주문 상세 보기
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* 페이지네이션 */}
                    {ordersTotalPages > 1 && (
                      <div className="flex justify-center mt-6">
                        <div className="flex space-x-2">
                          {Array.from({ length: ordersTotalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => {
                                setOrdersPage(page);
                                loadOrders(page);
                              }}
                              className={`px-3 py-2 rounded-md text-sm font-medium ${
                                ordersPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>아직 주문 내역이 없습니다.</p>
                    <p className="text-sm mt-2">상품을 주문하면 여기에 표시됩니다.</p>
                    <Button className="mt-4" asChild>
                      <a href="/home">쇼핑하러 가기</a>
                    </Button>
                  </div>
                )}
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
                        <ProductCard product={{
                          ...item.product,
                          sku: '',
                          categoryId: '',
                          isFeatured: false,
                          stockQuantity: 0,
                          lowStockThreshold: 0,
                          tags: [],
                          metadata: {},
                          createdAt: new Date(),
                          updatedAt: new Date(),
                          category: typeof item.product.category === 'string' 
                            ? { id: '', name: item.product.category, slug: '' }
                            : { id: '', name: '', slug: '' }
                        }} />
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
                <CardTitle className="flex items-center justify-between">
                  <span>배송지 관리</span>
                  <Button onClick={openAddModal}>
                    배송지 추가
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        isDefault={address.is_default || false}
                        onEdit={() => openEditModal(address)}
                        onDelete={() => handleDeleteAddress(address.id)}
                        onSetDefault={() => handleSetDefaultAddress(address.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>등록된 배송지가 없습니다.</p>
                    <p className="text-sm mt-2">첫 번째 배송지를 추가해보세요.</p>
                    <Button className="mt-4" onClick={openAddModal}>
                      배송지 추가
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'coupons':
        return (
          <div className="space-y-6">
            {/* 쿠폰 등록 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  쿠폰 등록
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="쿠폰 코드를 입력하세요"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={registering}
                  />
                  <Button 
                    onClick={handleRegisterCoupon}
                    disabled={registering || !couponCode.trim()}
                  >
                    {registering ? '등록 중...' : '등록'}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  쿠폰 코드를 입력하여 새 쿠폰을 등록하세요.
                </p>
              </CardContent>
            </Card>

            {/* 내 쿠폰 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  내 쿠폰 ({coupons.length}개)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {couponsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">쿠폰 목록을 불러오는 중...</p>
                  </div>
                ) : coupons.length > 0 ? (
                  <div className="space-y-4">
                    {coupons.map((userCoupon) => {
                      const coupon = userCoupon.coupon;
                      return (
                        <div
                          key={userCoupon.id}
                          className={`p-4 border rounded-lg ${
                            coupon.isUsable 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {coupon.name}
                                </h3>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    coupon.isUsable
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {couponUtils.getStatusText(coupon)}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-2">
                                {coupon.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-medium text-blue-600">
                                  {couponUtils.getDiscountText(coupon)}
                                </span>
                                {coupon.minAmount && (
                                  <span className="text-gray-500">
                                    최소 주문: {coupon.minAmount.toLocaleString()}원
                                  </span>
                                )}
                                <span className="text-gray-500">
                                  유효기간: {couponUtils.getValidityText(coupon)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900 mb-1">
                                {coupon.code}
                              </div>
                              {coupon.maxUses && (
                                <div className="text-xs text-gray-500">
                                  {coupon.currentUses}/{coupon.maxUses} 사용
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>등록된 쿠폰이 없습니다.</p>
                    <p className="text-sm mt-2">쿠폰 코드를 입력하여 새 쿠폰을 등록해보세요.</p>
                  </div>
                )}
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

      case 'delete':
        return (
          <div className="space-y-6">
            <Card className="border-red-200">
              <CardHeader className="bg-red-50 border-b border-red-200">
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-6 w-6" />
                  회원탈퇴
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* 경고 메시지 */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-semibold mb-2">회원탈퇴 시 주의사항</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>회원탈퇴는 <strong>되돌릴 수 없습니다</strong></li>
                        <li>진행 중인 주문이 있는 경우 탈퇴할 수 없습니다</li>
                        <li>개인정보는 즉시 익명화되며 복구할 수 없습니다</li>
                        <li>주문/결제 정보는 법적 보관 의무에 따라 보관됩니다</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 탈퇴 처리 방식 안내 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">탈퇴 처리 방식</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>즉시 익명화:</strong> 이름, 이메일, 전화번호, 배송지 등 개인정보</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>완전 삭제:</strong> 장바구니, 위시리스트, 카카오 연동 정보</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>법적 보관:</strong> 주문/결제/배송 정보 (5년간 보관)</span>
                    </div>
                  </div>
                </div>

                {/* 탈퇴 약관 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">탈퇴 약관</h3>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p>
                      회원탈퇴 시 개인정보는 「개인정보 보호법」에 따라 즉시 익명화 처리되며, 
                      주문/결제 정보는 「전자상거래법」에 따라 5년간 보관됩니다.
                    </p>
                    <p>
                      탈퇴 후에는 동일한 카카오 계정으로 재가입이 가능하지만, 
                      기존 데이터는 복구되지 않습니다.
                    </p>
                  </div>
                </div>

                {/* 탈퇴 버튼 */}
                <div className="pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => window.location.href = '/account/delete'}
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    회원탈퇴 진행하기
                  </Button>
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

        {/* 배송지 추가/수정 모달 */}
        <AddressFormModal
          isOpen={addressModalOpen}
          onClose={closeModal}
          onSubmit={editingAddress ? handleEditAddress : handleAddAddress}
          initialData={editingAddress ? {
            name: editingAddress.name,
            receiver_name: editingAddress.receiver_name || editingAddress.receiverName,
            receiver_phone_number1: editingAddress.receiver_phone_number1 || editingAddress.receiverPhoneNumber1,
            receiver_phone_number2: editingAddress.receiver_phone_number2 || editingAddress.receiverPhoneNumber2 || '',
            zone_number: editingAddress.zone_number || editingAddress.zoneNumber,
            base_address: editingAddress.base_address || editingAddress.baseAddress,
            detail_address: editingAddress.detail_address || editingAddress.detailAddress,
            is_default: editingAddress.is_default !== undefined ? editingAddress.is_default : editingAddress.isDefault,
          } : {
            name: '',
            receiver_name: '',
            receiver_phone_number1: '',
            receiver_phone_number2: '',
            zone_number: '',
            base_address: '',
            detail_address: '',
            is_default: false
          }}
          title={editingAddress ? "배송지 수정" : "배송지 추가"}
        />
      </div>
    </div>
  );
}
