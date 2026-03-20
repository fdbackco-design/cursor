/**
 * 로그인 후 이동용 상대 경로만 허용 (오픈 리다이렉트 방지)
 */
export function sanitizePostLoginPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s.startsWith('/') || s.startsWith('//')) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) return null;
  if (s.length > 2048) return null;
  return s;
}

/** signin 등에서 저장 — 홈 순차 팝업 닫을 때 원래 복귀 경로로 이동 */
export const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect';

export function getPostLoginRedirectOrHome(): string {
  if (typeof window === 'undefined') return '/home';
  try {
    const raw = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    const safe = sanitizePostLoginPath(raw);
    return safe ?? '/home';
  } catch {
    return '/home';
  }
}

export function clearPostLoginRedirect(): void {
  try {
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  } catch {
    /* ignore */
  }
}
