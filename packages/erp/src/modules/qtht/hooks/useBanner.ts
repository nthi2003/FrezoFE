import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bannerApi } from '../services/bannerApi'
import { toast } from 'sonner'

export function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: () => bannerApi.getAll(),
    select: (res: any) => res?.data ?? [],
  })
}

export function useCreateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => bannerApi.create(data),
    onSuccess: () => {
      toast.success('Thêm banner thành công')
      qc.invalidateQueries({ queryKey: ['banners'] })
    },
    onError: () => toast.error('Lỗi khi thêm banner'),
  })
}

export function useUpdateBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => bannerApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật banner thành công')
      qc.invalidateQueries({ queryKey: ['banners'] })
    },
    onError: () => toast.error('Lỗi khi cập nhật banner'),
  })
}

export function useDeleteBanner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => bannerApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa banner thành công')
      qc.invalidateQueries({ queryKey: ['banners'] })
    },
    onError: () => toast.error('Lỗi khi xóa banner'),
  })
}
