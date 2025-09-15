'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { ArrowLeft, Save, Upload, X, Plus, Trash2 } from 'lucide-react';
import { productsApi, updateProduct } from '@/lib/api/products';
import { Product } from '@/types/product';
import { getImageUrl } from '@/lib/utils/image';
import { useToast, toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-modal';

const EditProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  

  
  // 임시로 하드코딩된 상품 ID로 테스트
  const testProductId = 'cmerxdqvf00024q5ppjoeufkn';

  // 카테고리 옵션들
  const categoryOptions = [
    { value: '전체상품', label: '전체상품' },
    { value: '생활가전', label: '생활가전' },
    { value: '주방용품', label: '주방용품' },
    { value: '전자제품', label: '전자제품' },
    { value: '화장품', label: '화장품' },
    { value: '잡화', label: '잡화' },
    { value: '스포츠용품', label: '스포츠용품' }
  ];
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    priceB2B: '',
    priceB2C: '',
    comparePrice: '',
    sku: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    category: '',
    vendor: '',
    isActive: true,
    isFeatured: false,
    stockQuantity: '',
    lowStockThreshold: '',
    tags: [] as string[],
    metadata: {} as any,
    images: [] as File[],
    descriptionImages: [] as File[]
  });

  // 삭제할 이미지 인덱스들을 추적
  const [deletedImageIndexes, setDeletedImageIndexes] = useState<number[]>([]);
  const [deletedDescriptionImageIndexes, setDeletedDescriptionImageIndexes] = useState<number[]>([]);

  // 기존 상품 데이터 로드
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await productsApi.getProductById(productId);
        setProduct(data);
        
        // 폼 데이터 설정
        if (data) {
          setFormData({
            name: data.name || '',
            description: data.description || '',
            shortDescription: data.shortDescription || '',
            priceB2B: data.priceB2B ? data.priceB2B.toString() : '',
            priceB2C: data.priceB2C ? data.priceB2C.toString() : '',
            comparePrice: data.comparePrice ? data.comparePrice.toString() : '',
            sku: data.sku || '',
            weight: data.weight ? data.weight.toString() : '',
            length: data.length ? data.length.toString() : '',
            width: data.width ? data.width.toString() : '',
            height: data.height ? data.height.toString() : '',
            category: data.category?.name || '',
            vendor: data.vendor?.name || '',
            isActive: data.isActive,
            isFeatured: data.isFeatured,
            stockQuantity: data.stockQuantity ? data.stockQuantity.toString() : '',
            lowStockThreshold: data.lowStockThreshold ? data.lowStockThreshold.toString() : '',
            tags: data.tags || [],
            metadata: data.metadata || {},
            images: [],
            descriptionImages: []
          });
        }
      } catch (error) {
        console.error('상품 로드 실패:', error);
        showToast(toast.error('상품 로드 실패', '상품을 불러오는데 실패했습니다.'));
        router.push('/admin/products');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'images' | 'descriptionImages') => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], ...files]
    }));
  };

  const removeImage = (index: number, type: 'images' | 'descriptionImages') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // 기존 이미지 삭제 함수
  const removeExistingImage = (index: number, type: 'images' | 'descriptionImages') => {
    if (type === 'images') {
      setDeletedImageIndexes(prev => [...prev, index]);
    } else {
      setDeletedDescriptionImageIndexes(prev => [...prev, index]);
    }
  };

  const addTag = () => {
    const newTag = prompt('새 태그를 입력하세요:');
    if (newTag && newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;

    try {
      setSaving(true);
      
      // 실제로 변경된 데이터만 포함
      const productData: any = {};
      
      if (formData.name !== product.name) productData.name = formData.name;
      if (formData.description !== product.description) productData.description = formData.description;
      if (formData.shortDescription !== (product.shortDescription || '')) productData.shortDescription = formData.shortDescription || undefined;
      // 가격 필드 처리 - 디버깅 로그 추가
      const currentPriceB2B = parseFloat(formData.priceB2B);
      const currentPriceB2C = parseFloat(formData.priceB2C);
      const currentComparePrice = formData.comparePrice ? parseFloat(formData.comparePrice) : null;
      
      // console.log('가격 비교:', {
      //   formData: { priceB2B: formData.priceB2B, priceB2C: formData.priceB2C, comparePrice: formData.comparePrice },
      //   product: { priceB2B: product.priceB2B, priceB2C: product.priceB2C, comparePrice: product.comparePrice },
      //   parsed: { priceB2B: currentPriceB2B, priceB2C: currentPriceB2C, comparePrice: currentComparePrice }
      // });
      
      if (currentPriceB2B !== Number(product.priceB2B)) productData.priceB2B = currentPriceB2B;
      if (currentPriceB2C !== Number(product.priceB2C)) productData.priceB2C = currentPriceB2C;
      if (currentComparePrice !== product.comparePrice) productData.comparePrice = currentComparePrice;
      if (formData.sku !== (product.sku || '')) productData.sku = formData.sku || undefined;
      if (formData.weight !== (product.weight ? product.weight.toString() : '')) {
        productData.weight = formData.weight ? parseFloat(formData.weight) : undefined;
      }
      if (formData.length !== (product.length ? product.length.toString() : '')) {
        productData.length = formData.length ? parseFloat(formData.length) : undefined;
      }
      if (formData.width !== (product.width ? product.width.toString() : '')) {
        productData.width = formData.width ? parseFloat(formData.width) : undefined;
      }
      if (formData.height !== (product.height ? product.height.toString() : '')) {
        productData.height = formData.height ? parseFloat(formData.height) : undefined;
      }
      if (formData.category !== (product.category?.name || '')) productData.category = formData.category;
      if (formData.vendor !== (product.vendor?.name || '')) productData.vendor = formData.vendor || undefined;
      if (formData.isActive !== product.isActive) productData.isActive = formData.isActive;
      if (formData.isFeatured !== product.isFeatured) productData.isFeatured = formData.isFeatured;
      if (parseInt(formData.stockQuantity) !== product.stockQuantity) productData.stockQuantity = parseInt(formData.stockQuantity);
      if (formData.lowStockThreshold !== (product.lowStockThreshold ? product.lowStockThreshold.toString() : '')) {
        productData.lowStockThreshold = formData.lowStockThreshold ? parseInt(formData.lowStockThreshold) : undefined;
      }
      if (JSON.stringify(formData.tags) !== JSON.stringify(product.tags || [])) productData.tags = formData.tags;
      if (JSON.stringify(formData.metadata) !== JSON.stringify(product.metadata || {})) productData.metadata = formData.metadata;
      
      // 이미지 관련 데이터는 항상 포함 (삭제나 추가가 있을 때)
      if (formData.images.length > 0 || deletedImageIndexes.length > 0) {
        productData.images = formData.images;
        productData.deletedImageIndexes = deletedImageIndexes;
      }
      
      if (formData.descriptionImages.length > 0 || deletedDescriptionImageIndexes.length > 0) {
        productData.descriptionImages = formData.descriptionImages;
        productData.deletedDescriptionImageIndexes = deletedDescriptionImageIndexes;
      }

      // console.log('최종 전송 데이터:', productData);
      // console.log('전송할 productId:', productId);
      // console.log('삭제된 이미지 인덱스:', deletedImageIndexes);
      // console.log('삭제된 설명 이미지 인덱스:', deletedDescriptionImageIndexes);
      
      await updateProduct(productId, productData);
      showToast(toast.success('상품 수정 완료', '상품이 성공적으로 수정되었습니다.'));
      router.push('/admin/products');
    } catch (error) {
      console.error('상품 수정 실패:', error);
      showToast(toast.error('상품 수정 실패', '상품 수정에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = () => {
    return formData.name && 
           formData.description && 
           formData.priceB2B && 
           formData.priceB2C && 
           formData.category && 
           formData.stockQuantity;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">상품을 찾을 수 없습니다.</p>
          <Button onClick={() => router.push('/admin/products')} className="mt-4">
            상품 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/admin/products')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로가기
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">상품 수정</h1>
            </div>
            <Button 
              type="submit" 
              form="edit-product-form"
              disabled={!isFormValid() || saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상품명 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상품 설명 *(필수입력: 배송 기한은 영업일 기준 1~2일 이내입니다.) 
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  간단 설명
                </label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* 가격 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>가격 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    B2B 가격 *
                  </label>
                  <input
                    type="number"
                    name="priceB2B"
                    value={formData.priceB2B}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    B2C 가격 *
                  </label>
                  <input
                    type="number"
                    name="priceB2C"
                    value={formData.priceB2C}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비교 가격
                  </label>
                  <input
                    type="number"
                    name="comparePrice"
                    value={formData.comparePrice}
                    onChange={handleInputChange}
                    min="0"
                    step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 카테고리 및 벤더 */}
          <Card>
            <CardHeader>
              <CardTitle>카테고리 및 벤더</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리 *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">카테고리를 선택하세요</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    벤더
                  </label>
                  <input
                    type="text"
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 재고 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>재고 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    재고 수량 *
                  </label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최소 재고 임계값
                  </label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 물리적 속성 */}
          <Card>
            <CardHeader>
              <CardTitle>물리적 속성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Top10 순위
                  </label>
                  <select
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">일반 상품</option>
                    <option value="10">Top 10</option>
                    <option value="9">Top 9</option>
                    <option value="8">Top 8</option>
                    <option value="7">Top 7</option>
                    <option value="6">Top 6</option>
                    <option value="5">Top 5</option>
                    <option value="4">Top 4</option>
                    <option value="3">Top 3</option>
                    <option value="2">Top 2</option>
                    <option value="1">Top 1</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Top10 순위를 지정하면 메인 페이지의 Top10 섹션에 표시됩니다.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    길이 (cm)
                  </label>
                  <input
                    type="number"
                    name="length"
                    value={formData.length}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    너비 (cm)
                  </label>
                  <input
                    type="number"
                    name="width"
                    value={formData.width}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    높이 (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 상태 설정 */}
          <Card>
            <CardHeader>
              <CardTitle>상태 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">활성 상품</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">추천 상품</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* 태그 */}
          <Card>
            <CardHeader>
              <CardTitle>태그</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                태그 추가
              </Button>
            </CardContent>
          </Card>

          {/* 상품 이미지 */}
          <Card>
            <CardHeader>
              <CardTitle>상품 이미지</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 기존 이미지 */}
              {product.images && product.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">기존 이미지</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.images.map((image, index) => (
                      <div key={index} className={`relative ${deletedImageIndexes.includes(index) ? 'opacity-50' : ''}`}>
                        <img
                          src={getImageUrl(image)}
                          alt={`기존 이미지 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        {!deletedImageIndexes.includes(index) && (
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index, 'images')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 새 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 이미지 추가
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'images')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 업로드된 이미지 미리보기 */}
              {formData.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">업로드할 이미지</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`업로드 이미지 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, 'images')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 상세 설명 이미지 */}
          <Card>
            <CardHeader>
              <CardTitle>상세 설명 이미지</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 기존 이미지 */}
              {product.descriptionImages && product.descriptionImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">기존 이미지</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.descriptionImages.map((image, index) => (
                      <div key={index} className={`relative ${deletedDescriptionImageIndexes.includes(index) ? 'opacity-50' : ''}`}>
                        <img
                          src={getImageUrl(image)}
                          alt={`기존 상세 이미지 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        {!deletedDescriptionImageIndexes.includes(index) && (
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index, 'descriptionImages')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 새 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 상세 이미지 추가
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'descriptionImages')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 업로드된 이미지 미리보기 */}
              {formData.descriptionImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">업로드할 상세 이미지</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.descriptionImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`업로드 상세 이미지 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, 'descriptionImages')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>

        {/* 페이지 하단 저장 버튼 */}
        <div className="mt-8 flex justify-center">
          <button 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground h-10 px-4 py-2 bg-blue-600 hover:bg-blue-700" 
            type="submit" 
            form="edit-product-form"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save h-4 w-4 mr-2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProductPage;
