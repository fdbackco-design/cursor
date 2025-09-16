'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { 
  ShoppingCart, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Loader2,
  X,
  Package,
  CreditCard,
  MapPin,
  FileText,
  Save,
  Download,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { adminApi, AdminOrder, Vendor } from '@/lib/api/admin';
import { ordersApi } from '@/lib/api/orders';
import { useToast, toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-modal';

const OrdersPage = () => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [orderNotes, setOrderNotes] = useState<{ [key: string]: string }>({});
  const [tempNote, setTempNote] = useState('');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: string]: boolean }>({});

  const statuses = [
    { value: 'PENDING', label: '결제 대기' },
    { value: 'CONFIRMED', label: '주문 확인' },
    { value: 'PROCESSING', label: '상품 준비중' },
    { value: 'SHIPPED', label: '배송중' },
    { value: 'DELIVERED', label: '배송완료' },
    { value: 'CANCELLED', label: '주문 취소' },
  ];

  // 상태 라벨 가져오기
  const getStatusLabel = (status: string) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  // 엑셀 다운로드
  const downloadExcel = async () => {
    try {
      setLoading(true);
      
      // 선택된 기간의 모든 주문 데이터 가져오기
      const response = await adminApi.getOrders({
        page: 1,
        limit: 10000, // 충분히 큰 수
        status: selectedStatus,
        vendorId: selectedVendor,
        ...(searchTerm && { search: searchTerm }),
      });
      
      if (!response.success || !response.data?.orders) {
        showToast(toast.error('주문 데이터 로드 실패', '주문 데이터를 가져오는데 실패했습니다.'));
        return;
      }
      
      const orders = response.data.orders;
      
      // 엑셀 데이터 준비
      const excelData = orders.map((order) => ({
        '날짜': format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: ko }),
        '원가': '',
        '판매가': order.totalAmount.toLocaleString(),
        '순이익': '',
        '진행여부': getStatusLabel(order.status),
        '입금여부': order.status === 'CANCELLED' ? '취소' : '완료',
        '반품/교환': '',
        '발주처': order.items[0]?.product?.vendor?.name || '',
        '제품명': order.items.map(item => item.productName).join(', '),
        '수량': order.items.reduce((sum, item) => sum + item.quantity, 0),
        '주소': `${order.shippingAddress?.base_address || ''} ${order.shippingAddress?.detail_address || ''}`.trim(),
        '수령인': order.shippingAddress?.receiver_name || order.user.name,
        '연락처': order.shippingAddress?.recipientPhone || order.user.phoneNumber || '',
        '판매자': '폐쇄몰',
        '송하인': '김하준',
        '비고': order.notes || '',
        '택배사': '',
        '송장번호': '',
      }));
      
      // 워크북 생성
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // 컬럼 너비 자동 조정
      const colWidths = [
        { wch: 20 }, // 날짜
        { wch: 10 }, // 원가
        { wch: 15 }, // 판매가
        { wch: 10 }, // 순이익
        { wch: 15 }, // 진행여부
        { wch: 12 }, // 입금여부
        { wch: 15 }, // 반품/교환
        { wch: 20 }, // 발주처
        { wch: 30 }, // 제품명
        { wch: 10 }, // 수량
        { wch: 40 }, // 주소
        { wch: 15 }, // 수령인
        { wch: 15 }, // 연락처
        { wch: 15 }, // 판매자
        { wch: 15 }, // 송하인
        { wch: 30 }, // 비고
        { wch: 15 }, // 택배사
        { wch: 20 }, // 송장번호
      ];
      ws['!cols'] = colWidths;
      
      // 워크시트를 워크북에 추가
      XLSX.utils.book_append_sheet(wb, ws, '주문내역');
      
      // 파일명 생성
      const fileName = `주문내역_${startDate}_${endDate}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      
      // 파일 다운로드
      XLSX.writeFile(wb, fileName);
      
      showToast(toast.success('엑셀 다운로드 완료', `${orders.length}건의 주문 내역이 엑셀로 다운로드되었습니다.`));
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      showToast(toast.error('엑셀 다운로드 실패', '엑셀 다운로드에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // 주문 목록 로드
  const loadOrders = async (page = 1) => {
    try {
      setLoading(true);
      //console.log('관리자 주문 목록 로드 시작:', { page, selectedStatus, searchTerm, selectedVendor });
      
      const response = await adminApi.getOrders({
        page,
        limit: 10,
        status: selectedStatus,
        vendorId: selectedVendor,
        ...(searchTerm && { search: searchTerm }),
      });
      
      //console.log('관리자 API 응답:', response);
      // console.log('응답 데이터 상세:', {
      //   success: response.success,
      //   hasData: !!response.data,
      //   orders: response.data?.orders,
      //   ordersLength: response.data?.orders?.length,
      //   pagination: response.data?.pagination
      // });
      
      if (response.success && response.data) {
        const orders = response.data.orders || [];
        //console.log('설정할 주문 데이터:', orders);
        
        setOrders(orders);
        setCurrentPage(response.data.pagination?.page || 1);
        setTotalPages(response.data.pagination?.totalPages || 0);
        setTotalOrders(response.data.pagination?.total || 0);
        
        // console.log('상태 업데이트 완료:', {
        //   ordersCount: orders.length,
        //   currentPage: response.data.pagination?.page || 1,
        //   totalPages: response.data.pagination?.totalPages || 0,
        //   totalOrders: response.data.pagination?.total || 0
        // });
      } else {
        //console.log('응답 실패 또는 데이터 없음');
        setOrders([]);
        setCurrentPage(1);
        setTotalPages(0);
        setTotalOrders(0);
      }
    } catch (error) {
      console.error('주문 목록 로드 실패:', error);
      setOrders([]);
      setCurrentPage(1);
      setTotalPages(0);
      setTotalOrders(0);
      showToast(toast.error('주문 목록 로드 실패', '주문 목록을 불러오는데 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // 벤더 목록 로드
  const loadVendors = async () => {
    try {
      const response = await adminApi.getVendors();
      if (response.success && response.data) {
        setVendors(response.data);
      }
    } catch (error) {
      console.error('벤더 목록 로드 실패:', error);
    }
  };

  // 검색 실행
  const handleSearch = () => {
    setCurrentPage(1);
    loadOrders(1);
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadOrders(page);
  };

  // 주문 상세 보기
  const openOrderDetail = (order: AdminOrder) => {
    setSelectedOrder(order);
    setTempNote(orderNotes[order.id] || '');
    setShowDetailModal(true);
  };

  // 주문 상세 보기 닫기
  const closeOrderDetail = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
    setTempNote('');
  };

  // 메모 저장
  const saveOrderNote = async () => {
    if (selectedOrder) {
      try {
        //console.log('메모 저장 시작:', { orderNumber: selectedOrder.orderNumber, notes: tempNote });
        
        const response = await ordersApi.updateOrderNotes(selectedOrder.orderNumber, tempNote);
        
        if (response.success) {
          // 로컬 상태 업데이트
          setOrderNotes(prev => ({
            ...prev,
            [selectedOrder.id]: tempNote
          }));
          
          // 주문 목록에서도 notes 업데이트
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === selectedOrder.id 
                ? { ...order, notes: tempNote }
                : order
            )
          );
          
          showToast(toast.success('메모 저장 완료', '메모가 성공적으로 저장되었습니다.'));
          //console.log('메모 저장 성공:', response.data);
        } else {
          throw new Error(response.error || '메모 저장에 실패했습니다.');
        }
      } catch (error) {
        console.error('메모 저장 실패:', error);
        showToast(toast.error('메모 저장 실패', error instanceof Error ? error.message : '메모 저장 중 오류가 발생했습니다.'));
      }
    }
  };

  // 주문 상태 변경
  const updateOrderStatus = async (orderNumber: string, newStatus: string) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [orderNumber]: true }));
      const response = await adminApi.updateOrderStatus(orderNumber, newStatus);
      if (response.success) {
        // 주문 목록에서 해당 주문의 상태 업데이트
        setOrders(prev => prev.map(order => 
          order.orderNumber === orderNumber 
            ? { ...order, status: newStatus }
            : order
        ));
        
        // 선택된 주문이 있다면 해당 주문도 업데이트
        if (selectedOrder && selectedOrder.orderNumber === orderNumber) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
        
        showToast(toast.success('주문 상태 변경 완료', '주문 상태가 성공적으로 변경되었습니다.'));
      } else {
        showToast(toast.error('주문 상태 변경 실패', '주문 상태 변경에 실패했습니다.'));
      }
    } catch (error) {
      console.error('주문 상태 변경 실패:', error);
      showToast(toast.error('주문 상태 변경 오류', '주문 상태 변경 중 오류가 발생했습니다.'));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [orderNumber]: false }));
    }
  };

  // 서버에서 필터링된 데이터를 받으므로 클라이언트 필터링 불필요
  const filteredOrders = orders || [];
  
  // 디버깅: 현재 orders 상태 확인
  // console.log('현재 orders 상태:', orders);
  // console.log('filteredOrders:', filteredOrders);
  // console.log('orders 타입:', typeof orders);
  // console.log('orders 길이:', orders?.length);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-orange-100 text-orange-800';
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  // 초기 로드
  useEffect(() => {
    loadOrders();
    loadVendors();
  }, []);

  // 필터 변경 시 자동 검색
  useEffect(() => {
    if (currentPage === 1) {
      loadOrders(1);
    } else {
      setCurrentPage(1);
    }
  }, [selectedStatus, selectedVendor]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-16 py-2 sm:py-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700 text-sm sm:text-base">
                ← 뒤로가기
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">주문 관리</h1>
            </div>
            <div className="flex space-x-1 sm:space-x-2">
              {/* <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('https://api.feedbackmall.com/api/v1/auth/dev/admin-login', {
                      method: 'POST',
                      credentials: 'include',
                    });
                    if (response.ok) {
                      showToast(toast.success('관리자 로그인', '관리자로 로그인되었습니다.'));
                      window.location.reload();
                    }
                  } catch (error) {
                    showToast(toast.error('로그인 실패', '로그인 실패'));
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2"
              >
                관리자 로그인
              </Button> */}
            {/* <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              새 주문 등록
            </Button> */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* 검색 및 필터 */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="주문번호, 고객명, 전화번호 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                />
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              >
                <option value="all">전체 상태</option>
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              >
                <option value="all">전체 벤더</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name} ({vendor.code})
                  </option>
                ))}
              </select>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-center min-h-[44px] sm:min-h-[40px] text-sm sm:text-base"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                <Filter className="h-4 w-4 mr-2" />
                )}
                {loading ? '검색중...' : '검색'}
              </Button>
            </div>
            
            {/* 기간 선택 및 엑셀 다운로드 */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">기간 선택:</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                  />
                  <span className="text-gray-500">~</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <Button 
                onClick={downloadExcel}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto min-h-[44px] sm:min-h-[40px] text-sm sm:text-base"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {loading ? '다운로드중...' : '엑셀 다운로드'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 주문 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
              <span>주문 목록 ({totalOrders}개)</span>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">정렬</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm sm:text-base text-gray-500">주문 목록을 불러오는 중...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm sm:text-base text-gray-500">주문이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-0">
                {/* 데스크톱 테이블 */}
                <div className="hidden sm:block">
                  <div className="-mx-3 sm:-mx-4 lg:-mx-6">
                    {/* 스크롤/테두리/둥근모서리 */}
                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                      <table className="w-full table-auto min-w-[1200px]">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-medium text-gray-900 w-[200px]">주문 정보</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 w-[250px]">상품</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 w-[140px]">총 금액</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 w-[180px]">상태</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 w-[100px]">결제수단</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 w-[120px]">주문일시</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 w-[120px]">작업</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((order) => (
                            <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <ShoppingCart className="h-6 w-6 text-purple-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-gray-900 text-sm leading-tight">{order.orderNumber}</p>
                                    <p className="text-xs text-gray-500 truncate">{order.user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{order.user.phoneNumber}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-1">
                                  {order.items.slice(0, 3).map((item, index) => (
                                    <div key={item.id} className="flex items-center space-x-2">
                                      <Package className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                      <span className="text-xs text-gray-900 truncate">
                                        {item.productName} x {item.quantity}
                                      </span>
                                    </div>
                                  ))}
                                  {order.items.length > 3 && (
                                    <div className="text-xs text-gray-500">
                                      +{order.items.length - 3}개 더
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-medium text-gray-900 text-sm">
                                  ₩{order.totalAmount.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  상품: ₩{order.subtotal.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  배송: ₩{order.shippingAmount.toLocaleString()}
                                </p>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-col space-y-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                  </span>
                                  <select
                                    value={order.status}
                                    onChange={(e) => updateOrderStatus(order.orderNumber, e.target.value)}
                                    disabled={updatingStatus[order.orderNumber]}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full"
                                  >
                                    {statuses.map((status) => (
                                      <option key={status.value} value={status.value}>
                                        {status.label}
                                      </option>
                                    ))}
                                  </select>
                                  {updatingStatus[order.orderNumber] && (
                                    <Loader2 className="h-3 w-3 animate-spin text-purple-600" />
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <CreditCard className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-900">카드</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-xs text-gray-900">
                                  {format(new Date(order.createdAt), 'MM/dd')}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {format(new Date(order.createdAt), 'HH:mm')}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openOrderDetail(order)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 모바일 카드 */}
                <div className="sm:hidden space-y-4 p-4 sm:p-0">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      {/* 주문 정보 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{order.orderNumber}</p>
                            <p className="text-xs text-gray-500">{order.user.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openOrderDetail(order)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm" 
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 상품 정보 */}
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={item.id} className="flex items-center space-x-2">
                            <Package className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-900">
                              {item.productName} x {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* 금액 정보 */}
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            ₩{order.totalAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            상품: ₩{order.subtotal.toLocaleString()} | 배송: ₩{order.shippingAmount.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {format(new Date(order.createdAt), 'MM/dd HH:mm')}
                          </div>
                        </div>
                      </div>

                      {/* 상태 및 결제수단 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <CreditCard className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">카드</span>
                          </div>
                        </div>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.orderNumber, e.target.value)}
                          disabled={updatingStatus[order.orderNumber]}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          {statuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-4 sm:mt-6 px-4 sm:px-6">
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2 min-h-[36px] sm:min-h-[40px]"
                  >
                    이전
                  </Button>
                  
                  {/* 모바일에서는 현재 페이지 주변만 표시 */}
                  <div className="flex space-x-1 sm:space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        if (totalPages <= 7) return true; // 7페이지 이하면 모두 표시
                        // 현재 페이지 주변 3페이지씩 표시
                        return page >= currentPage - 2 && page <= currentPage + 2;
                      })
                      .map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm"
                        >
                          {page}
                        </Button>
                      ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2 min-h-[36px] sm:min-h-[40px]"
                  >
                    다음
                  </Button>
                </div>
                
                {/* 페이지 정보 */}
                <div className="text-center mt-2">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {currentPage} / {totalPages} 페이지
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 주문 상세 모달 */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                주문 상세 - {selectedOrder.orderNumber}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={closeOrderDetail}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 주문 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">주문 정보</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">주문번호:</span>
                    <span className="font-medium">{selectedOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">주문일시:</span>
                    <span className="font-medium">
                      {format(new Date(selectedOrder.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">주문상태:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => updateOrderStatus(selectedOrder.orderNumber, e.target.value)}
                        disabled={updatingStatus[selectedOrder.orderNumber]}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      {updatingStatus[selectedOrder.orderNumber] && (
                        <Loader2 className="h-3 w-3 animate-spin text-purple-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 고객 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">고객 정보</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">고객명:</span>
                    <span className="font-medium">{selectedOrder.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">이메일:</span>
                    <span className="font-medium">{selectedOrder.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">전화번호:</span>
                    <span className="font-medium">{selectedOrder.user.phoneNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 상품 정보 */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">상품 정보</h3>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">수량: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ₩{item.totalPrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          단가: ₩{item.unitPrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 금액 정보 */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">금액 정보</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">상품 금액:</span>
                  <span className="font-medium">₩{selectedOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">배송비:</span>
                  <span className="font-medium">₩{selectedOrder.shippingAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">할인:</span>
                  <span className="font-medium">₩{selectedOrder.discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">세금:</span>
                  <span className="font-medium">₩{selectedOrder.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>총 금액:</span>
                  <span>₩{selectedOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 메모 */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">메모</h3>
              <div className="space-y-3">
                <textarea
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  placeholder="주문에 대한 메모를 입력하세요..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={closeOrderDetail}>
                    취소
                  </Button>
                  <Button onClick={saveOrderNote}>
                    <Save className="h-4 w-4 mr-2" />
                    저장
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
