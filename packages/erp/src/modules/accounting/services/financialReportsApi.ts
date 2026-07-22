// ============================================================
// Financial reports API — BCTC stub
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

async function tolerantReport(
  path: string,
  from: string,
  to: string,
): Promise<FinancialReportDto | null> {
  try {
    const r = await axiosClient.get<ApiResponse<FinancialReportDto>>(path, {
      params: { from, to },
    })
    return r.data.data ?? null
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404 || status === 501) return null
    throw err
  }
}

export const financialReportsApi = {
  balanceSheet: (from: string, to: string) =>
    tolerantReport('/accounting/reports/balance-sheet', from, to),

  incomeStatement: (from: string, to: string) =>
    tolerantReport('/accounting/reports/income-statement', from, to),
}
