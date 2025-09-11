'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ShoppingCart, Heart, Star, Image as ImageIcon, Check, X } from 'lucide-react';
import { getProductImageUrls, getProductThumbnailUrl } from '@/lib/utils/image';
import { formatPriceWithCurrency } from '@/lib/utils/price';
import { useAuth } from '@/contexts/AuthContext';
import { cartApi } from '@/lib/api/cart';
import { wishlistApi } from '@/lib/api/wishlist';
import { reviewsApi, Review } from '@/lib/api/reviews';
import { deleteProductImage } from '@/lib/api/products';
import { useToast, toast } from '@/components/ui/toast';

import { Product } from '@/types/product';

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartStatus, setAddToCartStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  // 리뷰 관련 상태
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewStats, setReviewStats] = useState<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Array<{
      rating: number;
      count: number;
      percentage: number;
    }>;
  } | null>(null);
  
  // 이미지가 없거나 selectedImage가 범위를 벗어날 때 안전 처리
  const safeSelectedImage = product.images && product.images.length > 0 
    ? Math.min(selectedImage, product.images.length - 1) 
    : 0;
  
  // 사용자 역할 확인 - 실제 앱에서는 context/state에서 가져옴
  const userRole = user?.role || 'CONSUMER';
  const isAdmin = userRole === 'ADMIN';
  
  // Show consumer price by default for MVP
  const displayPrice = product.priceB2C;
  const priceLabel = '일반 가격';
  const discount = product.comparePrice ? Math.round(((product.comparePrice - displayPrice) / product.comparePrice) * 100) : 0;

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // 이미지 삭제 함수 (관리자만 사용 가능)
  const handleDeleteImage = async (imageIndex: number) => {
    if (!isAdmin) {
      showToast(toast.warning('권한 없음', '이미지 삭제 권한이 없습니다.'));
      return;
    }

    try {
      await deleteProductImage(product.id, imageIndex);
      showToast(toast.success('이미지 삭제', '이미지가 삭제되었습니다.'));
      // 페이지 새로고침으로 변경사항 반영
      window.location.reload();
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      showToast(toast.error('삭제 실패', '이미지 삭제에 실패했습니다.'));
    }
  };

  // 찜하기 상태 확인
  useEffect(() => {
    if (isAuthenticated) {
      checkWishlistStatus();
    }
  }, [isAuthenticated, product.id]);

  const checkWishlistStatus = async () => {
    try {
      const status = await wishlistApi.checkWishlistStatus(product.id);
      setIsWishlisted(status);
    } catch (error) {
      console.error('찜하기 상태 확인 실패:', error);
    }
  };

  // 찜하기 토글
  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      showToast(toast.warning('로그인 필요', '로그인이 필요한 서비스입니다.'));
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await wishlistApi.removeFromWishlist({ productId: product.id });
        setIsWishlisted(false);
        showToast(toast.success('찜하기 해제', '상품을 찜목록에서 제거했습니다.'));
      } else {
        await wishlistApi.addToWishlist({ productId: product.id });
        setIsWishlisted(true);
        showToast(toast.success('찜하기 추가', '상품을 찜목록에 추가했습니다.'));
      }
    } catch (error) {
      console.error('찜하기 토글 실패:', error);
      showToast(toast.error('찜하기 실패', '찜하기 처리에 실패했습니다.'));
    } finally {
      setWishlistLoading(false);
    }
  };

  // 리뷰 로드 함수
  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      const response = await reviewsApi.getProductReviews(product.id, 1, 10);
      
      //console.log('리뷰 API 응답:', response);
      
      if (response.success && response.data) {
        //console.log('리뷰 데이터:', response.data.reviews);
        //console.log('리뷰 통계:', response.data.stats);
        setReviews(response.data.reviews);
        setReviewStats(response.data.stats);
      } else {
        console.error('리뷰 로드 실패:', response.error);
        setReviewsError('리뷰를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('리뷰 로드 실패:', error);
      setReviewsError('리뷰를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setReviewsLoading(false);
    }
  };

  // 리뷰 섹션 토글
  const toggleReviews = () => {
    if (!showReviews && (!reviews || reviews.length === 0)) {
      loadReviews();
    }
    setShowReviews(!showReviews);
  };

  // 컴포넌트 마운트 시 리뷰 통계 로드
  React.useEffect(() => {
    const loadReviewStats = async () => {
      try {
        const response = await reviewsApi.getProductReviews(product.id, 1, 1);
        //console.log('통계 API 응답:', response);
        
        if (response.success && response.data) {
          //console.log('통계 데이터:', response.data.stats);
          setReviewStats(response.data.stats);
        }
      } catch (error) {
        console.error('리뷰 통계 로드 실패:', error);
      }
    };

    loadReviewStats();
  }, [product.id]);

  const handleImageSelect = (index: number) => {
    setSelectedImage(index);
    setImageLoading(true);
    setImageError(false);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated || !user) {
      showToast(toast.warning('로그인 필요', '로그인이 필요한 서비스입니다.'));
      window.location.href = '/signin';
      return;
    }

    if (product.stockQuantity < quantity) {
      showToast(toast.warning('재고 부족', `재고가 부족합니다. 현재 재고: ${product.stockQuantity}개`));
      return;
    }

    setIsAddingToCart(true);
    setAddToCartStatus('idle');

    try {
      const result = await cartApi.addToCart({
        productId: product.id,
        quantity: quantity,
      });

      if (result.success) {
        setAddToCartStatus('success');
        //console.log('장바구니 추가 성공:', result.message);
        
        // 3초 후 상태 초기화
        setTimeout(() => {
          setAddToCartStatus('idle');
        }, 3000);
      } else {
        setAddToCartStatus('error');
        console.error('장바구니 추가 실패:', result.message);
        showToast(toast.error('장바구니 추가 실패', result.message || '장바구니 추가에 실패했습니다.'));
      }
    } catch (error) {
      setAddToCartStatus('error');
      console.error('장바구니 추가 오류:', error);
      showToast(toast.error('장바구니 추가 오류', '장바구니 추가 중 오류가 발생했습니다.'));
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Product Images */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
          {product.images && product.images.length > 0 ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
              
              {imageError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">이미지를 불러올 수 없습니다</span>
                  </div>
                </div>
              ) : (
                <img
                  src={getProductThumbnailUrl(product.images, safeSelectedImage)}
                  alt={`${product.name} 이미지 ${safeSelectedImage + 1}`}
                  className={`w-full h-full object-cover transition-opacity duration-200 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
              
              {/* 관리자용 메인 이미지 삭제 버튼 */}
              {isAdmin && product.images.length > 0 && (
                <button
                  onClick={() => handleDeleteImage(safeSelectedImage)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors z-10"
                  title="현재 이미지 삭제"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <span className="text-muted-foreground text-sm">이미지 없음</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Thumbnail Images */}
        {product.images && product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((image, index) => (
              <div key={index} className="relative">
                <button
                  onClick={() => handleImageSelect(index)}
                  className={`w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 ${
                    safeSelectedImage === index ? 'ring-2 ring-primary scale-105' : 'ring-1 ring-gray-200 hover:ring-gray-300'
                  }`}
                >
                  <img
                    src={getProductThumbnailUrl(product.images, index)}
                    alt={`${product.name} 썸네일 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
                {/* 관리자용 이미지 삭제 버튼 */}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(index);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                    title="이미지 삭제"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                          <p className="text-muted-foreground">{product.category?.name || '카테고리 없음'}</p>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-primary">
                {formatPriceWithCurrency(displayPrice)}
              </span>
              {product.comparePrice && product.comparePrice > displayPrice && (
                <span className="text-lg text-gray-500 line-through">
                  {formatPriceWithCurrency(product.comparePrice)}
                </span>
              )}
            </div>
            {discount > 0 && (
              <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-medium">
                {discount}% 할인
              </span>
            )}
          </div>
          
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label className="text-sm font-medium">수량</label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </Button>
            <span className="w-16 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            size="lg" 
            className="flex-1"
            onClick={handleAddToCart}
            disabled={isAddingToCart || product.stockQuantity === 0}
          >
            {isAddingToCart ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                추가 중...
              </>
            ) : addToCartStatus === 'success' ? (
              <>
                <Check className="h-5 w-5 mr-2 text-green-600" />
                추가 완료!
              </>
            ) : addToCartStatus === 'error' ? (
              <>
                <X className="h-5 w-5 mr-2 text-red-600" />
                추가 실패
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.stockQuantity === 0 ? '품절' : '장바구니에 추가'}
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className={`transition-colors duration-200 ${
              isWishlisted ? 'text-red-500 border-red-500 hover:bg-red-50' : 'hover:border-red-500'
            }`}
          >
            <Heart 
              className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} 
            />
            {wishlistLoading ? '처리중...' : (isWishlisted ? '찜됨' : '찜하기')}
          </Button>

        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="bg-secondary px-3 py-1 rounded-full text-sm text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Product Description */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>상품 설명</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Description Images */}
      {product.descriptionImages && product.descriptionImages.length > 0 && (
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>상품 상세 이미지</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.descriptionImages.map((image, index) => (
                  <div key={index} className="w-full">
                    <img
                      src={getProductThumbnailUrl(product.descriptionImages, index)}
                      alt={`${product.name} 상세 이미지 ${index + 1}`}
                      className="w-full h-auto rounded-lg shadow-sm"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reviews Section */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="flex items-center text-lg sm:text-xl">
                  <Star className="h-5 w-5 mr-2 text-yellow-400" />
                  상품 리뷰
                </span>
                {reviewStats && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-base">{reviewStats.totalReviews}</span>
                      <span>개 리뷰</span>
                    </div>
                    {reviewStats.averageRating > 0 ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                star <= Math.round(reviewStats.averageRating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium text-base">{reviewStats.averageRating}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-gray-400">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300"
                            />
                          ))}
                        </div>
                        <span>리뷰 없음</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleReviews}
                className="flex items-center justify-center w-full sm:w-auto min-h-[44px] px-6 py-3 text-sm font-medium"
              >
                {showReviews ? '리뷰 숨기기' : '리뷰 보기'}
              </Button>
            </CardTitle>
          </CardHeader>
          {showReviews && (
            <CardContent>
              {reviewsLoading ? (
                <div className="flex flex-col sm:flex-row items-center justify-center py-8 gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground text-sm sm:text-base">리뷰를 불러오는 중...</span>
                </div>
              ) : reviewsError ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4 text-sm sm:text-base">{reviewsError}</p>
                  <Button 
                    variant="outline" 
                    onClick={loadReviews}
                    className="w-full sm:w-auto min-h-[44px] px-6 py-3 text-sm font-medium"
                  >
                    다시 시도
                  </Button>
                </div>
              ) : !reviews || reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm sm:text-base">아직 작성된 리뷰가 없습니다.</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    첫 번째 리뷰를 작성해보세요!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm sm:text-base font-medium text-gray-600">
                              {review.user?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {review.user?.name || '익명'}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                      star <= review.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs sm:text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.isVerified && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full self-start sm:self-auto">
                            구매확정
                          </span>
                        )}
                      </div>
                      
                      {review.title && (
                        <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{review.title}</h4>
                      )}
                      
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{review.content}</p>
                    </div>
                  ))}
                  
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={loadReviews}
                      className="w-full sm:w-auto min-h-[44px] px-6 py-3 text-sm font-medium"
                    >
                      더 많은 리뷰 보기
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
