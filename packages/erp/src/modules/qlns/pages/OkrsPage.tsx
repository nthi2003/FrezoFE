// ============================================================
// OkrsPage — list OKR + progress (periodLabel / ownerPersonId)
// ============================================================

import { useMemo, useState } from 'react'
import { Plus, Target, Loader2 } from 'lucide-react'
import { Button, PageHeader, AppModal, EmptyState } from '@frezo/ui'
import { useOkrs, useCreateOkr } from '../hooks/usePerformance'
import type { OkrDto, OkrRequest } from '../services/performanceApi'

const PERIODS = ['2025-H1', '2025-H2', '2026-H1', '2026-H2']

export function OkrsPage() {
  const [periodFilter, setPeriodFilter] = useState(PERIODS[1])
  const { data: allRows = [], isLoading } = useOkrs()
  const create = useCreateOkr()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<OkrRequest>({
    title: '',
    periodLabel: PERIODS[1],
    ownerPersonId: '',
    description: '',
    keyResults: [{ title: '', targetValue: 100, currentValue: 0, unit: '%' }],
  })

  const rows = useMemo(
    () =>
      allRows.filter(
        (o) => !periodFilter || !o.periodLabel || o.periodLabel === periodFilter,
      ),
    [allRows, periodFilter],
  )

  const avgProgress = useMemo(() => {
    if (rows.length === 0) return 0
    return Math.round(
      rows.reduce((s, o) => s + (o.progressPct ?? o.progress ?? 0), 0) /
        rows.length,
    )
  }, [rows])

  const onCreate = () => {
    if (!form.title.trim()) return
    create.mutate(
      {
        ...form,
        periodLabel: form.periodLabel || periodFilter,
        ownerPersonId: form.ownerPersonId || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false)
          setForm({
            title: '',
            periodLabel: periodFilter,
            ownerPersonId: '',
            description: '',
            keyResults: [
              { title: '', targetValue: 100, currentValue: 0, unit: '%' },
            ],
          })
        },
      },
    )
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="OKR"
        description={`Mục tiêu & KR · TB kỳ ${periodFilter}: ${avgProgress}%`}
        actions={
          <Button className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus size={14} /> Thêm OKR
          </Button>
        }
      />

      <div className="flex gap-2 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriodFilter(p)}
            className={`h-8 px-3 rounded-full text-xs font-semibold border ${
              periodFilter === p
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-neutral-600 border-neutral-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-neutral-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        </div>
      ) : rows.length === 0 ? (
        <div className="border rounded-xl bg-white">
          <EmptyState
            icon={Target}
            title="Chưa có OKR kỳ này"
            description="Tạo mục tiêu đầu tiên cho team."
            action={{ label: 'Thêm OKR', onClick: () => setOpen(true) }}
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((o) => (
            <OkrCard key={o.id} okr={o} />
          ))}
        </div>
      )}

      <AppModal isOpen={open} onClose={() => setOpen(false)} title="Tạo OKR" maxWidth="lg">
        <div className="space-y-3">
          <Field label="Tiêu đề *">
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Owner personId">
            <input
              className="w-full border rounded-md px-3 py-2 text-sm font-mono"
              value={form.ownerPersonId || ''}
              onChange={(e) =>
                setForm({ ...form, ownerPersonId: e.target.value })
              }
            />
          </Field>
          <Field label="Period label">
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.periodLabel || periodFilter}
              onChange={(e) =>
                setForm({ ...form, periodLabel: e.target.value })
              }
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Start date">
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.startDate || ''}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value || undefined })
                }
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.endDate || ''}
                onChange={(e) =>
                  setForm({ ...form, endDate: e.target.value || undefined })
                }
              />
            </Field>
          </div>
          <Field label="Mô tả">
            <textarea
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Key result 1">
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="VD: Tăng NPS lên 70"
              value={form.keyResults?.[0]?.title || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  keyResults: [
                    {
                      title: e.target.value,
                      targetValue: form.keyResults?.[0]?.targetValue ?? 100,
                      currentValue: form.keyResults?.[0]?.currentValue ?? 0,
                      unit: form.keyResults?.[0]?.unit ?? '%',
                      sortOrder: 1,
                    },
                  ],
                })
              }
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={onCreate} disabled={create.isPending || !form.title.trim()}>
              Tạo
            </Button>
          </div>
        </div>
      </AppModal>
    </div>
  )
}

function OkrCard({ okr }: { okr: OkrDto }) {
  const pct = Math.min(100, Math.max(0, okr.progressPct ?? okr.progress ?? 0))
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-neutral-900 truncate">{okr.title}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {okr.ownerPersonId || '—'} · {okr.periodLabel || '—'} ·{' '}
            {okr.status || '—'}
          </p>
        </div>
        <span className="text-lg font-bold tabular-nums text-primary-700">{pct}%</span>
      </div>
      <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {(okr.keyResults?.length ?? 0) > 0 && (
        <ul className="mt-3 space-y-1">
          {okr.keyResults!.map((kr, i) => (
            <li key={kr.id || i} className="text-xs text-neutral-600 flex justify-between gap-2">
              <span className="truncate">{kr.title}</span>
              <span className="tabular-nums shrink-0">
                {kr.currentValue}/{kr.targetValue} {kr.unit || ''}
              </span>
            </li>
          ))}
        </ul>
      )}
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
