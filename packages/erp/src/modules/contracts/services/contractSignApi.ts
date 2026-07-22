// ============================================================
// Contract e-sign OTP — khớp ContractSignController
// request-otp → {sessionId, expiresAt}
// confirm → {status, signedAt, signedBy, audit}
// GET status có sẵn
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export interface SignAudit {
  ip?: string
  device?: string
}

export interface SignStatusDto {
  contractId: string
  signed?: boolean
  status?: string
  signedAt?: string | null
  signedBy?: string | null
  sessionId?: string | null
  expiresAt?: string | null
  audit?: SignAudit
}

export interface RequestOtpResult {
  contractId: string
  sessionId: string
  expiresAt: string
  message?: string
}

export interface ConfirmSignResult {
  contractId: string
  status: string
  signedAt?: string
  signedBy?: string
  audit?: SignAudit
}

export const contractSignApi = {
  requestOtp: (contractId: string) =>
    axiosClient
      .post<ApiResponse<RequestOtpResult>>(
        `/qlns/contracts/${contractId}/sign/request-otp`,
      )
      .then((r) => r.data.data),

  confirm: (contractId: string, otp: string) =>
    axiosClient
      .post<ApiResponse<ConfirmSignResult>>(
        `/qlns/contracts/${contractId}/sign/confirm`,
        { otp },
      )
      .then((r) => r.data.data),

  status: (contractId: string) =>
    axiosClient
      .get<ApiResponse<SignStatusDto>>(
        `/qlns/contracts/${contractId}/sign/status`,
      )
      .then((r) => r.data.data),
}
