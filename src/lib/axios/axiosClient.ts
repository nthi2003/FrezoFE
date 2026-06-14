// ============================================================
// FREZO ERP — Axios Client
// Auto attach JWT, handle 401, refresh token
// ============================================================

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { storage, STORAGE_KEYS } from '@/lib/utils/storage'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Create main axios instance
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

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN)

      if (!refreshToken) {
        // No refresh token → redirect to login
        storage.clear()
        window.location.href = '/login'
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
        storage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosClient
