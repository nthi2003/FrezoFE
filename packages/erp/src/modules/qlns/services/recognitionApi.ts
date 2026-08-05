// ============================================================
// QLNS Recognition / Token gift — khớp BE RecognitionController
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export interface RecognitionConfigDto {
  tokenToVnd: number
  maxGiftAmount: number
  maxRedeemAmount: number
  starterBalance: number
}

export interface TokenWalletDto {
  id: string
  personId: string
  personName?: string
  balance: number
  estimatedVnd?: number
  tokenToVnd?: number
}

export interface TokenTransferDto {
  id: string
  fromPersonId: string
  fromPersonName?: string
  toPersonId: string
  toPersonName?: string
  amount: number
  note?: string
  sourceType?: string
  sourceId?: string
  createdDate?: string
  createdBy?: string
}

export interface TokenRedeemDto {
  id: string
  personId: string
  personName?: string
  amount: number
  cashValue: number
  note?: string
  status: string
  payrollPeriodId?: string
  targetMonth?: number
  targetYear?: number
  reviewedBy?: string
  reviewedAt?: string
  rejectReason?: string
  createdDate?: string
}

export interface TokenGiftRequest {
  toPersonId: string
  amount: number
  note?: string
  sourceType?: 'MANUAL' | 'TASK'
  sourceId?: string
}

export interface TokenRedeemCreateRequest {
  amount: number
  note?: string
  catalogId?: string
}

export const recognitionApi = {
  getConfig: () =>
    axiosClient
      .get<ApiResponse<RecognitionConfigDto>>('/qlns/recognition/config')
      .then((r) => r.data.data),

  myWallet: () =>
    axiosClient
      .get<ApiResponse<TokenWalletDto>>('/qlns/recognition/wallet/me')
      .then((r) => r.data.data),

  listWallets: () =>
    axiosClient
      .get<ApiResponse<TokenWalletDto[]>>('/qlns/recognition/wallets')
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  gift: (body: TokenGiftRequest) =>
    axiosClient
      .post<ApiResponse<TokenTransferDto>>('/qlns/recognition/gift', body)
      .then((r) => r.data.data),

  listTransfers: (personId?: string) =>
    axiosClient
      .get<ApiResponse<TokenTransferDto[]>>('/qlns/recognition/transfers', {
        params: personId ? { personId } : undefined,
      })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  listRedeems: (params?: { personId?: string; status?: string }) =>
    axiosClient
      .get<ApiResponse<TokenRedeemDto[]>>('/qlns/recognition/redeem', { params })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  createRedeem: (body: TokenRedeemCreateRequest) =>
    axiosClient
      .post<ApiResponse<TokenRedeemDto>>('/qlns/recognition/redeem', body)
      .then((r) => r.data.data),

  approveRedeem: (id: string) =>
    axiosClient
      .post<ApiResponse<TokenRedeemDto>>(`/qlns/recognition/redeem/${id}/approve`)
      .then((r) => r.data.data),

  rejectRedeem: (id: string, reason?: string) =>
    axiosClient
      .post<ApiResponse<TokenRedeemDto>>(`/qlns/recognition/redeem/${id}/reject`, {
        reason,
      })
      .then((r) => r.data.data),
}
