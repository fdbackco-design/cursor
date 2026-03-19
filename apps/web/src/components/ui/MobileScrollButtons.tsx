'use client';

import { useEffect, useState } from 'react';
import { ChevronsDown, ChevronsUp } from 'lucide-react';

export default function MobileScrollButtons() {
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const updateScrollState = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;
      const threshold = 4;

      setIsAtTop(scrollTop <= threshold);
      setIsAtBottom(scrollTop + viewportHeight >= fullHeight - threshold);
    };

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      window.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="md:hidden fixed right-4 bottom-24 z-40 flex flex-col gap-2">
      <button
        type="button"
        onClick={scrollToTop}
        disabled={isAtTop}
        aria-label="최상단으로 이동"
        className="h-11 w-11 rounded-full bg-white/95 shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
      >
        <ChevronsUp className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={scrollToBottom}
        disabled={isAtBottom}
        aria-label="최하단으로 이동"
        className="h-11 w-11 rounded-full bg-white/95 shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
      >
        <ChevronsDown className="h-5 w-5" />
      </button>
    </div>
  );
}
