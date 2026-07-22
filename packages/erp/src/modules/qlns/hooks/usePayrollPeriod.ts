import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  payrollPeriodApi,
  type PayrollPeriodRequest,
} from '../services/payrollPeriodApi'

export function usePayrollPeriods(month: number, year: number) {
  return useQuery({
    queryKey: ['qlns', 'payroll-period', month, year],
    queryFn: () => payrollPeriodApi.list({ month, year }),
  })
}

export function useCreatePayrollPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PayrollPeriodRequest) => payrollPeriodApi.create(body),
    onSuccess: () => {
      toast.success('Đã tạo kỳ lương')
      qc.invalidateQueries({ queryKey: ['qlns', 'payroll-period'] })
    },
    onError: () => toast.error('Tạo kỳ lương thất bại'),
  })
}

export function useLockPayrollPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => payrollPeriodApi.lock(id),
    onSuccess: () => {
      toast.success('Đã khoá kỳ — chờ Approval')
      qc.invalidateQueries({ queryKey: ['qlns', 'payroll-period'] })
      qc.invalidateQueries({ queryKey: ['approvals'] })
    },
    onError: () => toast.error('Khoá kỳ thất bại'),
  })
}

export function useUnlockPayrollPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => payrollPeriodApi.unlock(id),
    onSuccess: () => {
      toast.success('Đã mở khoá kỳ')
      qc.invalidateQueries({ queryKey: ['qlns', 'payroll-period'] })
    },
    onError: () => toast.error('Mở khoá thất bại'),
  })
}
