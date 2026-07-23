// ============================================================
// PerformanceReviewsPage — create / submit / manager-score
// R12: ErrorState+retry · ConfirmDialog submit · ẩn manager score nếu không quyền
// ============================================================

import { useState } from 'react'
import { Plus, Star, Loader2 } from 'lucide-react'
import { Button, PageHeader, AppModal, EmptyState, ErrorState, ConfirmDialog } from '@frezo/ui'
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
  const [form, setForm] = useState<PerformanceReviewRequest>({
    cycleId: '2025-Q3',
    personId: '',
    selfScore: 3,
    selfComment: '',
  })

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Đánh giá hiệu suất"
        description="Chu kỳ review — submit self rồi manager chấm điểm."
        actions={
          <Button className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus size={14} /> Tạo đánh giá
          </Button>
        }
      />

      {isError ? (
        <div className="border rounded-xl bg-white">
          <ErrorState
            title="Không tải được đánh giá"
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isLoading ? (
        <div className="p-8 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-neutral-400" />
        </div>
      ) : rows.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Star}
            title="Chưa có đánh giá"
            description="Tạo review cho nhân viên (cycleId + personId)."
            action={{ label: 'Tạo đánh giá', onClick: () => setOpen(true) }}
          />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-xl bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="p-3 text-left">Cycle</th>
                <th className="p-3 text-left">Person</th>
                <th className="p-3 text-center">Self</th>
                <th className="p-3 text-center">Manager</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-medium font-mono text-xs">{r.cycleId}</td>
                  <td className="p-3 font-mono text-xs">{r.personId}</td>
                  <td className="p-3 text-center tabular-nums font-semibold">
                    {r.selfScore ?? '—'}
                  </td>
                  <td className="p-3 text-center tabular-nums font-semibold">
                    {r.managerScore ?? '—'}
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border bg-neutral-50">
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    {(r.status || '').toUpperCase() === 'DRAFT' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={submit.isPending}
                        onClick={() => setSubmitTarget(r)}
                      >
                        Submit
                      </Button>
                    )}
                    {canManagerScore &&
                      ['SUBMITTED', 'SCORED'].includes(
                        (r.status || '').toUpperCase(),
                      ) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setScoreTarget(r)
                            setScore(r.managerScore ?? 3)
                            setComments(r.managerComment || '')
                          }}
                        >
                          Manager score
                        </Button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        title="Submit đánh giá?"
        message="Sau khi submit, bạn không sửa self-score được. Manager sẽ chấm điểm."
        confirmText="Submit"
        isLoading={submit.isPending}
      />

      <AppModal isOpen={open} onClose={() => setOpen(false)} title="Tạo đánh giá">
        <div className="space-y-3">
          <Field label="Cycle ID *">
            <input
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
              value={form.cycleId}
              onChange={(e) => setForm({ ...form, cycleId: e.target.value })}
            />
          </Field>
          <Field label="Person ID *">
            <input
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
              value={form.personId}
              onChange={(e) => setForm({ ...form, personId: e.target.value })}
            />
          </Field>
          <Field label="Self score">
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
          <Field label="Self comment">
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
        title={`Manager score — ${scoreTarget?.personId || ''}`}
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
