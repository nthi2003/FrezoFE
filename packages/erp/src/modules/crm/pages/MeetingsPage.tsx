// ============================================================
// MeetingsPage — AppTable + FilterBar sticky + ConfirmDialog
// ============================================================

import { useMemo, useState } from 'react'
import { Plus, Calendar, Search } from 'lucide-react'
import {
  Button, PageHeader, PageGuideButton, AppModal, EmptyState, ErrorState, ConfirmDialog,
} from '@frezo/ui'
import { AppTable } from '@/components/ui/AppTable'
import type { AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  useMeetings,
  useCreateMeeting,
  useCancelMeeting,
} from '../hooks/useMeetings'
import { MEETINGS_GUIDE } from '../constants/meetings.guide'
import { pageRootClass } from '@/modules/accounting/utils/pageEmbed'
import type { MeetingDto } from '../services/meetingsApi'

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Đã lên lịch',
  COMPLETED: 'Đã họp',
  CANCELLED: 'Đã huỷ',
  DONE: 'Đã họp',
}

function formatStatus(status?: string) {
  if (!status) return '—'
  const key = status.toUpperCase()
  return STATUS_LABEL[key] || status
}

export function MeetingsPage({ embedded }: { embedded?: boolean } = {}) {
  const { data: list = [], isLoading, isError, refetch, isFetching } = useMeetings()
  const create = useCreateMeeting()
  const cancel = useCancelMeeting()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelTarget, setCancelTarget] = useState<MeetingDto | null>(null)
  const [form, setForm] = useState({
    title: '',
    startAt: '',
    endAt: '',
    location: '',
    dealId: '',
    customerId: '',
    notes: '',
  })

  const sorted = useMemo(
    () =>
      [...list].sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    [list],
  )

  const filtered = useMemo(() => {
    let rows = sorted
    if (statusFilter) {
      rows = rows.filter((m) => (m.status || '').toUpperCase() === statusFilter)
    }
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (m) =>
          (m.title || '').toLowerCase().includes(q) ||
          (m.location || '').toLowerCase().includes(q) ||
          (m.dealId || '').toLowerCase().includes(q) ||
          (m.customerId || '').toLowerCase().includes(q),
      )
    }
    return rows
  }, [sorted, search, statusFilter])

  const hasFilter = !!search.trim() || !!statusFilter
  const isFilteredEmpty = !isLoading && !isError && list.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && list.length === 0

  const columns: AppTableColumn<MeetingDto>[] = [
    {
      key: 'title',
      title: 'Tiêu đề',
      render: (_, row) => (
        <span className="font-medium text-neutral-900">{row.title || '—'}</span>
      ),
    },
    {
      key: 'startAt',
      title: 'Thời gian',
      render: (_, row) => (
        <span className="text-sm text-neutral-700 tabular-nums">
          {row.startAt ? new Date(row.startAt).toLocaleString('vi-VN') : '—'}
          {row.endAt ? ` → ${new Date(row.endAt).toLocaleTimeString('vi-VN')}` : ''}
        </span>
      ),
    },
    {
      key: 'location',
      title: 'Địa điểm',
      render: (_, row) => (
        <span className="text-sm text-neutral-600">{row.location || '—'}</span>
      ),
    },
    {
      key: 'links',
      title: 'Liên kết',
      render: (_, row) => (
        <span className="text-xs text-neutral-500 font-mono truncate max-w-[180px] block" title={[row.dealId, row.customerId].filter(Boolean).join(' · ')}>
          {[row.dealId, row.customerId].filter(Boolean).join(' · ') || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, row) => {
        const st = (row.status || '').toUpperCase()
        const tone =
          st === 'CANCELLED'
            ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
            : st === 'COMPLETED' || st === 'DONE'
              ? 'bg-success-light text-success-dark border-success/30'
              : 'bg-info-light text-info-dark border-info/30'
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${tone}`}>
            {formatStatus(row.status)}
          </span>
        )
      },
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      width: 100,
      render: (_, row) =>
        (row.status || '').toUpperCase() !== 'CANCELLED' ? (
          <Button
            size="sm"
            variant="outline"
            disabled={cancel.isPending}
            onClick={() => setCancelTarget(row)}
          >
            Huỷ
          </Button>
        ) : null,
    },
  ]

  const headerActions = (
    <div className="flex items-center gap-2">
      <PageGuideButton guide={MEETINGS_GUIDE} />
      <Button className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus size={14} /> Tạo họp
      </Button>
    </div>
  )

  return (
    <div className={pageRootClass(embedded)}>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-neutral-600">
            Cuộc họp gắn deal hoặc khách hàng.
            <span className="ml-2 text-xs text-neutral-400 tabular-nums">
              {filtered.length} cuộc họp{hasFilter ? ' (đã lọc)' : ''}
            </span>
          </p>
          {headerActions}
        </div>
      ) : (
        <PageHeader
          title="Lịch họp"
          description="Cuộc họp gắn với cơ hội bán hoặc khách hàng."
          actions={headerActions}
        />
      )}

      <FilterBar
        hasActiveFilters={hasFilter}
        onClear={() => {
          setSearch('')
          setStatusFilter('')
        }}
        countLabel={`${filtered.length} cuộc họp${hasFilter ? ' (đã lọc)' : ''}`}
        selects={[
          {
            id: 'status',
            label: 'Trạng thái',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'SCHEDULED', label: 'Đã lên lịch' },
              { value: 'COMPLETED', label: 'Đã họp' },
              { value: 'CANCELLED', label: 'Đã huỷ' },
            ],
          },
        ]}
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 text-sm border rounded-md bg-white"
            placeholder="Tìm tiêu đề, địa điểm…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Tìm cuộc họp"
          />
        </div>
      </FilterBar>

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được lịch họp"
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Calendar}
            title={isFilteredEmpty ? 'Không có cuộc họp khớp bộ lọc' : 'Chưa có cuộc họp'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi từ khoá.'
                : 'Tạo cuộc họp gắn với cơ hội bán hoặc khách hàng.'
            }
            action={
              isFilteredEmpty
                ? {
                    label: 'Xoá lọc',
                    onClick: () => {
                      setSearch('')
                      setStatusFilter('')
                    },
                  }
                : { label: 'Tạo họp', onClick: () => setOpen(true) }
            }
          />
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          density="compact"
          showSearch={false}
          onRefresh={() => void refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Huỷ cuộc họp?"
        message={
          cancelTarget
            ? `「${cancelTarget.title}」 sẽ chuyển sang trạng thái đã huỷ.`
            : ''
        }
        confirmText="Huỷ họp"
        cancelText="Giữ lại"
        variant="danger"
        isLoading={cancel.isPending}
        onConfirm={() => {
          if (!cancelTarget) return
          cancel.mutate(cancelTarget.id, {
            onSuccess: () => setCancelTarget(null),
          })
        }}
      />

      <AppModal isOpen={open} onClose={() => setOpen(false)} title="Tạo cuộc họp">
        <div className="space-y-3">
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Tiêu đề"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-neutral-500 space-y-1">
              Bắt đầu
              <input
                type="datetime-local"
                className="w-full border rounded-md px-2 py-1.5 text-sm"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              />
            </label>
            <label className="text-xs text-neutral-500 space-y-1">
              Kết thúc
              <input
                type="datetime-local"
                className="w-full border rounded-md px-2 py-1.5 text-sm"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              />
            </label>
          </div>
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Địa điểm"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <input
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder="Mã cơ hội bán (tuỳ chọn)"
            value={form.dealId}
            onChange={(e) => setForm({ ...form, dealId: e.target.value })}
          />
          <input
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder="Mã khách hàng (tuỳ chọn)"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          />
          <textarea
            rows={2}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Ghi chú"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button
              disabled={!form.title.trim() || !form.startAt || create.isPending}
              onClick={() =>
                create.mutate(
                  {
                    title: form.title,
                    startAt: form.startAt.includes('T')
                      ? form.startAt.length === 16
                        ? `${form.startAt}:00`
                        : form.startAt
                      : form.startAt,
                    endAt: form.endAt
                      ? form.endAt.length === 16
                        ? `${form.endAt}:00`
                        : form.endAt
                      : undefined,
                    location: form.location || undefined,
                    dealId: form.dealId || undefined,
                    customerId: form.customerId || undefined,
                    notes: form.notes || undefined,
                  },
                  {
                    onSuccess: () => {
                      setOpen(false)
                      setForm({
                        title: '',
                        startAt: '',
                        endAt: '',
                        location: '',
                        dealId: '',
                        customerId: '',
                        notes: '',
                      })
                    },
                  },
                )
              }
            >
              Tạo
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
