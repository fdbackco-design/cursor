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
