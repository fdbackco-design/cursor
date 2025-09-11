'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/products/product-card';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Search, ArrowLeft, Filter, Info } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import type { Product } from '@/types/product';

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [filteredResults, setFilteredResults] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // 추천 검색어
  const recommendedKeywords = ['청소기', '공기청정기', '압력솥'];

  // 모든 상품 로드
  useEffect(() => {
    const load = async () => {
      try {
        const res = await productsApi.getProducts({ limit: 1000 });
        const products = (res.success && res.data?.products) ? res.data.products : [];
        setAllProducts(products);
        setSearchResults(products);
        setFilteredResults(products);
      } catch {
        setAllProducts([]); setSearchResults([]); setFilteredResults([]);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  // 검색어 필터
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(allProducts);
      setFilteredResults(allProducts);
      return;
    }
    const term = searchQuery.toLowerCase();
    const results = allProducts.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.vendor?.name?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term) ||
      p.category?.name?.toLowerCase().includes(term) ||
      p.tags?.some(t => t?.toLowerCase().includes(term))
    );
    setSearchResults(results);
    setFilteredResults(results);
  }, [searchQuery, allProducts]);

  // 카테고리 필터
  useEffect(() => {
    const results = selectedCategory === 'all'
      ? searchResults
      : searchResults.filter(p => p.category?.slug === selectedCategory);
    setFilteredResults(results);
  }, [searchResults, selectedCategory]);

  const categories = ['all', ...Array.from(new Set(allProducts.map(p => p.category?.slug).filter(Boolean)))];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      // URL 업데이트
      const params = new URLSearchParams(searchParams);
      params.set('q', searchQuery.trim());
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    setSearchQuery(keyword);
    setIsSearching(true);
    const params = new URLSearchParams(searchParams);
    params.set('q', keyword);
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => setSelectedCategory('all');

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 검색 결과가 있는 경우 (검색어가 입력된 경우)
  if (isSearching && searchQuery.trim()) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">검색 결과: "{searchQuery}"</h1>
            <p className="text-gray-600">총 {filteredResults.length}개의 상품을 찾았습니다</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Filter className="h-5 w-5 mr-2" />
                      필터
                    </span>
                    <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700">초기화</button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">카테고리</h3>
                    <div className="space-y-2">
                      {categories.map((c) => (
                        <label key={c || 'empty'} className="flex items-center">
                          <input
                            type="radio"
                            name="category"
                            value={c || ''}
                            checked={selectedCategory === c}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">
                            {c === 'all' ? '전체' : c || '미지정'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {filteredResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.map((p) => (<ProductCard key={p.id} product={p} />))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-16">
                    <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
                    <p className="text-gray-600">다른 검색어를 입력하거나 필터를 조정해보세요.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 검색 페이지 (검색어가 없는 경우)
  return (
    <div className="min-h-screen bg-white">
      {/* 검색 헤더 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            {/* 뒤로가기 버튼 */}
            <button 
              onClick={() => router.back()}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            
            {/* 검색 입력 */}
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품명 또는 브랜드 입력"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                autoFocus
              />
            </form>
          </div>
        </div>
      </div>

      {/* 검색 콘텐츠 */}
      <div className="px-4 py-6">
        {/* 최근 검색어 */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">최근 검색어</h2>
          <div className="text-center py-8">
            <p className="text-gray-500">최근 검색어 내역이 없습니다.</p>
          </div>
        </div>

        {/* 추천 검색어 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">추천 검색어</h2>
            <Info className="h-4 w-4 text-gray-400 ml-2" />
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendedKeywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => handleKeywordClick(keyword)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors duration-200"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}