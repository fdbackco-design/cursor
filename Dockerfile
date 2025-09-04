# --- builder ---
    FROM node:20-bookworm-slim AS builder
    WORKDIR /app
    RUN corepack enable
    
    # 모노레포 메타만 우선 복사 → 설치 캐시 최적화
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
    COPY apps/api/package.json apps/api/package.json
    COPY packages ./packages
    
    # 의존성 설치
    RUN pnpm i --frozen-lockfile -w
    
    # 소스 복사
    COPY . .
    
    # 빌드 (api만)
    RUN pnpm -w build --filter @repo/api
    # Prisma Client 생성
    RUN pnpm -w --filter @repo/api prisma:generate
    
    # --- runner ---
    FROM node:20-bookworm-slim AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    
    # 런타임 파일만 복사 (node_modules 포함)
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/apps/api/dist ./apps/api/dist
    COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
    COPY --from=builder /app/prisma ./prisma
    
    # 포트
    ENV PORT=3000
    EXPOSE 3000
    
    # 시작
    CMD ["node", "apps/api/dist/main.js"]

    