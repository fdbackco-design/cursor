import Link from 'next/link';
import { Button } from '@repo/ui';
import { ArrowRight, ShoppingBag, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            전자상거래의 새로운 시작
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Next.js, NestJS, Prisma로 구축된 현대적인 전자상거래 플랫폼으로 
            빠르고 안전한 온라인 쇼핑을 경험하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="text-lg px-8 py-4">
                상품 둘러보기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/signin">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">주요 기능</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">상품 관리</h3>
              <p className="text-muted-foreground">
                B2B/B2C 가격 분기, 재고 관리, 카테고리 분류 등 
                체계적인 상품 관리 시스템
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">보안 인증</h3>
              <p className="text-muted-foreground">
                카카오 OAuth 기반 안전한 로그인, 
                HttpOnly 쿠키로 보안 강화
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">빠른 결제</h3>
              <p className="text-muted-foreground">
                카카오페이 통합, 멱등키 처리로 
                안전하고 빠른 결제 시스템
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl mb-8 opacity-90">
            10일 내 MVP 배포가 가능한 완벽한 기반을 제공합니다
          </p>
          <Link href="/signin">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              무료로 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
