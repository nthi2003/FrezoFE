import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unwrapList } from '@frezo/utils'
import { payrollApi } from '../services/payrollApi'
import { toast } from 'sonner'

export function usePayrolls(params?: any) {
  return useQuery({
    queryKey: ['payrolls', params],
    queryFn: () => payrollApi.getAll(params),
    select: unwrapList,
  })
}

export function usePayrollDetails(id: string) {
  return useQuery({
    queryKey: ['payroll', id],
    queryFn: () => payrollApi.getById(id),
    enabled: !!id
  })
}

/**
 * Tính lương toàn bộ nhân sự cho 1 kỳ.
 * KHÔNG show toast — caller (PayrollsPage) sẽ render `PayrollCalculateModal`
 * với summary chi tiết ở stage RESULT thay vì toast text ngắn.
 * Error cũng để caller hiển thị inline ở stage CONFIRM (không toast bay ngang).
 */
export function useCalculateAllPayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { month: number; year: number }) => payrollApi.calculateAll(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    },
  })
}

export function useBonusPayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => payrollApi.bonus(id, data),
    onSuccess: () => {
      toast.success('Đã thêm thưởng/phụ cấp')
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    },
  })
}

export function useConfirmPayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => payrollApi.confirm(id),
    onSuccess: () => {
      toast.success('Đã xác nhận bảng lương')
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    },
  })
}

export function usePayPayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => payrollApi.pay(id),
    onSuccess: () => {
      toast.success('Đã thanh toán lương')
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    },
  })
}

/**
 * Tính lương cho 1 nhân viên cụ thể.
 * Cùng lý do với `useCalculateAllPayroll`: caller render popup summary,
 * không auto toast (tránh 2 UI trùng nhau).
 */
export function useCalculatePersonPayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ personId, data }: { personId: string; data: { month: number; year: number } }) =>
      payrollApi.calculatePerson(personId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    },
  })
}
