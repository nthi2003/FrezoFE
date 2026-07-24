import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryApi } from '../services/categoryApi'
import { toast } from '@/lib/toast'

export function useCategories(groupCode?: string) {
  return useQuery({
    queryKey: ['categories', groupCode],
    queryFn: () =>
      categoryApi.getAll(
        groupCode ? { groupCode, pageNumber: 1, pageSize: 200 } : { pageNumber: 1, pageSize: 200 },
      ),
    select: (res: any) => res?.data?.items ?? [],
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => categoryApi.create(data),
    onSuccess: () => {
      toast.success('Thêm danh mục thành công')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    // code.exist / name.exist: hiện nguyên message từ BE, không toast generic
    onError: (err) => toast.apiError(err, 'Lỗi khi thêm danh mục'),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => categoryApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật danh mục thành công')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err) => toast.apiError(err, 'Lỗi khi cập nhật danh mục'),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa danh mục thành công')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err) => toast.apiError(err, 'Lỗi khi xóa danh mục'),
  })
}
