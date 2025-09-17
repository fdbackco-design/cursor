'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Layout
} from 'lucide-react';
import Link from 'next/link';
import { getRecentActivities, AuditLog } from '../../lib/api/audit-log';
import { getAdminStats, AdminStats } from '../../lib/api/admin';
import { useAuth } from '@/contexts/AuthContext';

const AdminPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recentActivities, setRecentActivities] = useState<AuditLog[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

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
      id: 'refunds',
      title: '환불 관리',
      description: '환불 내역 조회, 통계, 상세 관리',
      icon: DollarSign,
      color: 'bg-red-500',
      href: '/admin/refunds'
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
    },
    {
      id: 'home-order',
      title: '메인상품 노출 관리',
      description: '카테고리, MD Pick 순서 관리',
      icon: Layout,
      color: 'bg-pink-500',
      href: '/admin/home-order'
    },
    {
      id: 'users',
      title: '사용자 승인',
      description: '신규 사용자 승인 및 관리',
      icon: Clock,
      color: 'bg-red-500',
      href: '/admin/users'
    }
  ];

  // 실제 통계 데이터를 사용
  const quickStats = adminStats ? [
    { title: '총 상품 수', ...adminStats.totalProducts },
    { title: '활성 셀러', ...adminStats.activeSellers },
    { title: '오늘 활동', ...adminStats.todayOrders },
    { title: '재고 부족', ...adminStats.lowStockProducts }
  ] : [];


  // 통계 데이터 로딩
  useEffect(() => {
    const loadAdminStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await getAdminStats();
        //console.log('관리자 통계 응답:', response);
        
        if (response.success && response.data) {
          setAdminStats(response.data);
        } else {
          console.error('관리자 통계 응답 오류:', response.error);
          // 에러 시 기본값 설정
          setAdminStats({
            totalProducts: { value: '0', change: '0%', changeType: 'positive' },
            activeSellers: { value: '0', change: '0%', changeType: 'positive' },
            todayOrders: { value: '0', change: '0%', changeType: 'positive' },
            lowStockProducts: { value: '0', change: '0%', changeType: 'positive' }
          });
        }
      } catch (error) {
        console.error('관리자 통계 로딩 실패:', error);
        // 에러 시 기본값 설정
        setAdminStats({
          totalProducts: { value: '0', change: '0%', changeType: 'positive' },
          activeSellers: { value: '0', change: '0%', changeType: 'positive' },
          todayOrders: { value: '0', change: '0%', changeType: 'positive' },
          lowStockProducts: { value: '0', change: '0%', changeType: 'positive' }
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadAdminStats();
  }, []);

  // 최근 활동 데이터 로딩
  useEffect(() => {
    const loadRecentActivities = async () => {
      try {
        setIsLoadingActivities(true);
        const activities = await getRecentActivities(10); // 최근 10개만
        setRecentActivities(activities);
      } catch (error) {
        console.error('최근 활동 로딩 실패:', error);
        // 에러 시 빈 배열로 설정
        setRecentActivities([]);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    loadRecentActivities();
  }, []);

  // 활동 유형에 따른 아이콘 반환
  const getActivityIcon = (action: string, entityType: string) => {
    switch (action) {
      case 'REGISTER':
        if (entityType === 'USER') return Users;
        if (entityType === 'SELLER') return Users;
        return Plus;
      case 'CREATE':
        if (entityType === 'PRODUCT') return Package;
        return Plus;
      case 'ORDER':
        return ShoppingCart;
      case 'LOGIN':
        return Users;
      default:
        return Clock;
    }
  };

  // 활동 유형에 따른 색상 반환
  const getActivityColor = (action: string, entityType: string) => {
    switch (action) {
      case 'REGISTER':
        return 'bg-green-100 text-green-600';
      case 'CREATE':
        return 'bg-blue-100 text-blue-600';
      case 'ORDER':
        return 'bg-purple-100 text-purple-600';
      case 'LOGIN':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // 시간 포맷팅
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}일 전`;
    } else if (diffInHours > 0) {
      return `${diffInHours}시간 전`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}분 전`;
    } else {
      return '방금 전';
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-16 py-2 sm:py-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">관리자 대시보드</h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 빠른 통계 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {isLoadingStats ? (
            // 로딩 상태
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-12 sm:w-16"></div>
                    </div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-8 sm:w-12"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // 실제 데이터
            quickStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs sm:text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                      <p className="text-xs text-gray-400 hidden sm:block">전일 대비</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 관리 모듈 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {adminModules.map((module) => (
            <Link key={module.id} href={module.href}>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className={`${module.color} p-2 sm:p-3 rounded-lg`}>
                      <module.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm sm:text-lg truncate">{module.title}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm line-clamp-2">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 p-3 sm:p-6">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                    <span>관리하기</span>
                    <div className="flex space-x-1 sm:space-x-2">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 최근 활동 */}
        <div className="mt-8 sm:mt-12">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">최근 활동</h2>
          <Card>
            <CardContent className="p-4 sm:p-6">
              {isLoadingActivities ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm sm:text-base text-gray-600">최근 활동을 불러오는 중...</span>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <Clock className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-sm sm:text-base">최근 활동이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {recentActivities.map((activity, index) => {
                    const IconComponent = getActivityIcon(activity.action, activity.entityType);
                    const colorClass = getActivityColor(activity.action, activity.entityType);
                    
                    return (
                      <div 
                        key={activity.id} 
                        className={`flex items-start sm:items-center justify-between py-2 sm:py-3 ${
                          index < recentActivities.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${colorClass}`}>
                            <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">
                              {activity.description || `${activity.action} 작업이 수행되었습니다`}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">
                              {(activity.user?.name ?? '시스템')}
                              {activity.user?.email ? ` (${activity.user.email})` : ''}
                              {' - '}
                              {formatTimeAgo(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-400 flex-shrink-0 ml-2 hidden sm:block">
                          {activity.entityType === 'PRODUCT' && '상품 관리'}
                          {activity.entityType === 'USER' && '사용자 관리'}
                          {activity.entityType === 'SELLER' && '셀러 관리'}
                          {activity.entityType === 'ORDER' && '주문 관리'}
                          {!['PRODUCT', 'USER', 'SELLER', 'ORDER'].includes(activity.entityType) && activity.entityType}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
