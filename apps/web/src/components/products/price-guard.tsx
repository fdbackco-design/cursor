"use client";

import { useEffect, useState } from "react";

type Role = "consumer" | "corporate" | "admin" | undefined;

type Props = {
  productId: number;
  role?: Role; // 서버에서 내려주는 사용자 역할(SSR 프롭 또는 컨텍스트)
  fallbackText?: string; // 로그인 전 문구 커스터마이즈
};

export default function PriceGuard({ productId, role, fallbackText = "로그인 후 가격 확인" }: Props) {
  const [price, setPrice] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!role);

  useEffect(() => {
    if (!role || role === "admin") return; // admin은 소비자/기업가를 직접 선택한 페이지에서만 노출
    setLoading(true);
    fetch(`/api/products/${productId}/price?tier=${role}`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("failed to load price");
        return res.json();
      })
      .then((data: { priceFormatted: string }) => setPrice(data.priceFormatted))
      .catch(() => setPrice(null))
      .finally(() => setLoading(false));
  }, [productId, role]);

  if (!role || role === "admin") return <span className="text-gray-400">{fallbackText}</span>;
  if (loading) return <span className="text-gray-400">가격 불러오는 중…</span>;
  if (!price) return <span className="text-gray-400">{fallbackText}</span>;

  return <span className="font-semibold">{price}</span>;
}