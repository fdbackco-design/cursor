import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/products/product-detail';
import { productsApi } from '@/lib/api/products';
import { Product } from '@/types/product';
import { getImageUrl } from '@/lib/utils/image';

interface ProductPageProps {
  params: {
    id: string;
  };
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const product = await productsApi.getProductById(params.id);
    
    if (!product) {
      return {
        title: '상품을 찾을 수 없습니다 - FeedbackMall',
        description: '요청하신 상품이 존재하지 않습니다.',
      };
    }

    const productImage = product.images && product.images.length > 0 
      ? getImageUrl(product.images[0]) 
      : 'https://feedbackmall.com/images/feedbackmall.png';

    return {
      title: `${product.name} - FeedbackMall`,
      description: product.shortDescription || product.description || '프리미엄 쇼핑몰, 피드백몰',
      openGraph: {
        title: `${product.name} - FeedbackMall`,
        description: product.shortDescription || product.description || '프리미엄 쇼핑몰, 피드백몰',
        url: `https://feedbackmall.com/products/${product.id}`,
        siteName: 'FeedbackMall',
        images: [
          {
            url: productImage,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
        locale: 'ko_KR',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} - FeedbackMall`,
        description: product.shortDescription || product.description || '프리미엄 쇼핑몰, 피드백몰',
        images: [productImage],
      },
    };
  } catch (error) {
    console.error('메타데이터 생성 실패:', error);
    return {
      title: '상품 - FeedbackMall',
      description: '프리미엄 쇼핑몰, 피드백몰',
    };
  }
}

// 캐시 비활성화 - 상품 정보가 자주 변경될 수 있으므로
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    // 캐시 버스팅을 위해 타임스탬프 추가
    const product = await productsApi.getProductById(params.id);
    
    if (!product) {
      notFound();
    }

    // 디버깅: 상품 이미지 확인
    console.log('[상품 상세 페이지] 로드된 상품 이미지:', {
      productId: product.id,
      imagesCount: product.images?.length || 0,
      firstImage: product.images?.[0] ? {
        s3Key: (product.images[0] as any)?.s3Key,
        cdnUrl: (product.images[0] as any)?.cdnUrl
      } : null
    });

    return (
      <div className="container mx-auto px-4 py-8">
        <ProductDetail product={product} />
      </div>
    );
  } catch (error) {
    console.error('상품 로드 실패:', error);
    notFound();
  }
}
