'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { 
  ArrowLeft,
  Save,
  X,
  GripVertical,
  Star,
  Package,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useToast, toast } from '@/components/ui/toast';
import { Product } from '@/types/product';
import { productsApi } from '@/lib/api/products';
import { getImageUrl } from '@/lib/utils/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 드래그 가능한 MD's Pick 아이템 컴포넌트
function SortableItem({ product, onRemove }: { product: Product; onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
        {product.images && product.images.length > 0 ? (
          <img
            src={getImageUrl(product.images[0] || '')}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="h-6 w-6 text-gray-500" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
        <p className="text-xs text-gray-500 truncate">SKU: {product.sku}</p>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(product.id!)}
        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// 카테고리별 상품 선택 컴포넌트
function CategoryProductSelector({ 
  category, 
  products, 
  selectedProducts, 
  onSelect, 
  onRemove 
}: {
  category: string;
  products: Product[];
  selectedProducts: Product[];
  onSelect: (product: Product) => void;
  onRemove: (productId: string) => void;
}) {
  const isSelected = (productId: string) => selectedProducts.some(p => p.id === productId);
  const canSelect = selectedProducts.length < 3;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
      
      {/* 선택된 상품들 */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">선택된 상품 ({selectedProducts.length}/3)</p>
          <div className="space-y-2">
            {selectedProducts.map((product) => (
              <div key={product.id} className="flex items-center space-x-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={getImageUrl(product.images[0] || '')}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(product.id!)}
                  className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 선택 가능한 상품들 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">상품 목록</p>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className={`flex items-center space-x-3 p-2 border rounded-lg cursor-pointer transition-colors ${
                isSelected(product.id!) 
                  ? 'bg-blue-50 border-blue-200' 
                  : canSelect 
                    ? 'bg-white border-gray-200 hover:bg-gray-50' 
                    : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
              }`}
              onClick={() => canSelect && !isSelected(product.id!) && onSelect(product)}
            >
              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={getImageUrl(product.images[0] || '')}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-4 w-4 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                <p className="text-xs text-gray-500 truncate">SKU: {product.sku}</p>
              </div>
              {isSelected(product.id!) && (
                <div className="text-blue-600">
                  <Star className="h-4 w-4 fill-current" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomeOrderPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 카테고리별 선택된 상품들
  const [selectedProducts, setSelectedProducts] = useState<{
    [category: string]: Product[];
  }>({});
  
  // MD's Pick 선택된 상품들 (드래그 앤 드롭 가능)
  const [mdPicks, setMdPicks] = useState<Product[]>([]);
  
  // 배너 관리
  const [banners, setBanners] = useState<any[]>([]);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    description: '',
    buttonText: '상품 둘러보기',
    buttonLink: '/products',
    image: null as File | null
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 상품 데이터 로드
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getProducts({ limit: 1000 });
      if (response.success && response.data) {
        setProducts(response.data.products || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('상품 로드 실패:', error);
      showToast(toast.error('상품 로드 실패', '상품을 불러오는데 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // 홈페이지 순서 데이터 로드
  const loadHomeOrder = async () => {
    try {
      const response = await fetch('/api/admin/home-order', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 카테고리별 선택된 상품 설정
          if (data.categoryProducts) {
            setSelectedProducts(data.categoryProducts);
          }
          
          // MD's Pick 상품 설정
          if (data.mdPicks) {
            setMdPicks(data.mdPicks);
          }
        }
      }
    } catch (error) {
      console.error('홈페이지 순서 로드 실패:', error);
    }
  };

  // 배너 목록 로드
  const loadBanners = async () => {
    try {
      const response = await fetch('/api/admin/banners', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBanners(data.data || []);
        }
      }
    } catch (error) {
      console.error('배너 로드 실패:', error);
    }
  };

  // 배너 저장
  const handleSaveBanner = async () => {
    if (!bannerForm.title || !bannerForm.description || (!bannerForm.image && !editingBanner)) {
      showToast(toast.error('입력 오류', '제목, 설명, 이미지를 모두 입력해주세요.'));
      return;
    }

    try {
      const formData = new FormData();
      if (bannerForm.image) {
        formData.append('image', bannerForm.image);
      }
      formData.append('title', bannerForm.title);
      formData.append('description', bannerForm.description);
      formData.append('buttonText', bannerForm.buttonText);
      formData.append('buttonLink', bannerForm.buttonLink);
      if (editingBanner) {
        formData.append('id', editingBanner.id.toString());
      }

      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast(toast.success('저장 완료', editingBanner ? '배너가 수정되었습니다.' : '배너가 추가되었습니다.'));
          setBannerForm({
            title: '',
            description: '',
            buttonText: '상품 둘러보기',
            buttonLink: '/products',
            image: null
          });
          setEditingBanner(null);
          loadBanners();
        } else {
          throw new Error(data.error || '저장에 실패했습니다.');
        }
      } else {
        throw new Error('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('배너 저장 실패:', error);
      showToast(toast.error('저장 실패', error instanceof Error ? error.message : '배너 저장 중 오류가 발생했습니다.'));
    }
  };

  // 배너 삭제
  const handleDeleteBanner = async (id: number) => {
    if (!confirm('정말 이 배너를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast(toast.success('삭제 완료', '배너가 삭제되었습니다.'));
          loadBanners();
        } else {
          throw new Error(data.error || '삭제에 실패했습니다.');
        }
      } else {
        throw new Error('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('배너 삭제 실패:', error);
      showToast(toast.error('삭제 실패', error instanceof Error ? error.message : '배너 삭제 중 오류가 발생했습니다.'));
    }
  };

  // 배너 수정 시작
  const handleEditBanner = (banner: any) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      description: banner.description,
      buttonText: banner.buttonText,
      buttonLink: banner.buttonLink || '/products',
      image: null
    });
  };

  // 카테고리별 상품 필터링
  const getProductsByCategory = (category: string) => {
    return products.filter(product => product.category?.name === category);
  };

  // 카테고리 목록
  const categories = ['생활가전', '주방용품', '전자제품', '화장품', '잡화', '스포츠용품'];

  // 카테고리별 상품 선택
  const handleCategoryProductSelect = (category: string, product: Product) => {
    setSelectedProducts(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), product]
    }));
  };

  // 카테고리별 상품 제거
  const handleCategoryProductRemove = (category: string, productId: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter(p => p.id !== productId)
    }));
  };

  // MD's Pick 상품 선택
  const handleMdPickSelect = (product: Product) => {
    if (!mdPicks.some(p => p.id === product.id)) {
      setMdPicks(prev => [...prev, product]);
    }
  };

  // MD's Pick 상품 제거
  const handleMdPickRemove = (productId: string) => {
    setMdPicks(prev => prev.filter(p => p.id !== productId));
  };

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setMdPicks((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 저장
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // 모든 카테고리별 상품 ID 수집
      const categoryProductIds = Object.values(selectedProducts).flat().map(p => p.id!);
      
      // MD's Pick 상품 ID 수집 (순서대로)
      const mdPickIds = mdPicks.map(p => p.id!);
      
      // console.log('저장할 데이터:', {
      //   categoryProducts: selectedProducts,
      //   mdPicks: mdPickIds,
      //   mdPicksArray: mdPicks
      // });
      
      const response = await fetch('/api/admin/home-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          categoryProducts: selectedProducts,
          mdPicks: mdPickIds
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast(toast.success('저장 완료', '홈페이지 상품 순서가 성공적으로 저장되었습니다.'));
        } else {
          throw new Error(data.error || '저장에 실패했습니다.');
        }
      } else {
        throw new Error('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      showToast(toast.error('저장 실패', error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadHomeOrder();
    loadBanners();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 py-0">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">홈페이지 상품 노출 순서 관리</h1>
            </div>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 카테고리별 상품 선택 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>카테고리별 상품 선택</CardTitle>
                <CardDescription>
                  각 카테고리에서 최대 3개의 상품을 선택하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {categories.map((category) => (
                  <CategoryProductSelector
                    key={category}
                    category={category}
                    products={getProductsByCategory(category)}
                    selectedProducts={selectedProducts[category] || []}
                    onSelect={(product) => handleCategoryProductSelect(category, product)}
                    onRemove={(productId) => handleCategoryProductRemove(category, productId)}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* MD's Pick 관리 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>MD's Pick 관리</CardTitle>
                <CardDescription>
                  추천 상품을 선택하고 드래그로 순서를 조정하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 상품 선택 */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">상품 선택</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {products
                      .filter(product => !mdPicks.some(p => p.id === product.id))
                      .slice(0, 20)
                      .map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleMdPickSelect(product)}
                        >
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={getImageUrl(product.images[0] || '')}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                            <p className="text-xs text-gray-500 truncate">SKU: {product.sku}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 선택된 MD's Pick 상품들 (드래그 앤 드롭) */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    선택된 상품 ({mdPicks.length}개) - 드래그로 순서 변경
                  </h4>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={mdPicks.map(p => p.id!)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {mdPicks.map((product) => (
                          <SortableItem
                            key={product.id}
                            product={product}
                            onRemove={handleMdPickRemove}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 배너 관리 */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>배너 관리</CardTitle>
              <CardDescription>
                홈페이지 메인 배너 이미지를 등록, 수정, 삭제할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 배너 추가/수정 폼 */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {editingBanner ? '배너 수정' : '새 배너 추가'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      제목 *
                    </label>
                    <input
                      type="text"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="예: 호이드 오브제 무선청소기 출시"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명 *
                    </label>
                    <input
                      type="text"
                      value={bannerForm.description}
                      onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                      placeholder="예: 당신의 일상을 품격있게 청소하다"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      버튼 텍스트 *
                    </label>
                    <input
                      type="text"
                      value={bannerForm.buttonText}
                      onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                      placeholder="예: 상품 둘러보기"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      버튼 링크
                    </label>
                    <input
                      type="text"
                      value={bannerForm.buttonLink}
                      onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value })}
                      placeholder="/products"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      배너 이미지 {!editingBanner && '*'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBannerForm({ ...bannerForm, image: file });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {editingBanner && !bannerForm.image && (
                      <p className="text-xs text-gray-500 mt-1">이미지를 변경하지 않으려면 비워두세요.</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveBanner}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingBanner ? '수정' : '추가'}
                  </Button>
                  {editingBanner && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingBanner(null);
                        setBannerForm({
                          title: '',
                          description: '',
                          buttonText: '상품 둘러보기',
                          buttonLink: '/products',
                          image: null
                        });
                      }}
                    >
                      취소
                    </Button>
                  )}
                </div>
              </div>

              {/* 배너 목록 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  등록된 배너 ({banners.length}개)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map((banner) => (
                    <div key={banner.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="relative h-48 bg-gray-100">
                        <img
                          src={banner.image}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <h5 className="font-semibold text-gray-900">{banner.title}</h5>
                        <p className="text-sm text-gray-600">{banner.description}</p>
                        <p className="text-xs text-gray-500">버튼: {banner.buttonText}</p>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditBanner(banner)}
                            className="flex-1"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="flex-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {banners.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    등록된 배너가 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
