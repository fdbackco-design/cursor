'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Channel?: {
        chat: (params: { channelPublicId: string }) => void;
      };
    };
  }
}

const KAKAO_SCRIPT_ID = 'kakao-js-sdk';
const CHANNEL_PUBLIC_ID = '_xiBPkn';

export default function MobileKakaoChannelButton() {
  const kakaoJsKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

  useEffect(() => {
    if (!kakaoJsKey) {
      console.warn('NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY가 설정되지 않았습니다.');
      return undefined;
    }

    let cleanup: (() => void) | undefined;

    const initKakao = () => {
      if (!window.Kakao) return;
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(kakaoJsKey);
      }
    };

    if (window.Kakao) {
      initKakao();
      return;
    }

    const existing = document.getElementById(KAKAO_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', initKakao);
      cleanup = () => existing.removeEventListener('load', initKakao);
      return cleanup;
    }

    const script = document.createElement('script');
    script.id = KAKAO_SCRIPT_ID;
    script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
    script.async = true;
    script.onload = initKakao;
    document.head.appendChild(script);

    return () => cleanup?.();
  }, [kakaoJsKey]);

  const handleOpenKakaoChannel = () => {
    try {
      if (window.Kakao?.Channel) {
        window.Kakao.Channel.chat({ channelPublicId: CHANNEL_PUBLIC_ID });
        return;
      }
    } catch (error) {
      console.error('카카오 채널 열기 실패:', error);
    }

    window.open(`https://pf.kakao.com/${CHANNEL_PUBLIC_ID}/chat`, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleOpenKakaoChannel}
      aria-label="카카오톡 채널 문의"
      className="md:hidden fixed right-4 bottom-[12.5rem] z-40 h-11 w-11 rounded-full bg-white shadow-lg border border-yellow-300 overflow-hidden active:scale-95 transition"
    >
      <img
        src="/images/kakao-channel.png"
        alt="카카오톡 채널"
        className="h-full w-full object-cover"
      />
    </button>
  );
}
