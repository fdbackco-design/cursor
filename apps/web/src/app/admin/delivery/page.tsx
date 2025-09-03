'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { useToast, toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-modal';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link';
import { adminApi, AdminOrder } from '@/lib/api/admin';

interface DeliveryData {
  recipientName: string;
  recipientPhone: string;
  address: string;
  productName: string;
  quantity: number;
  senderName: string;
  senderPhone: string;
  courier: string;
  trackingNumber: string;
}

interface MappingResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  productName: string;
  quantity: number;
  courier: string;
  trackingNumber: string;
  message: string;
}

const DeliveryPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mappingResults, setMappingResults] = useState<MappingResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // 파일 선택 처리
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // 엑셀 파일인지 확인
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          selectedFile.type === 'application/vnd.ms-excel' ||
          selectedFile.name.endsWith('.xlsx') ||
          selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
      } else {
        showToast(toast.warning('파일 형식 오류', '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.'));
        event.target.value = '';
      }
    }
  };

  // 파일 드롭 처리
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          droppedFile.type === 'application/vnd.ms-excel' ||
          droppedFile.name.endsWith('.xlsx') ||
          droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
      } else {
        showToast(toast.warning('파일 형식 오류', '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.'));
      }
    }
  };

  // 드래그 오버 처리
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  // 파일 제거
  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 엑셀 파일 처리 및 매핑
  const processExcelFile = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setShowResults(false);
      setMappingResults([]);

      // 엑셀 파일 읽기
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // 헤더 검증
      const headers = jsonData[0] as string[];
      const expectedHeaders = ['수령인', '수령인 전화번호', '주소', '상품명', '수량', '송하인', '송하인 연락처', '택배사', '송장번호'];
      
      if (!expectedHeaders.every(header => headers.includes(header))) {
        throw new Error('엑셀 파일의 헤더가 올바르지 않습니다. 요구사항에 맞는 헤더를 확인해주세요.');
      }

      // 데이터 행 처리
      const deliveryData: DeliveryData[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (row.length >= 9 && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
          deliveryData.push({
            recipientName: row[0] || '',
            recipientPhone: row[1] || '',
            address: row[2] || '',
            productName: row[3] || '',
            quantity: parseInt(row[4]) || 0,
            senderName: row[5] || '',
            senderPhone: row[6] || '',
            courier: row[7] || '',
            trackingNumber: row[8] || '',
          });
        }
      }

      if (deliveryData.length === 0) {
        throw new Error('처리할 데이터가 없습니다.');
      }

      // 주문 데이터와 매핑
      const results = await mapDeliveryData(deliveryData);
      setMappingResults(results);
      setShowResults(true);

    } catch (error) {
      console.error('엑셀 파일 처리 실패:', error);
      showToast(toast.error('엑셀 파일 처리 실패', error instanceof Error ? error.message : '엑셀 파일 처리에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // 배송 데이터와 주문 매핑
  const mapDeliveryData = async (deliveryData: DeliveryData[]): Promise<MappingResult[]> => {
    const results: MappingResult[] = [];

    try {
      // 모든 주문 데이터 가져오기
      const response = await adminApi.getOrders({
        page: 1,
        limit: 10000,
      });

      if (!response.success || !response.data?.orders) {
        throw new Error('주문 데이터를 가져오는데 실패했습니다.');
      }

      const orders = response.data.orders;

      // 각 배송 데이터에 대해 매칭되는 주문 찾기
      for (const delivery of deliveryData) {
        let matched = false;

        // 같은 수령인/전화/주소/상품 기준으로 모든 주문 찾기
        const matchingOrders = orders.filter(order => {
          const isRecipientMatch = order.shippingAddress?.receiver_name === delivery.recipientName ||
                                  order.user.name === delivery.recipientName;
          
          const isPhoneMatch = order.shippingAddress?.recipientPhone === delivery.recipientPhone ||
                              order.user.phoneNumber === delivery.recipientPhone;
          
          const baseAddress = order.shippingAddress?.base_address || '';
          const detailAddress = order.shippingAddress?.detail_address || '';
          const address = order.shippingAddress?.address || '';
          const addressDetail = order.shippingAddress?.addressDetail || '';
          
          const isAddressMatch = baseAddress === delivery.address ||
                               address === delivery.address ||
                               (baseAddress + ' ' + detailAddress).includes(delivery.address) ||
                               (address + ' ' + addressDetail).includes(delivery.address);

          return isRecipientMatch && isPhoneMatch && isAddressMatch;
        });

        if (matchingOrders.length > 0) {
          // 오래된 주문부터 정렬 (createdAt 기준)
          matchingOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          // 배송 전 남은 수량 계산 및 매칭
          let remainingQuantity = delivery.quantity;
          let matchedOrderItems: Array<{orderId: string, orderNumber: string, itemId: string, quantity: number}> = [];

          for (const order of matchingOrders) {
            if (remainingQuantity <= 0) break;

            for (const item of order.items) {
              if (item.productName === delivery.productName && remainingQuantity > 0) {
                // 해당 주문 아이템의 배송 전 남은 수량 계산
                const shippedQuantity = await getShippedQuantityForItem(item.id);
                const availableQuantity = item.quantity - shippedQuantity;

                if (availableQuantity > 0) {
                  const quantityToAllocate = Math.min(availableQuantity, remainingQuantity);
                  
                  matchedOrderItems.push({
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    itemId: item.id,
                    quantity: quantityToAllocate
                  });

                  remainingQuantity -= quantityToAllocate;
                }
              }
            }
          }

          // 매칭 성공 시 배송 정보 업데이트
          if (remainingQuantity === 0 && matchedOrderItems.length > 0) {
            try {
              // 각 주문 아이템에 대해 배송 정보 생성
              for (const matchedItem of matchedOrderItems) {
                await updateOrderDeliveryWithItem(
                  matchedItem.orderId, 
                  matchedItem.itemId, 
                  delivery.courier, 
                  delivery.trackingNumber,
                  matchedItem.quantity
                );
              }

              results.push({
                success: true,
                orderId: matchedOrderItems[0].orderId, // 첫 번째 주문 ID 표시
                orderNumber: matchedOrderItems.map(item => item.orderNumber).join(', '), // 모든 주문번호 표시
                recipientName: delivery.recipientName,
                recipientPhone: delivery.recipientPhone,
                address: delivery.address,
                productName: delivery.productName,
                quantity: delivery.quantity,
                courier: delivery.courier,
                trackingNumber: delivery.trackingNumber,
                message: `성공적으로 매핑되었습니다. (${matchedOrderItems.length}개 주문에 분할 할당)`,
              });

              matched = true;
            } catch (error) {
              results.push({
                success: false,
                orderId: matchedOrderItems[0]?.orderId || '',
                orderNumber: matchedOrderItems.map(item => item.orderNumber).join(', ') || '',
                recipientName: delivery.recipientName,
                recipientPhone: delivery.recipientPhone,
                address: delivery.address,
                productName: delivery.productName,
                quantity: delivery.quantity,
                courier: delivery.courier,
                trackingNumber: delivery.trackingNumber,
                message: '주문 업데이트에 실패했습니다.',
              });
              matched = true;
            }
          } else if (remainingQuantity > 0) {
            // 수량이 부족한 경우
            results.push({
              success: false,
              orderId: '',
              orderNumber: '',
              recipientName: delivery.recipientName,
              recipientPhone: delivery.recipientPhone,
              address: delivery.address,
              productName: delivery.productName,
              quantity: delivery.quantity,
              courier: delivery.courier,
              trackingNumber: delivery.trackingNumber,
              message: `수량 부족: 요청 ${delivery.quantity}개, 사용 가능 ${delivery.quantity - remainingQuantity}개`,
            });
            matched = true;
          }
        }

        if (!matched) {
          results.push({
            success: false,
            orderId: '',
            orderNumber: '',
            recipientName: delivery.recipientName,
            recipientPhone: delivery.recipientPhone,
            address: delivery.address,
            productName: delivery.productName,
            quantity: delivery.quantity,
            courier: delivery.courier,
            trackingNumber: delivery.trackingNumber,
            message: '매칭되는 주문을 찾을 수 없습니다.',
          });
        }
      }

    } catch (error) {
      console.error('배송 데이터 매핑 실패:', error);
      throw error;
    }

    return results;
  };

  // 주문 아이템별 배송 전 남은 수량 조회
  const getShippedQuantityForItem = async (itemId: string): Promise<number> => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/orders/admin/item/${itemId}/shipped-quantity`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '배송 수량 조회에 실패했습니다.');
      }

      return result.data.shippedQuantity || 0;
    } catch (error) {
      console.error('배송 수량 조회 실패:', error);
      return 0;
    }
  };

  // 주문 아이템별 배송 정보 업데이트
  const updateOrderDeliveryWithItem = async (
    orderId: string, 
    itemId: string, 
    courier: string, 
    trackingNumber: string,
    quantity: number
  ) => {
    try {
      // 새로운 API 엔드포인트 사용
      const response = await fetch(`http://localhost:3001/api/v1/orders/admin/${orderId}/delivery/item`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          courier,
          trackingNumber,
          quantity
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '주문 아이템별 배송 정보 업데이트에 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('주문 아이템별 배송 정보 업데이트 실패:', error);
      throw error;
    }
  };

  // 주문 배송 정보 업데이트 (기존 함수)
  const updateOrderDelivery = async (orderId: string, courier: string, trackingNumber: string) => {
    try {
      const response = await adminApi.updateOrderDelivery(orderId, { courier, trackingNumber });
      if (!response.success) {
        throw new Error(response.error || '주문 업데이트에 실패했습니다.');
      }
      return response;
    } catch (error) {
      console.error('주문 배송 정보 업데이트 실패:', error);
      throw error;
    }
  };

  // 성공/실패 통계
  const successCount = mappingResults.filter(r => r.success).length;
  const failureCount = mappingResults.filter(r => !r.success).length;

  // 결과 다운로드
  const downloadResults = () => {
    if (mappingResults.length === 0) return;

    const wb = XLSX.utils.book_new();
    
    // 성공 데이터
    const successData = mappingResults.filter(r => r.success).map(r => ({
      '결과': '성공',
      '주문번호': r.orderNumber,
      '수령인': r.recipientName,
      '수령인 전화번호': r.recipientPhone,
      '주소': r.address,
      '상품명': r.productName,
      '수량': r.quantity,
      '택배사': r.courier,
      '송장번호': r.trackingNumber,
      '메시지': r.message,
    }));

    // 실패 데이터
    const failureData = mappingResults.filter(r => !r.success).map(r => ({
      '결과': '실패',
      '주문번호': r.orderNumber || 'N/A',
      '수령인': r.recipientName,
      '수령인 전화번호': r.recipientPhone,
      '주소': r.address,
      '상품명': r.productName,
      '수량': r.quantity,
      '택배사': r.courier,
      '송장번호': r.trackingNumber,
      '메시지': r.message,
    }));

    // 워크시트 생성
    if (successData.length > 0) {
      const successWs = XLSX.utils.json_to_sheet(successData);
      XLSX.utils.book_append_sheet(wb, successWs, '성공_데이터');
    }

    if (failureData.length > 0) {
      const failureWs = XLSX.utils.json_to_sheet(failureData);
      XLSX.utils.book_append_sheet(wb, failureWs, '실패_데이터');
    }

    // 파일 다운로드
    const fileName = `배송_매핑_결과_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5 mr-2" />
                뒤로가기
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">배송 관리</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 엑셀 업로드 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              배송 정보 엑셀 업로드
            </CardTitle>
            <CardDescription>
              엑셀 파일을 업로드하여 주문과 배송 정보를 자동으로 매핑합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 파일 업로드 영역 */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {file ? (
                <div className="space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-green-900">{file.name}</p>
                    <p className="text-sm text-green-600">
                      파일 크기: {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button onClick={removeFile} variant="outline" size="sm">
                    파일 제거
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      엑셀 파일을 드래그하여 업로드하거나 클릭하여 선택하세요
                    </p>
                    <p className="text-sm text-gray-500">
                      지원 형식: .xlsx, .xls
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    파일 선택
                  </Button>
                </div>
              )}
            </div>

            {/* 숨겨진 파일 입력 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 업로드 버튼 */}
            {file && (
              <div className="mt-6 text-center">
                <Button
                  onClick={processExcelFile}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5 mr-2" />
                  )}
                  {loading ? '처리중...' : '엑셀 파일 처리'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 업로드 가이드 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              업로드 가이드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">필수 헤더 (순서대로):</h4>
                <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                  수령인 | 수령인 전화번호 | 주소 | 상품명 | 수량 | 송하인 | 송하인 연락처 | 택배사 | 송장번호
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">샘플 데이터:</h4>
                <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                  홍길동 | 01012341234 | 송도과학로 80 | 호이드 무선청소기 | 1 | 김철수 | 01012341234 | 한진택배 | 1234567890
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">매핑 규칙:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 수령인, 수령인 전화번호, 주소를 키로 하여 내부 주문과 매칭</li>
                  <li>• 상품명과 수량도 일치해야 정확한 매칭</li>
                  <li>• 매칭 성공 시 택배사와 송장번호가 자동으로 주문에 반영</li>
                  <li>• 결과는 idempotent하게 처리되어 중복 업로드 시에도 안전</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 처리 결과 */}
        {showResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>처리 결과</span>
                <Button onClick={downloadResults} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  결과 다운로드
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{successCount}</div>
                  <div className="text-sm text-green-700">성공</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{failureCount}</div>
                  <div className="text-sm text-red-700">실패</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{mappingResults.length}</div>
                  <div className="text-sm text-blue-700">전체</div>
                </div>
              </div>

              {/* 결과 테이블 */}
              <div className="space-y-4">
                {/* 성공 데이터 */}
                {successCount > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-green-900 mb-3 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      성공 데이터 ({successCount}건)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-green-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-green-900">주문번호</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-green-900">수령인</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-green-900">상품명</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-green-900">택배사</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-green-900">송장번호</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mappingResults.filter(r => r.success).map((result, index) => (
                            <tr key={index} className="border-t border-gray-200">
                              <td className="px-4 py-2 text-sm">{result.orderNumber}</td>
                              <td className="px-4 py-2 text-sm">{result.recipientName}</td>
                              <td className="px-4 py-2 text-sm">{result.productName}</td>
                              <td className="px-4 py-2 text-sm">{result.courier}</td>
                              <td className="px-4 py-2 text-sm">{result.trackingNumber}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 실패 데이터 */}
                {failureCount > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-red-900 mb-3 flex items-center">
                      <XCircle className="h-5 w-5 mr-2" />
                      실패 데이터 ({failureCount}건)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-red-900">수령인</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-red-900">전화번호</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-red-900">상품명</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-red-900">수량</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-red-900">실패 사유</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mappingResults.filter(r => !r.success).map((result, index) => (
                            <tr key={index} className="border-t border-gray-200">
                              <td className="px-4 py-2 text-sm">{result.recipientName}</td>
                              <td className="px-4 py-2 text-sm">{result.recipientPhone}</td>
                              <td className="px-4 py-2 text-sm">{result.productName}</td>
                              <td className="px-4 py-2 text-sm">{result.quantity}</td>
                              <td className="px-4 py-2 text-sm text-red-600">{result.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DeliveryPage;
