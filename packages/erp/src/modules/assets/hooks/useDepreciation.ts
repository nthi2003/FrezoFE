import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast, extractApiErrorMessage } from '@/lib/toast'
import { depreciationApi } from '../services/depreciationApi'

/** Map messageCode / message → copy VN ổn định (CYCLE-DEP). */
export function mapDepreciationError(err: unknown, fallback: string): string {
  const anyErr = err as {
    response?: { data?: { messageCode?: string; message?: string; errorKey?: string } }
  }
  const code =
    anyErr?.response?.data?.messageCode ??
    anyErr?.response?.data?.errorKey ??
    ''
  const raw = (anyErr?.response?.data?.message ?? '').toLowerCase()

  if (
    code === 'accounting.period.closed' ||
    code === 'PERIOD_CLOSED' ||
    raw.includes('kỳ kế toán đã') ||
    (raw.includes('period') && raw.includes('closed'))
  ) {
    return 'Kỳ kế toán đã đóng — không ghi sổ được.'
  }
  if (
    code === 'depreciation.no.active.schedule' ||
    code === 'NO_ACTIVE_SCHEDULE' ||
    raw.includes('không có lịch')
  ) {
    return 'Không có lịch khấu hao đang hiệu lực để ghi sổ trong kỳ này.'
  }
  if (
    code === 'depreciation.schedule.exists' ||
    code === 'SCHEDULE_EXISTS' ||
    raw.includes('đã có lịch')
  ) {
    return 'Đã có lịch khấu hao cho tài sản này.'
  }
  if (
    anyErr?.response &&
    (anyErr as { response?: { status?: number } }).response?.status === 403
  ) {
    return 'Bạn không có quyền thực hiện thao tác này.'
  }

  return extractApiErrorMessage(err, fallback)
}

export function useDepreciationSchedules(assetId?: string) {
  return useQuery({
    queryKey: ['asset', 'depreciation', 'schedules', assetId ?? 'all'],
    queryFn: () => depreciationApi.listSchedules(assetId),
  })
}

export function useGenerateDepreciationSchedule(assetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params?: { method?: string; months?: number }) =>
      depreciationApi.generate({
        assetId,
        method: params?.method,
        months: params?.months,
      }),
    onSuccess: () => {
      toast.success('Đã sinh lịch khấu hao')
      qc.invalidateQueries({
        queryKey: ['asset', 'depreciation', 'schedules', assetId],
      })
    },
    onError: (err) =>
      toast.error(mapDepreciationError(err, 'Sinh lịch thất bại')),
  })
}

export function useDepreciationPostings(year?: number, month?: number) {
  return useQuery({
    queryKey: ['asset', 'depreciation', 'postings', year, month],
    queryFn: () => depreciationApi.listPostings(year, month),
  })
}

export function useDepreciationPreview(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: ['asset', 'depreciation', 'preview', year, month],
    queryFn: () => depreciationApi.preview(year, month),
    enabled,
    retry: false,
  })
}

export function usePostDepreciation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      depreciationApi.post(year, month),
    onSuccess: (res, vars) => {
      const key = ['asset', 'depreciation', 'postings'] as const
      const cachedLists = qc.getQueriesData<{
        periodYear?: number
        periodMonth?: number
        status?: string
        journalEntryId?: string
      }[]>({ queryKey: key })
      const alreadyPosted = cachedLists.some(([, list]) =>
        (list ?? []).some(
          (p) =>
            p.periodYear === vars.year &&
            p.periodMonth === vars.month &&
            p.status === 'POSTED',
        ),
      )

      if (alreadyPosted) {
        toast.info(
          `Kỳ này đã ghi sổ` +
            (res?.journalEntryId ? ` · JE ${res.journalEntryId}` : ''),
        )
      } else {
        toast.success(
          `Đã ghi sổ khấu hao ${String(res?.periodMonth).padStart(2, '0')}/${res?.periodYear}` +
            (res?.journalEntryId ? ` · JE ${res.journalEntryId}` : ''),
        )
      }
      qc.invalidateQueries({ queryKey: ['asset', 'depreciation'] })
    },
    onError: (err) =>
      toast.error(mapDepreciationError(err, 'Ghi sổ khấu hao thất bại')),
  })
}
