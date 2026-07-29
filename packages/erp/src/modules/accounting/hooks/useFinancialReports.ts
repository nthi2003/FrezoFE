import { useQuery } from '@tanstack/react-query'
import { financialReportsApi } from '../services/financialReportsApi'

export function useBalanceSheet(from?: string, to?: string) {
  return useQuery({
    queryKey: ['accounting', 'reports', 'balance-sheet', from, to],
    queryFn: () => financialReportsApi.balanceSheet(from!, to!),
    enabled: !!from && !!to,
  })
}

export function useIncomeStatement(from?: string, to?: string) {
  return useQuery({
    queryKey: ['accounting', 'reports', 'income-statement', from, to],
    queryFn: () => financialReportsApi.incomeStatement(from!, to!),
    enabled: !!from && !!to,
  })
}
