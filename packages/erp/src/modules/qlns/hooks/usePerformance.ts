import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  performanceApi,
  type ManagerScoreRequest,
  type OkrCheckInRequest,
  type OkrRequest,
  type OkrScope,
  type PerformanceReviewRequest,
} from '../services/performanceApi'

export function useOkrs(scope: OkrScope = 'mine', ownerPersonId?: string) {
  return useQuery({
    queryKey: ['qlns', 'okrs', scope, ownerPersonId ?? ''],
    queryFn: () => performanceApi.listOkrs({ scope, ownerPersonId }),
  })
}

export function useCreateOkr() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: OkrRequest) => performanceApi.createOkr(body),
    onSuccess: () => {
      toast.success('Đã tạo OKR')
      qc.invalidateQueries({ queryKey: ['qlns', 'okrs'] })
    },
    onError: () => toast.error('Tạo OKR thất bại'),
  })
}

export function useCheckInOkr() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: OkrCheckInRequest }) =>
      performanceApi.checkInOkr(id, body),
    onSuccess: () => {
      toast.success('Đã cập nhật tiến độ OKR')
      qc.invalidateQueries({ queryKey: ['qlns', 'okrs'] })
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || 'Check-in thất bại'),
  })
}

export function usePerformanceReviews(params?: {
  cycleId?: string
  personId?: string
}) {
  return useQuery({
    queryKey: ['qlns', 'performance-reviews', params?.cycleId, params?.personId],
    queryFn: () => performanceApi.listReviews(params),
  })
}

export function useCreatePerformanceReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PerformanceReviewRequest) =>
      performanceApi.createReview(body),
    onSuccess: () => {
      toast.success('Đã tạo đánh giá')
      qc.invalidateQueries({ queryKey: ['qlns', 'performance-reviews'] })
    },
    onError: () => toast.error('Tạo đánh giá thất bại'),
  })
}

export function useSubmitPerformanceReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => performanceApi.submitReview(id),
    onSuccess: () => {
      toast.success('Đã submit review')
      qc.invalidateQueries({ queryKey: ['qlns', 'performance-reviews'] })
    },
    onError: () => toast.error('Submit thất bại'),
  })
}

export function useManagerScoreReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ManagerScoreRequest }) =>
      performanceApi.managerScore(id, body),
    onSuccess: () => {
      toast.success('Đã chấm điểm manager')
      qc.invalidateQueries({ queryKey: ['qlns', 'performance-reviews'] })
    },
    onError: () => toast.error('Chấm điểm thất bại'),
  })
}
