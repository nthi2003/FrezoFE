// ============================================================
// OkrsPage — OKR theo vai trò: NV (của tôi) · QL (team) · Admin (toàn cty)
// BE enforce scope — FE chỉ hiện tab + UI phù hợp từng vai
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus, Target, Search, User, Users, Building2, TrendingUp,
  AlertTriangle, CheckCircle2, RefreshCw, ClipboardCheck, Send, Trash2, type LucideIcon,
} from 'lucide-react'
import {
  Button, PageHeader, AppModal, EmptyState, ErrorState, ConfirmDialog,
  PageGuideButton, Select, Label, Input, AppTooltip,
} from '@frezo/ui'
import { AppTable, type AppTableColumn } from '@/components/ui/AppTable'
import { FilterBar } from '@/components/ui/FilterBar'
import { profileApi } from '@/modules/profile/services/profileApi'
import { usePersonsCombobox } from '../hooks/usePerson'
import { useOkrs, useCreateOkr, useCheckInOkr, usePublishOkr } from '../hooks/usePerformance'
import type { OkrAction, OkrCheckInSession, OkrDto, OkrKeyResult, OkrRequest, OkrScope } from '../services/performanceApi'
import { performanceApi } from '../services/performanceApi'
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
  { key: 'mine', label: 'OKR của tôi', icon: User, hint: 'Mục tiêu cá nhân — cập nhật tiến độ' },
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

export function OkrsPage({ embedded: _embedded }: { embedded?: boolean } = {}) {
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
  const [overviewMode, setOverviewMode] = useState<'tree' | 'list'>('list')

  const { data: payload, isLoading, isError, refetch, isFetching } = useOkrs(
    scope,
    ownerFilter || undefined,
  )
  const viewer = payload?.viewer
  const allRows = payload?.items ?? []

  const create = useCreateOkr()
  const checkIn = useCheckInOkr()
  const publish = usePublishOkr()
  const queryClient = useQueryClient()
  const createCheckInDraft = useMutation({
    mutationFn: ({ okrId, body }: { okrId: string; body: Parameters<typeof performanceApi.createCheckIn>[1] }) =>
      performanceApi.createCheckIn(okrId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qlns', 'okr-workflow', 'check-ins'] })
      toast.success('Đã gửi bản check-in cho quản lý')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không tạo được bản check-in'),
  })
  const { data: cycles = [] } = useQuery({
    queryKey: ['qlns', 'okr-workflow', 'cycles'],
    queryFn: performanceApi.listCycles,
  })
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
  const [actionTarget, setActionTarget] = useState<OkrKeyResult | null>(null)
  const [managerCheckInTarget, setManagerCheckInTarget] = useState<OkrDto | null>(null)
  const [krDraft, setKrDraft] = useState<Array<{ id: string; currentValue: number }>>([])
  const [checkInForm, setCheckInForm] = useState({
    progress: '',
    delayedWork: '',
    blockers: '',
    solutions: '',
    confidenceLevel: 3,
    managerPersonId: '',
  })
  const [form, setForm] = useState<OkrRequest>({
    title: '',
    periodLabel: PERIODS[2],
    ownerPersonId: '',
    description: '',
    objectiveType: 'COMMITTED',
    scopeType: 'PERSONAL',
    keyResults: [{ title: '', targetValue: 100, currentValue: 0, unit: '%' }],
  })

  const canPickOwner = scope === 'team' || scope === 'all'

  const openCreate = () => {
    setForm({
      title: '',
      periodLabel: periodFilter || PERIODS[2],
      ownerPersonId: isPersonalView ? (profile?.personId || '') : '',
      description: '',
      objectiveType: 'COMMITTED',
      scopeType: isPersonalView ? 'PERSONAL' : scope === 'team' ? 'TEAM' : 'COMPANY',
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
        keyResults: (form.keyResults || []).filter((kr) => kr.title.trim()),
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
    setCheckInForm({ progress: '', delayedWork: '', blockers: '', solutions: '', confidenceLevel: 3, managerPersonId: '' })
  }

  const submitCheckIn = () => {
    if (!checkInTarget) return
    checkIn.mutate(
      {
        id: checkInTarget.id,
        body: { keyResults: krDraft.filter((k) => k.id) },
      },
      {
        onSuccess: () => {
          createCheckInDraft.mutate(
            { okrId: checkInTarget.id, body: checkInForm },
            { onSuccess: () => setCheckInTarget(null) },
          )
        },
      },
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
      {!isPersonalView && (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant={overviewMode === 'tree' ? 'default' : 'outline'} onClick={() => setOverviewMode('tree')}>Cây</Button>
          <Button size="sm" variant={overviewMode === 'list' ? 'default' : 'outline'} onClick={() => setOverviewMode('list')}>Danh sách</Button>
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
              onPublish={!okr.published ? () => publish.mutate(okr.id) : undefined}
              onPlanKr={setActionTarget}
            />
          ))}
        </div>
      ) : overviewMode === 'tree' ? (
        <OkrTree rows={rows} personMap={personMap} onReviewCheckIn={setManagerCheckInTarget} />
      ) : (
        <TeamOkrTable
          rows={rows}
          personMap={personMap}
          isLoading={isLoading}
          onRefresh={() => void refetch()}
          onPublish={(okr) => publish.mutate(okr.id)}
          onReviewCheckIn={setManagerCheckInTarget}
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

          <Field label="Chu kỳ OKR">
            <Select
              options={(cycles.length ? cycles : PERIODS.map((name) => ({ id: name, name }))).map((c) => ({ value: c.id, label: c.name }))}
              value={form.cycleId || form.periodLabel || PERIODS[2]}
              onChange={(v) => {
                const selected = cycles.find((c) => c.id === v)
                setForm({
                  ...form,
                  cycleId: selected?.id,
                  periodLabel: selected?.name || v,
                  startDate: selected?.startDate || form.startDate,
                  endDate: selected?.endDate || form.endDate,
                })
              }}
              showSearch={false}
              aria-label="Kỳ đánh giá"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Loại mục tiêu">
              <Select
                options={[{ value: 'COMMITTED', label: 'Cam kết' }, { value: 'STRETCH', label: 'Mở rộng' }]}
                value={form.objectiveType || 'COMMITTED'}
                onChange={(v) => setForm({ ...form, objectiveType: v as OkrRequest['objectiveType'] })}
                showSearch={false}
              />
            </Field>
            <Field label="OKR cha">
              <Select
                options={[{ value: '', label: '— Không có —' }, ...allRows.map((o) => ({ value: o.id, label: o.title }))]}
                value={form.parentOkrId || ''}
                onChange={(v) => setForm({ ...form, parentOkrId: v || undefined })}
                showSearch
              />
            </Field>
          </div>

          <Field label="Liên kết chéo (mã OKR, cách nhau bằng dấu phẩy)">
            <Input
              value={(form.crossLinkIds || []).join(', ')}
              onChange={(e) => setForm({ ...form, crossLinkIds: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
              placeholder="okr-id-1, okr-id-2"
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-neutral-700">Kết quả then chốt</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setForm({ ...form, keyResults: [...(form.keyResults || []), { title: '', targetValue: 100, currentValue: 0, unit: '%', sortOrder: (form.keyResults?.length || 0) + 1 }] })}
              >
                <Plus size={13} /> Thêm KR
              </Button>
            </div>
            {(form.keyResults || []).map((kr, index) => (
              <div key={index} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    placeholder={`Kết quả then chốt ${index + 1}`}
                    value={kr.title}
                    onChange={(e) => {
                      const keyResults = [...(form.keyResults || [])]
                      keyResults[index] = { ...kr, title: e.target.value }
                      setForm({ ...form, keyResults })
                    }}
                  />
                  {(form.keyResults?.length || 0) > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, keyResults: form.keyResults?.filter((_, i) => i !== index) })}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" aria-label="Mục tiêu" value={kr.targetValue} onChange={(e) => {
                    const keyResults = [...(form.keyResults || [])]; keyResults[index] = { ...kr, targetValue: Number(e.target.value) }; setForm({ ...form, keyResults })
                  }} />
                  <Input type="number" aria-label="Kết quả hiện tại" value={kr.currentValue} onChange={(e) => {
                    const keyResults = [...(form.keyResults || [])]; keyResults[index] = { ...kr, currentValue: Number(e.target.value) }; setForm({ ...form, keyResults })
                  }} />
                  <Input aria-label="Đơn vị" value={kr.unit || ''} onChange={(e) => {
                    const keyResults = [...(form.keyResults || [])]; keyResults[index] = { ...kr, unit: e.target.value }; setForm({ ...form, keyResults })
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Huỷ</Button>
            <Button
              onClick={() => setConfirmCreate(true)}
              disabled={create.isPending || !form.title.trim() || !!(form.startDate && form.endDate && form.startDate > form.endDate) || !(form.keyResults || []).some((kr) => kr.title.trim())}
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
        title={`Cập nhật tiến độ — ${checkInTarget?.title || ''}`}
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
            <div className="rounded-lg border border-border p-3 space-y-3">
              <h4 className="text-sm font-semibold">Bản check-in 1:1</h4>
              <Field label="1. Tiến độ / kết quả đạt được">
                <textarea rows={2} className="w-full border border-border rounded-md px-3 py-2 text-sm" value={checkInForm.progress} onChange={(e) => setCheckInForm({ ...checkInForm, progress: e.target.value })} />
              </Field>
              <Field label="2. Công việc bị trễ">
                <textarea rows={2} className="w-full border border-border rounded-md px-3 py-2 text-sm" value={checkInForm.delayedWork} onChange={(e) => setCheckInForm({ ...checkInForm, delayedWork: e.target.value })} />
              </Field>
              <Field label="3. Khó khăn / blockers">
                <textarea rows={2} className="w-full border border-border rounded-md px-3 py-2 text-sm" value={checkInForm.blockers} onChange={(e) => setCheckInForm({ ...checkInForm, blockers: e.target.value })} />
              </Field>
              <Field label="4. Giải pháp đề xuất">
                <textarea rows={2} className="w-full border border-border rounded-md px-3 py-2 text-sm" value={checkInForm.solutions} onChange={(e) => setCheckInForm({ ...checkInForm, solutions: e.target.value })} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="5. Mức độ tự tin (1–5)">
                  <Input type="number" min={1} max={5} value={checkInForm.confidenceLevel} onChange={(e) => setCheckInForm({ ...checkInForm, confidenceLevel: Number(e.target.value) })} />
                </Field>
                <Field label="Quản lý xác nhận *">
                  <Select options={personOptions} value={checkInForm.managerPersonId} onChange={(v) => setCheckInForm({ ...checkInForm, managerPersonId: v })} showSearch />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCheckInTarget(null)}>Huỷ</Button>
              <Button onClick={submitCheckIn} disabled={checkIn.isPending || createCheckInDraft.isPending || !checkInForm.managerPersonId || checkInForm.confidenceLevel < 1 || checkInForm.confidenceLevel > 5}>
                Gửi check-in
              </Button>
            </div>
          </div>
        )}
      </AppModal>
      <KrActionsModal target={actionTarget} onClose={() => setActionTarget(null)} personOptions={personOptions} />
      <ManagerCheckInModal target={managerCheckInTarget} onClose={() => setManagerCheckInTarget(null)} />
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function ManagerCheckInModal({ target, onClose }: { target: OkrDto | null; onClose: () => void }) {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({
    queryKey: ['qlns', 'okr-workflow', 'check-ins', target?.id],
    queryFn: () => performanceApi.listCheckIns(target!.id),
    enabled: !!target,
  })
  const draft = data.find((x) => x.status === 'DRAFT')
  const [form, setForm] = useState({ officialUpdate: '', managerFeedback: '', nextCheckInDate: '', completeOkrs: false })
  const confirm = useMutation({
    mutationFn: (session: OkrCheckInSession) => performanceApi.confirmCheckIn(session.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qlns', 'okr-workflow', 'check-ins', target?.id] })
      qc.invalidateQueries({ queryKey: ['qlns', 'okrs'] })
      toast.success('Đã xác nhận check-in')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không có quyền xác nhận check-in'),
  })
  return (
    <AppModal isOpen={!!target} onClose={onClose} title={`Xác nhận check-in — ${target?.title || ''}`} maxWidth="2xl">
      {isLoading ? <p className="text-sm text-neutral-500">Đang tải…</p> : !draft ? (
        <EmptyState icon={ClipboardCheck} title="Không có bản nháp chờ xác nhận" description="Nhân viên cần gửi bản check-in trước." />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2 text-sm rounded-lg border border-border p-3">
            <p><b>Tiến độ:</b> {draft.progress || '—'}</p>
            <p><b>Công việc trễ:</b> {draft.delayedWork || '—'}</p>
            <p><b>Blockers:</b> {draft.blockers || '—'}</p>
            <p><b>Giải pháp:</b> {draft.solutions || '—'}</p>
            <p><b>Mức tự tin:</b> {draft.confidenceLevel}/5</p>
          </div>
          <Field label="Cập nhật chính thức"><textarea rows={3} className="w-full border border-border rounded-md px-3 py-2 text-sm" value={form.officialUpdate} onChange={(e) => setForm({ ...form, officialUpdate: e.target.value })} /></Field>
          <Field label="Phản hồi của quản lý"><textarea rows={3} className="w-full border border-border rounded-md px-3 py-2 text-sm" value={form.managerFeedback} onChange={(e) => setForm({ ...form, managerFeedback: e.target.value })} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Check-in tiếp theo"><Input type="date" value={form.nextCheckInDate} onChange={(e) => setForm({ ...form, nextCheckInDate: e.target.value })} disabled={form.completeOkrs} /></Field>
            <label className="flex items-center gap-2 text-sm pt-6"><input type="checkbox" checked={form.completeOkrs} onChange={(e) => setForm({ ...form, completeOkrs: e.target.checked, nextCheckInDate: e.target.checked ? '' : form.nextCheckInDate })} /> Hoàn thành OKRs</label>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Hủy</Button><Button onClick={() => confirm.mutate(draft)} disabled={confirm.isPending || (!form.completeOkrs && !form.nextCheckInDate)}>Xác nhận</Button></div>
        </div>
      )}
    </AppModal>
  )
}

function KrActionsModal({
  target,
  onClose,
  personOptions,
}: {
  target: OkrKeyResult | null
  onClose: () => void
  personOptions: Array<{ value: string; label: string }>
}) {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({
    queryKey: ['qlns', 'okr-workflow', 'actions', target?.id],
    queryFn: () => performanceApi.listActions(target!.id!),
    enabled: !!target?.id,
  })
  const emptyAction = (): Omit<OkrAction, 'id' | 'keyResultId'> => ({
    title: '',
    planUrl: '',
    startDate: '',
    endDate: '',
    result: '',
    status: 'TODO',
    relatedPersonIds: [],
  })
  const [editing, setEditing] = useState<OkrAction | null>(null)
  const [form, setForm] = useState(emptyAction())
  const save = useMutation({
    mutationFn: () => editing
      ? performanceApi.updateAction(editing.id, form)
      : performanceApi.createAction(target!.id!, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qlns', 'okr-workflow', 'actions', target?.id] })
      setEditing(null)
      setForm(emptyAction())
      toast.success('Đã lưu kế hoạch')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không lưu được kế hoạch'),
  })
  const remove = useMutation({
    mutationFn: performanceApi.deleteAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qlns', 'okr-workflow', 'actions', target?.id] }),
  })
  return (
    <AppModal isOpen={!!target} onClose={onClose} title={`Kế hoạch hành động — ${target?.title || ''}`} maxWidth="2xl">
      <div className="space-y-4">
        <div className="space-y-2">
          {isLoading ? <p className="text-sm text-neutral-500">Đang tải…</p> : data.length === 0 ? <p className="text-sm text-neutral-500">Chưa có kế hoạch.</p> : data.map((action) => (
            <div key={action.id} className="rounded-lg border border-border p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-neutral-500">{action.startDate || '—'} → {action.endDate || '—'} · {action.status}</div>
                {action.planUrl && <a href={action.planUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-700 hover:underline">Mở kế hoạch</a>}
                {action.result && <p className="text-xs mt-1">{action.result}</p>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(action); setForm({ ...action }) }}>Sửa</Button>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(action.id)}><Trash2 size={13} /></Button>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-neutral-50 border border-border p-3 space-y-3">
          <h4 className="text-sm font-semibold">{editing ? 'Sửa kế hoạch' : 'Thêm kế hoạch'}</h4>
          <Field label="Tiêu đề *"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="URL kế hoạch"><Input type="url" value={form.planUrl || ''} onChange={(e) => setForm({ ...form, planUrl: e.target.value })} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Field label="Bắt đầu"><Input type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
            <Field label="Kết thúc"><Input type="date" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
            <Field label="Trạng thái"><Select options={[{ value: 'TODO', label: 'Cần làm' }, { value: 'DOING', label: 'Đang làm' }, { value: 'DONE', label: 'Hoàn thành' }]} value={form.status} onChange={(v) => setForm({ ...form, status: v as OkrAction['status'] })} /></Field>
          </div>
          <Field label="Kết quả"><textarea rows={2} className="w-full border border-border rounded-md px-3 py-2 text-sm" value={form.result || ''} onChange={(e) => setForm({ ...form, result: e.target.value })} /></Field>
          <Field label="Người liên quan">
            <Select
              options={[{ value: '', label: '— Chọn người nhận thông báo —' }, ...personOptions]}
              value={form.relatedPersonIds?.[0] || ''}
              onChange={(v) => setForm({ ...form, relatedPersonIds: v ? [v] : [] })}
              showSearch
            />
          </Field>
          <div className="flex justify-end gap-2">
            {editing && <Button variant="outline" onClick={() => { setEditing(null); setForm(emptyAction()) }}>Hủy sửa</Button>}
            <Button onClick={() => save.mutate()} disabled={!form.title.trim() || save.isPending || !!(form.startDate && form.endDate && form.startDate > form.endDate)}>Lưu kế hoạch</Button>
          </div>
        </div>
      </div>
    </AppModal>
  )
}

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
  onPublish,
  onPlanKr,
}: {
  okr: OkrDto
  personLabel: string
  showOwner: boolean
  onCheckIn?: () => void
  canCheckIn?: boolean
  onPublish?: () => void
  onPlanKr?: (kr: OkrKeyResult) => void
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
                {onPlanKr && (
                  <button type="button" className="mt-1 text-[11px] font-medium text-primary-700 hover:underline" onClick={() => onPlanKr(kr)}>
                    Kế hoạch hành động
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs text-neutral-400 border-t border-border/60 pt-2">Chưa có Key Result</p>
      )}

      <div className="mt-auto grid gap-2">
        {canCheckIn && onCheckIn && krs.length > 0 && (
          <Button size="sm" variant="outline" className="w-full gap-1" onClick={onCheckIn}>
            <RefreshCw size={12} /> Cập nhật tiến độ
          </Button>
        )}
        {onPublish && (
          <Button size="sm" className="w-full gap-1" onClick={onPublish}>
            <Send size={12} /> Công bố
          </Button>
        )}
      </div>
    </article>
  )
}

function OkrTree({ rows, personMap, onReviewCheckIn }: {
  rows: OkrDto[]
  personMap: Map<string, string>
  onReviewCheckIn: (okr: OkrDto) => void
}) {
  const children = new Map<string, OkrDto[]>()
  rows.forEach((row) => {
    const parent = row.parentOkrId && rows.some((x) => x.id === row.parentOkrId) ? row.parentOkrId : 'root'
    children.set(parent, [...(children.get(parent) || []), row])
  })
  const renderNodes = (parent: string, depth = 0): React.ReactNode => (children.get(parent) || []).map((row) => (
    <div key={row.id} className={depth ? 'ml-5 border-l border-border pl-3' : ''}>
      <div className="mb-2 rounded-lg border border-border bg-surface p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-neutral-500">{row.scopeType || 'PERSONAL'} · {personMap.get(row.ownerPersonId || '') || row.ownerPersonId || '—'}</div>
            <div className="font-medium text-sm">{row.title}</div>
            <div className="mt-1 text-xs text-neutral-500">{(row.keyResults || []).length} Key Results</div>
          </div>
          <div className="flex items-center gap-2"><b className="text-primary-700">{okrPct(row)}%</b><Button size="sm" variant="outline" onClick={() => onReviewCheckIn(row)}>Chi tiết</Button></div>
        </div>
        <ProgressBar pct={okrPct(row)} className="mt-2" />
      </div>
      {renderNodes(row.id, depth + 1)}
    </div>
  ))
  return <div className="rounded-xl border border-border bg-neutral-50 p-3">{renderNodes('root')}</div>
}

function TeamOkrTable({
  rows,
  personMap,
  isLoading,
  onRefresh,
  onPublish,
  onReviewCheckIn,
}: {
  rows: OkrDto[]
  personMap: Map<string, string>
  isLoading: boolean
  onRefresh: () => void
  onPublish: (okr: OkrDto) => void
  onReviewCheckIn: (okr: OkrDto) => void
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
    {
      key: 'publish',
      title: '',
      align: 'right',
      width: 96,
      render: (_, row) => row.published
        ? <span className="text-xs text-success-dark">Đã công bố</span>
        : <Button size="sm" variant="outline" onClick={() => onPublish(row)}><Send size={12} /> Công bố</Button>,
    },
    {
      key: 'checkin',
      title: '',
      align: 'right',
      width: 110,
      render: (_, row) => <Button size="sm" variant="outline" onClick={() => onReviewCheckIn(row)}><ClipboardCheck size={12} /> Check-in</Button>,
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
