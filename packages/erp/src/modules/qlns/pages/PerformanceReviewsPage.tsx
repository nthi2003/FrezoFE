// ============================================================
// PerformanceReviewsPage — create / submit / manager-score
// R12: ErrorState+retry · ConfirmDialog submit · ẩn manager score nếu không quyền
// ============================================================

import { useMemo, useState } from 'react'
import { Plus, Star, Search } from 'lucide-react'
import { Button, PageHeader, AppModal, EmptyState, ErrorState, ConfirmDialog, PageGuideButton } from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  usePerformanceReviews,
  useCreatePerformanceReview,
  useSubmitPerformanceReview,
  useManagerScoreReview,
} from '../hooks/usePerformance'
import type {
  PerformanceReviewDto,
  PerformanceReviewRequest,
} from '../services/performanceApi'
import { usePermission } from '@/lib/hooks/usePermission'
import { StatusPipelineStepper } from '../../warehouse/components/StatusPipelineStepper'
import { KPI_PIPELINE } from '../constants/hrWorkflow'
import { KPI_GUIDE } from '../constants/kpi.guide'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã gửi',
  SCORED: 'Đã chấm',
  CLOSED: 'Đã đóng',
}

export function PerformanceReviewsPage() {
  const { data: rows = [], isLoading, isError, refetch, isFetching } =
    usePerformanceReviews()
  const create = useCreatePerformanceReview()
  const submit = useSubmitPerformanceReview()
  const managerScore = useManagerScoreReview()
  const canManagerScore =
    usePermission('QLNS.PERFORMANCE.SCORE') || usePermission('LEAVE.APPROVE')
  const [open, setOpen] = useState(false)
  const [scoreTarget, setScoreTarget] = useState<PerformanceReviewDto | null>(null)
  const [score, setScore] = useState(3)
  const [comments, setComments] = useState('')
  const [submitTarget, setSubmitTarget] = useState<PerformanceReviewDto | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<PerformanceReviewRequest>({
    cycleId: '2025-Q3',
    personId: '',
    selfScore: 3,
    selfComment: '',
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        (r.cycleId || '').toLowerCase().includes(q) ||
        (r.personId || '').toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q),
    )
  }, [rows, search])

  const hasFilter = !!search.trim()
  const isFilteredEmpty = !isLoading && !isError && rows.length > 0 && filtered.length === 0
  const isFullyEmpty = !isLoading && !isError && rows.length === 0

  const clearFilters = () => setSearch('')

  const columns: AppTableColumn<PerformanceReviewDto>[] = useMemo(() => [
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
      render: (_, r) => <span className="font-mono text-xs">{r.personId}</span>,
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
        return (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border bg-neutral-50">
            {STATUS_LABEL[st] || r.status}
          </span>
        )
      },
    },
    {
      key: 'actions',
      title: 'Thao tác',
      align: 'right',
      render: (_, r) => (
        <div className="space-x-1">
          {(r.status || '').toUpperCase() === 'DRAFT' && (
            <Button
              size="sm"
              variant="outline"
              disabled={submit.isPending}
              onClick={() => setSubmitTarget(r)}
            >
              Gửi
            </Button>
          )}
          {canManagerScore &&
            ['SUBMITTED', 'SCORED'].includes((r.status || '').toUpperCase()) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setScoreTarget(r)
                  setScore(r.managerScore ?? 3)
                  setComments(r.managerComment || '')
                }}
              >
                Chấm điểm QL
              </Button>
            )}
        </div>
      ),
    },
  ], [canManagerScore, submit.isPending])

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Đánh giá hiệu suất"
        description="Chu kỳ review — nộp tự đánh giá rồi quản lý chấm điểm."
        actions={
          <>
            <PageGuideButton guide={KPI_GUIDE} />
            <Button className="gap-1.5" onClick={() => setOpen(true)}>
              <Plus size={14} /> Tạo đánh giá
            </Button>
          </>
        }
      />

      <StatusPipelineStepper steps={KPI_PIPELINE} currentIndex={2} />

      {!isFullyEmpty && (
        <FilterBar
          hasActiveFilters={hasFilter}
          onClear={clearFilters}
          countLabel={`${filtered.length} đánh giá${hasFilter ? ' (đã lọc)' : ''}`}
        >
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              className="w-full h-9 pl-9 pr-3 border rounded-md text-sm bg-white"
              placeholder="Tìm chu kỳ, nhân sự, trạng thái…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm đánh giá"
            />
          </div>
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
                : { label: 'Tạo đánh giá', onClick: () => setOpen(true) }
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
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
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
          <Field label="Mã chu kỳ *">
            <input
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
              value={form.cycleId}
              onChange={(e) => setForm({ ...form, cycleId: e.target.value })}
            />
          </Field>
          <Field label="Mã nhân sự *">
            <input
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
              value={form.personId}
              onChange={(e) => setForm({ ...form, personId: e.target.value })}
            />
          </Field>
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
                create.mutate(form, { onSuccess: () => setOpen(false) })
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
        title={`Chấm điểm quản lý — ${scoreTarget?.personId || ''}`}
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
