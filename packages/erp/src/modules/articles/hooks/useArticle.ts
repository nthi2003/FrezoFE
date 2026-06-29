import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { articleApi } from '../services/articleApi'
import { toast } from 'sonner'

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: () => articleApi.getAll(),
    select: (res: any) => res?.data ?? [],
  })
}

export function useArticleById(id: string) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => articleApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => articleApi.create(data),
    onSuccess: () => {
      toast.success('Thêm bài viết thành công')
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
    onError: () => toast.error('Lỗi khi thêm bài viết'),
  })
}

export function useUpdateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => articleApi.update(id, data),
    onSuccess: () => {
      toast.success('Cập nhật bài viết thành công')
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
    onError: () => toast.error('Lỗi khi cập nhật bài viết'),
  })
}

export function useDeleteArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => articleApi.delete(id),
    onSuccess: () => {
      toast.success('Xóa bài viết thành công')
      qc.invalidateQueries({ queryKey: ['articles'] })
    },
    onError: () => toast.error('Lỗi khi xóa bài viết'),
  })
}
