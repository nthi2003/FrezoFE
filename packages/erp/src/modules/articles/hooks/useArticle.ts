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

/** Published articles for Home portal /bai-viet — prefers home-feed, falls back to /public. */
export function useHomeFeedArticles() {
  return useQuery({
    queryKey: ['articles', 'home-feed'],
    queryFn: async () => {
      try {
        return await articleApi.getHomeFeed()
      } catch {
        return articleApi.getPublicList(0, 20)
      }
    },
    select: (res: any) => {
      const list = unwrapList(res)
      if (list.length) return list
      // public page shape: { content: [] } or { items: [] }
      if (Array.isArray(res?.data?.content)) return res.data.content
      if (Array.isArray(res?.content)) return res.content
      if (Array.isArray(res?.data?.items)) return res.data.items
      return list
    },
    staleTime: 60 * 1000,
  })
}

export function useArticleById(id: string) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => articleApi.getById(id),
    enabled: !!id,
  })
}

/** Detail for reader view /bai-viet/:id — home-feed then public. */
export function useHomeArticleById(id: string) {
  return useQuery({
    queryKey: ['article', 'home', id],
    queryFn: async () => {
      try {
        const res = await articleApi.getHomeFeedById(id)
        return res?.data ?? res
      } catch {
        const res = await articleApi.getPublicById(id)
        return res?.data ?? res
      }
    },
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

function articleApiErrorMessage(err: any, fallback: string) {
  const data = err?.response?.data
  const msg =
    data?.errors?.code ||
    data?.message ||
    data?.mess ||
    fallback
  return typeof msg === 'string' ? msg : fallback
}

function isConcurrentModification(err: any) {
  const code = err?.response?.data?.messageCode || err?.response?.data?.errorKey
  return err?.response?.status === 409 && code === 'error.concurrent.modification'
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
      toast.error(articleApiErrorMessage(err, 'Lỗi khi thêm bài viết'))
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
    onError: (err: any, vars) => {
      if (isConcurrentModification(err)) {
        toast.error('Có người khác vừa cập nhật bài viết. Đang tải lại bản mới nhất…')
        void qc.invalidateQueries({ queryKey: ['article', vars.id] })
        void qc.invalidateQueries({ queryKey: ['articles'] })
        return
      }
      toast.error(articleApiErrorMessage(err, 'Lỗi khi cập nhật bài viết'))
    },
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
    mutationFn: ({ id, approved, note }: { id: string; approved: boolean; note?: string }) =>
      articleApi.review(id, { approved, note }),
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
