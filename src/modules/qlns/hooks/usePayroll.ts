import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payrollApi } from '../services/payrollApi'
import { toast } from 'sonner'

export function usePayrolls(params?: any) {
  return useQuery({
    queryKey: ['payrolls', params],
    queryFn: () => payrollApi.getAll(params),
    select: (res: any) => res?.data ?? [],
  })
}

export function usePayrollDetails(id: string) {
  return useQuery({
    queryKey: ['payroll', id],
    queryFn: () => payrollApi.getById(id),
    enabled: !!id
  })
}

export function useCalculateAllPayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => payrollApi.calculateAll(data),
    onSuccess: () => {
      toast.success('Đã tính lương cho toàn bộ nhân sự')
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Có lỗi xảy ra'),
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
