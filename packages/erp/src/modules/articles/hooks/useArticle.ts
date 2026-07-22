import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unwrapList } from '@frezo/utils'
import { articleApi } from '../services/articleApi'
import { toast } from 'sonner'

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: () => articleApi.getAll(),
    select: unwrapList,
  })
}

export function useArticleById(id: string) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => articleApi.getById(id),
    enabled: !!id,
  })
}

export function useArticleManagers() {
  return useQuery({
    queryKey: ['article-managers'],
    queryFn: () => articleApi.getManagers(),
    select: (res: any) => {
      const items = unwrapList(res)
      return items.map((m: any) => ({
        value: m.value ?? m.id ?? m.userId ?? '',
        label: m.label ?? m.name ?? m.fullName ?? m.userName ?? m.value ?? '',
      }))
    },
    staleTime: 5 * 60 * 1000,
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
    onError: (err: any) => {
      const msg =
        err?.response?.data?.errors?.code ||
        err?.response?.data?.message ||
        'Lỗi khi thêm bài viết'
      toast.error(typeof msg === 'string' ? msg : 'Lỗi khi thêm bài viết')
    },
  })
}

export function useUpdateArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => articleApi.update(id, data),
    onSuccess: (_res, vars) => {
      toast.success('Cập nhật bài viết thành công')
      qc.invalidateQueries({ queryKey: ['articles'] })
      qc.invalidateQueries({ queryKey: ['article', vars.id] })
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

export function useSubmitArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => articleApi.submit(id),
    onSuccess: (_res, id) => {
      toast.success('Đã gửi duyệt bài viết')
      qc.invalidateQueries({ queryKey: ['articles'] })
      qc.invalidateQueries({ queryKey: ['article', id] })
    },
    onError: () => toast.error('Không gửi duyệt được bài viết'),
  })
}

export function useReviewArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      articleApi.review(id, { approved }),
    onSuccess: (_res, vars) => {
      toast.success(vars.approved ? 'Đã duyệt bài viết' : 'Đã từ chối bài viết')
      qc.invalidateQueries({ queryKey: ['articles'] })
      qc.invalidateQueries({ queryKey: ['article', vars.id] })
    },
    onError: () => toast.error('Không duyệt được bài viết'),
  })
}

export function usePublishArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => articleApi.publish(id),
    onSuccess: (_res, id) => {
      toast.success('Đã xuất bản bài viết')
      qc.invalidateQueries({ queryKey: ['articles'] })
      qc.invalidateQueries({ queryKey: ['article', id] })
    },
    onError: () => toast.error('Không xuất bản được bài viết'),
  })
}
