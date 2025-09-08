'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Eye,
  Calendar,
  TrendingUp,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { refundsApi, REFUND_REASONS, REFUND_STATUSES } from '@/lib/api/refunds';

interface RefundData {
  id: string;
  returnId: string;
  orderId: string;
  orderItemId?: string;
  refundAmount: number;
  refundReason: string;
  status: string;
  tossRefundId?: string;
  transactionKey?: string;
  receiptKey?: string;
  refundedAt?: string;
  processedBy?: string;
  notes?: string;
  createdAt: string;
  order: {
    orderNumber: string;
    user: {
      name: string;
      email: string;
    };
  };
  orderItem?: {
    product: {
      name: string;
      images: string[];
    };
  };
  return: {
    reason: string;
    type: string;
  };
}

export default function RefundsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [refunds, setRefunds] = useState<RefundData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<RefundData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // 필터 상태
  const [filters, setFilters] = useState<{
    status: string;
    refundReason: string;
    startDate: string;
    endDate: string;
  }>({
    status: '',
    refundReason: '',
    startDate: '',
    endDate: ''
  });

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isAuthenticated && (user as any)?.role === 'ADMIN') {
      loadRefunds();
      loadStats();
    }
  }, [currentPage, filters, isAuthenticated, user]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      //console.log('환불 내역 로드 시작...');
      
      const response = await refundsApi.getRefunds({
        page: currentPage,
        limit: 20,
        status: filters.status as any,
        refundReason: filters.refundReason as any,
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      //console.log('환불 API 응답:', response);

      if (response.success && response.data) {
        // console.log('Raw API response data:', response.data);
        // console.log('Raw API response data.data:', response.data.data);
        // console.log('Raw API response data.data.refunds:', response.data.data?.refunds);
        
        // API 응답 구조: {success: true, data: {refunds: [], pagination: {}}}
        let refundsData = [];
        let paginationData = null;
        
        if (response.data.data && response.data.data.refunds && Array.isArray(response.data.data.refunds)) {
          refundsData = response.data.data.refunds;
          paginationData = response.data.data.pagination;
        } else if (Array.isArray(response.data)) {
          refundsData = response.data;
        } else if (response.data.refunds && Array.isArray(response.data.refunds)) {
          refundsData = response.data.refunds;
          paginationData = response.data.pagination;
        } else {
          console.warn('예상치 못한 API 응답 구조:', response.data);
        }
        
        if (refundsData.length > 0) {
          //console.log('첫 번째 환불 데이터:', refundsData[0]);
        }
        
        //console.log('환불 데이터 (after assignment):', refundsData);
        setRefunds(refundsData);
        
        // 페이지네이션 정보 처리
        if (paginationData) {
          setTotalPages(paginationData.totalPages || 1);
        } else {
          setTotalPages(Math.ceil(refundsData.length / 20));
        }
      } else {
        //console.log('환불 데이터 없음 또는 오류:', response.error);
        setRefunds([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('환불 내역 로드 실패:', error);
      setRefunds([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await refundsApi.getRefundStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('환불 통계 로드 실패:', error);
    }
  };

  const openDetailModal = (refund: RefundData) => {
    setSelectedRefund(refund);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRefund(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRefundReasonText = (reason: string) => {
    return REFUND_REASONS[reason as keyof typeof REFUND_REASONS] || reason;
  };

  const getStatusText = (status: string) => {
    return REFUND_STATUSES[status as keyof typeof REFUND_STATUSES] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h1>
          <p className="text-gray-600 mb-6">환불 관리 페이지에 접근하려면 로그인해주세요.</p>
          <Link href="/signin">
            <Button>로그인하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 관리자 권한이 없는 사용자
  if ((user as any)?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-6">환불 관리 페이지는 관리자만 접근할 수 있습니다.</p>
          <Link href="/admin">
            <Button variant="outline">관리자 대시보드로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로가기
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">환불 관리</h1>
              <p className="text-gray-600">환불 내역 및 통계를 관리합니다.</p>
            </div>
          </div>
          <Button onClick={loadRefunds} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 환불 건수</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRefunds}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">완료된 환불</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedRefunds}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">대기 중</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingRefunds}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">실패한 환불</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.failedRefunds}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 환불 금액</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(stats.totalRefundAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 필터 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  {Object.entries(REFUND_STATUSES).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">환불 사유</label>
                <select
                  value={filters.refundReason}
                  onChange={(e) => setFilters(prev => ({ ...prev, refundReason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  {Object.entries(REFUND_REASONS).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 환불 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>환불 내역</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">환불 내역을 불러오는 중...</p>
              </div>
            ) : refunds.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">환불 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">환불 정보</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">주문 정보</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">환불 금액</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">상태</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">처리일</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(refunds) && refunds.map((refund) => (
                      <tr key={refund.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">#{refund.id.slice(-8)}</p>
                            <p className="text-sm text-gray-500">
                              {getRefundReasonText(refund.refundReason)}
                            </p>
                            {refund.notes && (
                              <p className="text-xs text-gray-400">{refund.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{refund.order.orderNumber}</p>
                            <p className="text-sm text-gray-500">{refund.order.user.name}</p>
                            {refund.orderItem && (
                              <p className="text-xs text-gray-400">{refund.orderItem.product.name}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-lg text-blue-600">
                            {formatCurrency(refund.refundAmount)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(refund.status)}`}>
                            {getStatusText(refund.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-500">
                            <p>{formatDate(refund.createdAt)}</p>
                            {refund.refundedAt && (
                              <p className="text-xs text-gray-400">
                                완료: {formatDate(refund.refundedAt)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailModal(refund)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            상세
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        currentPage === page
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
          </CardContent>
        </Card>
      </div>

      {/* 환불 상세 모달 */}
      {showDetailModal && selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">환불 상세 정보</h2>
              <Button variant="outline" size="sm" onClick={closeDetailModal}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">환불 ID</p>
                    <p className="text-gray-900">{selectedRefund.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">반품 ID</p>
                    <p className="text-gray-900">{selectedRefund.returnId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">환불 사유</p>
                    <p className="text-gray-900">{getRefundReasonText(selectedRefund.refundReason)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">환불 금액</p>
                    <p className="text-gray-900 font-semibold">{formatCurrency(selectedRefund.refundAmount)}</p>
                  </div>
                </div>
              </div>

              {/* 주문 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">주문 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">주문번호</p>
                    <p className="text-gray-900">{selectedRefund.order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">고객명</p>
                    <p className="text-gray-900">{selectedRefund.order.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">고객 이메일</p>
                    <p className="text-gray-900">{selectedRefund.order.user.email}</p>
                  </div>
                  {selectedRefund.orderItem && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">환불 상품</p>
                      <p className="text-gray-900">{selectedRefund.orderItem.product.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 토스페이먼츠 정보 */}
              {selectedRefund.tossRefundId && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">토스페이먼츠 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">토스 환불 ID</p>
                      <p className="text-gray-900">{selectedRefund.tossRefundId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">거래 키</p>
                      <p className="text-gray-900">{selectedRefund.transactionKey}</p>
                    </div>
                    {selectedRefund.receiptKey && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">영수증 키</p>
                        <p className="text-gray-900">{selectedRefund.receiptKey}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 처리 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">처리 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">생성일</p>
                    <p className="text-gray-900">{formatDate(selectedRefund.createdAt)}</p>
                  </div>
                  {selectedRefund.refundedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">환불 완료일</p>
                      <p className="text-gray-900">{formatDate(selectedRefund.refundedAt)}</p>
                    </div>
                  )}
                  {selectedRefund.processedBy && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">처리자</p>
                      <p className="text-gray-900">{selectedRefund.processedBy}</p>
                    </div>
                  )}
                  {selectedRefund.notes && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-600">처리 메모</p>
                      <p className="text-gray-900">{selectedRefund.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button onClick={closeDetailModal} className="w-full">
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}