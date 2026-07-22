import { useQuery } from '@tanstack/react-query'
import { financialReportsApi } from '../services/financialReportsApi'
import { glApi } from '../services/accountingApi'
import type { FinancialReportDto, ReportLineDto } from '../services/financialReportsApi'
import type { TrialBalanceRow } from '../services/accountingApi'

/** Map trial balance → stub BCĐKT / KQKD khi report API 404. */
function mapTbToBalanceSheet(rows: TrialBalanceRow[]): FinancialReportDto {
  const assets = rows.filter((r) => /^[1]/.test(r.accountCode))
  const liabilities = rows.filter((r) => /^[2]/.test(r.accountCode))
  const equity = rows.filter((r) => /^[4]/.test(r.accountCode) || /^411/.test(r.accountCode))
  const lines: ReportLineDto[] = [
    { label: 'TÀI SẢN', amount: 0, level: 0 },
    ...assets.map((r) => ({
      code: r.accountCode,
      label: r.accountName,
      amount: (r.closingDebit || 0) - (r.closingCredit || 0),
      level: 1,
    })),
    { label: 'NỢ PHẢI TRẢ', amount: 0, level: 0 },
    ...liabilities.map((r) => ({
      code: r.accountCode,
      label: r.accountName,
      amount: (r.closingCredit || 0) - (r.closingDebit || 0),
      level: 1,
    })),
    { label: 'VỐN CHỦ SỞ HỮU', amount: 0, level: 0 },
    ...equity.map((r) => ({
      code: r.accountCode,
      label: r.accountName,
      amount: (r.closingCredit || 0) - (r.closingDebit || 0),
      level: 1,
    })),
  ]
  return { lines }
}

function mapTbToIncome(rows: TrialBalanceRow[]): FinancialReportDto {
  const revenue = rows.filter((r) => /^5/.test(r.accountCode) || /^511/.test(r.accountCode))
  const expense = rows.filter((r) => /^6/.test(r.accountCode) || /^8/.test(r.accountCode))
  const revTotal = revenue.reduce(
    (s, r) => s + ((r.periodCredit || 0) - (r.periodDebit || 0)),
    0,
  )
  const expTotal = expense.reduce(
    (s, r) => s + ((r.periodDebit || 0) - (r.periodCredit || 0)),
    0,
  )
  const lines: ReportLineDto[] = [
    { label: 'DOANH THU', amount: revTotal, level: 0 },
    ...revenue.map((r) => ({
      code: r.accountCode,
      label: r.accountName,
      amount: (r.periodCredit || 0) - (r.periodDebit || 0),
      level: 1,
    })),
    { label: 'CHI PHÍ', amount: expTotal, level: 0 },
    ...expense.map((r) => ({
      code: r.accountCode,
      label: r.accountName,
      amount: (r.periodDebit || 0) - (r.periodCredit || 0),
      level: 1,
    })),
    { label: 'LỢI NHUẬN GỘP (ước)', amount: revTotal - expTotal, level: 0 },
  ]
  return { lines, total: revTotal - expTotal }
}

export function useBalanceSheet(from?: string, to?: string) {
  return useQuery({
    queryKey: ['accounting', 'reports', 'balance-sheet', from, to],
    queryFn: async () => {
      const api = await financialReportsApi.balanceSheet(from!, to!)
      if (api?.lines?.length) return { ...api, source: 'api' as const }
      const tbRes = await glApi.trialBalance(from!, to!)
      const rows = Array.isArray(tbRes?.data) ? tbRes.data : []
      return { ...mapTbToBalanceSheet(rows), from, to, source: 'trial-balance' as const }
    },
    enabled: !!from && !!to,
  })
}

export function useIncomeStatement(from?: string, to?: string) {
  return useQuery({
    queryKey: ['accounting', 'reports', 'income-statement', from, to],
    queryFn: async () => {
      const api = await financialReportsApi.incomeStatement(from!, to!)
      if (api?.lines?.length) return { ...api, source: 'api' as const }
      const tbRes = await glApi.trialBalance(from!, to!)
      const rows = Array.isArray(tbRes?.data) ? tbRes.data : []
      return { ...mapTbToIncome(rows), from, to, source: 'trial-balance' as const }
    },
    enabled: !!from && !!to,
  })
}
