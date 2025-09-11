'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { productsApi, deleteProduct } from '@/lib/api/products';
import { Product } from '@/types/product';
import { getImageUrl } from '@/lib/utils/image';
import { useToast, toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-modal';

const ProductsPage = () => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // 상품 데이터 로드
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAllProducts();
      // API 응답이 배열인지 확인하고, 그렇지 않으면 빈 배열로 설정
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('상품 로드 실패:', error);
      showToast(toast.error('상품 로드 실패', '상품을 불러오는데 실패했습니다.'));
      setProducts([]); // 에러 시 빈 배열로 설정
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // 상품 삭제
  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: '상품 삭제',
      message: '정말로 이 상품을 삭제하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      type: 'danger'
    });
    
    if (confirmed) {
      try {
        await deleteProduct(id);
        showToast(toast.success('상품 삭제 완료', '상품이 성공적으로 삭제되었습니다.'));
        loadProducts(); // 목록 새로고침
      } catch (error) {
        console.error('상품 삭제 실패:', error);
        showToast(toast.error('상품 삭제 실패', '상품 삭제에 실패했습니다.'));
      }
    }
  };

  // 상품 상태 토글
  const toggleProductStatus = async (product: Product) => {
    try {
      // 여기서 updateProduct API를 호출하여 상태를 변경
      // 임시로 로컬 상태만 변경
      setProducts(products.map(p => 
        p.id === product.id 
          ? { ...p, isActive: !p.isActive }
          : p
      ));
    } catch (error) {
      console.error('상품 상태 변경 실패:', error);
    }
  };

  // 필터링된 상품 목록 (id가 있는 상품만)
  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    if (!product.id) return false; // id가 없는 상품 제외
    
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.vendor?.name && product.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category?.name === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' ? product.isActive : !product.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) : [];

  // 카테고리 목록 (실제 데이터에서 추출)
  const categories = ['all', ...Array.from(new Set(Array.isArray(products) ? products.map(p => p.category?.name).filter(Boolean) : []))];
  const statuses = ['all', 'active', 'inactive'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">상품 관리</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button 
                variant="outline" 
                onClick={loadProducts}
                className="flex items-center text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
              >
                <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">새로고침</span>
              </Button>
              <Link href="/admin/products/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2">
                  <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">새 상품 등록</span>
                  <span className="sm:hidden">등록</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 검색 및 필터 */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="상품명, 설명, 벤더 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? '전체 카테고리' : category}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? '전체 상태' : status === 'active' ? '활성' : '비활성'}
                  </option>
                ))}
              </select>
              
              <Button variant="outline" className="flex items-center justify-center min-h-[44px] sm:min-h-[40px] text-sm sm:text-base">
                <Filter className="h-4 w-4 mr-2" />
                필터 적용
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 상품 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
              <span>상품 목록 ({filteredProducts.length}개)</span>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">정렬</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-500">상품이 없습니다.</p>
                <Link href="/admin/products/new">
                  <Button className="mt-4 text-sm sm:text-base">첫 번째 상품 등록하기</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-0">
                {/* 데스크톱 테이블 */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 w-1/4">상품명</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 w-20">카테고리</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 w-24">가격</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 w-16">재고</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 w-20">벤더</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 w-20">상태</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 w-20">등록일</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 w-24">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id!} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={getImageUrl(product.images[0] || '')}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                <p className="text-sm text-gray-500 truncate">SKU: {product.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                              {product.category?.name || '카테고리 없음'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="text-sm">
                                <span className="text-gray-500">B2B: </span>
                                <span className="font-medium">{Number(product.priceB2B).toLocaleString()}원</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">B2C: </span>
                                <span className="font-medium">{Number(product.priceB2C).toLocaleString()}원</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.stockQuantity > 20 ? 'bg-green-100 text-green-800' :
                              product.stockQuantity > 10 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {product.stockQuantity}개
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-900 whitespace-nowrap truncate block">{product.vendor?.name || '벤더 없음'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.isActive ? '활성' : '비활성'}
                              </span>
                              {product.isFeatured && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  추천
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                              {new Date(product.createdAt).toLocaleDateString('ko-KR').replace(/\.$/, '')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Link href={`/products/${product.id}`}>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/admin/products/${product.id}/edit`}>
                                <Button variant="ghost" size="sm" className="text-green-600 hover:text-blue-700">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(product.id)}
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

                {/* 모바일 카드 */}
                <div className="sm:hidden space-y-4 p-4">
                  {filteredProducts.map((product) => (
                    <div key={product.id!} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      {/* 상품 정보 */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={getImageUrl(product.images[0] || '')}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {product.category?.name || '카테고리 없음'}
                              </span>
                              <span className="text-xs text-gray-500">{product.vendor?.name || '벤더 없음'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Link href={`/products/${product.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 가격 정보 */}
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-gray-500">B2B: </span>
                            <span className="font-medium">{Number(product.priceB2B).toLocaleString()}원</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">B2C: </span>
                            <span className="font-medium">{Number(product.priceB2C).toLocaleString()}원</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.stockQuantity > 20 ? 'bg-green-100 text-green-800' :
                            product.stockQuantity > 10 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.stockQuantity}개
                          </span>
                        </div>
                      </div>

                      {/* 상태 및 등록일 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.isActive ? '활성' : '비활성'}
                          </span>
                          {product.isFeatured && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              추천
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(product.createdAt).toLocaleDateString('ko-KR').replace(/\.$/, '')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductsPage;
