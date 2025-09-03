import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import { DialogProvider } from '@/components/ui/dialog-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FeedbackMall - Shootmoon Ventures',
  description: '혁신적인 비즈니스 솔루션을 제공하는 벤처 기업',
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
