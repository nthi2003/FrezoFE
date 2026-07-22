// ============================================================
// Hooks cho workflow ticket cấp phát / thu hồi tài sản.
// ------------------------------------------------------------
// Vòng đời ticket:
//   create → PENDING → approve → APPROVED → handover → HANDED_OVER
//                    ↘ reject → REJECTED
//                    ↘ cancel (requester) → CANCELLED
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  transferApi, type TransferRequestItem, type TransferListParams, type TransferCreatePayload,
} from '../services/assetApi'

const QK_LIST = ['assets', 'transfer', 'list'] as const

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['assets'] }) // asset list + stats + drawer
  qc.invalidateQueries({ queryKey: QK_LIST })
}

export function useTransferRequests(params?: TransferListParams) {
  return useQuery({
    queryKey: [...QK_LIST, params],
    queryFn: () => transferApi.list(params),
    select: (raw: any) => {
      const d = raw?.data ?? raw
      return {
        items: (d?.items as TransferRequestItem[]) || [],
        total: d?.total || 0,
      }
    },
    // Refetch mỗi 30s cho tab "Chờ duyệt" (số badge trong tab bar cần cập nhật)
    refetchInterval: params?.status === 'PENDING' ? 30_000 : false,
  })
}

export function useCreateTransferRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ assetId, data }: { assetId: string; data: TransferCreatePayload }) =>
      transferApi.create(assetId, data),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu — chờ duyệt')
      invalidate(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không tạo được yêu cầu'),
  })
}

export function useApproveTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reqId, note }: { reqId: string; note?: string }) => transferApi.approve(reqId, note),
    onSuccess: () => {
      toast.success('Đã duyệt — chờ bàn giao')
      invalidate(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không duyệt được'),
  })
}

export function useRejectTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reqId, reason }: { reqId: string; reason: string }) => transferApi.reject(reqId, reason),
    onSuccess: () => {
      toast.success('Đã từ chối')
      invalidate(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không từ chối được'),
  })
}

export function useCancelTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reqId: string) => transferApi.cancel(reqId),
    onSuccess: () => {
      toast.success('Đã huỷ yêu cầu')
      invalidate(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không huỷ được'),
  })
}

export function useHandoverTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reqId, note }: { reqId: string; note?: string }) => transferApi.handover(reqId, note),
    onSuccess: () => {
      toast.success('Đã xác nhận bàn giao — tài sản chuyển sang IN_USE')
      invalidate(qc)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không xác nhận được'),
  })
}
