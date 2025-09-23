import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import { DialogProvider } from '@/components/ui/dialog-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FeedbackMall',
  description: '프리미엄 쇼핑몰, 피드백몰',
  openGraph: {
    title: 'FeedbackMall',
    description: '프리미엄 쇼핑몰, 피드백몰',
    url: 'https://feedbackmall.com/',
    siteName: 'FeedbackMall',
    images: [
      {
        url: 'https://feedbackmall.com/images/feedbackmall.png',
        width: 1200,
        height: 630,
        alt: 'FeedbackMall',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FeedbackMall',
    description: '프리미엄 쇼핑몰, 피드백몰',
    images: ['https://feedbackmall.com/images/feedbackmall.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // 실제 Google Search Console 코드로 교체
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* Daum 우편번호 서비스 */}
        <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <DialogProvider>
            {/* 전역 레이아웃: Header + Main Content + Footer */}
            <div className="min-h-screen flex flex-col">
              {/* 상단 헤더 */}
              <Header />
              
              {/* 메인 콘텐츠 영역 */}
              <main className="flex-1">
                {children}
              </main>
              
              {/* 하단 푸터 */}
              <Footer />
            </div>
          </DialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
