import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { unwrapList, unwrapOne } from '@frezo/utils'
import { toast } from 'sonner'
import { guideApi, type GuideSavePayload } from '../services/guideApi'
import { invalidateGuideCaches } from '../services/guideCache'
import { fetchHubDocs, resolveDocBySlug } from '../services/docsRegistry'

export function useHubDocs() {
  return useQuery({
    queryKey: ['docs-hub'],
    queryFn: fetchHubDocs,
    staleTime: 60_000,
  })
}

export function useResolvedDoc(slug: string | undefined) {
  return useQuery({
    queryKey: ['docs-slug', slug],
    queryFn: () => resolveDocBySlug(slug!),
    enabled: !!slug,
    staleTime: 60_000,
  })
}

export function useAdminGuides(enabled = true) {
  return useQuery({
    queryKey: ['admin-guides'],
    queryFn: () => guideApi.listAll(),
    select: unwrapList,
    enabled,
  })
}

export function useAdminGuide(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-guide', id],
    queryFn: async () => {
      const res = await guideApi.getById(id!)
      return unwrapOne(res)
    },
    enabled: !!id,
  })
}

function bustCaches(slug?: string) {
  invalidateGuideCaches(slug)
}

export function useCreateGuide() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GuideSavePayload) => guideApi.create(data),
    onSuccess: () => {
      toast.success('Đã tạo hướng dẫn')
      bustCaches()
      qc.invalidateQueries({ queryKey: ['admin-guides'] })
      qc.invalidateQueries({ queryKey: ['docs-hub'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không tạo được hướng dẫn')
    },
  })
}

export function useUpdateGuide() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GuideSavePayload }) =>
      guideApi.update(id, data),
    onSuccess: (_res, vars) => {
      toast.success('Đã lưu hướng dẫn')
      bustCaches(vars.data.slug)
      qc.invalidateQueries({ queryKey: ['admin-guides'] })
      qc.invalidateQueries({ queryKey: ['admin-guide', vars.id] })
      qc.invalidateQueries({ queryKey: ['docs-hub'] })
      qc.invalidateQueries({ queryKey: ['docs-slug'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không lưu được hướng dẫn')
    },
  })
}

export function usePublishGuide() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => guideApi.publish(id),
    onSuccess: () => {
      toast.success('Đã xuất bản')
      bustCaches()
      qc.invalidateQueries({ queryKey: ['admin-guides'] })
      qc.invalidateQueries({ queryKey: ['docs-hub'] })
    },
    onError: () => toast.error('Không xuất bản được'),
  })
}

export function useUnpublishGuide() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => guideApi.unpublish(id),
    onSuccess: () => {
      toast.success('Đã gỡ xuất bản')
      bustCaches()
      qc.invalidateQueries({ queryKey: ['admin-guides'] })
      qc.invalidateQueries({ queryKey: ['docs-hub'] })
    },
    onError: () => toast.error('Không gỡ xuất bản được'),
  })
}

export function useDeleteGuide() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => guideApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa hướng dẫn')
      bustCaches()
      qc.invalidateQueries({ queryKey: ['admin-guides'] })
      qc.invalidateQueries({ queryKey: ['docs-hub'] })
    },
    onError: () => toast.error('Không xóa được hướng dẫn'),
  })
}
