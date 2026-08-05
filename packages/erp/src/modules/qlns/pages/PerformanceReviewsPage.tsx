// ============================================================
// PerformanceReviewsPage — create / submit / manager-score
// Hub-embeddable: FilterBar + AppTable + RowActions + StatusBadge + Can
// ============================================================

import { useMemo, useState } from 'react'
import { Plus, Star, Search, Send, ClipboardCheck } from 'lucide-react'
import {
  Button,
  PageHeader,
  AppModal,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  PageGuideButton,
  RowActions,
  StatusBadge,
  Select,
  Label,
  type StatusColor,
} from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { Can } from '@/lib/permissions'
import { useAnyPermission } from '@/lib/hooks/usePermission'
import {
  usePerformanceReviews,
  useCreatePerformanceReview,
  useSubmitPerformanceReview,
  useManagerScoreReview,
} from '../hooks/usePerformance'
import { usePersonsCombobox } from '../hooks/usePerson'
import type {
  PerformanceReviewDto,
  PerformanceReviewRequest,
} from '../services/performanceApi'
import { KPI_GUIDE } from '../constants/kpi.guide'
import { pageRootClass } from '../utils/pageEmbed'

const CYCLES = ['2025-Q3', '2025-Q4', '2026-Q1', '2026-Q2', '2026-H1', '2026-H2']

const STATUS_META: Record<string, { label: string; color: StatusColor }> = {
  DRAFT: { label: 'Nháp', color: 'neutral' },
  SUBMITTED: { label: 'Đã gửi', color: 'warning' },
  SCORED: { label: 'Đã chấm', color: 'success' },
  CLOSED: { label: 'Đã đóng', color: 'info' },
}

const EMPTY_FORM: PerformanceReviewRequest = {
  cycleId: CYCLES[0],
  personId: '',
  selfScore: 3,
  selfComment: '',
}

export function PerformanceReviewsPage({ embedded }: { embedded?: boolean } = {}) {
  const { data, isLoading, isError, refetch, isFetching } = usePerformanceReviews()
  const rows = data ?? []
  const create = useCreatePerformanceReview()
  const submit = useSubmitPerformanceReview()
  const managerScore = useManagerScoreReview()
  const { options: personOptions } = usePersonsCombobox()

  const canCreate = useAnyPermission([
    'QLNS_PERFORMANCE_REVIEWS_CREATE',
    'QLNS.PERFORMANCE.REVIEWS.CREATE',
  ])
  const canManagerScore = useAnyPermission([
    'QLNS_PERFORMANCE_REVIEWS_ID_MANAGER_SCORE_CREATE',
    'QLNS.PERFORMANCE.REVIEWS.MANAGER_SCORE',
  ])
  const canSubmit = useAnyPermission([
    'QLNS_PERFORMANCE_REVIEWS_ID_SUBMIT_UPDATE',
    'QLNS.PERFORMANCE.REVIEWS.SUBMIT',
  ])

  const personMap = useMemo(
    () => new Map((personOptions ?? []).map((p) => [p.value, p.label])),
    [personOptions],
  )

  const [open, setOpen] = useState(false)
  const [scoreTarget, setScoreTarget] = useState<PerformanceReviewDto | null>(null)
  const [score, setScore] = useState(3)
  const [comments, setComments] = useState('')
  const [submitTarget, setSubmitTarget] = useState<PerformanceReviewDto | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form, setForm] = useState<PerformanceReviewRequest>(EMPTY_FORM)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter && (r.status || '').toUpperCase() !== statusFilter) return false
      if (!q) return true
      const personLabel = (personMap.get(r.personId) || '').toLowerCase()
      return (
        (r.cycleId || '').toLowerCase().includes(q) ||
        (r.personId || '').toLowerCase().includes(q) ||
        personLabel.includes(q) ||
        (r.status || '').toLowerCase().includes(q)
      )
    })
  }, [rows, search, statusFilter, personMap])

  const hasFilter = !!search.trim() || !!statusFilter
  const isFilteredEmpty = !isLoading && !isError && rows.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && rows.length === 0

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  const columns: AppTableColumn<PerformanceReviewDto>[] = useMemo(
    () => [
      {
        key: 'cycleId',
        title: 'Chu kỳ',
        render: (_, r) => (
          <span className="font-medium font-mono text-xs">{r.cycleId}</span>
        ),
      },
      {
        key: 'personId',
        title: 'Nhân sự',
        render: (_, r) => {
          const name = personMap.get(r.personId)
          return (
            <div className="min-w-0">
              <div className="font-medium text-neutral-900 truncate max-w-[200px]">
                {name || r.personId || '—'}
              </div>
              {name && (
                <div className="text-[11px] text-neutral-500 font-mono truncate max-w-[200px]">
                  {r.personId}
                </div>
              )}
            </div>
          )
        },
      },
      {
        key: 'selfScore',
        title: 'Tự đánh giá',
        align: 'center',
        render: (_, r) => (
          <span className="tabular-nums font-semibold">{r.selfScore ?? '—'}</span>
        ),
      },
      {
        key: 'managerScore',
        title: 'Quản lý',
        align: 'center',
        render: (_, r) => (
          <span className="tabular-nums font-semibold">{r.managerScore ?? '—'}</span>
        ),
      },
      {
        key: 'status',
        title: 'Trạng thái',
        align: 'center',
        render: (_, r) => {
          const st = (r.status || '').toUpperCase()
          const meta = STATUS_META[st] || { label: r.status || '—', color: 'neutral' as StatusColor }
          return <StatusBadge label={meta.label} color={meta.color} />
        },
      },
      {
        key: 'actions',
        title: 'Thao tác',
        align: 'right',
        width: 100,
        render: (_, r) => {
          const st = (r.status || '').toUpperCase()
          return (
            <RowActions
              align="end"
              actions={[
                {
                  key: 'submit',
                  icon: Send,
                  tooltip: 'Gửi đánh giá',
                  tone: 'emerald',
                  disabled: submit.isPending,
                  onClick: () => setSubmitTarget(r),
                  hidden: !(canSubmit && st === 'DRAFT'),
                },
                {
                  key: 'manager-score',
                  icon: ClipboardCheck,
                  tooltip: 'Chấm điểm quản lý',
                  tone: 'blue',
                  onClick: () => {
                    setScoreTarget(r)
                    setScore(r.managerScore ?? 3)
                    setComments(r.managerComment || '')
                  },
                  hidden: !(canManagerScore && ['SUBMITTED', 'SCORED'].includes(st)),
                },
              ]}
            />
          )
        },
      },
    ],
    [canManagerScore, canSubmit, personMap, submit.isPending],
  )

  const toolbar = (
    <>
      <PageGuideButton guide={KPI_GUIDE} />
      <Can
        anyOf={['QLNS_PERFORMANCE_REVIEWS_CREATE', 'QLNS.PERFORMANCE.REVIEWS.CREATE']}
        fallback={null}
      >
        <Button size={embedded ? 'sm' : 'default'} className="gap-1.5" onClick={openCreate}>
          <Plus size={14} /> Tạo đánh giá
        </Button>
      </Can>
    </>
  )

  return (
    <div className={pageRootClass(embedded)}>
      {!embedded && (
        <PageHeader
          title="Đánh giá hiệu suất"
          description="Chu kỳ review — nộp tự đánh giá rồi quản lý chấm điểm."
          actions={toolbar}
        />
      )}

      {embedded && (
        <div className="flex flex-wrap items-center justify-end gap-2">{toolbar}</div>
      )}

      {!isFullyEmpty && (
        <FilterBar
          hasActiveFilters={hasFilter}
          onClear={clearFilters}
          countLabel={`${filtered.length} đánh giá${hasFilter ? ' (đã lọc)' : ''}`}
        >
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
              placeholder="Tìm chu kỳ, nhân sự, trạng thái…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm đánh giá"
            />
          </div>
          <Select
            className="w-[160px]"
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              ...Object.entries(STATUS_META).map(([value, m]) => ({
                value,
                label: m.label,
              })),
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            showSearch={false}
            aria-label="Lọc trạng thái"
          />
        </FilterBar>
      )}

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được đánh giá"
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Star}
            title={isFilteredEmpty ? 'Không có đánh giá khớp bộ lọc' : 'Chưa có đánh giá'}
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi từ khoá tìm kiếm.'
                : 'Tạo review cho nhân viên (chu kỳ + mã nhân sự).'
            }
            action={
              isFilteredEmpty
                ? { label: 'Xoá lọc', onClick: clearFilters }
                : canCreate
                  ? { label: 'Tạo đánh giá', onClick: openCreate }
                  : undefined
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
          pageSize={10}
          pageSizeOptions={[10]}
          onRefresh={() => void refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={!!submitTarget}
        onClose={() => setSubmitTarget(null)}
        onConfirm={() => {
          if (!submitTarget) return
          submit.mutate(submitTarget.id, {
            onSuccess: () => setSubmitTarget(null),
          })
        }}
        title="Gửi đánh giá?"
        message="Sau khi gửi, bạn không sửa điểm tự đánh giá được. Quản lý sẽ chấm điểm."
        confirmText="Gửi"
        cancelText="Huỷ"
        isLoading={submit.isPending}
      />

      <AppModal isOpen={open} onClose={() => setOpen(false)} title="Tạo đánh giá">
        <div className="space-y-3">
          <div>
            <Label className="mb-1">Chu kỳ *</Label>
            <Select
              options={CYCLES.map((c) => ({ value: c, label: c }))}
              value={form.cycleId}
              onChange={(v) => setForm({ ...form, cycleId: v })}
              showSearch={false}
              aria-label="Chu kỳ đánh giá"
            />
          </div>
          <div>
            <Label className="mb-1">Nhân sự *</Label>
            <Select
              options={[
                { value: '', label: '— Chọn nhân viên —' },
                ...(personOptions ?? []),
              ]}
              value={form.personId}
              onChange={(v) => setForm({ ...form, personId: v })}
              aria-label="Nhân sự"
            />
          </div>
          <Field label="Điểm tự đánh giá">
            <input
              type="number"
              min={1}
              max={5}
              step={0.5}
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.selfScore ?? ''}
              onChange={(e) =>
                setForm({ ...form, selfScore: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Nhận xét tự đánh giá">
            <textarea
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.selfComment || ''}
              onChange={(e) =>
                setForm({ ...form, selfComment: e.target.value })
              }
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button
              disabled={
                create.isPending || !form.personId.trim() || !form.cycleId.trim()
              }
              onClick={() =>
                create.mutate(form, {
                  onSuccess: () => {
                    setOpen(false)
                    setForm(EMPTY_FORM)
                  },
                })
              }
            >
              Tạo
            </Button>
          </div>
        </div>
      </AppModal>

      <AppModal
        isOpen={!!scoreTarget}
        onClose={() => setScoreTarget(null)}
        title={`Chấm điểm quản lý — ${
          scoreTarget
            ? personMap.get(scoreTarget.personId) || scoreTarget.personId
            : ''
        }`}
      >
        <div className="space-y-3">
          <Field label="Điểm (1–5)">
            <input
              type="number"
              min={1}
              max={5}
              step={0.5}
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
            />
          </Field>
          <Field label="Nhận xét">
            <textarea
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setScoreTarget(null)}>
              Huỷ
            </Button>
            <Button
              disabled={managerScore.isPending}
              onClick={() => {
                if (!scoreTarget) return
                managerScore.mutate(
                  {
                    id: scoreTarget.id,
                    body: {
                      managerScore: score,
                      managerComment: comments || undefined,
                    },
                  },
                  { onSuccess: () => setScoreTarget(null) },
                )
              }}
            >
              Lưu điểm
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-neutral-700 mb-1 block">{label}</label>
      {children}
    </div>
  )
}
