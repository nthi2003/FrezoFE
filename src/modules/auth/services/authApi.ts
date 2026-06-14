import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse } from '@/types/api.types'
import type { LoginRequest, LoginResponse } from '@/types/auth.types'

export const authApi = {
  login: (data: LoginRequest) =>
    axiosClient
      .post<ApiResponse<LoginResponse>>(API.AUTH.LOGIN, data)
      .then((res) => res.data.data),

  logout: (token: string) =>
    axiosClient
      .post<ApiResponse<void>>(API.AUTH.LOGOUT, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => res.data),

  getProfile: () =>
    axiosClient
      .get<ApiResponse<object>>(API.AUTH.PROFILE)
      .then((res) => res.data.data),

  refreshToken: (refreshToken: string) =>
    axiosClient
      .post<ApiResponse<LoginResponse>>(API.AUTH.REFRESH, null, {
        params: { refreshToken },
      })
      .then((res) => res.data.data),

  verifyOtp: (data: { username: string; otp: string }) =>
    axiosClient.post<ApiResponse<any>>(API.AUTH.VERIFY_OTP, data).then(res => res.data),

  forgotPassword: (username: string) =>
    axiosClient.post<ApiResponse<any>>(API.AUTH.FORGOT_PW, null, { params: { username } }).then(res => res.data),

  resetPassword: (data: { token: string; newPassword: string }) =>
    axiosClient.post<ApiResponse<any>>(API.AUTH.RESET_PW, data).then(res => res.data),

  getLoginHistory: (params?: { page?: number; size?: number }) =>
    axiosClient.get<ApiResponse<any[]>>(API.AUTH.LOGIN_HISTORY, { params }).then(res => res.data.data),
}
