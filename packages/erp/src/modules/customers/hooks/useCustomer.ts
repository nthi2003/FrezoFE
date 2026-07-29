import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unwrapList } from '@frezo/utils'
import { customerApi } from '../services/customerApi'
import { toast } from '@/lib/toast'

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => customerApi.getAll(),
    select: unwrapList,
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
    onError: (err) => toast.apiError(err, 'Lỗi khi thêm khách hàng'),
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
    onError: (err) => toast.apiError(err, 'Lỗi khi cập nhật khách hàng'),
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
    onError: (err) => toast.apiError(err, 'Lỗi khi xóa khách hàng'),
  })
}

export function useUploadCustomerAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      customerApi.uploadAvatar(id, file),
    onSuccess: (_url, { id }) => {
      toast.success('Đã cập nhật avatar')
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer', id] })
    },
    onError: (err) => toast.apiError(err, 'Upload avatar thất bại'),
  })
}
