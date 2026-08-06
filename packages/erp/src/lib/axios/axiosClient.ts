// ============================================================
// FREZO ERP — Axios Client
// Auto attach JWT, handle 401 (refresh token), handle 403 (toast)
// ============================================================

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { toast as sonnerToast } from 'sonner'
import { storage, STORAGE_KEYS } from '@frezo/utils'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Extend Axios request config để cho phép opt-out các default behaviors.
 * Dùng: `axiosClient.get('/x', { skipForbiddenToast: true })`
 */
declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Không show toast khi response 403. Dùng cho request "probe" quyền. */
    skipForbiddenToast?: boolean
    /**
     * Không chạy flow refresh-token / redirect-to-login khi response 401.
     * Bắt buộc dùng cho các endpoint public/auth (login, register, forgot-password)
     * — nếu không, 401 từ chính /auth/login sẽ trigger redirect vô hạn.
     */
    skipAuthRefresh?: boolean
  }
}

/**
 * Các endpoint AUTH không cần refresh-token flow.
 * Match bằng `endsWith` để không phụ thuộc baseURL (/api prefix, absolute URL v.v.).
 */
const AUTH_PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh-token',
  '/auth/verify-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
] as const

function isAuthPublicEndpoint(url?: string): boolean {
  if (!url) return false
  return AUTH_PUBLIC_ENDPOINTS.some((ep) => url.endsWith(ep))
}

/** Session bị thu hồi / refresh thất bại — hiện toast trên màn login sau redirect. */
export const SESSION_REVOKED_KEY = 'frezo_session_revoked'

function forceLogout(sessionRevoked = false) {
  if (sessionRevoked) {
    try {
      sessionStorage.setItem(SESSION_REVOKED_KEY, '1')
    } catch {
      /* ignore quota / private mode */
    }
  }
  storage.clear()
  window.location.href = '/login'
}

const axiosClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// ---- REQUEST INTERCEPTOR: Attach Bearer token ----
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN)
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ---- RESPONSE INTERCEPTOR: Handle 401, errors ----
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // ---- 403 Forbidden: user thiếu quyền — show toast (trừ khi opt-out) ----
    if (status === 403 && !originalRequest?.skipForbiddenToast) {
      const message =
        error.response?.data?.message ||
        'Bạn không có quyền thực hiện thao tác này.'
      sonnerToast.error(message)
    }

    // If 401 and not already retrying
    // Skip cho các endpoint public/auth — nếu không, 401 từ /auth/login (sai mật khẩu)
    // sẽ trigger clear storage + reload page thay vì để useMutation.onError chạy.
    const shouldSkipAuthRefresh =
      originalRequest?.skipAuthRefresh || isAuthPublicEndpoint(originalRequest?.url)

    if (status === 401 && !shouldSkipAuthRefresh) {
      // Retry vẫn 401 (session bị thu hồi / refresh thất bại) → logout ngay
      if (originalRequest._retry) {
        forceLogout(true)
        return Promise.reject(error)
      }

      const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN)

      if (!refreshToken) {
        forceLogout(true)
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          return axiosClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          null,
          { params: { refreshToken } }
        )

        const newToken = response.data.data?.token || response.data.data?.accessToken
        storage.set(STORAGE_KEYS.ACCESS_TOKEN, newToken)
        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

        processQueue(null, newToken)
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return axiosClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        forceLogout(true)
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosClient
