import type { UserProfile } from '@frezo/types'
import { resolveAvatarUrl } from './resolveAvatarUrl'

/** Raw profile từ /auth/profile (BE: avatarUrl, name, …). */
export type RawAuthProfile = Record<string, unknown>

/**
 * Bind UserProfile từ response API.
 * Avatar lấy từ URL server (avatarUrl/imageUrl/…); khi server không trả URL thì giữ prev (cache login)
 * để Header không mất ảnh trong lúc chờ / giữa các lần sync.
 */
export function mapProfileToUser(
  raw: RawAuthProfile | null | undefined,
  prev?: UserProfile | null,
): UserProfile {
  const serverAvatar = resolveAvatarUrl(raw)
  // Có URL server → dùng; không có → giữ prev (đã persist sau login); chỉ xoá khi raw rõ ràng null avatar fields
  const hasAvatarField =
    raw != null &&
    ('avatarUrl' in raw ||
      'imageUrl' in raw ||
      'photoUrl' in raw ||
      'photo' in raw ||
      'avatar' in raw)
  const avatar =
    serverAvatar ??
    (hasAvatarField ? undefined : resolveAvatarUrl(prev) ?? prev?.avatar)

  const personIdRaw = raw?.personId ?? prev?.personId
  const personId =
    personIdRaw != null && String(personIdRaw).trim() !== ''
      ? String(personIdRaw)
      : undefined

  return {
    id: String(raw?.id ?? prev?.id ?? ''),
    username: String(raw?.username ?? raw?.userName ?? prev?.username ?? ''),
    email: String(raw?.email ?? prev?.email ?? ''),
    fullName: String(raw?.fullName ?? raw?.name ?? prev?.fullName ?? ''),
    avatar,
    personId,
    roles: Array.isArray(raw?.roles)
      ? (raw!.roles as string[])
      : (prev?.roles ?? []),
    permissions: Array.isArray(raw?.permissions)
      ? (raw!.permissions as string[])
      : (prev?.permissions ?? []),
    isAdmin: Boolean(raw?.isAdmin ?? prev?.isAdmin ?? false),
  }
}
