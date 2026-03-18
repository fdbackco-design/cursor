'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package,
  Truck,
  AlertCircle,
  Eye,
  Edit,
  DollarSign,
  RotateCcw,
  Calendar,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { returnsApi, ReturnRequest, ReturnStats, ReturnQueryDto } from '@/lib/api/returns';
import { adminApi } from '@/lib/api/admin';
import { refundsApi, REFUND_REASONS, REFUND_STATUSES } from '@/lib/api/refunds';
import { useToast, toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-modal';
import { usePrompt } from '@/components/ui/prompt-modal';
import * as XLSX from 'xlsx';
import { formatNumber } from '@/lib/utils/price';

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [stats, setStats] = useState<ReturnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'refund' | 'exchange' | 'pickup'>('approve');
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { prompt } = usePrompt();
  
  // 액션 모달 상태
  const [actionData, setActionData] = useState({
    refundAmount: 0,
    refundReason: '',
    refundNotes: '',
    exchangeTrackingNumber: '',
    exchangeCarrier: '',
    exchangeNotes: '',
    pickupCarrier: '',
    pickupDate: '' as string,
    pickupNotes: ''
  });
  
  // 필터 상태
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    orderNumber: '',
    customerName: '',
    reason: '',
    startDate: '',
    endDate: ''
  });

  // 페이지네이션
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // 반품 목록 조회
  const loadReturns = useCallback(async () => {
    try {
      setLoading(true);
      
      const query: ReturnQueryDto = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.orderNumber && { orderNumber: filters.orderNumber }),
        ...(filters.customerName && { customerName: filters.customerName }),
        ...(filters.reason && { reason: filters.reason }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      };

      const response = await returnsApi.getReturns(query);

      if (response.success && response.data) {
        setReturns(response.data.returns);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('반품 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // 반품 통계 조회
  const loadStats = useCallback(async () => {
    try {
      const response = await returnsApi.getReturnStats();

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('반품 통계 조회 실패:', error);
    }
  }, []);

  // 엑셀 다운로드
  const exportToExcel = async () => {
    try {
      // 모든 반품 데이터 가져오기 (필터 없이)
      const query: ReturnQueryDto = {
        page: 1,
        limit: 10000, // 충분히 큰 수로 설정
      };

      const response = await returnsApi.getReturns(query);
      
      if (!response.success || !response.data) {
        showToast(toast.error('데이터 조회 실패', '반품 데이터를 불러올 수 없습니다.'));
        return;
      }

      const allReturns = response.data.returns;

      // 엑셀 데이터 준비
      const excelData = allReturns.map((returnRequest) => {
        // 주문 상세 정보에서 배송지 정보 가져오기
        const shippingAddress = returnRequest.order.user.phoneNumber || '';
        
        return {
          '날짜': formatDate(returnRequest.createdAt),
          '주문자': returnRequest.order.user.name,
          '제품명': returnRequest.orderItemId && returnRequest.orderItem 
            ? returnRequest.orderItem.product.name 
            : '전체 주문',
          '수량': returnRequest.orderItemId && returnRequest.orderItem 
            ? returnRequest.orderItem.quantity 
            : returnRequest.order.items.reduce((sum, item) => sum + item.quantity, 0),
          '배송지': shippingAddress, // 실제 배송지 정보가 필요하면 API에서 추가로 가져와야 함
          '연락처': returnRequest.order.user.phoneNumber || returnRequest.order.user.email,
          'CS 사유': returnRequest.reason,
          'CS 진행현황': getStatusText(returnRequest.status),
          '비고': returnRequest.notes || '',
          '제품공급가': returnRequest.orderItemId && returnRequest.orderItem 
            ? returnRequest.orderItem.finalPrice 
            : returnRequest.order.items.reduce((sum, item) => sum + item.finalPrice, 0),
          '배송비 왕복': 0, // 배송비 정보가 필요하면 API에서 추가로 가져와야 함
          '최종환불금액': returnRequest.refundAmount || 0,
          '입금완료 비고': returnRequest.adminNotes || '',
          '송장번호': returnRequest.trackingNumber || returnRequest.exchangeTrackingNumber || '',
          '택배사': returnRequest.carrier || returnRequest.exchangeCarrier || ''
        };
      });

      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 12 }, // 날짜
        { wch: 10 }, // 주문자
        { wch: 20 }, // 제품명
        { wch: 8 },  // 수량
        { wch: 15 }, // 배송지
        { wch: 15 }, // 연락처
        { wch: 15 }, // CS 사유
        { wch: 12 }, // CS 진행현황
        { wch: 20 }, // 비고
        { wch: 12 }, // 제품공급가
        { wch: 12 }, // 배송비 왕복
        { wch: 12 }, // 최종환불금액
        { wch: 20 }, // 입금완료 비고
        { wch: 15 }, // 송장번호
        { wch: 10 }  // 택배사
      ];
      worksheet['!cols'] = columnWidths;

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '반품 목록');

      // 파일명 생성 (현재 날짜 포함)
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const fileName = `반품목록_${dateStr}.xlsx`;

      // 파일 다운로드
      XLSX.writeFile(workbook, fileName);

      showToast(toast.success('엑셀 다운로드 완료', `${fileName} 파일이 다운로드되었습니다.`));
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      showToast(toast.error('다운로드 실패', '엑셀 파일 다운로드 중 오류가 발생했습니다.'));
    }
  };

  useEffect(() => {
    loadReturns();
    loadStats();
  }, [loadReturns, loadStats]);

  // 상태 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'PROCESSING':
        return <Package className="h-4 w-4 text-purple-600" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'APPROVED':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'PROCESSING':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'REJECTED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 타입 한글 변환
  const getTypeText = (type: string) => {
    switch (type) {
      case 'RETURN':
        return '반품';
      case 'EXCHANGE':
        return '교환';
      case 'CANCEL':
        return '취소';
      default:
        return type;
    }
  };

  // 상태 한글 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '요청 접수';
      case 'APPROVED':
        return '승인';
      case 'PROCESSING':
        return '처리중';
      case 'COMPLETED':
        return '완료';
      case 'REJECTED':
        return '거절';
      default:
        return status;
    }
  };

  // 날짜 포맷팅
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };



  // 주문 상세 정보 가져오기
  const loadOrderDetail = async (orderNumber: string) => {
    try {
      setLoadingOrderDetail(true);
      const response = await adminApi.getOrderDetail(orderNumber);
      if (response.success && response.data) {
        setOrderDetail(response.data);
      } else {
        console.error('주문 상세 정보 조회 실패:', response.error);
      }
    } catch (error) {
      console.error('주문 상세 정보 조회 실패:', error);
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  // 반품 상세 모달 열기
  const openDetailModal = async (returnRequest: ReturnRequest) => {
    setSelectedReturn(returnRequest);
    setShowModal(true);
    // 주문 상세 정보도 함께 로드
    await loadOrderDetail(returnRequest.order.orderNumber);
  };

  // 반품 상태 업데이트
  const updateReturnStatus = async (returnId: string, status: string, adminNotes?: string) => {
    try {
      const response = await returnsApi.updateReturnStatus(returnId, {
        status: status as any,
        adminNotes: adminNotes || `상태가 ${status}로 변경되었습니다.`,
        processedBy: 'admin', // 실제로는 현재 관리자 ID를 사용해야 함
      });

      if (response.success) {
        // 성공 시 목록 새로고침
        await loadReturns();
        await loadStats();
        
        // 모달 닫기
        setShowModal(false);
        setShowActionModal(false);
        
        showToast(toast.success('반품 상태 변경', `반품 상태가 ${getStatusText(status)}로 변경되었습니다.`));
      } else {
        showToast(toast.error('상태 변경 실패', `상태 변경 실패: ${response.error}`));
      }
    } catch (error) {
      console.error('반품 상태 업데이트 실패:', error);
      showToast(toast.error('상태 변경 오류', '상태 변경 중 오류가 발생했습니다.'));
    }
  };

  // 승인 처리
  const handleApprove = async (returnRequest: ReturnRequest) => {
    const confirmed = await confirm({
      title: '반품 승인',
      message: '이 반품 요청을 승인하시겠습니까?',
      confirmText: '승인',
      cancelText: '취소',
      type: 'info'
    });
    
    if (confirmed) {
      await updateReturnStatus(returnRequest.id, 'APPROVED', '반품 요청이 승인되었습니다.');
    }
  };

  // 거절 처리
  const handleReject = async (returnRequest: ReturnRequest) => {
    const reason = await prompt({
      title: '반품 거절',
      message: '거절 사유를 입력해주세요:',
      placeholder: '거절 사유를 입력하세요',
      required: true
    });
    
    if (reason) {
      await updateReturnStatus(returnRequest.id, 'REJECTED', `거절 사유: ${reason}`);
    }
  };

  // 액션 모달 열기
  const openActionModal = (returnRequest: ReturnRequest, type: 'refund' | 'exchange' | 'pickup') => {
    setSelectedReturn(returnRequest);
    setActionType(type);
    setShowActionModal(true);
    
    // 기본값 설정
    if (type === 'refund') {
      setActionData(prev => ({
        ...prev,
        refundAmount: returnRequest.order.items.reduce((sum, item) => sum + item.finalPrice, 0),
        refundReason: ''
      }));
    } else if (type === 'exchange') {
      setActionData(prev => ({
        ...prev,
        exchangeTrackingNumber: '',
        exchangeCarrier: '',
        exchangeNotes: ''
      }));
    } else if (type === 'pickup') {
      setActionData(prev => ({
        ...prev,
        pickupCarrier: '',
        pickupDate: new Date().toISOString().split('T')[0] || '',
        pickupNotes: ''
      }));
    }
  };

  // 환불 처리
  const handleRefund = async () => {
    if (!selectedReturn || !actionData.refundReason) {
      showToast(toast.warning('환불 사유 선택 필요', '환불 사유를 선택해주세요.'));
      return;
    }

    try {
      // 1. 환불 금액 계산
      const calculationResponse = await refundsApi.calculateRefundAmount(
        selectedReturn.orderId,
        selectedReturn.orderItemId ? [selectedReturn.orderItemId] : undefined,
        actionData.refundReason as any
      );

      if (!calculationResponse.success || !calculationResponse.data) {
        showToast(toast.error('환불 금액 계산 실패', `환불 금액 계산 실패: ${calculationResponse.error}`));
        return;
      }

      const calculation = calculationResponse.data;

      // 2. 환불 생성
      const createResponse = await refundsApi.createRefund({
        returnId: selectedReturn.id,
        orderId: selectedReturn.orderId,
        ...(selectedReturn.orderItemId && { orderItemIds: [selectedReturn.orderItemId] }),
        refundReason: actionData.refundReason as any,
        notes: actionData.refundNotes || actionData.refundReason
      });

      if (!createResponse.success || !createResponse.data) {
        showToast(toast.error('환불 생성 실패', `환불 생성 실패: ${createResponse.error}`));
        return;
      }

      const refund = createResponse.data;

      // 3. 토스페이먼츠를 통한 환불 처리
      const processResponse = await refundsApi.processRefund(refund.id, {
        processedBy: 'admin', // 실제로는 현재 관리자 ID
        notes: `환불 처리: ${formatNumber(calculation.totalRefundAmount)}원`
      });

      if (processResponse.success) {
        await loadReturns();
        await loadStats();
        setShowActionModal(false);
        showToast(toast.success('환불 처리 완료', `환불 처리가 완료되었습니다. (${formatNumber(calculation.totalRefundAmount)}원)`));
      } else {
        showToast(toast.error('환불 처리 실패', `환불 처리 실패: ${processResponse.error}`));
      }
    } catch (error) {
      console.error('환불 처리 실패:', error);
      showToast(toast.error('환불 처리 오류', '환불 처리 중 오류가 발생했습니다.'));
    }
  };

  // 교환 처리
  const handleExchange = async () => {
    if (!selectedReturn || !actionData.exchangeTrackingNumber || !actionData.exchangeCarrier) {
      showToast(toast.warning('송장 정보 입력 필요', '송장번호와 택배사를 입력해주세요.'));
      return;
    }

    try {
      const response = await returnsApi.processExchangeShipment(selectedReturn.id, {
        trackingNumber: actionData.exchangeTrackingNumber,
        carrier: actionData.exchangeCarrier
      });

      if (response.success) {
        await loadReturns();
        await loadStats();
        setShowActionModal(false);
        showToast(toast.success('교환 처리 완료', '교환 처리가 완료되었습니다.'));
      } else {
        showToast(toast.error('교환 처리 실패', `교환 처리 실패: ${response.error}`));
      }
    } catch (error) {
      console.error('교환 처리 실패:', error);
      showToast(toast.error('교환 처리 오류', '교환 처리 중 오류가 발생했습니다.'));
    }
  };

  // 회수 요청 처리
  const handlePickup = async () => {
    if (!selectedReturn || !actionData.pickupCarrier) {
      showToast(toast.warning('택배사 선택 필요', '택배사를 선택해주세요.'));
      return;
    }

    try {
      const response = await returnsApi.requestPickup(selectedReturn.id, {
        carrier: actionData.pickupCarrier,
        pickupDate: actionData.pickupDate
      });

      if (response.success) {
        await loadReturns();
        await loadStats();
        setShowActionModal(false);
        showToast(toast.success('회수 요청 완료', '반품 회수 요청이 완료되었습니다.'));
      } else {
        showToast(toast.error('회수 요청 실패', `회수 요청 실패: ${response.error}`));
      }
    } catch (error) {
      console.error('회수 요청 실패:', error);
      showToast(toast.error('회수 요청 오류', '회수 요청 중 오류가 발생했습니다.'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link 
            href="/admin" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            관리자 대시보드로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">반품/취소/교환 관리</h1>
          <p className="text-gray-600 mt-2">
            고객의 반품, 취소, 교환 요청을 관리하고 처리할 수 있습니다.
          </p>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">전체 요청</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalReturns}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">대기중</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.statusBreakdown.PENDING || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">처리중</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.statusBreakdown.PROCESSING || 0}
                    </p>
                  </div>
                  <Truck className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">완료</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.statusBreakdown.COMPLETED || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 필터 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2 text-gray-600" />
              필터 및 검색
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  <option value="PENDING">요청 접수</option>
                  <option value="APPROVED">승인</option>
                  <option value="PROCESSING">처리중</option>
                  <option value="COMPLETED">완료</option>
                  <option value="REJECTED">거절</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">유형</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  <option value="RETURN">반품</option>
                  <option value="EXCHANGE">교환</option>
                  <option value="CANCEL">취소</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">주문번호</label>
                <input
                  type="text"
                  placeholder="주문번호 검색"
                  value={filters.orderNumber}
                  onChange={(e) => setFilters(prev => ({ ...prev, orderNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">고객명</label>
                <input
                  type="text"
                  placeholder="고객명 검색"
                  value={filters.customerName}
                  onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <Button onClick={loadReturns}>
                <Search className="h-4 w-4 mr-2" />
                검색
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setFilters({
                  status: '', type: '', orderNumber: '', customerName: '', reason: '', startDate: '', endDate: ''
                })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                초기화
              </Button>
              <Button 
                variant="outline" 
                onClick={exportToExcel}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Download className="h-4 w-4 mr-2" />
                엑셀 다운로드
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 반품 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">반품 정보를 불러오는 중...</p>
          </div>
        ) : returns.length > 0 ? (
          <div className="space-y-4">
            {returns.map((returnRequest) => (
              <Card key={returnRequest.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold">
                          {returnRequest.order.orderNumber}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(returnRequest.status)}`}>
                          {getStatusIcon(returnRequest.status)}
                          {getStatusText(returnRequest.status)}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {getTypeText(returnRequest.type)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>고객: {returnRequest.order.user.name} ({returnRequest.order.user.email})</p>
                        {returnRequest.orderItemId && returnRequest.orderItem ? (
                          <p className="text-blue-600 font-medium">
                            반품 상품: {returnRequest.orderItem.product.name} (수량: {returnRequest.orderItem.quantity}개)
                          </p>
                        ) : (
                          <p className="text-orange-600 font-medium">전체 주문 반품</p>
                        )}
                        <p>사유: {returnRequest.reason}</p>
                        <p>요청일: {formatDate(returnRequest.createdAt)}</p>
                        {returnRequest.refundAmount && (
                          <p>환불금액: {formatCurrency(returnRequest.refundAmount)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailModal(returnRequest)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        상세
                      </Button>
                      {returnRequest.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(returnRequest)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            승인
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(returnRequest)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            거절
                          </Button>
                        </>
                      )}
                      {returnRequest.status === 'APPROVED' && (
                        <>
                          {returnRequest.type === 'CANCEL' && (
                            <Button
                              size="sm"
                              onClick={() => openActionModal(returnRequest, 'refund')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              환불
                            </Button>
                          )}
                          {returnRequest.type === 'EXCHANGE' && (
                            <Button
                              size="sm"
                              onClick={() => openActionModal(returnRequest, 'exchange')}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              교환출고
                            </Button>
                          )}
                          {returnRequest.type === 'RETURN' && (
                            <Button
                              size="sm"
                              onClick={() => openActionModal(returnRequest, 'pickup')}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              회수요청
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">반품 요청이 없습니다</h3>
              <p className="text-gray-600">
                검색 조건에 맞는 반품 요청이 없습니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                이전
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                다음
              </Button>
            </div>
          </div>
        )}

        {/* 반품 상세 모달 */}
        {showModal && selectedReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  반품 상세 정보 - {selectedReturn.order.orderNumber}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 반품 정보 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">반품 정보</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">반품 ID:</span>
                      <span className="font-medium">{selectedReturn.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">반품 유형:</span>
                      <span className="font-medium">{getTypeText(selectedReturn.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">상태:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getStatusColor(selectedReturn.status)}`}>
                        {getStatusIcon(selectedReturn.status)}
                        {getStatusText(selectedReturn.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">사유:</span>
                      <span className="font-medium">{selectedReturn.reason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">요청일:</span>
                      <span className="font-medium">{formatDate(selectedReturn.createdAt)}</span>
                    </div>
                    {selectedReturn.refundAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">환불금액:</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedReturn.refundAmount)}</span>
                      </div>
                    )}
                    {selectedReturn.notes && (
                      <div className="mt-3">
                        <span className="text-gray-600 block mb-1">고객 메모:</span>
                        <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedReturn.notes}</p>
                      </div>
                    )}
                    {selectedReturn.adminNotes && (
                      <div className="mt-3">
                        <span className="text-gray-600 block mb-1">관리자 메모:</span>
                        <p className="text-sm bg-blue-50 p-3 rounded-lg">{selectedReturn.adminNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 고객 정보 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">고객 정보</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">고객명:</span>
                      <span className="font-medium">{selectedReturn.order.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">이메일:</span>
                      <span className="font-medium">{selectedReturn.order.user.email}</span>
                    </div>
                    {selectedReturn.order.user.phoneNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">전화번호:</span>
                        <span className="font-medium">{selectedReturn.order.user.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 주문 상세 정보 */}
              {loadingOrderDetail ? (
                <div className="mt-6 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">주문 정보를 불러오는 중...</p>
                </div>
              ) : orderDetail ? (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">주문 상세 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 주문 정보 */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">주문 정보</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">주문번호:</span>
                          <span className="font-medium">{orderDetail.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">주문일시:</span>
                          <span className="font-medium">{formatDate(orderDetail.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">주문상태:</span>
                          <span className="font-medium">{orderDetail.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">총 금액:</span>
                          <span className="font-medium">{formatCurrency(orderDetail.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* 배송 정보 */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">배송 정보</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">수령인:</span>
                          <span className="font-medium">{orderDetail.shippingAddress?.receiver_name || orderDetail.shippingAddress?.name || '정보 없음'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">전화번호:</span>
                          <span className="font-medium">{orderDetail.shippingAddress?.phone || '정보 없음'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">주소:</span>
                          <span className="font-medium text-right">
                            {orderDetail.shippingAddress?.base_address || orderDetail.shippingAddress?.address || '정보 없음'}
                            {orderDetail.shippingAddress?.detail_address && ` ${orderDetail.shippingAddress.detail_address}`}
                          </span>
                        </div>
                        {orderDetail.shipments && orderDetail.shipments.length > 0 && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">택배사:</span>
                              <span className="font-medium">{orderDetail.shipments[0].carrier}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">송장번호:</span>
                              <span className="font-medium">{orderDetail.shipments[0].trackingNumber}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 상품 정보 */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">
                      {selectedReturn.orderItemId ? '반품 요청 상품' : '주문 상품'}
                    </h4>
                    <div className="space-y-3">
                      {selectedReturn.orderItemId ? (
                        // 특정 상품 반품인 경우 - 반품 요청된 상품만 표시
                        selectedReturn.orderItem ? (
                          <div className="border border-gray-200 rounded-lg p-4 bg-red-50">
                            <div className="flex items-start gap-4">
                              {selectedReturn.orderItem.product.images && selectedReturn.orderItem.product.images.length > 0 && (
                                <img
                                  src={selectedReturn.orderItem.product.images[0]}
                                  alt={selectedReturn.orderItem.product.name}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{selectedReturn.orderItem.product.name}</p>
                                    <p className="text-sm text-gray-500">수량: {selectedReturn.orderItem.quantity}개</p>
                                    <p className="text-xs text-red-600 font-medium">반품 요청 상품</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-gray-900">
                                      {formatCurrency(selectedReturn.orderItem.finalPrice)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      단가: {formatCurrency(selectedReturn.orderItem.finalPrice / selectedReturn.orderItem.quantity)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            반품 상품 정보를 불러올 수 없습니다.
                          </div>
                        )
                      ) : (
                        // 전체 주문 반품인 경우 - 모든 상품 표시
                        orderDetail.items.map((item: any) => (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{item.product.name}</p>
                                <p className="text-sm text-gray-500">수량: {item.quantity}개</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  {formatCurrency(item.totalPrice)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  단가: {formatCurrency(item.unitPrice)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-center py-8">
                  <p className="text-gray-600">주문 정보를 불러올 수 없습니다.</p>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  닫기
                </Button>
                {selectedReturn.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={() => handleApprove(selectedReturn)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      승인
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(selectedReturn)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      거절
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 액션 모달 */}
        {showActionModal && selectedReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {actionType === 'refund' && '환불 처리'}
                    {actionType === 'exchange' && '교환 처리'}
                    {actionType === 'pickup' && '반품 회수 요청'}
                  </h2>
                  <button
                    onClick={() => setShowActionModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 반품 정보 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">반품 정보</h3>
                    <p className="text-sm text-gray-600">주문번호: {selectedReturn.order.orderNumber}</p>
                    <p className="text-sm text-gray-600">고객: {selectedReturn.order.user.name}</p>
                    <p className="text-sm text-gray-600">사유: {selectedReturn.reason}</p>
                  </div>

                  {/* 환불 처리 폼 */}
                  {actionType === 'refund' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          환불 사유
                        </label>
                        <select
                          value={actionData.refundReason}
                          onChange={(e) => setActionData(prev => ({ ...prev, refundReason: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">환불 사유를 선택하세요</option>
                          {Object.entries(REFUND_REASONS).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          추가 메모
                        </label>
                        <textarea
                          value={actionData.refundNotes}
                          onChange={(e) => setActionData(prev => ({ ...prev, refundNotes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="환불 처리에 대한 추가 메모를 입력하세요"
                        />
                      </div>
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm text-blue-800">
                          💡 환불 금액은 자동으로 계산됩니다. (상품 금액 + 쿠폰 할인 + 배송비)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 교환 처리 폼 */}
                  {actionType === 'exchange' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          택배사
                        </label>
                        <select
                          value={actionData.exchangeCarrier}
                          onChange={(e) => setActionData(prev => ({ ...prev, exchangeCarrier: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">택배사를 선택하세요</option>
                          <option value="CJ대한통운">CJ대한통운</option>
                          <option value="한진택배">한진택배</option>
                          <option value="롯데택배">롯데택배</option>
                          <option value="우체국택배">우체국택배</option>
                          <option value="로젠택배">로젠택배</option>
                          <option value="대신화물">대신화물</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          송장번호
                        </label>
                        <input
                          type="text"
                          value={actionData.exchangeTrackingNumber}
                          onChange={(e) => setActionData(prev => ({ ...prev, exchangeTrackingNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="송장번호를 입력하세요"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          메모
                        </label>
                        <textarea
                          value={actionData.exchangeNotes}
                          onChange={(e) => setActionData(prev => ({ ...prev, exchangeNotes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="교환 처리 메모를 입력하세요"
                        />
                      </div>
                    </div>
                  )}

                  {/* 회수 요청 폼 */}
                  {actionType === 'pickup' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          택배사
                        </label>
                        <select
                          value={actionData.pickupCarrier}
                          onChange={(e) => setActionData(prev => ({ ...prev, pickupCarrier: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">택배사를 선택하세요</option>
                          <option value="CJ대한통운">CJ대한통운</option>
                          <option value="한진택배">한진택배</option>
                          <option value="롯데택배">롯데택배</option>
                          <option value="우체국택배">우체국택배</option>
                          <option value="로젠택배">로젠택배</option>
                          <option value="대신화물">대신화물</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          회수 예정일
                        </label>
                        <input
                          type="date"
                          value={actionData.pickupDate}
                          onChange={(e) => setActionData(prev => ({ ...prev, pickupDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          메모
                        </label>
                        <textarea
                          value={actionData.pickupNotes}
                          onChange={(e) => setActionData(prev => ({ ...prev, pickupNotes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="회수 요청 메모를 입력하세요"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowActionModal(false)}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={() => {
                      if (actionType === 'refund') handleRefund();
                      else if (actionType === 'exchange') handleExchange();
                      else if (actionType === 'pickup') handlePickup();
                    }}
                    className={
                      actionType === 'refund' ? 'bg-blue-600 hover:bg-blue-700' :
                      actionType === 'exchange' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-orange-600 hover:bg-orange-700'
                    }
                  >
                    {actionType === 'refund' && '환불 처리'}
                    {actionType === 'exchange' && '교환 처리'}
                    {actionType === 'pickup' && '회수 요청'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
