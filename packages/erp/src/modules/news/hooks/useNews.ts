import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { unwrapList } from '@frezo/utils'
import { newsApi } from '../services/newsApi'
import { articleApi } from '@/modules/articles/services/articleApi'
import { toast } from 'sonner'

export function useNewsPageData(organizationId?: string) {
  return useQuery({
    queryKey: ['news', 'page-data', organizationId ?? 'all'],
    queryFn: async () => {
      try {
        const res = await newsApi.getPageData(organizationId)
        return res?.data ?? res
      } catch {
        const feed = await articleApi.getHomeFeed()
        const articles = unwrapList(feed)
        return { banners: [], motto: null, categories: [], pinnedArticles: [], articles }
      }
    },
    staleTime: 60 * 1000,
  })
}

export function useNewsCategories(organizationId?: string) {
  return useQuery({
    queryKey: ['news', 'categories', organizationId ?? 'all'],
    queryFn: () => newsApi.getCategories(organizationId),
    select: unwrapList,
  })
}

export function useNewsMottos() {
  return useQuery({
    queryKey: ['news', 'mottos'],
    queryFn: () => newsApi.getMottos(),
    select: unwrapList,
  })
}

export function useNewsPins(organizationId?: string) {
  return useQuery({
    queryKey: ['news', 'pins', organizationId],
    queryFn: () => newsApi.getPins(organizationId!),
    select: unwrapList,
    enabled: !!organizationId,
  })
}

export function useCreateNewsCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => newsApi.createCategory(data),
    onSuccess: () => {
      toast.success('Thêm danh mục thành công')
      qc.invalidateQueries({ queryKey: ['news', 'categories'] })
      qc.invalidateQueries({ queryKey: ['news', 'page-data'] })
    },
    onError: () => toast.error('Không thêm được danh mục'),
  })
}

export function useUpdateNewsCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => newsApi.updateCategory(id, data),
    onSuccess: () => {
      toast.success('Cập nhật danh mục thành công')
      qc.invalidateQueries({ queryKey: ['news', 'categories'] })
      qc.invalidateQueries({ queryKey: ['news', 'page-data'] })
    },
    onError: () => toast.error('Không cập nhật được danh mục'),
  })
}

export function useDeleteNewsCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => newsApi.deleteCategory(id),
    onSuccess: () => {
      toast.success('Xóa danh mục thành công')
      qc.invalidateQueries({ queryKey: ['news', 'categories'] })
      qc.invalidateQueries({ queryKey: ['news', 'page-data'] })
    },
    onError: () => toast.error('Không xóa được danh mục'),
  })
}

export function useCreateNewsMotto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => newsApi.createMotto(data),
    onSuccess: () => {
      toast.success('Thêm châm ngôn thành công')
      qc.invalidateQueries({ queryKey: ['news', 'mottos'] })
      qc.invalidateQueries({ queryKey: ['news', 'page-data'] })
    },
    onError: () => toast.error('Không thêm được châm ngôn'),
  })
}

export function useUpdateNewsMotto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => newsApi.updateMotto(id, data),
    onSuccess: () => {
      toast.success('Cập nhật châm ngôn thành công')
      qc.invalidateQueries({ queryKey: ['news', 'mottos'] })
      qc.invalidateQueries({ queryKey: ['news', 'page-data'] })
    },
    onError: () => toast.error('Không cập nhật được châm ngôn'),
  })
}

export function useDeleteNewsMotto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => newsApi.deleteMotto(id),
    onSuccess: () => {
      toast.success('Xóa châm ngôn thành công')
      qc.invalidateQueries({ queryKey: ['news', 'mottos'] })
      qc.invalidateQueries({ queryKey: ['news', 'page-data'] })
    },
    onError: () => toast.error('Không xóa được châm ngôn'),
  })
}

export function usePinArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { articleId: string; organizationId: string; sortOrder?: number }) =>
      newsApi.pinArticle(data),
    onSuccess: () => {
      toast.success('Đã ghim tin')
      qc.invalidateQueries({ queryKey: ['news', 'pins'] })
      qc.invalidateQueries({ queryKey: ['news', 'page-data'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Không ghim được tin (tối đa 5/đơn vị)'
      toast.error(msg)
    },
  })
}

export function useUnpinArticle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ organizationId, articleId }: { organizationId: string; articleId: string }) =>
      newsApi.unpinArticle(organizationId, articleId),
    onSuccess: () => {
      toast.success('Đã bỏ ghim')
      qc.invalidateQueries({ queryKey: ['news', 'pins'] })
      qc.invalidateQueries({ queryKey: ['news', 'page-data'] })
    },
    onError: () => toast.error('Không bỏ ghim được'),
  })
}
