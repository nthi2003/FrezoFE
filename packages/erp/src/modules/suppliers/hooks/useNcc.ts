import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { unwrapList } from '@frezo/utils'
import { nccApi } from '@/modules/customers/services/customerApi'

// Query keys
export const NCC_KEYS = {
  all: ['ncc'] as const,
  list: (params?: any) => ['ncc', 'list', params] as const,
  detail: (id: string) => ['ncc', 'detail', id] as const,
}

export function useNccList(params?: any) {
  return useQuery({
    queryKey: NCC_KEYS.list(params),
    queryFn: () => nccApi.getAll(),
    // NCC endpoint không hỗ trợ search server-side qua params trực tiếp trong hooks hiện tại
    // → tạm thời lấy toàn bộ, filter client-side ở component. Nếu list rất lớn (>1k) sẽ đổi sau.
    select: unwrapList,
  })
}

export function useNccDetail(id: string | null) {
  return useQuery({
    queryKey: NCC_KEYS.detail(id || ''),
    queryFn: () => nccApi.getById(id!),
    enabled: !!id,
    select: (res: any) => res?.data ?? res,
  })
}

export function useCreateNcc() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => nccApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NCC_KEYS.all })
      toast.success('Đã tạo nhà cung cấp')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || 'Lỗi tạo NCC'),
  })
}

export function useUpdateNcc() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => nccApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NCC_KEYS.all })
      toast.success('Đã cập nhật NCC')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || 'Lỗi cập nhật NCC'),
  })
}

export function useDeleteNcc() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => nccApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NCC_KEYS.all })
      toast.success('Đã xoá NCC')
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || 'Lỗi xoá NCC'),
  })
}
