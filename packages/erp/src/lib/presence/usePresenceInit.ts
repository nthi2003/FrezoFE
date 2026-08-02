import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { usePresenceStore } from '@/stores/presenceStore'

/** Đồng bộ presence từ localStorage khi user đăng nhập / đổi tài khoản. */
export function usePresenceInit() {
  const username = useAuthStore((s) => s.user?.username)
  const initForUser = usePresenceStore((s) => s.initForUser)

  useEffect(() => {
    initForUser(username)
  }, [username, initForUser])
}
