'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  CreditCard, 
  Truck, 
  Calendar,
  Phone,
  Mail,
  User,
  CheckCircle,
  X,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import { ordersApi } from '@/lib/api/orders';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, Order as DetailOrder } from '@/types/order';
import { returnsApi } from '@/lib/api/returns';
import { reviewsApi, AvailableReviewItem } from '@/lib/api/reviews';
import { useToast, toast } from '@/components/ui/toast';
import { usePrompt } from '@/components/ui/prompt-modal';
import { useConfirm } from '@/components/ui/confirm-modal';
import { getImageUrl } from '@/lib/utils/image';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { prompt } = usePrompt();
  const { confirm } = useConfirm();
  const [order, setOrder] = useState<DetailOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 교환/반품 신청 모달 상태
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [returnType, setReturnType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // 리뷰 작성 모달 상태
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [availableReviewItems, setAvailableReviewItems] = useState<AvailableReviewItem[]>([]);
  const [selectedReviewItem, setSelectedReviewItem] = useState<AvailableReviewItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const orderNumber = params.orderNumber as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
      return;
    }

    if (orderNumber && isAuthenticated) {
      loadOrderDetail();
    }
  }, [orderNumber, isAuthenticated, authLoading]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersApi.getOrderDetail(orderNumber);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError('주문 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
      setError('주문 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    router.back();
  };

  // 교환/반품 신청 모달 열기
  const openReturnModal = () => {
    setShowReturnModal(true);
    setSelectedItems([]);
    setReturnType('RETURN');
    setReturnReason('');
    setReturnDescription('');
  };

  // 교환/반품 신청 모달 닫기
  const closeReturnModal = () => {
    setShowReturnModal(false);
  };

  // 리뷰 작성 모달 열기
  const openReviewModal = async () => {
    if (!order) return;
    
    try {
      const response = await reviewsApi.getAvailableReviewItems(order.id);
      if (response.success && response.data) {
        setAvailableReviewItems(response.data.items);
        setShowReviewModal(true);
      } else {
        showToast(toast.error('리뷰 작성 실패', '리뷰 작성 가능한 상품을 불러올 수 없습니다.'));
      }
    } catch (error) {
      console.error('리뷰 작성 가능 상품 조회 실패:', error);
      showToast(toast.error('리뷰 작성 실패', '리뷰 작성 가능한 상품을 불러올 수 없습니다.'));
    }
  };

  // 리뷰 작성 모달 닫기
  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedReviewItem(null);
    setReviewRating(5);
    setReviewTitle('');
    setReviewContent('');
  };

  // 리뷰 작성 처리
  const handleSubmitReview = async () => {
    if (!selectedReviewItem) {
      showToast(toast.warning('상품 선택 필요', '리뷰를 작성할 상품을 선택해주세요.'));
      return;
    }

    if (!reviewContent.trim()) {
      showToast(toast.warning('내용 입력 필요', '리뷰 내용을 입력해주세요.'));
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await reviewsApi.createReview({
        productId: selectedReviewItem.productId,
        orderId: order!.id,
        orderItemId: selectedReviewItem.orderItemId,
        rating: reviewRating,
        title: reviewTitle.trim() || '',
        content: reviewContent.trim()
      });

      if (response.success) {
        showToast(toast.success('리뷰 작성 완료', '리뷰가 성공적으로 작성되었습니다.'));
        closeReviewModal();
        // 주문 상세 정보 새로고침
        loadOrderDetail();
      } else {
        showToast(toast.error('리뷰 작성 실패', response.error || '리뷰 작성에 실패했습니다.'));
      }
    } catch (error) {
      console.error('리뷰 작성 실패:', error);
      showToast(toast.error('리뷰 작성 실패', '리뷰 작성에 실패했습니다.'));
    } finally {
      setSubmittingReview(false);
    }
  };

  // 주문 취소 가능 여부 확인
  const canCancelOrder = () => {
    if (!order) return false;
    // 상품준비중 이전 상태: PENDING, CONFIRMED
    return ['PENDING', 'CONFIRMED'].includes(order.status);
  };

  // 주문 취소 처리
  const handleCancelOrder = async () => {
    const confirmed = await confirm({
      title: '주문 취소 확인',
      message: '정말로 이 주문을 취소하시겠습니까? 취소 시 자동으로 환불이 처리됩니다.',
      confirmText: '취소하기',
      cancelText: '돌아가기',
      type: 'warning'
    });
    if (!confirmed) return;

    try {
      const reason = await prompt({
        title: '주문 취소',
        message: '취소 사유를 입력해주세요:',
        placeholder: '취소 사유를 입력하세요',
        confirmText: '취소하기',
        cancelText: '돌아가기',
        required: true
      });
      if (!reason) return;

      const response = await ordersApi.cancelOrder(orderNumber, reason);
      if (response.success) {
        showToast(toast.success('주문 취소 완료', '주문이 성공적으로 취소되었습니다. 환불이 자동으로 처리됩니다.'));
        loadOrderDetail(); // 주문 정보 새로고침
      } else {
        showToast(toast.error('주문 취소 실패', response.error || '주문 취소에 실패했습니다.'));
      }
    } catch (error) {
      console.error('주문 취소 실패:', error);
      showToast(toast.error('주문 취소 오류', '주문 취소 중 오류가 발생했습니다.'));
    }
  };

  // 교환/반품 상태 확인 함수
  const getItemReturnStatus = (item: any) => {
    if (!item.returns || item.returns.length === 0) return null;

    const activeReturns = item.returns.filter((returnItem: any) => 
      ['PENDING', 'APPROVED', 'PROCESSING'].includes(returnItem.status)
    );

    if (activeReturns.length === 0) return null;

    const hasExchange = activeReturns.some((r: any) => r.type === 'EXCHANGE');
    const hasReturn = activeReturns.some((r: any) => r.type === 'RETURN');
    const hasCancel = activeReturns.some((r: any) => r.type === 'CANCEL');

    if (hasExchange) {
      return { type: 'exchange', text: '교환 진행중', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    } else if (hasReturn) {
      return { type: 'return', text: '반품 진행중', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (hasCancel) {
      return { type: 'cancel', text: '취소 진행중', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }

    return null;
  };

  // 교환/반품 신청 가능한 상품이 있는지 확인하는 함수
  const hasAvailableItemsForReturn = () => {
    if (!order || !order.items) return false;
    
    return order.items.some((item: any) => {
      // 교환/반품 신청 중인 상품이 없는 경우만 true
      if (!item.returns || item.returns.length === 0) return true;
      
      // 진행 중인 교환/반품이 없는 경우만 true
      const activeReturns = item.returns.filter((returnItem: any) => 
        ['PENDING', 'APPROVED', 'PROCESSING'].includes(returnItem.status)
      );
      
      return activeReturns.length === 0;
    });
  };

  // 상품 선택/해제
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // 교환/반품 신청 제출
  const submitReturnRequest = async () => {
    if (!order) {
      showToast(toast.error('주문 정보 오류', '주문 정보를 찾을 수 없습니다.'));
      return;
    }

    if (selectedItems.length === 0) {
      showToast(toast.warning('상품 선택 필요', '교환/반품할 상품을 선택해주세요.'));
      return;
    }

    if (!returnReason) {
      showToast(toast.warning('사유 선택 필요', '교환/반품 사유를 선택해주세요.'));
      return;
    }

    if (!returnDescription.trim()) {
      showToast(toast.warning('설명 입력 필요', '상세 설명을 입력해주세요.'));
      return;
    }

    try {
      setSubmittingReturn(true);
      
      // 선택된 상품들에 대해 교환/반품 신청 생성
      const promises = selectedItems.map(itemId => 
        returnsApi.createReturn({
          orderId: order.id,
          orderItemId: itemId,
          type: returnType,
          reason: returnReason,
          notes: returnDescription
        })
      );
      
      const responses = await Promise.all(promises);
      const successCount = responses.filter(r => r.success).length;
      
      if (successCount === selectedItems.length) {
        showToast(toast.success('신청 완료', `${returnType === 'RETURN' ? '반품' : '교환'} 신청이 완료되었습니다. (${successCount}개 상품)`));
        closeReturnModal();
        
        // 주문 정보 새로고침
        await loadOrderDetail();
      } else {
        showToast(toast.success('부분 완료', `${successCount}개 상품의 ${returnType === 'RETURN' ? '반품' : '교환'} 신청이 완료되었습니다.`));
        closeReturnModal();
      }
      
    } catch (error) {
      console.error('교환/반품 신청 실패:', error);
      showToast(toast.error('신청 실패', '교환/반품 신청에 실패했습니다. 다시 시도해주세요.'));
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">주문을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">{error || '요청하신 주문 정보를 찾을 수 없습니다.'}</p>
          <Button onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const getStatusStep = (status: string) => {
    const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    return steps.indexOf(status);
  };

  const currentStep = getStatusStep(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <Button 
            variant="ghost" 
            onClick={goBack}
            className="mb-3 sm:mb-4 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">주문 상세</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2 truncate">주문번호: {order.orderNumber}</p>
            </div>
            <div className="flex flex-col sm:items-end gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${
                    ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] ||
                    'text-gray-600 bg-gray-50'
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                </span>
                {/* 주문 취소 버튼 */}
                {canCancelOrder() && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelOrder}
                    className="text-xs sm:text-sm"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    취소
                  </Button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* 주문 진행 상황 */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              배송 진행 상황
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between overflow-x-auto">
              {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((status, index) => {
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <div key={status} className="flex flex-col items-center flex-1 min-w-[60px] sm:min-w-[80px]">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5" />
                      ) : (
                        <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 sm:mt-2 text-center leading-tight ${
                      isCurrent ? 'font-medium text-blue-600' : 'text-gray-500'
                    }`}>
                      {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS]}
                    </p>
                    {index < 4 && (
                      <div className={`h-1 w-full mt-2 sm:mt-4 ${
                        index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* 왼쪽 컬럼 */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* 주문 상품 정보 */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  주문 상품
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.images && Array.isArray(item.product.images) && item.product.images.length > 0 ? (
                          <img
                            src={getImageUrl(item.product.images[0])}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">{item.product.name}</h4>
                          {(() => {
                            const returnStatus = getItemReturnStatus(item);
                            return returnStatus ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${returnStatus.color} self-start sm:self-auto`}>
                                {returnStatus.text}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        {item.product.category && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">{item.product.category.name}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-2">
                          <p className="text-xs sm:text-sm text-gray-600">
                            수량: {item.quantity}개
                          </p>
                          <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm text-gray-500">
                              {item.unitPrice.toLocaleString()}원 × {item.quantity}
                            </p>
                            <p className="font-medium text-gray-900 text-sm sm:text-base">
                              {item.totalPrice.toLocaleString()}원
                            </p>
                          </div>
                        </div>
                        {item.returns && item.returns.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.returns
                              .filter((returnItem: any) => ['PENDING', 'APPROVED', 'PROCESSING'].includes(returnItem.status))
                              .map((returnItem: any) => (
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
                        
                        {/* 리뷰 작성 버튼 */}
                        {order.status === 'DELIVERED' && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={openReviewModal}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs sm:text-sm w-full sm:w-auto"
                            >
                              리뷰 작성
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 주문 금액 요약 */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">상품 금액</span>
                      <span className="font-medium">{Number(order.subtotal).toLocaleString()}원</span>
                    </div>
                    {Number(order.discountAmount) > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">할인 금액</span>
                        <span className="text-red-500 font-medium">-{Number(order.discountAmount).toLocaleString()}원</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">배송비</span>
                      <span className="font-medium">
                        {Number(order.shippingAmount) === 0 
                          ? '무료' 
                          : `${Number(order.shippingAmount).toLocaleString()}원`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-base sm:text-lg font-semibold pt-2 border-t border-gray-200">
                      <span>총 결제 금액</span>
                      <span className="text-blue-600">{Number(order.totalAmount).toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 배송지 정보 */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  배송지 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  {order.shippingAddress?.receiver_name && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{order.shippingAddress.receiver_name}</span>
                    </div>
                  )}
                  {order.shippingAddress?.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-sm sm:text-base">{order.shippingAddress.phone}</span>
                    </div>
                  )}
                  {order.shippingAddress?.base_address && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base break-words">{order.shippingAddress.base_address}</p>
                        {order.shippingAddress.detail_address && (
                          <p className="text-gray-600 text-sm sm:text-base break-words">{order.shippingAddress.detail_address}</p>
                        )}
                        {order.shippingAddress.zone_number && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            우편번호: {order.shippingAddress.zone_number}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 컬럼 */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* 주문자 정보 */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  주문자 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base">{order.user?.name || user?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base break-all">{order.user?.email || user?.email}</span>
                  </div>
                  {(order.user?.phoneNumber || user?.phoneNumber) && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                      <span className="text-sm sm:text-base">{order.user?.phoneNumber || user?.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 결제 정보 */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  결제 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">결제 방법</span>
                    <span className="font-medium text-sm sm:text-base">토스페이먼츠</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">결제 상태</span>
                    <span className="font-medium text-green-600 text-sm sm:text-base">결제 완료</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">결제 일시</span>
                    <span className="text-sm sm:text-base">
                      {new Date(order.createdAt).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="font-medium text-sm sm:text-base">총 결제 금액</span>
                    <span className="font-semibold text-base sm:text-lg text-blue-600">
                      {order.totalAmount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 배송 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  배송 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">배송 방법</span>
                    <span className="font-medium">일반 배송</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">배송비</span>
                    <span className={`font-medium ${Number(order.shippingAmount) === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {Number(order.shippingAmount) === 0 
                        ? '무료' 
                        : `${Number(order.shippingAmount).toLocaleString()}원`
                      }
                    </span>
                  </div>
                  {order.status === 'SHIPPED' || order.status === 'DELIVERED' ? (
                    <>
                      {order.shipments && order.shipments.length > 0 ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">운송장 번호</span>
                            <span className="font-medium">{order.shipments[0]?.trackingNumber || '정보 없음'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">택배사</span>
                            <span className="font-medium">{order.shipments[0]?.carrier || '정보 없음'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">배송 상태</span>
                            <span className="font-medium">
                              {order.shipments[0]?.status === 'PENDING' && '배송 준비중'}
                              {order.shipments[0]?.status === 'SHIPPED' && '배송중'}
                              {order.shipments[0]?.status === 'DELIVERED' && '배송 완료'}
                              {!order.shipments[0]?.status && '정보 없음'}
                            </span>
                          </div>
                          {order.shipments[0]?.shippedAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">배송 시작일</span>
                              <span className="font-medium">
                                {new Date(order.shipments[0].shippedAt).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            className="w-full mt-4"
                            onClick={() => {
                              // 배송 조회 링크 (택배사별로 다른 URL 사용)
                              const shipment = order.shipments?.[0];
                              if (!shipment) return;
                              
                              const carrier = shipment.carrier;
                              const trackingNumber = shipment.trackingNumber;
                              
                              // 택배사별 배송 조회 링크 매핑
                              const carrierTrackingUrls: { [key: string]: string } = {
                                '대신화물': 'https://www.ds3211.co.kr/',
                                'CJ대한통운': 'https://www.cjlogistics.com/ko/tool/parcel/tracking',
                                '롯데택배': 'https://www.lotteglogis.com/home/reservation/tracking/index',
                                '한진택배': 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillSch.do?mCode=MN038',
                                '우체국택배': 'https://service.epost.go.kr/iservice/usr/trace/usrtrc001k01.jsp',
                                '로젠택배': 'https://www.ilogen.com/web/personal/tkSearch'
                              };
                              
                              // 택배사명으로 정확한 링크 찾기
                              let trackingUrl = '';
                              let foundCarrier = '';
                              
                              // 정확한 매칭 먼저 시도
                              for (const [carrierName, url] of Object.entries(carrierTrackingUrls)) {
                                if (carrier === carrierName) {
                                  trackingUrl = url;
                                  foundCarrier = carrierName;
                                  break;
                                }
                              }
                              
                              // 정확한 매칭이 없으면 부분 매칭 시도
                              if (!trackingUrl) {
                                for (const [carrierName, url] of Object.entries(carrierTrackingUrls)) {
                                  if (carrier.includes(carrierName) || carrierName.includes(carrier)) {
                                    trackingUrl = url;
                                    foundCarrier = carrierName;
                                    break;
                                  }
                                }
                              }
                              
                              // 매칭되는 택배사가 없으면 기본 링크 사용
                              if (!trackingUrl) {
                                trackingUrl = 'https://www.doortodoor.co.kr/parcel/trace.do?invoice_no=' + trackingNumber;
                                foundCarrier = '기본 배송 조회';
                              }
                              
                              //console.log(`배송 조회: ${carrier} -> ${foundCarrier} (${trackingUrl})`);
                              window.open(trackingUrl, '_blank');
                            }}
                          >
                            배송 조회
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">배송 정보를 불러올 수 없습니다.</p>
                          <p className="text-xs mt-1">
                            고객센터에 문의해주세요.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">배송 준비 중입니다.</p>
                      <p className="text-xs mt-1">
                        배송이 시작되면 운송장 번호를 안내해드립니다.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          {/* 디버깅: 현재 주문 상태 표시
          <div className="text-sm text-gray-500 mb-2">
            현재 주문 상태: {order.status} ({ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]})
          </div> */}
          
          {order.status === 'PENDING' && (
            <Button variant="destructive" className="w-full sm:w-auto text-sm">
              주문 취소
            </Button>
          )}
          {(order.status === 'DELIVERED' || order.status === 'SHIPPED') && hasAvailableItemsForReturn() && (
            <>
              <Button variant="outline" onClick={openReturnModal} className="w-full sm:w-auto text-sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                교환/반품 신청
              </Button>
              {order.status === 'DELIVERED' && (
                <Button onClick={openReviewModal} className="w-full sm:w-auto text-sm">
                  리뷰 작성
                </Button>
              )}
            </>
          )}
          <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto text-sm">
            주문서 인쇄
          </Button>
        </div>
      </div>

      {/* 교환/반품 신청 모달 */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                교환/반품 신청
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={closeReturnModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* 교환/반품 유형 선택 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">신청 유형</h3>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="RETURN"
                    checked={returnType === 'RETURN'}
                    onChange={(e) => setReturnType(e.target.value as 'RETURN' | 'EXCHANGE')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700">반품</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="EXCHANGE"
                    checked={returnType === 'EXCHANGE'}
                    onChange={(e) => setReturnType(e.target.value as 'RETURN' | 'EXCHANGE')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700">교환</span>
                </label>
              </div>
            </div>

            {/* 상품 선택 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">상품 선택</h3>
              <div className="space-y-3">
                {order.items.map((item) => {
                  const isReturnInProgress = item.returns && item.returns.some((returnItem: any) => 
                    ['PENDING', 'APPROVED', 'PROCESSING'].includes(returnItem.status)
                  );
                  
                  return (
                    <label 
                      key={item.id} 
                      className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg ${
                        isReturnInProgress 
                          ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                          : 'cursor-pointer hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => !isReturnInProgress && toggleItemSelection(item.id)}
                        disabled={isReturnInProgress}
                        className="text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                          {isReturnInProgress && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                              교환/반품 진행중
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          수량: {item.quantity}개 | 
                          가격: ₩{item.totalPrice.toLocaleString()}
                        </p>
                        {isReturnInProgress && (
                          <p className="text-xs text-orange-600 mt-1">
                            이미 교환/반품 신청이 진행 중인 상품입니다.
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 사유 선택 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">사유 선택</h3>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">사유를 선택해주세요</option>
                <option value="단순변심">단순변심</option>
                <option value="상품불량">상품불량</option>
                <option value="오배송">오배송</option>
                <option value="상품파손">상품파손</option>
                <option value="사이즈불일치">사이즈불일치</option>
                <option value="색상불일치">색상불일치</option>
                <option value="기타">기타</option>
              </select>
            </div>

            {/* 상세 설명 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">상세 설명</h3>
              <textarea
                value={returnDescription}
                onChange={(e) => setReturnDescription(e.target.value)}
                placeholder="교환/반품 사유에 대한 상세한 설명을 입력해주세요..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={4}
              />
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={closeReturnModal}>
                취소
              </Button>
              <Button 
                onClick={submitReturnRequest}
                disabled={submittingReturn || selectedItems.length === 0 || !returnReason || !returnDescription.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {submittingReturn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    처리중...
                  </>
                ) : (
                  <>
                    {returnType === 'RETURN' ? '반품' : '교환'} 신청하기
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 리뷰 작성 모달 */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">리뷰 작성</h2>
              <button
                onClick={closeReviewModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* 상품 선택 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">리뷰를 작성할 상품 선택</h3>
              <div className="space-y-3">
                {availableReviewItems.map((item) => (
                  <label 
                    key={item.orderItemId} 
                    className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedReviewItem?.orderItemId === item.orderItemId 
                        ? 'border-blue-500 bg-blue-50' 
                        : ''
                    } ${item.hasReview ? 'opacity-75' : ''}`}
                  >
                    <input
                      type="radio"
                      name="selectedReviewItem"
                      checked={selectedReviewItem?.orderItemId === item.orderItemId}
                      onChange={() => setSelectedReviewItem(item)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.productImages && item.productImages.length > 0 ? (
                          <img
                            src={getImageUrl(item.productImages?.[0] ?? '/images/placeholder.png')}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">
                          수량: {item.quantity}개 | 
                          가격: ₩{item.finalPrice.toLocaleString()}
                        </p>
                        {item.hasReview && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            ✓ 이미 리뷰를 작성한 상품입니다
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              {/* 안내 메시지 */}
              {selectedReviewItem?.hasReview && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        <strong>이미 리뷰를 작성한 상품입니다.</strong> 다른 상품을 선택해주세요.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 별점 선택 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">별점 선택</h3>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => !selectedReviewItem?.hasReview && setReviewRating(star)}
                    disabled={selectedReviewItem?.hasReview}
                    className={`text-2xl ${
                      star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'
                    } ${selectedReviewItem?.hasReview ? 'cursor-not-allowed opacity-50' : 'hover:text-yellow-400 transition-colors'}`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-3 text-sm text-gray-600">
                  {reviewRating}점
                </span>
              </div>
            </div>

            {/* 리뷰 제목 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">리뷰 제목 (선택사항)</h3>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => !selectedReviewItem?.hasReview && setReviewTitle(e.target.value)}
                placeholder={selectedReviewItem?.hasReview ? "이미 작성된 리뷰입니다" : "리뷰 제목을 입력해주세요..."}
                disabled={selectedReviewItem?.hasReview}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedReviewItem?.hasReview ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                maxLength={100}
              />
            </div>

            {/* 리뷰 내용 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">리뷰 내용</h3>
              <textarea
                value={reviewContent}
                onChange={(e) => !selectedReviewItem?.hasReview && setReviewContent(e.target.value)}
                placeholder={selectedReviewItem?.hasReview ? "이미 작성된 리뷰입니다" : "상품에 대한 솔직한 리뷰를 작성해주세요..."}
                disabled={selectedReviewItem?.hasReview}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedReviewItem?.hasReview ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                rows={5}
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 mt-2 text-right">
                {reviewContent.length}/1000
              </p>
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={closeReviewModal}>
                취소
              </Button>
              <Button 
                onClick={handleSubmitReview}
                disabled={submittingReview || !selectedReviewItem || !reviewContent.trim() || selectedReviewItem?.hasReview}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submittingReview ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    작성중...
                  </>
                ) : selectedReviewItem?.hasReview ? (
                  '이미 작성된 리뷰'
                ) : (
                  '리뷰 작성하기'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
