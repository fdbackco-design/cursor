'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/products/product-card';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Search, Filter } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import type { Product } from '@/types/product';

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const query = initialQuery || '';
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [filteredResults, setFilteredResults] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

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
    if (!query.trim()) {
      setSearchResults(allProducts);
      setFilteredResults(allProducts);
      return;
    }
    const term = query.toLowerCase();
    const results = allProducts.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.vendor?.name?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term) ||
      p.category?.name?.toLowerCase().includes(term) ||
      p.tags?.some(t => t?.toLowerCase().includes(term))
    );
    setSearchResults(results);
    setFilteredResults(results);
  }, [query, allProducts]);

  // 카테고리 필터
  useEffect(() => {
    const results = selectedCategory === 'all'
      ? searchResults
      : searchResults.filter(p => p.category?.slug === selectedCategory);
    setFilteredResults(results);
  }, [searchResults, selectedCategory]);

  const categories = ['all', ...Array.from(new Set(allProducts.map(p => p.category?.slug).filter(Boolean)))];

  const clearFilters = () => setSelectedCategory('all');

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

  // 이하 기존 렌더링 그대로
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">검색 결과: "{query}"</h1>
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