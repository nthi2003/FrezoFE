import axiosClient from '@/lib/axios/axiosClient'
import { API } from '@/lib/axios/apiEndpoints'
import type { ApiResponse } from '@frezo/types'
import type { LoginRequest, LoginResponse } from '@frezo/types'

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

  /** 2FA login — BE expect query params username + code */
  verifyOtp: (data: { username: string; otp: string }) =>
    axiosClient
      .post<ApiResponse<LoginResponse>>(API.AUTH.VERIFY_OTP, null, {
        params: { username: data.username, code: data.otp },
      })
      .then((res) => res.data),

  /** Gửi OTP quên mật khẩu về email */
  forgotPassword: (email: string) =>
    axiosClient
      .post<ApiResponse<void>>(API.AUTH.FORGOT_PW, null, { params: { email } })
      .then((res) => res.data),

  /** Đặt lại mật khẩu bằng OTP (param key = mã OTP 6 số) */
  resetPassword: (data: { key: string; newPassword: string }) =>
    axiosClient
      .post<ApiResponse<void>>(API.AUTH.RESET_PW, null, {
        params: { key: data.key, newPassword: data.newPassword },
      })
      .then((res) => res.data),

  getLoginHistory: (params?: { page?: number; size?: number }) =>
    axiosClient.get<ApiResponse<any[]>>(API.AUTH.LOGIN_HISTORY, { params }).then(res => res.data.data),
}
