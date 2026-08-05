import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usageApi } from '../services/usageApi'
import { toast } from 'sonner'

export function useUsageSummary(options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: ['usage_summary'],
    queryFn: () => usageApi.getSummary(90),
    enabled: options?.enabled ?? true,
    /** Poll khi đang mở trang usage — gần realtime, không poll global. */
    refetchInterval: options?.refetchInterval ?? 12_000,
  })
}

export function useLoginByDayMap(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['usage_login_by_day'],
    queryFn: usageApi.getLoginByDay,
    enabled: options?.enabled ?? true,
    select: (data) => data ?? {},
  })
}

export function usePageViewTop(days = 1, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['usage_pageview_top', days],
    queryFn: () => usageApi.getPageViewTop(days),
    enabled: options?.enabled ?? true,
  })
}

export function useAdminSessions(page = 0, size = 20) {
  return useQuery({
    queryKey: ['usage_admin_sessions', page, size],
    queryFn: () => usageApi.getAdminSessions(page, size),
    refetchInterval: 30_000,
  })
}

export function useRevokeSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usageApi.revokeSession(id),
    onSuccess: () => {
      toast.success('Đã thu hồi phiên')
      qc.invalidateQueries({ queryKey: ['usage_admin_sessions'] })
      qc.invalidateQueries({ queryKey: ['usage_summary'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Thu hồi phiên thất bại')
    },
  })
}
