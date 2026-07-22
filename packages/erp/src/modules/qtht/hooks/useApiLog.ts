import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apilogApi, type ApiLogFilter, type ApiLogListResponse, type ApiLogStats } from '../services/apilogApi'
import { toast } from 'sonner'

// ============================================================
// Hooks
// ============================================================

/**
 * Query logs với filter đầy đủ.
 * `refetchIntervalMs` cho phép bật auto-refresh (dùng cho live monitoring).
 */
export function useApiLogs(filter: ApiLogFilter & { refetchIntervalMs?: number | false }) {
  const { refetchIntervalMs, ...rest } = filter
  return useQuery<ApiLogListResponse>({
    queryKey: ['apilogs', rest],
    queryFn: () => apilogApi.getLogs(rest),
    // React Query cho phép truyền false hoặc số milliseconds
    refetchInterval: refetchIntervalMs ?? false,
    // Tránh nhấp nháy layout khi auto-refresh
    placeholderData: (previousData) => previousData,
  })
}

/** Query stats — dùng cùng filter với danh sách để KPI khớp với bảng đang xem. */
export function useApiLogStats(filter: Omit<ApiLogFilter, 'pageNumber' | 'pageSize'>) {
  return useQuery<ApiLogStats>({
    queryKey: ['apilog-stats', filter],
    queryFn: () => apilogApi.getStats(filter),
    placeholderData: (previousData) => previousData,
  })
}

export function useDeleteApiLogs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: apilogApi.deleteBulk,
    onSuccess: (msg) => {
      toast.success(msg || 'Đã dọn dẹp log thành công')
      qc.invalidateQueries({ queryKey: ['apilogs'] })
      qc.invalidateQueries({ queryKey: ['apilog-stats'] })
    },
    onError: () => toast.error('Không xoá được log — vui lòng thử lại'),
  })
}

export function useDeleteApiLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apilogApi.delete(id),
    onSuccess: () => {
      toast.success('Đã xoá log')
      qc.invalidateQueries({ queryKey: ['apilogs'] })
      qc.invalidateQueries({ queryKey: ['apilog-stats'] })
    },
  })
}
