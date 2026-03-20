'use client';

import { useEffect } from 'react';

const SESSION_KEY = '__android_chrome_intent_attempted';
const CHROME_PACKAGE = 'com.android.chrome';

/**
 * 안드로이드 + 인앱 브라우저(WebView 등) 접속 시 Chrome 앱으로 동일 URL을 여는 Intent URI 리다이렉트.
 * - 동일 탭 세션에서 1회만 시도(sessionStorage)하여 무한 루프 완화
 * - NEXT_PUBLIC_DISABLE_ANDROID_CHROME_INTENT=true 이면 비활성화
 */
export default function AndroidInAppChromeIntent() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (process.env.NEXT_PUBLIC_DISABLE_ANDROID_CHROME_INTENT === 'true') {
      return;
    }

    const ua = navigator.userAgent || '';

    const isAndroid = /Android/i.test(ua);
    if (!isAndroid) return;

    // 이미 일반 Chrome(외부 브라우저) 등: Android WebView 표식 없고 알려진 인앱 UA도 아니면 스킵
    const hasWebViewMarker = /;\s*wv\)/i.test(ua);
    const knownInApp =
      /KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|Line\/|NAVER|DaumApps/i.test(ua);

    if (!hasWebViewMarker && !knownInApp) {
      return;
    }

    if (sessionStorage.getItem(SESSION_KEY)) {
      return;
    }

    sessionStorage.setItem(SESSION_KEY, '1');

    const href = window.location.href;
    const scheme = window.location.protocol.replace(':', '') || 'https';
    const pathAndHost = href.replace(/^https?:\/\//i, '');
    const fallback = encodeURIComponent(href);

    // Intent URI: 현재 URL을 Chrome 패키지로 열기 (미설치/실패 시 fallback)
    const intentUrl = `intent://${pathAndHost}#Intent;scheme=${scheme};package=${CHROME_PACKAGE};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${fallback};end`;

    window.location.replace(intentUrl);
  }, []);

  return null;
}
