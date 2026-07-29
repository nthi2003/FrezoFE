// ============================================================
// Financial reports API — BCĐKT / KQKD
// GET /accounting/reports/balance-sheet|income-statement?from&to
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export interface ReportLineDto {
  code?: string
  label: string
  amount: number
  level?: number
}

export interface FinancialReportDto {
  from?: string
  to?: string
  lines: ReportLineDto[]
  total?: number
}

export const financialReportsApi = {
  balanceSheet: async (from: string, to: string): Promise<FinancialReportDto> => {
    const r = await axiosClient.get<ApiResponse<FinancialReportDto>>(
      '/accounting/reports/balance-sheet',
      { params: { from, to } },
    )
    return r.data.data ?? { lines: [] }
  },

  incomeStatement: async (from: string, to: string): Promise<FinancialReportDto> => {
    const r = await axiosClient.get<ApiResponse<FinancialReportDto>>(
      '/accounting/reports/income-statement',
      { params: { from, to } },
    )
    return r.data.data ?? { lines: [] }
  },
}
