# 🚀 E-commerce Bootstrap

모노레포 전자상거래 부트스트래퍼 - Next.js + NestJS + Prisma + **MySQL** 기반 10일 내 MVP 배포 수준의 뼈대 코드

## 📋 프로젝트 개요

이 프로젝트는 전자상거래 플랫폼을 위한 완전한 부트스트래퍼 솔루션입니다.  
Turborepo를 사용한 모노레포 구조로 프론트엔드(Next.js), 백엔드(NestJS), 공통 패키지들을 효율적으로 관리합니다.

## 🏗️ 아키텍처

### 기술 스택
- **프론트엔드**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui  
- **백엔드**: NestJS + Prisma + **MySQL**  
- **인증**: 카카오 OAuth + HttpOnly 세션 쿠키  
- **결제**: 카카오페이 (stub 클라이언트)  
- **캐시/세션**: Redis (Upstash)  
- **파일/이미지**: AWS S3 + CloudFront  
- **모노레포**: Turborepo + pnpm 워크스페이스  

### 프로젝트 구조
```

.
├── apps/
│   ├── web/          # Next.js 프론트엔드
│   └── api/          # NestJS 백엔드
├── packages/
│   ├── ui/           # 공통 UI 컴포넌트
│   ├── contracts/    # Zod 스키마 & OpenAPI
│   └── db/           # Prisma 스키마 & 클라이언트
├── infra/
│   └── ci/           # GitHub Actions CI/CD
└── turbo.json        # Turborepo 설정

````

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 18+  
- pnpm 8.15.4+  
- **MySQL 8.0+**  
- Redis  
- Docker (선택사항)  

### 1. 저장소 클론
```bash
git clone <repository-url>
cd ecommerce-bootstrap
````

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 환경 변수 설정

```bash
# 루트 디렉토리에 .env 파일 생성
cp .env.example .env
```

### 4. MySQL 데이터베이스 준비

```bash
# MySQL 접속
mysql -u root -p

# 개발용 DB 생성
CREATE DATABASE ecommerce_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 계정 생성 및 권한 부여 (예: 'appuser')
CREATE USER 'appuser'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON ecommerce_dev.* TO 'appuser'@'%';
FLUSH PRIVILEGES;
```


### 5. Prisma 마이그레이션 & 시드

```bash
# Prisma 마이그레이션 실행
pnpm db:migrate

# 시드 데이터 입력
pnpm db:seed
```

### 6. 개발 서버 실행

```bash
# 모든 서비스 실행 (새 터미널에서)
pnpm dev

# 또는 개별 실행
pnpm --filter @repo/api dev      # API 서버 (포트 3001)
pnpm --filter @repo/web dev      # 웹 앱 (포트 3000)
```

---

## 📚 주요 기능

### 🔐 인증 시스템

* 카카오 OAuth 로그인
* 기업/일반 사용자 역할 분기
* HttpOnly 세션 쿠키 기반 인증
* 추천인 코드 게이트

### 🛍️ 상품 관리

* B2B/B2C 가격 분기
* 카테고리 관리
* 재고 관리
* 이미지 업로드 (S3)

### 🛒 주문 시스템

* 장바구니 관리
* 주문 생성 및 관리
* 주문 상태 추적
* 배송 관리

### 💳 결제 시스템

* 카카오페이 통합
* 멱등키 처리
* 웹훅 검증
* 결제 상태 머신

### 🎯 추천인 시스템

* 추천인 코드 생성
* 할인 정책 적용
* 사용 통계 추적

### 📊 관리자 기능

* 상품/주문 관리
* 매출 통계
* 사용자 관리
* 감사 로그

---

## 🧪 테스트

### 단위 테스트

```bash
pnpm test
```

### E2E 테스트

```bash
pnpm test:e2e
```

### 부하 테스트

```bash
pnpm test:load
```

---

## 🚀 배포

### Vercel (프론트엔드)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
cd apps/web
vercel --prod
```

### Railway (백엔드)

```bash
# Railway CLI 설치
npm i -g @railway/cli

# 배포
cd apps/api
railway up
```

### 환경별 설정

* **개발**: `NODE_ENV=development`
* **스테이징**: `NODE_ENV=staging`
* **프로덕션**: `NODE_ENV=production`

---

## 📖 API 문서

개발 서버 실행 후 다음 URL에서 Swagger 문서를 확인할 수 있습니다:

* **로컬**: [http://localhost:3001/docs](http://localhost:3001/docs)
* **스테이징**: [https://api-staging.yourdomain.com/docs](https://api-staging.yourdomain.com/docs)
* **프로덕션**: [https://api.yourdomain.com/docs](https://api.yourdomain.com/docs)

---

## 🔒 보안

### 민감 정보 마스킹

* 로그에서 민감 정보 자동 마스킹
* 환경 변수 기반 설정
* 하드코딩 금지

### 인증 보안

* HttpOnly 쿠키 사용
* 세션 기반 인증
* OAuth 2.0 표준 준수

### API 보안

* Rate limiting
* CORS 설정
* Helmet 보안 헤더
* 입력 검증 (Zod)

---

## 🐛 문제 해결

### Redis 연결 실패

```bash
# Redis 서비스 상태 확인
sudo systemctl status redis

# Redis CLI로 연결 테스트
redis-cli ping
```

### 포트 충돌

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3000
lsof -i :3001

# 프로세스 종료
kill -9 <PID>
```

---

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
자세한 내용은 `LICENSE` 파일을 참조하세요.

---

## 📞 지원

* **이슈**: [GitHub Issues](https://github.com/yourusername/ecommerce-bootstrap/issues)
* **문서**: [Wiki](https://github.com/yourusername/ecommerce-bootstrap/wiki)
* **이메일**: [support@yourdomain.com](mailto:support@yourdomain.com)

---

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들을 기반으로 합니다:

* [Next.js](https://nextjs.org/)
* [NestJS](https://nestjs.com/)
* [Prisma](https://www.prisma.io/)
* [Turborepo](https://turborepo.org/)
* [shadcn/ui](https://ui.shadcn.com/)

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!
