import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/lib/toast'
import {
  jobApi,
  type FePage,
  type SystemJobDto,
  type SystemJobHistoryDto,
  type SystemJobHistoryFilter,
  type SystemJobUpdateRequest,
} from '../services/jobApi'

const JOBS_KEY = ['qtht-jobs'] as const

/** Job đang chạy → poll dày để thấy kết quả ngay khi xong. */
const RUNNING_POLL_MS = 5000
const IDLE_POLL_MS = 30000

/**
 * Danh sách tác vụ nền. Tự động rút ngắn chu kỳ refetch khi có job RUNNING
 * để bảng phản ánh kết quả gần thời gian thực.
 */
export function useJobs(options?: { autoRefresh?: boolean }) {
  const autoRefresh = options?.autoRefresh ?? true
  return useQuery<SystemJobDto[]>({
    queryKey: JOBS_KEY,
    queryFn: jobApi.getJobs,
    refetchInterval: (query) => {
      const jobs = query.state.data
      if (Array.isArray(jobs) && jobs.some((j) => j.status === 'RUNNING')) {
        return RUNNING_POLL_MS
      }
      return autoRefresh ? IDLE_POLL_MS : false
    },
    placeholderData: (previousData) => previousData,
  })
}

export function useUpdateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ code, data }: { code: string; data: SystemJobUpdateRequest }) =>
      jobApi.update(code, data),
    onSuccess: (job) => {
      toast.success(`Đã cập nhật tác vụ "${job?.name ?? ''}"`.trim())
      qc.invalidateQueries({ queryKey: JOBS_KEY })
    },
    onError: (err) => toast.apiError(err, 'Không cập nhật được tác vụ'),
  })
}

export function useRunJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => jobApi.run(code),
    onSuccess: (job) => {
      toast.success(`Đã kích hoạt "${job?.name ?? ''}" — theo dõi kết quả ở cột lần chạy gần nhất`)
      qc.invalidateQueries({ queryKey: JOBS_KEY })
      if (job?.code) qc.invalidateQueries({ queryKey: ['qtht-job-history', job.code] })
    },
    onError: (err) => toast.apiError(err, 'Không chạy được tác vụ'),
  })
}

/** Lịch sử chạy của 1 job — chỉ fetch khi drawer mở (`code` khác null). */
export function useJobHistory(code: string | null, filter: SystemJobHistoryFilter) {
  return useQuery<FePage<SystemJobHistoryDto>>({
    queryKey: ['qtht-job-history', code, filter],
    queryFn: () => jobApi.getHistory(code as string, filter),
    enabled: !!code,
    placeholderData: (previousData) => previousData,
  })
}
