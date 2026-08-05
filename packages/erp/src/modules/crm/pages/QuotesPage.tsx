import { useMemo, useState } from 'react'
import { AlarmClock, Search, Send, CheckCircle2, XCircle, FileText } from 'lucide-react'
import {
  PageHeader, PageGuideButton, ConfirmDialog, EmptyState, ErrorState, Select, RowActions,
  type PageGuideConfig,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { formatCurrency, formatDate } from '@frezo/utils'
import { useQuotes, useSetQuoteStatus } from '../hooks/useCrm'
import type { Quote, QuoteStatus } from '../services/crmApi'
import { pageRootClass } from '@/modules/accounting/utils/pageEmbed'

const QUOTES_GUIDE: PageGuideConfig = {
  title: 'Báo giá',
  subtitle: 'Theo dõi báo giá từ nháp → gửi → duyệt / từ chối.',
  sections: [
    {
      heading: 'Luồng trạng thái',
      type: 'steps',
      steps: [
        { title: 'Nháp', description: 'Báo giá mới tạo, chưa gửi khách.' },
        { title: 'Đã gửi', description: 'Khách đang xem xét — có thể duyệt hoặc từ chối.' },
        { title: 'Được duyệt / Bị từ chối', description: 'Kết thúc vòng đời báo giá.' },
      ],
    },
  ],
}

function ExpiryBadge({ validUntil, status }: { validUntil?: string; status: QuoteStatus }) {
  if (!validUntil) return <span className="text-neutral-400 text-xs">—</span>
  if (status === 'ACCEPTED' || status === 'REJECTED') {
    return <span className="text-neutral-400 text-xs">{formatDate(validUntil)}</span>
  }
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const exp = new Date(validUntil)
  exp.setHours(0, 0, 0, 0)
  const days = Math.round((exp.getTime() - now.getTime()) / 86400000)
  const cls =
    days < 0
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : days <= 3
        ? 'bg-orange-50 text-orange-700 border-orange-200'
        : days <= 7
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
  const label =
    days < 0 ? `Quá hạn ${Math.abs(days)}d` : days === 0 ? 'Hết hôm nay' : `Còn ${days}d`
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}
      title={`Hạn: ${formatDate(validUntil)}`}
    >
      <AlarmClock size={11} /> {label}
    </span>
  )
}

const STATUS_TONE: Record<QuoteStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  SENT: 'bg-blue-50 text-blue-700 border-blue-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  EXPIRED: 'bg-neutral-100 text-neutral-500 border-neutral-200',
}

const STATUS_LABEL: Record<QuoteStatus, string> = {
  DRAFT: 'Nháp', SENT: 'Đã gửi', ACCEPTED: 'Được duyệt', REJECTED: 'Bị từ chối', EXPIRED: 'Hết hạn',
}

type ConfirmAction = { id: string; code: string; status: QuoteStatus; next: QuoteStatus }

export function QuotesPage({ embedded }: { embedded?: boolean } = {}) {
  const { data: rows, isLoading, isError, isFetching, refetch } = useQuotes()
  const setStatus = useSetQuoteStatus()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'ALL'>('ALL')
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const list = useMemo(() => (Array.isArray(rows) ? (rows as Quote[]) : []), [rows])

  const filtered = useMemo(() => {
    let result = list
    if (statusFilter !== 'ALL') {
      result = result.filter((v) => v.status === statusFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (v) =>
          v.code.toLowerCase().includes(q) ||
          (v.customerName || '').toLowerCase().includes(q),
      )
    }
    return result
  }, [list, search, statusFilter])

  const hasFilter = !!search.trim() || statusFilter !== 'ALL'
  const isFilteredEmpty = !isLoading && !isError && list.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && list.length === 0

  const confirmLabels: Record<QuoteStatus, { title: string; message: string; confirm: string; variant: 'warning' | 'danger' | 'default' }> = {
    DRAFT: { title: '', message: '', confirm: '', variant: 'default' },
    SENT: {
      title: 'Gửi báo giá?',
      message: 'Báo giá sẽ chuyển sang Đã gửi — khách có thể xem xét.',
      confirm: 'Gửi',
      variant: 'warning',
    },
    ACCEPTED: {
      title: 'Duyệt báo giá?',
      message: 'Báo giá sẽ được đánh dấu Được duyệt.',
      confirm: 'Duyệt',
      variant: 'default',
    },
    REJECTED: {
      title: 'Từ chối báo giá?',
      message: 'Báo giá sẽ bị từ chối — không thể hoàn tác trực tiếp.',
      confirm: 'Từ chối',
      variant: 'danger',
    },
    EXPIRED: { title: '', message: '', confirm: '', variant: 'default' },
  }

  const columns: AppTableColumn<Quote>[] = [
    {
      key: 'code',
      title: 'Mã BG',
      render: (_, q) => (
        <span className="font-mono font-semibold text-blue-700">{q.code}</span>
      ),
    },
    { key: 'customerName', title: 'Khách hàng', render: (_, q) => q.customerName || '—' },
    {
      key: 'issuedDate',
      title: 'Ngày phát hành',
      render: (_, q) => (q.issuedDate ? formatDate(q.issuedDate) : '—'),
    },
    {
      key: 'validUntil',
      title: 'Hạn',
      render: (_, q) => <ExpiryBadge validUntil={q.validUntil} status={q.status} />,
    },
    {
      key: 'total',
      title: 'Giá trị',
      align: 'right',
      render: (_, q) => (
        <span className="font-mono font-semibold tabular-nums">{formatCurrency(q.total)}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      align: 'center',
      render: (_, q) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${STATUS_TONE[q.status]}`}>
          {STATUS_LABEL[q.status]}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      width: 180,
      render: (_, q) => (
        <RowActions
          align="end"
          actions={[
            {
              key: 'send',
              icon: Send,
              tooltip: 'Gửi báo giá',
              tone: 'blue',
              hidden: q.status !== 'DRAFT',
              onClick: () => setConfirmAction({ id: q.id, code: q.code, status: q.status, next: 'SENT' }),
            },
            {
              key: 'accept',
              icon: CheckCircle2,
              tooltip: 'Duyệt',
              tone: 'emerald',
              hidden: q.status !== 'SENT',
              onClick: () => setConfirmAction({ id: q.id, code: q.code, status: q.status, next: 'ACCEPTED' }),
            },
            {
              key: 'reject',
              icon: XCircle,
              tooltip: 'Từ chối',
              tone: 'rose',
              hidden: q.status !== 'SENT',
              onClick: () => setConfirmAction({ id: q.id, code: q.code, status: q.status, next: 'REJECTED' }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className={pageRootClass(embedded)}>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-neutral-600">
            Báo giá — nháp → gửi → duyệt / từ chối.
            <span className="ml-2 text-xs text-neutral-400 tabular-nums">
              {filtered.length} báo giá{hasFilter ? ' (đã lọc)' : ''}
            </span>
          </p>
          <PageGuideButton guide={QUOTES_GUIDE} />
        </div>
      ) : (
        <PageHeader
          title="Báo giá"
          description="Quản lý báo giá cho khách hàng — theo dõi từ khi gửi đến lúc được duyệt hoặc từ chối."
          actions={<PageGuideButton guide={QUOTES_GUIDE} />}
        />
      )}

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => {
          setSearch('')
          setStatusFilter('ALL')
        }}
        countLabel={`${filtered.length} báo giá${hasFilter ? ' (đã lọc)' : ''}`}
      >
        <div className="min-w-[150px]">
          <Select
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              ...(Object.keys(STATUS_LABEL) as QuoteStatus[]).map((s) => ({
                value: s,
                label: STATUS_LABEL[s],
              })),
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as QuoteStatus | 'ALL')}
            placeholder="Trạng thái"
            showSearch={false}
            aria-label="Lọc trạng thái"
          />
        </div>
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
            placeholder="Tìm mã báo giá hoặc khách hàng…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm báo giá"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được báo giá"
            message="Kiểm tra kết nối hoặc quyền truy cập rồi thử lại."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={FileText}
            title={isFilteredEmpty ? 'Không có báo giá khớp bộ lọc' : 'Chưa có báo giá nào'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi trạng thái.'
                : 'Báo giá mới sẽ xuất hiện khi tạo từ CRM.'
            }
            action={isFilteredEmpty ? { label: 'Xoá lọc', onClick: () => { setSearch(''); setStatusFilter('ALL') } } : undefined}
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          onRefresh={() => void refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => {
          if (!setStatus.isPending) setConfirmAction(null)
        }}
        onConfirm={() => {
          if (!confirmAction) return
          setStatus.mutate(
            { id: confirmAction.id, status: confirmAction.next },
            { onSettled: () => setConfirmAction(null) },
          )
        }}
        title={confirmAction ? `${confirmLabels[confirmAction.next].title} (${confirmAction.code})` : ''}
        message={confirmAction ? confirmLabels[confirmAction.next].message : ''}
        confirmText={confirmAction ? confirmLabels[confirmAction.next].confirm : 'Xác nhận'}
        cancelText="Huỷ"
        variant={confirmAction ? confirmLabels[confirmAction.next].variant : 'default'}
        isLoading={setStatus.isPending}
      />
    </div>
  )
}
