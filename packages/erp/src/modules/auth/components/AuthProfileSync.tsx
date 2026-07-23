import { useSyncAuthProfile } from '../hooks/useSyncAuthProfile'

/** Mount trong AppProviders — bind avatar/profile từ API khi đã đăng nhập. */
export function AuthProfileSync() {
  useSyncAuthProfile()
  return null
}
