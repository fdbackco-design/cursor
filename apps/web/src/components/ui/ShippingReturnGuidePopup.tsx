'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  clearPostLoginRedirect,
  getPostLoginRedirectOrHome,
} from '@/lib/utils/safe-redirect';

const STORAGE_KEY = 'fm_shipping_guide_popup_hide_date';

function getLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isShippingGuideHiddenForToday(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    return saved === getLocalDateKey(new Date());
  } catch {
    return false;
  }
}

function saveHideForToday(): void {
  try {
    localStorage.setItem(STORAGE_KEY, getLocalDateKey(new Date()));
  } catch {
    /* ignore */
  }
}

type ShippingReturnGuidePopupProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * 배송·반품 안내 순차 팝업 — 이미지 / 흰 버튼 / 하단 액션 영역 분리
 */
export default function ShippingReturnGuidePopup({ open, onClose }: ShippingReturnGuidePopupProps) {
  const router = useRouter();
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const goSavedOrHome = useCallback(() => {
    const dest = getPostLoginRedirectOrHome();
    clearPostLoginRedirect();
    router.push(dest);
  }, [router]);

  const dismiss = useCallback(() => {
    if (dontShowToday) {
      saveHideForToday();
    }
    onClose();
    goSavedOrHome();
  }, [dontShowToday, onClose, goSavedOrHome]);

  const handleConfirm = useCallback(() => {
    if (dontShowToday) {
      saveHideForToday();
    }
    onClose();
    goSavedOrHome();
  }, [dontShowToday, onClose, goSavedOrHome]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shipping-guide-popup-title"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-hidden
        onClick={dismiss}
      />

      <div className="relative flex max-h-[min(92dvh,900px)] w-full max-w-[min(100%,24rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-w-md md:max-w-lg">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition hover:bg-white hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          aria-label="팝업 닫기"
        >
          <X className="h-5 w-5" strokeWidth={2.2} />
        </button>

        {/* 이미지 영역 — 비율 유지 */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/80 px-2 pb-2 pt-10 sm:px-3 sm:pb-3 sm:pt-11">
          <span id="shipping-guide-popup-title" className="sr-only">
            피드백몰 배송 및 반품 안내
          </span>
          <div className="overflow-hidden rounded-xl bg-white">
            <Image
              src="/images/shipping-return-guide-popup.png"
              alt="피드백몰 배송 및 반품 안내 — 배송비 무료, 단순 변심 시 왕복 배송비 고객 부담 등"
              width={720}
              height={1280}
              className="h-auto w-full object-contain"
              sizes="(max-width: 768px) 100vw, 28rem"
            />
          </div>
        </div>

        {/* 흰색 메인 버튼 영역 */}
        <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-4 sm:px-5 sm:py-5">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-center text-base font-semibold text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 sm:py-4 sm:text-lg"
          >
            내용을 확인했습니다
          </button>
        </div>

        {/* 하단 액션 — 회색 바 */}
        <div className="shrink-0 border-t border-gray-200 bg-gray-100 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 text-sm text-gray-600">
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <span>오늘 하루 보지 않기</span>
            </label>
            <span className="hidden h-4 w-px bg-gray-300 sm:inline-block" aria-hidden />
            <button
              type="button"
              onClick={dismiss}
              className="font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
