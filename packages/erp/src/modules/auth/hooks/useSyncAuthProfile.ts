// Sync user profile (avatarUrl → avatar) từ /auth/profile sau login / reload.
// localStorage chỉ nhận cache SAU khi đã bind từ server — không dùng cache làm nguồn chính.

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../services/authApi'
import { mapProfileToUser } from '../utils/mapProfileToUser'
import { useAuthStore } from '@/stores/authStore'

export function useSyncAuthProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)
  const userId = useAuthStore((s) => s.user?.id)
  const username = useAuthStore((s) => s.user?.username)

  const { data } = useQuery({
    queryKey: ['auth-profile', userId || username],
    queryFn: () => authApi.getProfile(),
    enabled: isAuthenticated && !!accessToken,
    staleTime: 60_000,
    refetchOnMount: true,
  })

  useEffect(() => {
    if (!data) return
    const prev = useAuthStore.getState().user
    setUser(mapProfileToUser(data as Record<string, unknown>, prev))
  }, [data, setUser])
}
