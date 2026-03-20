'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import PromotionEntryPopup from '@/components/ui/PromotionEntryPopup';
import ShippingReturnGuidePopup, {
  isShippingGuideHiddenForToday,
} from '@/components/ui/ShippingReturnGuidePopup';
import {
  clearPostLoginRedirect,
  getPostLoginRedirectOrHome,
} from '@/lib/utils/safe-redirect';

type HomeSequentialPopupsProps = {
  eligible: boolean;
};

/**
 * /home 진입 시: 프로모션 팝업 → 닫은 뒤 배송·반품 안내 팝업 순차 표시
 * 두 번째 팝업이 스킵되면(오늘 하루 숨김) 프로모션 직후에만 post_login_redirect로 이동
 */
export default function HomeSequentialPopups({ eligible }: HomeSequentialPopupsProps) {
  const router = useRouter();
  const [shippingOpen, setShippingOpen] = useState(false);

  const handlePromoAfterClose = useCallback(() => {
    if (isShippingGuideHiddenForToday()) {
      const dest = getPostLoginRedirectOrHome();
      clearPostLoginRedirect();
      router.push(dest);
      return;
    }
    setShippingOpen(true);
  }, [router]);

  const handleShippingClose = useCallback(() => {
    setShippingOpen(false);
  }, []);

  return (
    <>
      <PromotionEntryPopup eligible={eligible} onAfterClose={handlePromoAfterClose} />
      <ShippingReturnGuidePopup open={shippingOpen} onClose={handleShippingClose} />
    </>
  );
}
