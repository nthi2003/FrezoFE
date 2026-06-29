// ============================================================
// FREZO ERP — useLogin Hook
// Handles login mutation, token storage, navigate
// ============================================================

import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/authApi'
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
      const userProfile = await authApi.getProfile()
      return { response, userProfile }
    },
    onSuccess: ({ response, userProfile }) => {
      // Finalize store with real user
      setAuth({
        user: userProfile as any,
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
