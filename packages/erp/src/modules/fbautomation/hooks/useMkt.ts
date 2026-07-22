// ============================================================
// useMkt — React Query hooks cho Frezo MKT Suite
// ------------------------------------------------------------
// 3 nhóm hooks:
//   - Lead Import (upload CSV/Excel + history)
//   - Social Posts (content scheduler)
//   - Affiliate  (KOL short link + dashboard)
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import fbApi from '../services/fbApi'
import { toast } from 'sonner'

// ============================================================
// LEAD IMPORT
// ============================================================
export function useLeadImportHistory() {
  return useQuery({
    queryKey: ['mkt', 'lead-import', 'history'],
    queryFn: () => fbApi.leadImport.history(),
    staleTime: 30_000,
  })
}

export function useUploadLeadImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { file: File; source?: string; dedupe?: boolean }) =>
      fbApi.leadImport.upload(params.file, params.source, params.dedupe ?? true),
    onSuccess: (batch: any) => {
      const total = batch?.rowCount ?? 0
      const ok = batch?.successCount ?? 0
      const skip = batch?.skippedCount ?? 0
      const fail = batch?.failedCount ?? 0
      toast.success(`Import xong: ${ok}/${total} thành công · ${skip} trùng · ${fail} lỗi`)
      qc.invalidateQueries({ queryKey: ['mkt', 'lead-import'] })
      qc.invalidateQueries({ queryKey: ['fb', 'leads'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Import thất bại — kiểm tra định dạng file')
    },
  })
}

export function usePreviewLeadImport() {
  return useMutation({
    mutationFn: (file: File) => fbApi.leadImport.preview(file),
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không đọc được file')
    },
  })
}

export function useRollbackLeadImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (batchId: string) => fbApi.leadImport.rollback(batchId),
    onSuccess: () => {
      toast.success('Đã rollback batch — các lead trong batch đã bị xoá')
      qc.invalidateQueries({ queryKey: ['mkt', 'lead-import'] })
      qc.invalidateQueries({ queryKey: ['fb', 'leads'] })
    },
  })
}

// ============================================================
// SOCIAL POSTS (content scheduler)
// ============================================================
export function useSocialPosts(params?: { status?: string; channel?: string }) {
  return useQuery({
    queryKey: ['mkt', 'posts', params],
    queryFn: () => fbApi.posts.list(params),
    staleTime: 30_000,
  })
}

export function useSocialPost(id: string | null | undefined) {
  return useQuery({
    queryKey: ['mkt', 'posts', id],
    queryFn: () => fbApi.posts.get(id as string),
    enabled: !!id,
  })
}

export function useCreateSocialPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => fbApi.posts.create(data),
    onSuccess: () => {
      toast.success('Đã lưu bài viết')
      qc.invalidateQueries({ queryKey: ['mkt', 'posts'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Lưu thất bại'),
  })
}

export function useUpdateSocialPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; data: any }) => fbApi.posts.update(params.id, params.data),
    onSuccess: () => {
      toast.success('Đã cập nhật bài viết')
      qc.invalidateQueries({ queryKey: ['mkt', 'posts'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Cập nhật thất bại'),
  })
}

export function useDeleteSocialPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fbApi.posts.delete(id),
    onSuccess: () => {
      toast.success('Đã xoá')
      qc.invalidateQueries({ queryKey: ['mkt', 'posts'] })
    },
  })
}

export function useSocialPostAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; action: 'duplicate' | 'cancel' | 'publish' }) => {
      if (params.action === 'duplicate') return fbApi.posts.duplicate(params.id)
      if (params.action === 'cancel') return fbApi.posts.cancel(params.id)
      return fbApi.posts.publishNow(params.id)
    },
    onSuccess: (_res, vars) => {
      const msg =
        vars.action === 'duplicate' ? 'Đã nhân bản' :
        vars.action === 'cancel' ? 'Đã hủy lịch đăng' :
        'Đã gửi lệnh publish'
      toast.success(msg)
      qc.invalidateQueries({ queryKey: ['mkt', 'posts'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Thao tác thất bại'),
  })
}

// ============================================================
// AFFILIATE / KOL
// ============================================================
export function useAffiliateLinks(params?: { campaign?: string; status?: string; kolName?: string }) {
  return useQuery({
    queryKey: ['mkt', 'affiliate', params],
    queryFn: () => fbApi.affiliate.list(params),
    staleTime: 30_000,
  })
}

export function useAffiliateDashboard() {
  return useQuery({
    queryKey: ['mkt', 'affiliate', 'dashboard'],
    queryFn: () => fbApi.affiliate.dashboard(),
    staleTime: 30_000,
  })
}

export function useCreateAffiliateLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => fbApi.affiliate.create(data),
    onSuccess: () => {
      toast.success('Đã tạo affiliate link')
      qc.invalidateQueries({ queryKey: ['mkt', 'affiliate'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Tạo link thất bại'),
  })
}

export function useUpdateAffiliateLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; data: any }) => fbApi.affiliate.update(params.id, params.data),
    onSuccess: () => {
      toast.success('Đã cập nhật link')
      qc.invalidateQueries({ queryKey: ['mkt', 'affiliate'] })
    },
  })
}

export function useDeleteAffiliateLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fbApi.affiliate.delete(id),
    onSuccess: () => {
      toast.success('Đã xoá link')
      qc.invalidateQueries({ queryKey: ['mkt', 'affiliate'] })
    },
  })
}
