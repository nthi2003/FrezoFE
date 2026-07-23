// ============================================================
// FREZO ERP — useLogin Hook
// Handles login mutation, token storage, navigate
// ============================================================

import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/authApi'
import { mapProfileToUser } from '../utils/mapProfileToUser'
import { useAuthStore } from '@/stores/authStore'
import type { LoginRequest } from '@frezo/types'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await authApi.login(data)
      // Set tokens immediately so axiosClient has it for getProfile()
      useAuthStore.getState().setAuth({
        user: null as any, // Temporary
        accessToken: response.token,
        refreshToken: response.refreshToken,
      })
      const rawProfile = await authApi.getProfile()
      const userProfile = mapProfileToUser(rawProfile as Record<string, unknown>)
      return { response, userProfile }
    },
    onSuccess: ({ response, userProfile }) => {
      // Finalize store with user đã bind avatarUrl từ API
      setAuth({
        user: userProfile,
        accessToken: response.token,
        refreshToken: response.refreshToken,
      })
      // Navigate to dashboard
      navigate('/', { replace: true })
    },
  })

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  }
}
