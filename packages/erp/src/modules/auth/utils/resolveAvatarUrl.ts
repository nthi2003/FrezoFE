/**
 * Priority SME: URL ảnh từ auth user / API trước.
 * `avatar` (store sau login) là fallback cuối — không chờ localStorage async.
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
