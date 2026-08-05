// ============================================================
// OkrsPage — OKR theo vai trò: NV (của tôi) · QL (team) · Admin (toàn cty)
// BE enforce scope — FE chỉ hiện tab + UI phù hợp từng vai
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Plus, Target, Search, User, Users, Building2, TrendingUp,
  AlertTriangle, CheckCircle2, RefreshCw, ClipboardCheck, type LucideIcon,
} from 'lucide-react'
import {
  Button, PageHeader, AppModal, EmptyState, ErrorState, ConfirmDialog,
  PageGuideButton, Select, Label, Input, AppTooltip,
} from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { profileApi } from '@/modules/profile/services/profileApi'
import { usePersonsCombobox } from '../hooks/usePerson'
import { useOkrs, useCreateOkr, useCheckInOkr } from '../hooks/usePerformance'
import type { OkrDto, OkrKeyResult, OkrRequest, OkrScope } from '../services/performanceApi'
import { KPI_GUIDE } from '../constants/kpi.guide'

// ============================================================
// Constants
// ============================================================

const PERIODS = ['2025-H1', '2025-H2', '2026-H1', '2026-H2']

const STATUS_META: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: 'Nháp', tone: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
  ACTIVE: { label: 'Đang thực hiện', tone: 'bg-primary-50 text-primary-800 border-primary-200' },
  COMPLETED: { label: 'Hoàn thành', tone: 'bg-success-light text-success-dark border-success/30' },
  CANCELLED: { label: 'Đã huỷ', tone: 'bg-danger-light text-danger-dark border-danger/30' },
}

const SCOPE_TABS: Array<{ key: OkrScope; label: string; icon: LucideIcon; hint: string }> = [
  { key: 'mine', label: 'OKR của tôi', icon: User, hint: 'Mục tiêu cá nhân — check-in tiến độ' },
  { key: 'team', label: 'OKR team', icon: Users, hint: 'Theo dõi cấp dưới trực tiếp' },
  { key: 'all', label: 'Toàn công ty', icon: Building2, hint: 'Admin — mọi nhân viên' },
]

function okrPct(row: OkrDto): number {
  return Math.min(100, Math.max(0, Math.round(row.progressPct ?? row.progress ?? 0)))
}

function krPct(kr: OkrKeyResult): number {
  if (kr.progress != null) return Math.min(100, Math.max(0, Math.round(kr.progress)))
  if (!kr.targetValue) return 0
  return Math.min(100, Math.max(0, Math.round(((kr.currentValue ?? 0) / kr.targetValue) * 100)))
}

function progressBarTone(pct: number): string {
  if (pct >= 80) return 'bg-success'
  if (pct >= 40) return 'bg-warning'
  return 'bg-danger'
}

function statusBadge(status?: string) {
  const st = (status || 'ACTIVE').toUpperCase()
  const meta = STATUS_META[st] || { label: status || '—', tone: 'bg-neutral-100 text-neutral-600 border-neutral-200' }
  return (
    <span className={`inline-flex text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${meta.tone}`}>
      {meta.label}
    </span>
  )
}

// ============================================================
// Page
// ============================================================

export function OkrsPage() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000,
  })

  const [scope, setScope] = useState<OkrScope>('mine')
  const [periodFilter, setPeriodFilter] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data: payload, isLoading, isError, refetch, isFetching } = useOkrs(
    scope,
    ownerFilter || undefined,
  )
  const viewer = payload?.viewer
  const allRows = payload?.items ?? []

  const create = useCreateOkr()
  const checkIn = useCheckInOkr()
  const { options: personOptions } = usePersonsCombobox()

  const personMap = useMemo(
    () => new Map(personOptions.map((p) => [p.value, p.label])),
    [personOptions],
  )

  const allowedScopes = viewer?.allowedScopes ?? ['mine']
  const isPersonalView = scope === 'mine'

  useEffect(() => {
    if (!allowedScopes.includes(scope)) {
      setScope(allowedScopes[0] ?? 'mine')
    }
  }, [allowedScopes, scope])

  const periodOptions = useMemo(() => {
    const fromData = [...new Set(allRows.map((o) => o.periodLabel).filter(Boolean))] as string[]
    const merged = [...new Set([...PERIODS, ...fromData])]
    return [{ value: '', label: 'Tất cả kỳ' }, ...merged.map((p) => ({ value: p, label: p }))]
  }, [allRows])

  const ownerOptions = useMemo(() => {
    const ids = [...new Set(allRows.map((o) => o.ownerPersonId).filter(Boolean))] as string[]
    return [
      { value: '', label: 'Tất cả nhân viên' },
      ...ids.map((id) => ({ value: id, label: personMap.get(id) || id })),
    ]
  }, [allRows, personMap])

  const rows = useMemo(() => {
    let list = allRows
    if (periodFilter) list = list.filter((o) => o.periodLabel === periodFilter)
    if (statusFilter) list = list.filter((o) => (o.status || '').toUpperCase() === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((o) => {
        const owner = personMap.get(o.ownerPersonId || '') || o.ownerPersonId || ''
        return [o.title, o.description, o.periodLabel, owner]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
    }
    return list
  }, [allRows, periodFilter, statusFilter, search, personMap])

  const stats = useMemo(() => {
    const total = rows.length
    const avg = total
      ? Math.round(rows.reduce((s, o) => s + okrPct(o), 0) / total)
      : 0
    const onTrack = rows.filter((o) => okrPct(o) >= 80).length
    const atRisk = rows.filter((o) => okrPct(o) < 40).length
    return { total, avg, onTrack, atRisk }
  }, [rows])

  const hasFilter = !!(periodFilter || statusFilter || search.trim() || ownerFilter)
  const isFilteredEmpty = !isLoading && !isError && allRows.length > 0 && rows.length === 0
  const isFullyEmpty = !isLoading && !isError && allRows.length === 0

  const clearFilters = () => {
    setPeriodFilter('')
    setStatusFilter('')
    setSearch('')
    setOwnerFilter('')
  }

  // ---- Modals ----
  const [createOpen, setCreateOpen] = useState(false)
  const [confirmCreate, setConfirmCreate] = useState(false)
  const [checkInTarget, setCheckInTarget] = useState<OkrDto | null>(null)
  const [krDraft, setKrDraft] = useState<Array<{ id: string; currentValue: number }>>([])
  const [form, setForm] = useState<OkrRequest>({
    title: '',
    periodLabel: PERIODS[2],
    ownerPersonId: '',
    description: '',
    keyResults: [{ title: '', targetValue: 100, currentValue: 0, unit: '%' }],
  })

  const canPickOwner = scope === 'team' || scope === 'all'

  const openCreate = () => {
    setForm({
      title: '',
      periodLabel: periodFilter || PERIODS[2],
      ownerPersonId: isPersonalView ? (profile?.personId || '') : '',
      description: '',
      keyResults: [{ title: '', targetValue: 100, currentValue: 0, unit: '%' }],
    })
    setCreateOpen(true)
  }

  const onCreate = () => {
    if (!form.title.trim()) return
    create.mutate(
      {
        ...form,
        periodLabel: form.periodLabel || periodFilter || PERIODS[2],
        ownerPersonId: isPersonalView
          ? profile?.personId
          : form.ownerPersonId || profile?.personId || undefined,
      },
      {
        onSuccess: () => {
          setCreateOpen(false)
          setConfirmCreate(false)
        },
      },
    )
  }

  const openCheckIn = (okr: OkrDto) => {
    setCheckInTarget(okr)
    setKrDraft(
      (okr.keyResults || []).map((kr) => ({
        id: kr.id!,
        currentValue: kr.currentValue ?? 0,
      })),
    )
  }

  const submitCheckIn = () => {
    if (!checkInTarget) return
    checkIn.mutate(
      {
        id: checkInTarget.id,
        body: { keyResults: krDraft.filter((k) => k.id) },
      },
      { onSuccess: () => setCheckInTarget(null) },
    )
  }

  const pageTitle = isPersonalView
    ? 'OKR của tôi'
    : scope === 'team'
      ? 'OKR team'
      : 'OKR toàn công ty'

  const pageDesc = isPersonalView
    ? 'Mục tiêu cá nhân — cập nhật tiến độ Key Results giữa kỳ.'
    : scope === 'team'
      ? 'Theo dõi tiến độ OKR của cấp dưới trực tiếp.'
      : 'Tổng quan OKR toàn tổ chức — lọc theo nhân viên / kỳ.'

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={pageTitle}
        description={pageDesc}
        actions={
          <>
            <PageGuideButton guide={KPI_GUIDE} />
            {isPersonalView && (
              <Link to="/qlns/performance-reviews">
                <Button variant="outline" size="sm" className="gap-1.5 hidden sm:inline-flex">
                  <ClipboardCheck size={14} /> Đánh giá hiệu suất
                </Button>
              </Link>
            )}
            <Button className="gap-1.5" onClick={openCreate}>
              <Plus size={14} /> Thêm OKR
            </Button>
          </>
        }
      />

      {/* Scope tabs — chỉ tab BE cho phép */}
      {allowedScopes.length > 1 && (
        <div className="flex flex-wrap gap-1 p-1 bg-neutral-100 rounded-lg border border-border w-fit max-w-full">
          {SCOPE_TABS.filter((t) => allowedScopes.includes(t.key)).map((tab) => {
            const Icon = tab.icon
            const active = scope === tab.key
            return (
              <AppTooltip key={tab.key} content={tab.hint}>
                <button
                  type="button"
                  onClick={() => {
                    setScope(tab.key)
                    setOwnerFilter('')
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    active
                      ? 'bg-surface text-neutral-900 shadow-sm border border-border'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.key === 'mine' ? 'Tôi' : tab.key === 'team' ? 'Team' : 'All'}</span>
                </button>
              </AppTooltip>
            )
          })}
        </div>
      )}

      {/* KPI summary */}
      {!isFullyEmpty && !isError && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          <KpiTile icon={Target} label="Số OKR" value={String(stats.total)} tone="neutral" />
          <KpiTile icon={TrendingUp} label="TB tiến độ" value={`${stats.avg}%`} tone="green" />
          <KpiTile icon={CheckCircle2} label="Đúng tiến độ" value={String(stats.onTrack)} tone="green" />
          <KpiTile icon={AlertTriangle} label="Cần chú ý" value={String(stats.atRisk)} tone="amber" />
        </div>
      )}

      {!isFullyEmpty && (
        <FilterBar
          hasActiveFilters={hasFilter}
          onClear={clearFilters}
          countLabel={`${rows.length} OKR${hasFilter ? ' (đã lọc)' : ''}`}
          selects={[
            {
              id: 'period',
              label: 'Kỳ',
              value: periodFilter,
              onChange: setPeriodFilter,
              options: periodOptions,
            },
            ...(scope !== 'mine'
              ? [{
                  id: 'owner',
                  label: 'Nhân viên',
                  value: ownerFilter,
                  onChange: (v: string) => setOwnerFilter(v),
                  options: ownerOptions,
                  minWidth: '160px',
                }]
              : []),
            {
              id: 'status',
              label: 'Trạng thái',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: '', label: 'Mọi trạng thái' },
                ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label })),
              ],
            },
          ]}
          extra={
            <AppTooltip content="Làm mới">
              <Button variant="ghost" size="sm" onClick={() => void refetch()} disabled={isFetching}>
                <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              </Button>
            </AppTooltip>
          }
        >
          <div className="relative flex-1 min-w-[160px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              className="w-full h-9 pl-9 pr-3 border border-border rounded-md text-sm bg-surface"
              placeholder="Tìm mục tiêu, mô tả…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm OKR"
            />
          </div>
        </FilterBar>
      )}

      {isError ? (
        <div className="border border-border rounded-xl bg-surface">
          <ErrorState
            title="Không tải được OKR"
            message="Kiểm tra quyền truy cập hoặc liên kết hồ sơ nhân sự."
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </div>
      ) : isFullyEmpty || isFilteredEmpty ? (
        <div className="border border-border rounded-xl bg-surface">
          <EmptyState
            icon={Target}
            title={
              isFilteredEmpty
                ? 'Không có OKR khớp bộ lọc'
                : isPersonalView
                  ? 'Chưa có OKR cá nhân'
                  : scope === 'team'
                    ? 'Team chưa có OKR'
                    : 'Chưa có OKR nào'
            }
            description={
              isFilteredEmpty
                ? 'Thử xoá lọc hoặc đổi kỳ / nhân viên.'
                : isPersonalView
                  ? 'Tạo mục tiêu đầu tiên cho kỳ hiện tại — thống nhất với quản lý trước khi theo dõi.'
                  : 'Nhân viên cần tạo OKR cá nhân trước — bạn sẽ thấy ở tab này khi họ có dữ liệu.'
            }
            action={{ label: 'Thêm OKR', onClick: openCreate }}
          />
        </div>
      ) : isPersonalView ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((okr) => (
            <OkrCard
              key={okr.id}
              okr={okr}
              personLabel={personMap.get(okr.ownerPersonId || '') || 'Tôi'}
              showOwner={false}
              onCheckIn={() => openCheckIn(okr)}
              canCheckIn
            />
          ))}
        </div>
      ) : (
        <TeamOkrTable
          rows={rows}
          personMap={personMap}
          isLoading={isLoading}
          onRefresh={() => void refetch()}
        />
      )}

      {/* Create modal */}
      <AppModal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Tạo OKR" maxWidth="2xl">
        <div className="space-y-3">
          <Field label="Tiêu đề *">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Tăng trưởng doanh thu Q3"
            />
          </Field>

          {canPickOwner ? (
            <Field label="Người phụ trách">
              <Select
                options={[
                  { value: '', label: '— Chọn nhân viên —' },
                  ...personOptions,
                ]}
                value={form.ownerPersonId || ''}
                onChange={(v) => setForm({ ...form, ownerPersonId: v })}
                showSearch
                aria-label="Người phụ trách"
              />
            </Field>
          ) : (
            <Field label="Người phụ trách">
              <Input
                readOnly
                value={profile?.name || profile?.personId || '—'}
                className="bg-neutral-50"
              />
            </Field>
          )}

          <Field label="Kỳ đánh giá">
            <Select
              options={PERIODS.map((p) => ({ value: p, label: p }))}
              value={form.periodLabel || PERIODS[2]}
              onChange={(v) => setForm({ ...form, periodLabel: v })}
              showSearch={false}
              aria-label="Kỳ đánh giá"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Ngày bắt đầu">
              <Input
                type="date"
                value={form.startDate || ''}
                onChange={(e) => setForm({ ...form, startDate: e.target.value || undefined })}
              />
            </Field>
            <Field label="Ngày kết thúc">
              <Input
                type="date"
                value={form.endDate || ''}
                onChange={(e) => setForm({ ...form, endDate: e.target.value || undefined })}
              />
            </Field>
          </div>

          <Field label="Mô tả">
            <textarea
              rows={2}
              className="w-full border border-border rounded-md px-3 py-2 text-sm"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <Field label="Kết quả then chốt 1">
            <Input
              placeholder="VD: Tăng NPS lên 70"
              value={form.keyResults?.[0]?.title || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  keyResults: [{
                    title: e.target.value,
                    targetValue: form.keyResults?.[0]?.targetValue ?? 100,
                    currentValue: form.keyResults?.[0]?.currentValue ?? 0,
                    unit: form.keyResults?.[0]?.unit ?? '%',
                    sortOrder: 1,
                  }],
                })
              }
            />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Huỷ</Button>
            <Button
              onClick={() => setConfirmCreate(true)}
              disabled={create.isPending || !form.title.trim()}
            >
              Tạo
            </Button>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={confirmCreate}
        onClose={() => setConfirmCreate(false)}
        onConfirm={onCreate}
        title="Xác nhận tạo OKR?"
        message={`Tạo OKR «${form.title}» cho kỳ ${form.periodLabel || PERIODS[2]}?`}
        confirmText="Tạo OKR"
        isLoading={create.isPending}
      />

      {/* Check-in modal — employee only */}
      <AppModal
        isOpen={!!checkInTarget}
        onClose={() => setCheckInTarget(null)}
        title={`Check-in — ${checkInTarget?.title || ''}`}
        maxWidth="lg"
      >
        {checkInTarget && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Cập nhật giá trị hiện tại cho từng Key Result. Tiến độ mục tiêu sẽ tự tính lại.
            </p>
            <ul className="space-y-3">
              {(checkInTarget.keyResults || []).map((kr, i) => (
                <li key={kr.id || i} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="text-sm font-medium text-neutral-900">{kr.title}</div>
                  <ProgressBar pct={krPct(kr)} />
                  <div className="flex items-center gap-2">
                    <Label className="text-xs shrink-0">Hiện tại</Label>
                    <Input
                      type="number"
                      className="h-8 text-sm tabular-nums max-w-[120px]"
                      value={krDraft[i]?.currentValue ?? kr.currentValue ?? 0}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setKrDraft((prev) => {
                          const next = [...prev]
                          if (next[i]) next[i] = { ...next[i], currentValue: val }
                          return next
                        })
                      }}
                    />
                    <span className="text-xs text-neutral-500">
                      / {kr.targetValue} {kr.unit || ''}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCheckInTarget(null)}>Huỷ</Button>
              <Button onClick={submitCheckIn} disabled={checkIn.isPending}>
                Lưu tiến độ
              </Button>
            </div>
          </div>
        )}
      </AppModal>
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function ProgressBar({ pct, className = '' }: { pct: number; className?: string }) {
  return (
    <div className={`h-2 bg-neutral-100 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full transition-all ${progressBarTone(pct)}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function OkrCard({
  okr,
  personLabel,
  showOwner,
  onCheckIn,
  canCheckIn,
}: {
  okr: OkrDto
  personLabel: string
  showOwner: boolean
  onCheckIn?: () => void
  canCheckIn?: boolean
}) {
  const pct = okrPct(okr)
  const krs = okr.keyResults || []

  return (
    <article className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-neutral-900 text-sm leading-snug">{okr.title}</h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {statusBadge(okr.status)}
            {okr.periodLabel && (
              <span className="text-[10px] text-neutral-500 font-mono">{okr.periodLabel}</span>
            )}
          </div>
        </div>
        <span className="text-lg font-bold tabular-nums text-primary-700 shrink-0">{pct}%</span>
      </div>

      {showOwner && (
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <User size={12} className="shrink-0" />
          <span className="truncate">{personLabel}</span>
        </div>
      )}

      <ProgressBar pct={pct} />

      {krs.length > 0 ? (
        <ul className="space-y-2 pt-1 border-t border-border/60">
          {krs.map((kr, i) => {
            const kp = krPct(kr)
            return (
              <li key={kr.id || i}>
                <div className="flex justify-between gap-2 text-xs mb-1">
                  <span className="text-neutral-700 truncate" title={kr.title}>{kr.title}</span>
                  <span className="tabular-nums text-neutral-500 shrink-0">{kp}%</span>
                </div>
                <ProgressBar pct={kp} className="h-1.5" />
                <div className="text-[10px] text-neutral-400 mt-0.5 tabular-nums">
                  {kr.currentValue}/{kr.targetValue} {kr.unit || ''}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs text-neutral-400 border-t border-border/60 pt-2">Chưa có Key Result</p>
      )}

      {canCheckIn && onCheckIn && krs.length > 0 && (
        <Button size="sm" variant="outline" className="mt-auto w-full gap-1" onClick={onCheckIn}>
          <RefreshCw size={12} /> Check-in tiến độ
        </Button>
      )}
    </article>
  )
}

function TeamOkrTable({
  rows,
  personMap,
  isLoading,
  onRefresh,
}: {
  rows: OkrDto[]
  personMap: Map<string, string>
  isLoading: boolean
  onRefresh: () => void
}) {
  const columns: AppTableColumn<OkrDto>[] = [
    {
      key: 'owner',
      title: 'Nhân viên',
      render: (_, row) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-[10px] font-bold shrink-0">
            {(personMap.get(row.ownerPersonId || '') || '?').charAt(0).toUpperCase()}
          </div>
          <span className="text-sm truncate max-w-[140px]">
            {personMap.get(row.ownerPersonId || '') || row.ownerPersonId || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'title',
      title: 'Mục tiêu',
      render: (_, row) => {
        const pct = okrPct(row)
        return (
          <div className="min-w-0 py-0.5 max-w-[280px]">
            <div className="font-medium text-neutral-900 truncate">{row.title}</div>
            <ProgressBar pct={pct} className="mt-1.5 max-w-[200px]" />
          </div>
        )
      },
    },
    {
      key: 'period',
      title: 'Kỳ',
      width: 90,
      render: (_, row) => (
        <span className="text-xs font-mono text-neutral-600">{row.periodLabel || '—'}</span>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (_, row) => statusBadge(row.status),
    },
    {
      key: 'kr',
      title: 'Key Results',
      render: (_, row) => {
        const krs = row.keyResults || []
        if (krs.length === 0) return <span className="text-xs text-neutral-400">—</span>
        return (
          <ul className="space-y-1 max-w-[220px]">
            {krs.slice(0, 3).map((kr, i) => (
              <li key={kr.id || i} className="text-xs text-neutral-600 flex justify-between gap-2">
                <span className="truncate">{kr.title}</span>
                <span className="tabular-nums shrink-0 text-neutral-500">{krPct(kr)}%</span>
              </li>
            ))}
            {krs.length > 3 && (
              <li className="text-[10px] text-neutral-400">+{krs.length - 3} KR</li>
            )}
          </ul>
        )
      },
    },
    {
      key: 'progress',
      title: 'Tiến độ',
      align: 'right',
      width: 72,
      render: (_, row) => (
        <span className="font-bold tabular-nums text-primary-700">{okrPct(row)}%</span>
      ),
    },
  ]

  return (
    <AppTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      density="compact"
      showSearch={false}
      onRefresh={onRefresh}
    />
  )
}

function KpiTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  tone: 'neutral' | 'green' | 'amber'
}) {
  const toneMap = {
    neutral: 'bg-surface border-border [&_.ico]:bg-neutral-100 [&_.ico]:text-neutral-600',
    green: 'bg-success-light/40 border-success/20 [&_.ico]:bg-success-light [&_.ico]:text-success-dark',
    amber: 'bg-warning-light/40 border-warning/20 [&_.ico]:bg-warning-light [&_.ico]:text-warning-dark',
  }[tone]
  return (
    <div className={`p-3 rounded-xl border flex items-center gap-3 ${toneMap}`}>
      <div className="ico w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate">{label}</div>
        <div className="text-base font-bold text-neutral-900 tabular-nums">{value}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm text-neutral-700 mb-1 block">{label}</Label>
      {children}
    </div>
  )
}
