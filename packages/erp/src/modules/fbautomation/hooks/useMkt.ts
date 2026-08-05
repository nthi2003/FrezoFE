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
      toast.success('Đã hoàn tác lô — các khách tiềm năng trong lô đã bị xoá')
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

// ============================================================
// ADS
// ============================================================
export function useAdCampaigns(params?: { platform?: string; status?: string }) {
  return useQuery({
    queryKey: ['mkt', 'ads', params],
    queryFn: () => fbApi.ads.list(params),
    staleTime: 30_000,
  })
}

export function useAdsDashboard() {
  return useQuery({
    queryKey: ['mkt', 'ads', 'dashboard'],
    queryFn: () => fbApi.ads.dashboard(),
    staleTime: 30_000,
  })
}

export function useCreateAdCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => fbApi.ads.create(data),
    onSuccess: () => {
      toast.success('Đã tạo chiến dịch Ads')
      qc.invalidateQueries({ queryKey: ['mkt', 'ads'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Tạo thất bại'),
  })
}

export function useUpdateAdCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; data: any }) => fbApi.ads.update(params.id, params.data),
    onSuccess: () => {
      toast.success('Đã cập nhật chiến dịch')
      qc.invalidateQueries({ queryKey: ['mkt', 'ads'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Cập nhật thất bại'),
  })
}

export function useDeleteAdCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fbApi.ads.delete(id),
    onSuccess: () => {
      toast.success('Đã xoá chiến dịch')
      qc.invalidateQueries({ queryKey: ['mkt', 'ads'] })
    },
  })
}

// ============================================================
// INSIGHTS
// ============================================================
export function useMktInsights() {
  return useQuery({
    queryKey: ['mkt', 'insights', 'dashboard'],
    queryFn: () => fbApi.insights.dashboard(),
    staleTime: 30_000,
  })
}

// ============================================================
// COMMENTS
// ============================================================
export function useModeratedComments(params?: { status?: string }) {
  return useQuery({
    queryKey: ['mkt', 'comments', params],
    queryFn: () => fbApi.comments.list(params),
    staleTime: 30_000,
  })
}

export function useCommentRules() {
  return useQuery({
    queryKey: ['mkt', 'comments', 'rules'],
    queryFn: () => fbApi.comments.listRules(),
    staleTime: 30_000,
  })
}

export function useCommentsDashboard() {
  return useQuery({
    queryKey: ['mkt', 'comments', 'dashboard'],
    queryFn: () => fbApi.comments.dashboard(),
    staleTime: 30_000,
  })
}

export function useCreateComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => fbApi.comments.create(data),
    onSuccess: () => {
      toast.success('Đã thêm comment')
      qc.invalidateQueries({ queryKey: ['mkt', 'comments'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Thêm thất bại'),
  })
}

export function useCreateCommentRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => fbApi.comments.createRule(data),
    onSuccess: () => {
      toast.success('Đã tạo rule')
      qc.invalidateQueries({ queryKey: ['mkt', 'comments'] })
    },
  })
}

export function useDeleteCommentRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fbApi.comments.deleteRule(id),
    onSuccess: () => {
      toast.success('Đã xoá rule')
      qc.invalidateQueries({ queryKey: ['mkt', 'comments'] })
    },
  })
}

export function useModerateComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; action: string; replyText?: string }) =>
      fbApi.comments.moderate(params.id, params.action, params.replyText),
    onSuccess: () => {
      toast.success('Đã áp dụng kiểm duyệt')
      qc.invalidateQueries({ queryKey: ['mkt', 'comments'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Thao tác thất bại'),
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fbApi.comments.delete(id),
    onSuccess: () => {
      toast.success('Đã xoá')
      qc.invalidateQueries({ queryKey: ['mkt', 'comments'] })
    },
  })
}

// ============================================================
// REVIEWS
// ============================================================
export function usePageReviews(params?: { status?: string; platform?: string }) {
  return useQuery({
    queryKey: ['mkt', 'reviews', params],
    queryFn: () => fbApi.reviews.list(params),
    staleTime: 30_000,
  })
}

export function useReviewsDashboard() {
  return useQuery({
    queryKey: ['mkt', 'reviews', 'dashboard'],
    queryFn: () => fbApi.reviews.dashboard(),
    staleTime: 30_000,
  })
}

export function useCreatePageReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => fbApi.reviews.create(data),
    onSuccess: () => {
      toast.success('Đã thêm đánh giá')
      qc.invalidateQueries({ queryKey: ['mkt', 'reviews'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Thêm thất bại'),
  })
}

export function useReplyPageReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; replyText: string }) =>
      fbApi.reviews.reply(params.id, params.replyText),
    onSuccess: () => {
      toast.success('Đã trả lời đánh giá')
      qc.invalidateQueries({ queryKey: ['mkt', 'reviews'] })
    },
  })
}

export function useDeletePageReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fbApi.reviews.delete(id),
    onSuccess: () => {
      toast.success('Đã xoá đánh giá')
      qc.invalidateQueries({ queryKey: ['mkt', 'reviews'] })
    },
  })
}

// ============================================================
// LIVE
// ============================================================
export function useLivestreamEvents(params?: { status?: string }) {
  return useQuery({
    queryKey: ['mkt', 'live', params],
    queryFn: () => fbApi.live.list(params),
    staleTime: 30_000,
  })
}

export function useLiveDashboard() {
  return useQuery({
    queryKey: ['mkt', 'live', 'dashboard'],
    queryFn: () => fbApi.live.dashboard(),
    staleTime: 30_000,
  })
}

export function useCreateLivestream() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => fbApi.live.create(data),
    onSuccess: () => {
      toast.success('Đã tạo lịch livestream')
      qc.invalidateQueries({ queryKey: ['mkt', 'live'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Tạo thất bại'),
  })
}

export function useDeleteLivestream() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fbApi.live.delete(id),
    onSuccess: () => {
      toast.success('Đã xoá lịch live')
      qc.invalidateQueries({ queryKey: ['mkt', 'live'] })
    },
  })
}

export function useLivestreamAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string; action: 'notify' | 'status'; status?: string }) => {
      if (params.action === 'notify') return fbApi.live.markNotified(params.id)
      return fbApi.live.updateStatus(params.id, params.status || 'LIVE')
    },
    onSuccess: (_r, vars) => {
      toast.success(vars.action === 'notify' ? 'Đã đánh dấu nhắc' : 'Đã cập nhật trạng thái')
      qc.invalidateQueries({ queryKey: ['mkt', 'live'] })
    },
  })
}
