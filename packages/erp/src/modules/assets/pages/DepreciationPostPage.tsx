// ============================================================
// DepreciationPostPage — Khấu hao định kỳ (CYCLE-DEP)
// Layout: PageHeader + KPI + sticky FilterBar + period actions
//          + AppTable dòng TS + AppTable lịch sử ghi sổ
// ============================================================

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Landmark,
  Loader2,
  Calculator,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Package,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Button,
  PageHeader,
  PageGuideButton,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  StatusBadge,
  StatCard,
  Select,
} from '@frezo/ui'
import type { StatusColor } from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  useDepreciationPostings,
  usePostDepreciation,
  useDepreciationSchedules,
  useDepreciationPreview,
} from '../hooks/useDepreciation'
import { fmtMoneyFull } from '../constants/assetMeta'
import { DEPRECIATION_GUIDE } from '../constants/depreciation.guide'
import type {
  DepreciationPostingDto,
  DepreciationScheduleDto,
} from '../services/depreciationApi'

const now = new Date()

const POSTING_STATUS: Record<
  string,
  { label: string; color: StatusColor; icon: LucideIcon }
> = {
  PREVIEW: { label: 'Chưa ghi sổ', color: 'info', icon: Eye },
  POSTED: { label: 'Đã ghi sổ', color: 'success', icon: CheckCircle2 },
  FAILED: { label: 'Thất bại', color: 'danger', icon: XCircle },
  REVERSED: { label: 'Đã đảo', color: 'neutral', icon: Clock },
}

const SCHEDULE_STATUS: Record<
  string,
  { label: string; color: StatusColor; icon: LucideIcon }
> = {
  ACTIVE: { label: 'Đang hiệu lực', color: 'success', icon: CheckCircle2 },
  DONE: { label: 'Hoàn tất', color: 'neutral', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã huỷ', color: 'danger', icon: Clock },
}

function postingBadge(status?: string) {
  const key = (status || 'PREVIEW').toUpperCase()
  return POSTING_STATUS[key] ?? {
    label: status || '—',
    color: 'neutral' as StatusColor,
    icon: Clock,
  }
}

function scheduleBadge(status?: string) {
  const key = (status || 'ACTIVE').toUpperCase()
  return SCHEDULE_STATUS[key] ?? {
    label: status || '—',
    color: 'neutral' as StatusColor,
    icon: Clock,
  }
}

function methodLabel(method?: string) {
  if (!method) return '—'
  const m = method.toUpperCase()
  if (m === 'STRAIGHT_LINE') return 'Đường thẳng'
  if (m === 'DECLINING') return 'Số dư giảm dần'
  return method
}

export function DepreciationPostPage() {
  const nav = useNavigate()
  const canView = usePermission('ASSET.DEPRECIATION.VIEW')
  const canPost = usePermission('ASSET.DEPRECIATION.UPDATE')

  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [statusFilter, setStatusFilter] = useState('')
  const [historyYearFilter, setHistoryYearFilter] = useState<string>('')
  const [previewOn, setPreviewOn] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const {
    data: postings = [],
    isLoading: postingsLoading,
    isError: postingsError,
    isFetching: postingsFetching,
    refetch: refetchPostings,
  } = useDepreciationPostings()
  const {
    data: schedules = [],
    isLoading: schedulesLoading,
    isError: schedulesError,
    isFetching: schedulesFetching,
    refetch: refetchSchedules,
  } = useDepreciationSchedules()
  const {
    data: preview,
    isFetching: previewLoading,
    isError: previewError,
    refetch: refetchPreview,
  } = useDepreciationPreview(year, month, previewOn && canView)
  const post = usePostDepreciation()

  const periodLabel = `${String(month).padStart(2, '0')}/${year}`

  const existingPosted = useMemo(
    () =>
      postings.find(
        (p) =>
          p.periodYear === year &&
          p.periodMonth === month &&
          p.status === 'POSTED',
      ),
    [postings, year, month],
  )

  const displayStatus = existingPosted?.status || preview?.status || 'PREVIEW'
  const badge = postingBadge(displayStatus)

  const activeSchedules = useMemo(
    () => schedules.filter((s) => (s.status || '').toUpperCase() === 'ACTIVE'),
    [schedules],
  )

  const filteredSchedules = useMemo(() => {
    if (!statusFilter) return schedules
    return schedules.filter(
      (s) => (s.status || '').toUpperCase() === statusFilter.toUpperCase(),
    )
  }, [schedules, statusFilter])

  const filteredPostings = useMemo(() => {
    let list = postings
    if (historyYearFilter) {
      const y = Number(historyYearFilter)
      list = list.filter((p) => p.periodYear === y)
    }
    return list
  }, [postings, historyYearFilter])

  const kpis = useMemo(() => {
    const remaining = activeSchedules.reduce(
      (sum, s) => sum + (Number(s.remainingValue) || 0),
      0,
    )
    const periodDep =
      preview?.totalAmount != null
        ? Number(preview.totalAmount)
        : activeSchedules.reduce(
            (sum, s) => sum + (Number(s.monthlyAmount) || 0),
            0,
          )
    const lineCount = preview?.scheduleCount ?? activeSchedules.length
    return {
      assetCount: activeSchedules.length,
      remaining,
      periodDep,
      lineCount,
    }
  }, [activeSchedules, preview])

  const hasFilters = !!statusFilter || !!historyYearFilter
  const clearFilters = () => {
    setStatusFilter('')
    setHistoryYearFilter('')
  }

  const refreshAll = () => {
    void refetchSchedules()
    void refetchPostings()
    if (previewOn) void refetchPreview()
  }

  const scheduleColumns: AppTableColumn<DepreciationScheduleDto>[] = [
    {
      key: 'assetCode',
      title: 'Mã tài sản',
      width: 130,
      render: (_, row) => (
        <span className="font-mono text-xs text-primary-800">
          {row.assetCode || '—'}
        </span>
      ),
    },
    {
      key: 'assetName',
      title: 'Tên tài sản',
      render: (_, row) => (
        <span className="text-sm text-neutral-900">
          {row.assetName || '—'}
        </span>
      ),
    },
    {
      key: 'method',
      title: 'Phương pháp',
      width: 120,
      render: (_, row) => (
        <span className="text-sm text-neutral-700">{methodLabel(row.method)}</span>
      ),
    },
    {
      key: 'purchasePrice',
      title: 'Nguyên giá',
      align: 'right',
      width: 130,
      render: (_, row) => (
        <span className="tabular-nums text-sm">
          {fmtMoneyFull(row.purchasePrice)}
        </span>
      ),
    },
    {
      key: 'monthlyAmount',
      title: 'Khấu hao kỳ',
      align: 'right',
      width: 130,
      render: (_, row) => (
        <span className="tabular-nums text-sm font-medium text-neutral-900">
          {fmtMoneyFull(row.monthlyAmount)}
        </span>
      ),
    },
    {
      key: 'remainingValue',
      title: 'Giá trị còn lại',
      align: 'right',
      width: 140,
      render: (_, row) => (
        <span className="tabular-nums text-sm">
          {fmtMoneyFull(row.remainingValue)}
        </span>
      ),
    },
    {
      key: 'months',
      title: 'Số tháng',
      align: 'right',
      width: 80,
      render: (_, row) => (
        <span className="tabular-nums text-sm">{row.months ?? '—'}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: 130,
      render: (_, row) => {
        const b = scheduleBadge(row.status)
        return <StatusBadge label={b.label} color={b.color} icon={b.icon} />
      },
    },
  ]

  const postingColumns: AppTableColumn<DepreciationPostingDto>[] = [
    {
      key: 'period',
      title: 'Kỳ',
      width: 90,
      render: (_, row) => (
        <button
          type="button"
          className="font-mono text-xs text-primary-700 hover:underline"
          onClick={() => {
            setYear(row.periodYear)
            setMonth(row.periodMonth)
            setPreviewOn(true)
          }}
          title="Chọn kỳ này để xem trước / ghi sổ"
        >
          {String(row.periodMonth).padStart(2, '0')}/{row.periodYear}
        </button>
      ),
    },
    {
      key: 'totalAmount',
      title: 'Số tiền',
      align: 'right',
      width: 140,
      render: (_, row) => (
        <span className="tabular-nums text-sm font-semibold">
          {fmtMoneyFull(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'scheduleCount',
      title: 'Số dòng',
      align: 'right',
      width: 90,
      render: (_, row) => (
        <span className="tabular-nums text-sm">{row.scheduleCount ?? '—'}</span>
      ),
    },
    {
      key: 'journalEntryId',
      title: 'Chứng từ kế toán',
      render: (_, row) =>
        row.journalEntryId ? (
          <Link
            to="/accounting/journals"
            className="font-mono text-xs text-primary-700 underline underline-offset-2"
            title="Mở sổ nhật ký"
          >
            {row.journalEntryId}
          </Link>
        ) : (
          <span className="text-neutral-400 text-sm">—</span>
        ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      width: 140,
      render: (_, row) => {
        const b = postingBadge(row.status)
        return (
          <div>
            <StatusBadge label={b.label} color={b.color} icon={b.icon} />
            {row.errorMessage && (
              <div className="text-[11px] text-danger-dark mt-1 max-w-[220px] truncate" title={row.errorMessage}>
                {row.errorMessage}
              </div>
            )}
          </div>
        )
      },
    },
  ]

  if (!canView) {
    return (
      <div className="p-6 animate-fade-in">
        <PageHeader
          title="Khấu hao tài sản"
          description="Chọn kỳ, xem trước tổng chi phí, xác nhận rồi ghi sổ kế toán."
          actions={<PageGuideButton guide={DEPRECIATION_GUIDE} />}
        />
        <div className="mt-4 border rounded-xl bg-white">
          <EmptyState
            icon={Landmark}
            title="Bạn không có quyền xem khấu hao"
            description="Liên hệ quản trị để được cấp quyền xem khấu hao định kỳ."
          />
        </div>
      </div>
    )
  }

  const schedulesBusy = schedulesLoading || schedulesFetching
  const showKpi = !schedulesLoading && !schedulesError && schedules.length > 0

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Khấu hao tài sản"
        description="Chọn kỳ → xem trước → ghi sổ. Chạy lại cùng kỳ không ghi đôi."
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <PageGuideButton guide={DEPRECIATION_GUIDE} />
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={schedulesBusy || postingsFetching}
              onClick={refreshAll}
            >
              <RefreshCw
                size={14}
                className={
                  schedulesFetching || postingsFetching || previewLoading
                    ? 'animate-spin'
                    : ''
                }
              />
              Làm mới
            </Button>
            <Link to="/admin/qlts">
              <Button variant="outline" className="gap-1.5">
                <Package size={14} />
                Danh sách tài sản
              </Button>
            </Link>
          </div>
        }
      />

      {/* Pipeline ngắn: Chọn kỳ → Xem trước → Ghi sổ */}
      <ol className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
        {[
          { n: 1, label: 'Chọn kỳ', active: true },
          { n: 2, label: 'Xem trước', active: !!preview || previewLoading },
          {
            n: 3,
            label: 'Ghi sổ',
            active: displayStatus === 'POSTED',
          },
        ].map((step, i) => (
          <li key={step.n} className="inline-flex items-center gap-2">
            {i > 0 && <span className="text-neutral-300">→</span>}
            <span
              className={
                step.active
                  ? 'inline-flex items-center gap-1.5 font-medium text-primary-800'
                  : 'inline-flex items-center gap-1.5'
              }
            >
              <span
                className={
                  step.active
                    ? 'w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] flex items-center justify-center'
                    : 'w-5 h-5 rounded-full bg-neutral-200 text-neutral-600 text-[10px] flex items-center justify-center'
                }
              >
                {step.n}
              </span>
              {step.label}
            </span>
          </li>
        ))}
      </ol>

      {/* KPI strip */}
      {showKpi && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Tổng tài sản"
            value={kpis.assetCount}
            hint="Lịch đang hiệu lực"
            className="!p-4"
          />
          <StatCard
            label="Giá trị còn lại"
            value={fmtMoneyFull(kpis.remaining)}
            hint="Tổng GTCL các lịch hiệu lực"
            className="!p-4"
          />
          <StatCard
            label="Khấu hao kỳ"
            value={fmtMoneyFull(kpis.periodDep)}
            hint={`Kỳ ${periodLabel}`}
            className="!p-4"
          />
          <StatCard
            label="Số dòng"
            value={kpis.lineCount}
            hint="Dòng sẽ ghi sổ kỳ này"
            className="!p-4"
          />
        </div>
      )}

      {/* Sticky filter + period actions */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-2 bg-neutral-50/95 backdrop-blur border-y border-neutral-200/80 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-xs text-neutral-500 inline-flex flex-col gap-0.5">
            Năm
            <input
              type="number"
              className="h-9 w-24 border rounded-md px-3 text-sm bg-white tabular-nums"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())}
              aria-label="Năm kỳ khấu hao"
            />
          </label>
          <label className="text-xs text-neutral-500 inline-flex flex-col gap-0.5">
            Tháng
            <div className="w-28">
              <Select
                options={Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
                  value: String(m),
                  label: `Tháng ${m}`,
                }))}
                value={String(month)}
                onChange={(v) => setMonth(Number(v))}
                placeholder="Tháng"
                aria-label="Tháng kỳ khấu hao"
                showSearch={false}
              />
            </div>
          </label>
          <label className="text-xs text-neutral-500 inline-flex flex-col gap-0.5">
            Trạng thái lịch
            <div className="min-w-[150px]">
              <Select
                options={[
                  { value: '', label: 'Tất cả trạng thái' },
                  { value: 'ACTIVE', label: 'Đang hiệu lực' },
                  { value: 'DONE', label: 'Hoàn tất' },
                  { value: 'CANCELLED', label: 'Đã huỷ' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Trạng thái"
                aria-label="Lọc trạng thái lịch khấu hao"
                showSearch={false}
              />
            </div>
          </label>
          <label className="text-xs text-neutral-500 inline-flex flex-col gap-0.5">
            Năm lịch sử
            <div className="w-28">
              <Select
                options={[
                  { value: '', label: 'Tất cả năm' },
                  ...Array.from(
                    new Set([
                      ...postings.map((p) => p.periodYear).filter(Boolean),
                      year,
                    ]),
                  )
                    .sort((a, b) => Number(b) - Number(a))
                    .map((y) => ({ value: String(y), label: String(y) })),
                ]}
                value={historyYearFilter}
                onChange={setHistoryYearFilter}
                placeholder="Năm"
                aria-label="Lọc năm lịch sử ghi sổ"
                showSearch={false}
              />
            </div>
          </label>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="mt-4" onClick={clearFilters}>
              Xoá lọc
            </Button>
          )}
          <span className="text-xs text-neutral-500 ml-auto tabular-nums mt-4">
            {filteredSchedules.length} lịch
            {hasFilters ? ' (đã lọc)' : ''}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-200/60">
          <span className="text-sm font-semibold text-neutral-800">
            Kỳ {periodLabel}
          </span>
          <StatusBadge label={badge.label} color={badge.color} icon={badge.icon} />
          {preview && !previewError && (
            <span className="text-xs text-neutral-600 tabular-nums">
              Tổng {fmtMoneyFull(preview.totalAmount)} · {preview.scheduleCount ?? 0}{' '}
              dòng
            </span>
          )}
          {existingPosted && (
            <span className="text-xs text-success-dark">
              Đã ghi sổ
              {existingPosted.journalEntryId
                ? ` · chứng từ ${existingPosted.journalEntryId}`
                : ''}
            </span>
          )}
          <div className="flex flex-wrap gap-2 ml-auto">
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={previewLoading}
              onClick={() => {
                setPreviewOn(true)
                void refetchPreview()
              }}
            >
              {previewLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Eye size={14} />
              )}
              Xem trước / Tính khấu hao
            </Button>
            {canPost && (
              <Button
                className="gap-1.5"
                disabled={post.isPending || !!existingPosted}
                onClick={() => setConfirmOpen(true)}
              >
                {post.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Landmark size={14} />
                )}
                Ghi sổ
              </Button>
            )}
          </div>
        </div>
      </div>

      {previewError && (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được xem trước kỳ"
            message="Vui lòng thử lại. Nếu lỗi tiếp diễn, kiểm tra kết nối hoặc quyền truy cập."
            onRetry={() => void refetchPreview()}
            isRetrying={previewLoading}
          />
        </div>
      )}

      {/* Dòng khấu hao */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-800">
          Dòng khấu hao
        </h2>
        {schedulesError ? (
          <div className="border rounded-xl bg-white">
            <ErrorState
              title="Không tải được lịch khấu hao"
              message="Vui lòng thử lại. Nếu lỗi tiếp diễn, kiểm tra kết nối hoặc quyền truy cập."
              onRetry={() => void refetchSchedules()}
              isRetrying={schedulesFetching}
            />
          </div>
        ) : !schedulesLoading && filteredSchedules.length === 0 ? (
          <div className="border rounded-xl bg-white">
            <EmptyState
              icon={Calculator}
              title={
                schedules.length === 0
                  ? 'Chưa có lịch khấu hao'
                  : 'Không có lịch phù hợp bộ lọc'
              }
              description={
                schedules.length === 0
                  ? 'Mở danh sách tài sản → chọn tài sản có giá mua → tab Khấu hao → Sinh lịch.'
                  : 'Thử đổi trạng thái lịch hoặc bấm Xoá lọc.'
              }
              action={
                    schedules.length === 0
                  ? {
                      label: 'Mở danh sách tài sản',
                      onClick: () => nav('/admin/qlts'),
                    }
                  : {
                      label: 'Xoá lọc',
                      onClick: clearFilters,
                    }
              }
            />
          </div>
        ) : (
          <AppTable
            columns={scheduleColumns}
            data={filteredSchedules}
            isLoading={schedulesLoading}
            loadingRows={6}
            density="compact"
            onRefresh={() => void refetchSchedules()}
          />
        )}
      </section>

      {/* Lịch sử ghi sổ */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-800">
          Lịch sử ghi sổ
        </h2>
        {postingsError ? (
          <div className="border rounded-xl bg-white">
            <ErrorState
              title="Không tải được lịch sử ghi sổ"
              message="Vui lòng thử lại. Nếu lỗi tiếp diễn, kiểm tra kết nối hoặc quyền truy cập."
              onRetry={() => void refetchPostings()}
              isRetrying={postingsFetching}
            />
          </div>
        ) : !postingsLoading && filteredPostings.length === 0 ? (
          <div className="border rounded-xl bg-white">
            <EmptyState
              icon={Landmark}
              title={
                postings.length === 0
                  ? 'Chưa có lần ghi sổ nào'
                  : 'Không có kỳ phù hợp bộ lọc năm'
              }
              description={
                postings.length === 0
                  ? 'Chọn kỳ → Xem trước / Tính khấu hao → Ghi sổ để tạo lần ghi đầu tiên.'
                  : 'Thử đổi năm lịch sử hoặc bấm Xoá lọc.'
              }
              action={
                postings.length === 0
                  ? {
                      label: 'Xem trước kỳ này',
                      onClick: () => {
                        setPreviewOn(true)
                        void refetchPreview()
                      },
                    }
                  : {
                      label: 'Xoá lọc',
                      onClick: clearFilters,
                    }
              }
            />
          </div>
        ) : (
          <AppTable
            columns={postingColumns}
            data={filteredPostings}
            isLoading={postingsLoading}
            loadingRows={4}
            density="compact"
            onRefresh={() => void refetchPostings()}
          />
        )}
      </section>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          if (!post.isPending) setConfirmOpen(false)
        }}
        onConfirm={() => {
          post.mutate(
            { year, month },
            { onSettled: () => setConfirmOpen(false) },
          )
        }}
        title={`Ghi sổ khấu hao kỳ ${periodLabel}?`}
        message={
          <span>
            {existingPosted ? (
              <>
                Kỳ này <strong>đã ghi sổ</strong>
                {existingPosted.journalEntryId
                  ? ` (chứng từ ${existingPosted.journalEntryId})`
                  : ''}
                . Chạy lại sẽ trả chứng từ cũ — <strong>không ghi đôi</strong>.
              </>
            ) : (
              <>
                Tổng dự kiến:{' '}
                <strong className="tabular-nums">
                  {fmtMoneyFull(preview?.totalAmount)}
                </strong>
                {' · '}
                {preview?.scheduleCount ?? 0} dòng lịch.
                <br />
                Không hoàn tác dễ — kiểm tra kỳ trước khi xác nhận.
              </>
            )}
          </span>
        }
        confirmText={existingPosted ? 'Ghi sổ lại (không ghi đôi)' : 'Ghi sổ'}
        cancelText="Huỷ"
        variant="warning"
        isLoading={post.isPending}
      />
    </div>
  )
}
