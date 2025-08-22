'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  Truck, 
  RefreshCw, 
  Ticket, 
  MessageSquare, 
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import Link from 'next/link';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const adminModules = [
    {
      id: 'products',
      title: '상품 관리',
      description: '물건 등록, 수정, 삭제, 조회',
      icon: Package,
      color: 'bg-blue-500',
      href: '/admin/products'
    },
    {
      id: 'sellers',
      title: '셀러 관리',
      description: '셀러 등록, 수정, 삭제, 조회',
      icon: Users,
      color: 'bg-green-500',
      href: '/admin/sellers'
    },
    {
      id: 'orders',
      title: '주문 관리',
      description: '주문 등록, 수정, 삭제, 조회',
      icon: ShoppingCart,
      color: 'bg-purple-500',
      href: '/admin/orders'
    },
    {
      id: 'delivery',
      title: '배송 관리',
      description: '배송/택배 등록, 수정, 삭제, 조회',
      icon: Truck,
      color: 'bg-orange-500',
      href: '/admin/delivery'
    },
    {
      id: 'returns',
      title: '반품/교환 관리',
      description: '상품 반품, 취소, 교환 등록, 수정, 삭제, 조회',
      icon: RefreshCw,
      color: 'bg-red-500',
      href: '/admin/returns'
    },
    {
      id: 'coupons',
      title: '쿠폰 관리',
      description: '쿠폰 등록, 수정, 삭제, 조회',
      icon: Ticket,
      color: 'bg-yellow-500',
      href: '/admin/coupons'
    },
    {
      id: 'reviews',
      title: '구매평 관리',
      description: '구매평 등록, 수정, 삭제, 조회',
      icon: MessageSquare,
      color: 'bg-indigo-500',
      href: '/admin/reviews'
    },
    {
      id: 'analytics',
      title: '판매량 분석',
      description: '각 셀러 별 판매량 데이터 조회',
      icon: BarChart3,
      color: 'bg-teal-500',
      href: '/admin/analytics'
    }
  ];

  const quickStats = [
    { title: '총 상품 수', value: '1,234', change: '+12%', changeType: 'positive' },
    { title: '활성 셀러', value: '89', change: '+5%', changeType: 'positive' },
    { title: '오늘 주문', value: '156', change: '+23%', changeType: 'positive' },
    { title: '배송 중', value: '45', change: '-8%', changeType: 'negative' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">관리자님 환영합니다</span>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 빠른 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 관리 모듈 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {adminModules.map((module) => (
            <Link key={module.id} href={module.href}>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`${module.color} p-3 rounded-lg`}>
                      <module.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>관리하기</span>
                    <div className="flex space-x-2">
                      <Eye className="h-4 w-4" />
                      <Edit className="h-4 w-4" />
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 최근 활동 */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">최근 활동</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">새 상품이 등록되었습니다</p>
                      <p className="text-sm text-gray-500">"프리미엄 커피머신" - 2분 전</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">상품 관리</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">새 셀러가 가입했습니다</p>
                      <p className="text-sm text-gray-500">"테크스토어" - 15분 전</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">셀러 관리</span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <ShoppingCart className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">새 주문이 들어왔습니다</p>
                      <p className="text-sm text-gray-500">주문번호: #12345 - 1시간 전</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">주문 관리</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
