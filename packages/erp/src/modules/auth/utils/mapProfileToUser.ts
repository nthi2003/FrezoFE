import type { UserProfile } from '@frezo/types'
import { resolveAvatarUrl } from './resolveAvatarUrl'

/** Raw profile từ /auth/profile (BE: avatarUrl, name, …). */
export type RawAuthProfile = Record<string, unknown>

/**
 * Bind UserProfile từ response API.
 * Avatar luôn lấy từ URL server (avatarUrl/imageUrl/…); không giữ avatar cache cũ khi server đã có URL mới / đã xoá.
 */
export function mapProfileToUser(
  raw: RawAuthProfile | null | undefined,
  prev?: UserProfile | null,
): UserProfile {
  // Avatar chỉ từ URL server — không giữ cache localStorage khi server không có / đã đổi
  const serverAvatar = resolveAvatarUrl(raw)

  return {
    id: String(raw?.id ?? prev?.id ?? ''),
    username: String(raw?.username ?? raw?.userName ?? prev?.username ?? ''),
    email: String(raw?.email ?? prev?.email ?? ''),
    fullName: String(raw?.fullName ?? raw?.name ?? prev?.fullName ?? ''),
    avatar: serverAvatar,
    roles: Array.isArray(raw?.roles)
      ? (raw!.roles as string[])
      : (prev?.roles ?? []),
    permissions: Array.isArray(raw?.permissions)
      ? (raw!.permissions as string[])
      : (prev?.permissions ?? []),
    isAdmin: Boolean(raw?.isAdmin ?? prev?.isAdmin ?? false),
  }
}
