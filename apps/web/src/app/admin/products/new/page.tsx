'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { 
  Package, 
  ArrowLeft, 
  Upload,
  X,
  Tag,
  Ruler,
  Weight,
  Hash
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/api/products';
import { useToast, toast } from '@/components/ui/toast';

const NewProductPage = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    priceB2B: '',
    priceB2C: '',
    comparePrice: '',
    sku: '',
    weight: '' as string | null,
    length: '',
    width: '',
    height: '',
    category: '',
    vendor: '',
    isActive: true,
    isFeatured: false, // 명시적으로 false로 설정
    stockQuantity: '',
    lowStockThreshold: '',
    tags: [] as string[],
    metadata: {} as any,
    images: [] as File[],
    descriptionImages: [] as File[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // 컴포넌트 마운트 시 초기 상태 로그
  useEffect(() => {
    //console.log('컴포넌트 마운트 시 formData.isFeatured:', formData.isFeatured);
  }, []);

  const categories = ['전체상품', '생활가전', '주방용품', '전자제품', '화장품', '잡화', '스포츠용품'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    //console.log(`입력 변경: ${name}, 타입: ${type}, 값: ${value}`); // 디버깅용 로그
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      //console.log(`체크박스 변경: ${name} = ${checked}`); // 디버깅용 로그
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: checked
        };
        //console.log(`새로운 formData.${name}:`, (newData as any)[name]); // 디버깅용 로그
        return newData;
      });
    } else {
      // weight 필드가 "0" (일반 상품)일 때는 null로 설정
      if (name === 'weight' && value === '0') {
        setFormData(prev => ({
          ...prev,
          [name]: null
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'images' | 'descriptionImages') => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], ...newImages]
      }));
    }
  };

  const removeImage = (index: number, type: 'images' | 'descriptionImages') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    //console.log('제출 시 formData.isFeatured:', formData.isFeatured); // 디버깅용 로그
    
    const productData = {
      name: formData.name,
      description: formData.description,
      shortDescription: formData.shortDescription || '',
      priceB2B: Number(formData.priceB2B),
      priceB2C: Number(formData.priceB2C),
      comparePrice: formData.comparePrice ? Number(formData.comparePrice) : 0,
      sku: formData.sku || '',
      weight: formData.weight ? Number(formData.weight) : 0,
      length: formData.length ? Number(formData.length) : 0,
      width: formData.width ? Number(formData.width) : 0,
      height: formData.height ? Number(formData.height) : 0,

      // ✅ 서버가 요구하는 필드명으로
      category: formData.category,    // ← 카테고리 이름
      vendor: formData.vendor || '',

      isActive: Boolean(formData.isActive),
      isFeatured: Boolean(formData.isFeatured),
      stockQuantity: Number(formData.stockQuantity),
      lowStockThreshold: formData.lowStockThreshold ? Number(formData.lowStockThreshold) : 0,

      // ✅ 이미지 파일 배열
      images: formData.images || [],
      descriptionImages: formData.descriptionImages || [],

      // ✅ 태그와 메타데이터
      tags: formData.tags || [],
      metadata: formData.metadata || {},
    };
    
    //console.log('제출할 productData.isFeatured:', productData.isFeatured); // 디버깅용 로그

    const result = await createProduct({
      ...productData,
      images: formData.images,
      descriptionImages: formData.descriptionImages
    });
    if (result.success) {
      showToast(toast.success('상품 등록 완료', '상품이 성공적으로 등록되었습니다!'));
      router.push('/admin/products');
    } else {
      throw new Error(result.message || '상품 등록에 실패했습니다.');
    }
  } catch (err) {
    console.error('상품 등록 실패:', err);
    showToast(toast.error('상품 등록 실패', '상품 등록에 실패했습니다. 다시 시도해주세요.'));
  } finally {
    setIsSubmitting(false);
  }
};

  const isFormValid = formData.name && formData.description && formData.priceB2B && 
                     formData.priceB2C && formData.stockQuantity && formData.category;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin/products" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">새 상품 등록</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-6 w-6 mr-2" />
              상품 정보 입력
            </CardTitle>
            <CardDescription>
              새로운 상품의 정보를 입력하고 등록하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 기본 정보 */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      상품명 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="상품명을 입력하세요"
                    />
                  </div>

                  <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                      SKU (선택사항)
                    </label>
                    <input
                      type="text"
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SKU를 입력하거나 비워두면 자동 생성됩니다"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      비워두면 자동으로 고유한 SKU가 생성됩니다
                    </p>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      카테고리 *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">카테고리를 선택하세요</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-2">
                      벤더
                    </label>
                    <input
                      type="text"
                      id="vendor"
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="벤더명을 입력하세요"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    상품 설명 *(필수입력: 배송 기한은 영업일 기준 1-2일 이내입니다.)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="상품에 대한 자세한 설명을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    간단 설명
                  </label>
                  <textarea
                    id="shortDescription"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="상품에 대한 간단한 설명을 입력하세요"
                  />
                </div>
              </div>

              {/* 가격 정보 */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">가격 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="priceB2B" className="block text-sm font-medium text-gray-700 mb-2">
                      B2B 가격 (원) *
                    </label>
                    <input
                      type="number"
                      id="priceB2B"
                      name="priceB2B"
                      value={formData.priceB2B}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label htmlFor="priceB2C" className="block text-sm font-medium text-gray-700 mb-2">
                      B2C 가격 (원) *
                    </label>
                    <input
                      type="number"
                      id="priceB2C"
                      name="priceB2C"
                      value={formData.priceB2C}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label htmlFor="comparePrice" className="block text-sm font-medium text-gray-700 mb-2">
                      비교 가격 (원)
                    </label>
                    <input
                      type="number"
                      id="comparePrice"
                      name="comparePrice"
                      value={formData.comparePrice}
                      onChange={handleInputChange}
                      min="0"
                      step="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              {/* 재고 정보 */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">재고 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                      재고 수량 *
                    </label>
                    <input
                      type="number"
                      id="stockQuantity"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                      최소 재고 알림
                    </label>
                    <input
                      type="number"
                      id="lowStockThreshold"
                      name="lowStockThreshold"
                      value={formData.lowStockThreshold}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* 물리적 속성 */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">물리적 속성</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                      <Weight className="h-4 w-4 inline mr-1" />
                      Top10 순위
                    </label>
                    <select
                      id="weight"
                      name="weight"
                      value={formData.weight || "0"}
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
                    <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-2">
                      <Ruler className="h-4 w-4 inline mr-1" />
                      길이 (cm)
                    </label>
                    <input
                      type="number"
                      id="length"
                      name="length"
                      value={formData.length}
                      onChange={handleInputChange}
                      min="0"
                      step="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
                      <Ruler className="h-4 w-4 inline mr-1" />
                      너비 (cm)
                    </label>
                    <input
                      type="number"
                      id="width"
                      name="width"
                      value={formData.width}
                      onChange={handleInputChange}
                      min="0"
                      step="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                      <Ruler className="h-4 w-4 inline mr-1" />
                      높이 (cm)
                    </label>
                    <input
                      type="number"
                      id="height"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      min="0"
                      step="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              {/* 태그 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">태그</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="태그를 입력하고 Enter를 누르세요"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Tag className="h-4 w-4 mr-2" />
                    추가
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 상태 설정 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">상태 설정</h3>
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">활성 상태</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">추천 상품</span>
                    <span className="ml-2 text-xs text-gray-500">(현재: {formData.isFeatured ? '체크됨' : '체크 안됨'})</span>
                  </label>
                </div>
              </div>

              {/* 이미지 업로드 */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">이미지</h3>
                
                {/* 상품 이미지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 이미지
                  </label>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'images')}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          이미지를 클릭하여 업로드하거나 드래그 앤 드롭하세요
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF 파일 (최대 5MB)
                        </p>
                      </label>
                    </div>

                    {/* 업로드된 이미지 미리보기 */}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`상품 이미지 ${index + 1}`}
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
                    )}
                  </div>
                </div>

                {/* 설명 이미지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명 이미지
                  </label>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'descriptionImages')}
                        className="hidden"
                        id="description-image-upload"
                      />
                      <label htmlFor="description-image-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          설명용 이미지를 업로드하세요
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF 파일 (최대 5MB)
                        </p>
                      </label>
                    </div>

                    {/* 업로드된 설명 이미지 미리보기 */}
                    {formData.descriptionImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.descriptionImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`설명 이미지 ${index + 1}`}
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
                    )}
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Link href="/admin/products">
                  <Button variant="outline" type="button">
                    취소
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={!isFormValid || isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? '등록 중...' : '상품 등록'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewProductPage;
