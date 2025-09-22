import { Metadata } from 'next';

export const homeMetadata: Metadata = {
  title: 'FeedbackMall - 프리미엄 쇼핑몰',
  description: '프리미엄 쇼핑몰, 피드백몰에서 최고의 상품을 만나보세요',
  openGraph: {
    title: 'FeedbackMall - 프리미엄 쇼핑몰',
    description: '프리미엄 쇼핑몰, 피드백몰에서 최고의 상품을 만나보세요',
    url: 'https://feedbackmall.com/home',
    siteName: 'FeedbackMall',
    images: [
      {
        url: 'https://feedbackmall.com/feedbackmall.png',
        width: 1200,
        height: 630,
        alt: 'FeedbackMall - 프리미엄 쇼핑몰',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FeedbackMall - 프리미엄 쇼핑몰',
    description: '프리미엄 쇼핑몰, 피드백몰에서 최고의 상품을 만나보세요',
    images: ['https://feedbackmall.com/feedbackmall.png'],
  },
};
