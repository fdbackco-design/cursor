'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/products/product-card';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Search, Filter, X } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { Product } from '@/types/product';
import { useAuth } from '@/contexts/AuthContext';

export default function SearchPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [filteredResults, setFilteredResults] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // 인증 체크
  useEffect(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated || !user) {
      router.push('/signin');
      return;
    }
    
    // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
    if (isAuthenticated && user && !user.approve) {
      router.push('/approval-pending');
      return;
    }
  }, [isAuthenticated, user, router]);

  // 모든 상품 로드
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await productsApi.getProducts({ limit: 1000 }); // 모든 상품을 가져오기 위해 큰 limit 설정
        if (response.success && response.data) {
          const products = response.data.products || [];
          setAllProducts(products);
          setSearchResults(products);
          setFilteredResults(products);
        } else {
          console.error('상품 로드 실패:', response.error);
          setAllProducts([]);
          setSearchResults([]);
          setFilteredResults([]);
        }
      } catch (error) {
        console.error('상품 로드 실패:', error);
        setAllProducts([]);
        setSearchResults([]);
        setFilteredResults([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // 검색어에 따른 상품 필터링
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(allProducts);
      setFilteredResults(allProducts);
      return;
    }

    if (!Array.isArray(allProducts)) {
      setSearchResults([]);
      setFilteredResults([]);
      return;
    }

    const results = allProducts.filter(product => {
      const searchTerm = query.toLowerCase();
      return (
        product.name?.toLowerCase().includes(searchTerm) ||
        product.vendor?.name?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.category?.name?.toLowerCase().includes(searchTerm) ||
        product.tags?.some(tag => tag?.toLowerCase().includes(searchTerm))
      );
    });

    setSearchResults(results);
    setFilteredResults(results);
  }, [query, allProducts]);

  // 카테고리 필터링
  useEffect(() => {
    let results = searchResults;

    if (selectedCategory !== 'all') {
      results = results.filter(product => product.category?.slug === selectedCategory);
    }

    setFilteredResults(results);
  }, [searchResults, selectedCategory]);

  // 고유한 카테고리 목록
  const categories = ['all', ...Array.from(new Set((Array.isArray(allProducts) ? allProducts : []).map(p => p.category?.slug).filter(Boolean)))];

  const clearFilters = () => {
    setSelectedCategory('all');
  };

  // 검색어가 없을 때의 UI
  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <Search className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">검색어를 입력해주세요</h1>
            <p className="text-gray-600 mb-8">
              상품명, 브랜드, 카테고리로 검색할 수 있습니다.
            </p>
            <div className="max-w-md mx-auto">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const searchQuery = formData.get('search') as string;
                  if (searchQuery.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  name="search"
                  placeholder="검색어를 입력하세요"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  검색
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">상품을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated || !user) {
    return null;
  }
  
  // 승인되지 않은 사용자는 승인 대기 페이지로 리다이렉트
  if (isAuthenticated && user && !user.approve) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 검색 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            검색 결과: "{query}"
          </h1>
          <p className="text-gray-600">
            총 {filteredResults.length}개의 상품을 찾았습니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 필터 사이드바 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    필터
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    초기화
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 카테고리 필터 */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">카테고리</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category || 'empty-category'} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          value={category || ''}
                          checked={selectedCategory === category}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {category === 'all' ? '전체' : category || '미지정'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>


              </CardContent>
            </Card>
          </div>

          {/* 검색 결과 */}
          <div className="lg:col-span-3">
            {filteredResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-gray-600">
                    다른 검색어를 입력하거나 필터를 조정해보세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
