/**
 * Priority SME: URL ảnh từ API/person trước, không lấy localStorage làm nguồn chính.
 * `avatar` (legacy store) chỉ là fallback cuối.
 */
export function resolveAvatarUrl(source: unknown): string | undefined {
  if (!source || typeof source !== 'object') return undefined
  const s = source as Record<string, unknown>
  const candidates = [s.avatarUrl, s.imageUrl, s.photoUrl, s.photo, s.avatar]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return undefined
}
