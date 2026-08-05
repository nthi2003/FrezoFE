// ============================================================
// FREZO ERP — JobHistoryDrawer
// Lịch sử chạy của 1 tác vụ nền: lọc theo kết quả + khoảng ngày,
// bảng phân trang, xem thông điệp lỗi đầy đủ trong modal riêng.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { History, RefreshCw } from 'lucide-react'
import {
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  FormModal,
  Select,
  StatusBadge,
} from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { formatDateTime } from '@/lib/utils/format'
import { useJobHistory } from '../hooks/useJob'
import type {
  SystemJobDto,
  SystemJobHistoryDto,
  SystemJobRunStatus,
} from '../services/jobApi'
import { formatDuration } from '../utils/cron'
import { RUN_STATUS_CONFIG } from '../constants/jobStatus'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả kết quả' },
  { value: 'SUCCESS', label: 'Thành công' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'SKIPPED', label: 'Bỏ qua' },
]

interface JobHistoryDrawerProps {
  job: SystemJobDto | null
  onClose: () => void
}

export function JobHistoryDrawer({ job, onClose }: JobHistoryDrawerProps) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'ALL' | SystemJobRunStatus>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [detail, setDetail] = useState<SystemJobHistoryDto | null>(null)

  // Đổi job hoặc đổi bộ lọc → về trang đầu để không rơi vào trang trống.
  useEffect(() => {
    setPage(1)
  }, [job?.code, status, fromDate, toDate])

  useEffect(() => {
    if (!job) {
      setStatus('ALL')
      setFromDate('')
      setToDate('')
      setDetail(null)
    }
  }, [job])

  const filter = useMemo(
    () => ({
      pageNumber: page,
      pageSize: PAGE_SIZE,
      status: status === 'ALL' ? undefined : status,
      fromDate: fromDate ? `${fromDate}T00:00:00` : undefined,
      toDate: toDate ? `${toDate}T23:59:59` : undefined,
    }),
    [page, status, fromDate, toDate],
  )

  const { data, isLoading, isFetching, isError, refetch } = useJobHistory(
    job?.code ?? null,
    filter,
  )

  const rows = data?.content ?? []
  const hasActiveFilter = status !== 'ALL' || !!fromDate || !!toDate

  const clearFilters = () => {
    setStatus('ALL')
    setFromDate('')
    setToDate('')
  }

  const columns = useMemo<AppTableColumn<SystemJobHistoryDto>[]>(
    () => [
      {
        title: 'Bắt đầu',
        dataIndex: 'startedAt',
        width: 150,
        render: (value: string) => (
          <span className="text-xs tabular-nums text-neutral-800">{formatDateTime(value)}</span>
        ),
      },
      {
        title: 'Thời lượng',
        dataIndex: 'durationMs',
        width: 110,
        align: 'right' as const,
        render: (value: number) => (
          <span className="text-xs tabular-nums text-neutral-600">{formatDuration(value)}</span>
        ),
      },
      {
        title: 'Kết quả',
        dataIndex: 'status',
        width: 110,
        render: (value: SystemJobRunStatus) => {
          const config = RUN_STATUS_CONFIG[value]
          return config ? <StatusBadge {...config} /> : <span className="text-xs">—</span>
        },
      },
      {
        title: 'Kích hoạt bởi',
        dataIndex: 'triggeredBy',
        width: 120,
        render: (value: string) =>
          value === 'SYSTEM' ? (
            <span className="text-xs text-neutral-500">Theo lịch</span>
          ) : (
            <span className="text-xs text-neutral-700">{value || '—'}</span>
          ),
      },
      {
        title: 'Thông điệp',
        dataIndex: 'message',
        render: (value: string, row: SystemJobHistoryDto) =>
          value ? (
            <button
              type="button"
              onClick={() => setDetail(row)}
              className="block max-w-[220px] truncate text-left text-xs text-neutral-600 underline-offset-2 hover:text-primary-700 hover:underline"
            >
              {value}
            </button>
          ) : (
            <span className="text-xs text-neutral-400">—</span>
          ),
      },
    ],
    [],
  )

  return (
    <>
      <Drawer
        isOpen={!!job}
        onClose={onClose}
        title={job ? `Lịch sử — ${job.name}` : 'Lịch sử'}
        description={job?.code}
        size="xl"
        footer={
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        }
      >
        <div className="space-y-3 p-4">
          {/* ── Bộ lọc ── */}
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[150px]">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Kết quả
              </label>
              <Select
                options={STATUS_OPTIONS}
                value={status}
                onChange={(v) => setStatus(v as 'ALL' | SystemJobRunStatus)}
                showSearch={false}
                aria-label="Lọc theo kết quả chạy"
              />
            </div>
            <div>
              <label
                htmlFor="job-history-from"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
              >
                Từ ngày
              </label>
              <input
                id="job-history-from"
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 rounded-md border border-neutral-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label
                htmlFor="job-history-to"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
              >
                Đến ngày
              </label>
              <input
                id="job-history-to"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 rounded-md border border-neutral-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            {hasActiveFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Xoá lọc
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Làm mới
            </Button>
          </div>

          {isError ? (
            <div className="rounded-xl border border-neutral-200 bg-white">
              <ErrorState
                title="Không tải được lịch sử chạy"
                message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            </div>
          ) : !isLoading && rows.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white">
              <EmptyState
                icon={History}
                title={hasActiveFilter ? 'Không có lần chạy phù hợp bộ lọc' : 'Chưa có lần chạy nào'}
                description={
                  hasActiveFilter
                    ? 'Thử mở rộng khoảng ngày hoặc bỏ lọc kết quả.'
                    : 'Lịch sử sẽ xuất hiện sau lần chạy đầu tiên (theo lịch hoặc thủ công).'
                }
                action={hasActiveFilter ? { label: 'Xoá lọc', onClick: clearFilters } : undefined}
              />
            </div>
          ) : (
            <AppTable
              columns={columns}
              data={rows}
              isLoading={isLoading}
              showSearch={false}
              density="compact"
              loadingRows={5}
              pageIndex={page}
              pageSize={PAGE_SIZE}
              pageSizeOptions={[]}
              totalElements={data?.totalElements ?? 0}
              onPageChange={(nextPage) => setPage(nextPage)}
            />
          )}
        </div>
      </Drawer>

      <FormModal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title="Chi tiết lần chạy"
        description={detail ? formatDateTime(detail.startedAt) : undefined}
        size="lg"
        showFooter={false}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {detail && RUN_STATUS_CONFIG[detail.status] && (
              <StatusBadge {...RUN_STATUS_CONFIG[detail.status]} />
            )}
            <span className="text-xs text-neutral-500">
              Thời lượng {formatDuration(detail?.durationMs)} · Kích hoạt bởi{' '}
              {detail?.triggeredBy === 'SYSTEM' ? 'lịch hệ thống' : detail?.triggeredBy || '—'}
            </span>
          </div>
          <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-lg bg-neutral-900 p-4 font-mono text-xs leading-relaxed text-neutral-100">
            {detail?.message || 'Không có thông điệp.'}
          </pre>
        </div>
      </FormModal>
    </>
  )
}
