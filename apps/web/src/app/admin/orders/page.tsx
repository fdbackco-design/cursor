'use client';

import { useState } from 'react';
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
  Truck
} from 'lucide-react';
import Link from 'next/link';

const OrdersPage = () => {
  const [orders, setOrders] = useState([
    {
      id: 'ORD-001',
      customerName: '김철수',
      customerEmail: 'kim@email.com',
      products: ['프리미엄 커피머신', '스마트 블렌더'],
      totalAmount: 388000,
      status: 'processing',
      paymentMethod: '카드',
      orderDate: '2024-01-15 14:30',
      deliveryAddress: '서울시 강남구 테헤란로 123'
    },
    {
      id: 'ORD-002',
      customerName: '이영희',
      customerEmail: 'lee@email.com',
      products: ['비타민C 1000mg'],
      totalAmount: 25000,
      status: 'shipped',
      paymentMethod: '계좌이체',
      orderDate: '2024-01-15 10:15',
      deliveryAddress: '부산시 해운대구 해운대로 456'
    },
    {
      id: 'ORD-003',
      customerName: '박민수',
      customerEmail: 'park@email.com',
      products: ['스마트 블렌더'],
      totalAmount: 89000,
      status: 'delivered',
      paymentMethod: '카드',
      orderDate: '2024-01-14 16:45',
      deliveryAddress: '대구시 수성구 동대구로 789'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');

  const handleDelete = (id: string) => {
    if (confirm('정말로 이 주문을 삭제하시겠습니까?')) {
      setOrders(orders.filter(order => order.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status: newStatus } : order
    ));
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPayment = selectedPaymentMethod === 'all' || order.paymentMethod === selectedPaymentMethod;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const statuses = ['processing', 'shipped', 'delivered', 'cancelled'];
  const paymentMethods = ['카드', '계좌이체', '무통장입금'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing': return '처리중';
      case 'shipped': return '배송중';
      case 'delivered': return '배송완료';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                ← 뒤로가기
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">주문 관리</h1>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              새 주문 등록
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="주문번호, 고객명, 이메일 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">전체 상태</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{getStatusText(status)}</option>
                ))}
              </select>
              
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">전체 결제수단</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              
              <Button variant="outline" className="flex items-center justify-center">
                <Filter className="h-4 w-4 mr-2" />
                필터 적용
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 주문 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>주문 목록 ({filteredOrders.length}개)</span>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ArrowUpDown className="h-4 w-4" />
                정렬
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">주문 정보</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">상품</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">총 금액</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">상태</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">결제수단</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">주문일시</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{order.id}</p>
                            <p className="text-sm text-gray-500">{order.customerName}</p>
                            <p className="text-sm text-gray-500">{order.customerEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {order.products.map((product, index) => (
                            <p key={index} className="text-sm text-gray-700">{product}</p>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {order.totalAmount.toLocaleString()}원
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                          {order.status === 'processing' && (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handleStatusChange(order.id, 'shipped')}
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              배송
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleStatusChange(order.id, 'delivered')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              완료
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">{order.paymentMethod}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500">{order.orderDate}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(order.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrdersPage;
