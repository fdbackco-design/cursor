'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'fm_promotion_popup_hide_date';
/** 같은 브라우저 탭에서 /home 최초 진입 1회만 팝업 (로그인 후 첫 리다이렉트에 해당) */
const SESSION_FIRST_HOME_KEY = 'fm_home_entry_promo_shown';

function getLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isHiddenForToday(): boolean {
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

type PromotionEntryPopupProps = {
  /** 로그인·승인된 사용자가 /home 본문을 볼 때만 true */
  eligible: boolean;
  /** 열림/닫힘 상태 (순차 팝업용) */
  onOpenChange?: (open: boolean) => void;
  /** 닫힌 직후 1회 (열었다가 닫았을 때만 호출) */
  onAfterClose?: () => void;
};

/**
 * 당근/회원가입 쿠폰 안내 팝업 — /home에서만 사용.
 * 로그인 전에는 마운트하지 않음. 같은 탭에서 /home 첫 진입 시에만 표시(sessionStorage).
 */
export default function PromotionEntryPopup({
  eligible,
  onOpenChange,
  onAfterClose,
}: PromotionEntryPopupProps) {
  const [open, setOpen] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !eligible) {
      setOpen(false);
      return;
    }
    if (isHiddenForToday()) return;
    try {
      if (sessionStorage.getItem(SESSION_FIRST_HOME_KEY) === '1') return;
      // 같은 탭에서 /home 최초 1회만 노출(리다이렉트 직후 포함). 표시 직전에 소비 처리.
      sessionStorage.setItem(SESSION_FIRST_HOME_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(true);
  }, [eligible]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    onOpenChange?.(open);
    if (prevOpenRef.current && !open) {
      onAfterClose?.();
    }
    prevOpenRef.current = open;
  }, [open, onOpenChange, onAfterClose]);

  const dismiss = useCallback(() => {
    if (dontShowToday) {
      saveHideForToday();
    }
    setOpen(false);
  }, [dontShowToday]);

  const handleCtaClick = useCallback(() => {
    setOpen(false);
  }, []);

  if (!eligible || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-popup-title"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-hidden
        onClick={dismiss}
      />

      <div className="relative w-full max-w-[min(100%,24rem)] sm:max-w-md md:max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition hover:bg-white hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          aria-label="팝업 닫기"
        >
          <X className="h-5 w-5" strokeWidth={2.2} />
        </button>

        <div className="relative w-full bg-white pt-2 px-2 sm:pt-3 sm:px-3">
          <span id="promotion-popup-title" className="sr-only">
            회원가입 축하 쿠폰 안내
          </span>
          <div className="relative w-full overflow-hidden rounded-xl bg-white">
            <Image
              src="/images/promotion-entry-popup.png"
              alt="회원가입 축하 1만원 할인 쿠폰 즉시 지급 안내"
              width={720}
              height={1280}
              className="h-auto w-full object-contain"
              sizes="(max-width: 768px) 100vw, 28rem"
              priority
            />
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          <button
            type="button"
            onClick={handleCtaClick}
            className="flex w-full flex-col items-center justify-center rounded-xl bg-[#FF7E36] px-4 py-3.5 text-center text-white shadow-md transition hover:bg-[#f56f28] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
            aria-label="다음 안내로 이동"
          >
            <span className="text-base font-bold sm:text-lg">쿠폰 사용하러 가기</span>
            <span className="mt-0.5 text-xs font-medium text-white/90 sm:text-sm">
              (전체 상품 보기)
            </span>
          </button>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-x-3 gap-y-2 text-sm text-gray-600">
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#FF7E36] focus:ring-orange-400"
              />
              <span>오늘 하루 보지 않기</span>
            </label>
            <span className="hidden h-4 w-px bg-gray-200 sm:inline-block" aria-hidden />
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
