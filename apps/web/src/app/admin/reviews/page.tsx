'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  RefreshCw, 
  Star,
  User,
  Package,
  Calendar,
  Trash2,
  Eye,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { reviewsApi, Review } from '@/lib/api/reviews';
import { useToast, toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-modal';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  // 필터 상태
  const [filters, setFilters] = useState({
    rating: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // 리뷰 목록 조회
  const loadReviews = useCallback(async (searchFilters = filters) => {
    try {
      setLoading(true);
      
      const options = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchFilters.rating && { rating: parseInt(searchFilters.rating) }),
        ...(searchFilters.search && { search: searchFilters.search }),
        sortBy: searchFilters.sortBy,
        sortOrder: searchFilters.sortOrder
      };

      const response = await reviewsApi.getAdminReviews(options);
      
      if (response.success && response.data) {
        setReviews(response.data.reviews);
        setPagination(response.data.pagination);
      } else {
        showToast(toast.error('리뷰 조회 실패', response.error || '리뷰를 불러오는데 실패했습니다.'));
        setReviews([]);
      }
    } catch (error) {
      console.error('리뷰 조회 실패:', error);
      showToast(toast.error('리뷰 조회 오류', '리뷰 조회 중 오류가 발생했습니다.'));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, showToast]);

  // 리뷰 삭제
  const handleDeleteReview = async (review: Review) => {
    const confirmed = await confirm({
      title: '리뷰 삭제',
      message: `"${review.product?.name}" 상품에 대한 "${review.user?.name}"님의 리뷰를 삭제하시겠습니까?`,
      confirmText: '삭제',
      cancelText: '취소',
      type: 'danger'
    });
    
    if (confirmed) {
      try {
        const response = await reviewsApi.deleteReview(review.id);
        
        if (response.success) {
          showToast(toast.success('리뷰 삭제 완료', '리뷰가 성공적으로 삭제되었습니다.'));
          await loadReviews(); // 목록 새로고침
        } else {
          showToast(toast.error('리뷰 삭제 실패', response.error || '리뷰 삭제에 실패했습니다.'));
        }
      } catch (error) {
        console.error('리뷰 삭제 실패:', error);
        showToast(toast.error('리뷰 삭제 오류', '리뷰 삭제 중 오류가 발생했습니다.'));
      }
    }
  };

  // 별점 렌더링
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 초기 로드
  useEffect(() => {
    loadReviews();
  }, []);

  // 페이지 변경 시 로드
  useEffect(() => {
    loadReviews();
  }, [pagination.page]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  관리자 메인
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">리뷰 관리</h1>
                <p className="text-gray-600 mt-1">사용자 리뷰 조회 및 관리</p>
              </div>
            </div>
          </div>
        </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">별점</label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  <option value="5">5점</option>
                  <option value="4">4점</option>
                  <option value="3">3점</option>
                  <option value="2">2점</option>
                  <option value="1">1점</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정렬 기준</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">작성일</option>
                  <option value="rating">별점</option>
                  <option value="product.name">상품명</option>
                  <option value="user.name">작성자</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정렬 순서</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">최신순</option>
                  <option value="asc">오래된순</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
                <input
                  type="text"
                  placeholder="상품명, 작성자, 내용 검색"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setPagination(prev => ({ ...prev, page: 1 }));
                      loadReviews(filters);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <Button onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 })); // 검색 시 첫 페이지로
                loadReviews(filters);
              }}>
                <Search className="h-4 w-4 mr-2" />
                검색
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const resetFilters = {
                    rating: '',
                    search: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc' as 'asc' | 'desc'
                  };
                  setFilters(resetFilters);
                  setPagination(prev => ({ ...prev, page: 1 }));
                  loadReviews(resetFilters);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 리뷰 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">리뷰 정보를 불러오는 중...</p>
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-sm font-medium text-gray-600">
                            {review.rating}점
                          </span>
                        </div>
                        {review.isVerified && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded">
                            구매확정
                          </span>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">상품</span>
                          </div>
                          <p className="text-gray-900 font-medium">{review.product?.name}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">작성자</span>
                          </div>
                          <p className="text-gray-900">{review.user?.name}</p>
                          <p className="text-sm text-gray-500">{review.user?.email}</p>
                        </div>
                      </div>

                      {review.title && (
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <p className="text-gray-700 leading-relaxed">{review.content}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReview(review)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">리뷰가 없습니다</h3>
              <p className="text-gray-600">
                검색 조건에 맞는 리뷰가 없습니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                이전
              </Button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <Button
                    key={pageNumber}
                    variant={pagination.page === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                다음
              </Button>
            </div>
          </div>
        )}

        {/* 통계 정보 */}
        {pagination.total > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600">
            총 {pagination.total}개의 리뷰 중 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
          </div>
        )}
      </div>
    </div>
  );
}
