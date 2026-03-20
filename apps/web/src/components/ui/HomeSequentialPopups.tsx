'use client';

import { useCallback, useState } from 'react';
import PromotionEntryPopup from '@/components/ui/PromotionEntryPopup';
import ShippingReturnGuidePopup, {
  isShippingGuideHiddenForToday,
} from '@/components/ui/ShippingReturnGuidePopup';

type HomeSequentialPopupsProps = {
  eligible: boolean;
};

/**
 * /home 진입 시: 프로모션 팝업 → 닫은 뒤 배송·반품 안내 팝업 순차 표시
 */
export default function HomeSequentialPopups({ eligible }: HomeSequentialPopupsProps) {
  const [shippingOpen, setShippingOpen] = useState(false);

  const handlePromoAfterClose = useCallback(() => {
    if (isShippingGuideHiddenForToday()) return;
    setShippingOpen(true);
  }, []);

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
