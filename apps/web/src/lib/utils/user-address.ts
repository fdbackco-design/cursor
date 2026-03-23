/**
 * User.shippingAddress(JSON)을 표시/엑셀용 한 줄 문자열로 변환합니다.
 */
export function formatUserShippingAddressJson(addr: unknown): string {
  if (addr == null || addr === '') return '';
  if (typeof addr === 'string') {
    try {
      return formatUserShippingAddressJson(JSON.parse(addr));
    } catch {
      return addr;
    }
  }
  if (typeof addr !== 'object') return '';
  const o = addr as Record<string, unknown>;
  const zone = String(o.zone_number ?? o.zoneNumber ?? '').trim();
  const base = String(o.base_address ?? o.baseAddress ?? '').trim();
  const detail = String(o.detail_address ?? o.detailAddress ?? '').trim();
  const zipPart = zone ? `[${zone}]` : '';
  return [zipPart, base, detail].filter(Boolean).join(' ').trim();
}

export type AdminUserAddressRow = {
  zoneNumber?: string | null;
  baseAddress?: string | null;
  detailAddress?: string | null;
};

/**
 * 프로필 JSON(shippingAddress)이 없으면 저장된 배송지 1건(기본 우선)으로 표시합니다.
 */
export function formatUserAddressForAdmin(user: {
  shippingAddress?: unknown;
  addresses?: AdminUserAddressRow[] | null;
}): string {
  const fromJson = formatUserShippingAddressJson(user.shippingAddress);
  if (fromJson) return fromJson;
  const a = user.addresses?.[0];
  if (!a) return '';
  const z = String(a.zoneNumber ?? '').trim();
  const base = String(a.baseAddress ?? '').trim();
  const detail = String(a.detailAddress ?? '').trim();
  const zipPart = z ? `[${z}]` : '';
  return [zipPart, base, detail].filter(Boolean).join(' ').trim();
}
