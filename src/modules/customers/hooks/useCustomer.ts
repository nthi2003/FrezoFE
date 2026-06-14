import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerApi } from '../services/customerApi'
import { toast } from 'sonner'

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => customerApi.getAll(),
    select: (res: any) => res?.data ?? [],
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => customerApi.create(data),
    onSuccess: () => {
      toast.success('Thêm khách hàng thành công')
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: () => toast.error('Lỗi khi thêm khách hàng'),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => customerApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật khách hàng thành công')
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: () => toast.error('Lỗi khi cập nhật khách hàng'),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customerApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa khách hàng thành công')
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: () => toast.error('Lỗi khi xóa khách hàng'),
  })
}
