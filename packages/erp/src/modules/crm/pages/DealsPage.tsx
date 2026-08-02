import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Plus, Trophy, XCircle, User, CalendarDays, MessageSquare, ChevronRight, LayoutGrid,
  GripVertical,
} from 'lucide-react'
import {
  Button, PageHeader, PageGuideButton, AppModal, ConfirmDialog, EmptyState, ErrorState, Select, Label, VndInput,
  IconActionButton,
} from '@frezo/ui'
import { formatCurrency, formatDate, unwrapOne } from '@frezo/utils'
import { toast } from 'sonner'
import { FilterBar } from '@/components/ui/FilterBar'
import {
  usePipelines, usePipelineStages, useDealsByPipeline, useCreateDeal,
  useMoveDealStage, useMarkDealWon, useMarkDealLost, useEnsureDefaultPipeline,
  useReorderPipelineStages,
} from '../hooks/useCrm'
import type { Deal, Pipeline, Stage } from '../services/crmApi'
import { useCustomers } from '@/modules/customers/hooks/useCustomer'
import { CommentDrawer } from '@/components/shared/CommentThread'
import { SubjectType } from '@/modules/approval/types'
import { DEALS_GUIDE } from '../constants/deals.guide'
import { pageRootClass } from '@/modules/accounting/utils/pageEmbed'

const COLUMN_DRAG_MIME = 'application/x-frezo-kanban-column'

// ============================================================
// FR-UX-04 — Kanban semantic (không gradient raw) + KPI cột
// Align FE_UI_UX_STANDARD §14.4 + Tickets board patterns
// ============================================================

const STAGE_TONE = [
  {
    border: 'border-l-primary-500',
    dot: 'bg-primary-500',
    headerBg: 'bg-primary-50',
    headerText: 'text-primary-800',
    countClass: 'bg-primary-600 text-white',
    badge: 'bg-primary-50 text-primary-700 border-primary-200',
  },
  {
    border: 'border-l-info',
    dot: 'bg-info',
    headerBg: 'bg-info-light',
    headerText: 'text-info-dark',
    countClass: 'bg-info text-white',
    badge: 'bg-info-light text-info-dark border-info/30',
  },
  {
    border: 'border-l-warning',
    dot: 'bg-warning',
    headerBg: 'bg-warning-light',
    headerText: 'text-warning-dark',
    countClass: 'bg-warning text-white',
    badge: 'bg-warning-light text-warning-dark border-warning/30',
  },
  {
    border: 'border-l-success',
    dot: 'bg-success',
    headerBg: 'bg-success-light',
    headerText: 'text-success-dark',
    countClass: 'bg-success text-white',
    badge: 'bg-success-light text-success-dark border-success/30',
  },
  {
    border: 'border-l-danger',
    dot: 'bg-danger',
    headerBg: 'bg-danger-light',
    headerText: 'text-danger-dark',
    countClass: 'bg-danger text-white',
    badge: 'bg-danger-light text-danger-dark border-danger/30',
  },
  {
    border: 'border-l-neutral-400',
    dot: 'bg-neutral-400',
    headerBg: 'bg-neutral-100',
    headerText: 'text-neutral-800',
    countClass: 'bg-neutral-500 text-white',
    badge: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  },
]

function stageTone(orderNo: number) {
  return STAGE_TONE[Math.max(0, orderNo) % STAGE_TONE.length]
}

/** Fix typo seed / legacy: "Sơ suất / Báo giá" → "Đề xuất / Báo giá" */
function normalizeStageName(name?: string): string {
  if (!name) return ''
  return name
    .replace(/Sơ\s*suất\s*\/\s*Báo\s*giá/gi, 'Đề xuất / Báo giá')
    .replace(/^Sơ\s*suất$/gi, 'Đề xuất')
}

function ownerInitials(username?: string): string {
  if (!username) return '?'
  const parts = username.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return username[0]?.toUpperCase() || '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function DealsPage({ embedded }: { embedded?: boolean } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: pipelines } = usePipelines()
  const { data: customersRaw } = useCustomers()
  const pipelineList = useMemo(
    () => ((pipelines as Pipeline[] | undefined) ?? []),
    [pipelines],
  )
  const ensureDefault = useEnsureDefaultPipeline()

  const customerOptions = useMemo(() => {
    const list = (customersRaw as { id: string; name?: string }[] | undefined) ?? []
    return list.map((c) => ({
      value: c.id,
      label: c.name?.trim() || c.id,
    }))
  }, [customersRaw])

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const o of customerOptions) map.set(o.value, o.label)
    return map
  }, [customerOptions])

  const resolveCustomerName = (d: Deal) =>
    d.customerName?.trim()
    || (d.customerId ? customerNameById.get(d.customerId) : undefined)
    || undefined

  const [pipelineId, setPipelineId] = useState<string | undefined>()
  const [customerFilter, setCustomerFilter] = useState<string>(
    () => searchParams.get('customerId') || '',
  )
  const [focusDealId, setFocusDealId] = useState<string | null>(
    () => searchParams.get('dealId'),
  )

  useEffect(() => {
    if (pipelineList.length > 0 && !pipelineId) {
      const def = pipelineList.find((p) => p.isDefault) || pipelineList[0]
      setPipelineId(def.id)
    }
  }, [pipelineList, pipelineId])

  const { data: stages } = usePipelineStages(pipelineId)
  const remoteStageList = useMemo(
    () =>
      ((stages as Stage[] | undefined) ?? [])
        .map((s) => ({
          ...s,
          name: normalizeStageName(s.name),
        }))
        .sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0)),
    [stages],
  )

  /** Local order so column DnD feels instant; sync when server stages change. */
  const [stageList, setStageList] = useState<Stage[]>([])
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null)
  const [columnDropTargetId, setColumnDropTargetId] = useState<string | null>(null)
  useEffect(() => {
    setStageList(remoteStageList)
    setDraggingColumnId(null)
    setColumnDropTargetId(null)
  }, [remoteStageList, pipelineId])

  const { data: deals, isLoading, isError, refetch, isFetching } = useDealsByPipeline(pipelineId)
  const dealList = useMemo(
    () => ((deals as Deal[] | undefined) ?? []),
    [deals],
  )

  /** Mỗi thẻ = 1 dealId riêng; lọc theo customerId khi user chọn KH. */
  const scopedDeals = useMemo(() => {
    if (!customerFilter) return dealList
    return dealList.filter((d) => d.customerId === customerFilter)
  }, [dealList, customerFilter])

  const dealsByStage = useMemo(() => {
    const m = new Map<string, Deal[]>()
    stageList.forEach((s) => m.set(s.id, []))
    scopedDeals.forEach((d) => {
      if (d.status === 'OPEN' || d.status === 'STALLED') {
        const arr = m.get(d.stageId) ?? []
        arr.push(d)
        m.set(d.stageId, arr)
      }
    })
    return m
  }, [scopedDeals, stageList])

  const openDeals = useMemo(
    () => scopedDeals.filter((d) => d.status === 'OPEN' || d.status === 'STALLED'),
    [scopedDeals],
  )
  const totalValue = useMemo(
    () => scopedDeals.filter((d) => d.status === 'OPEN').reduce((s, d) => s + (d.amount || 0), 0),
    [scopedDeals],
  )
  const wonValue = useMemo(
    () => scopedDeals.filter((d) => d.status === 'WON').reduce((s, d) => s + (d.amount || 0), 0),
    [scopedDeals],
  )

  const move = useMoveDealStage()
  const win = useMarkDealWon()
  const lose = useMarkDealLost()
  const create = useCreateDeal()
  const reorderStages = useReorderPipelineStages()

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createError, setCreateError] = useState('')
  const [commentDeal, setCommentDeal] = useState<Deal | null>(null)
  const [wonTarget, setWonTarget] = useState<Deal | null>(null)
  const [lostTarget, setLostTarget] = useState<Deal | null>(null)
  const [lostReason, setLostReason] = useState('')
  const [form, setForm] = useState({
    title: '',
    amount: 0,
    stageId: '',
    customerId: '',
    expectedCloseDate: '',
    description: '',
  })

  // Deep-link: ?dealId= / ?customerId= / ?create=1&customerId= (Lead convert / Customer 360)
  useEffect(() => {
    const dealId = searchParams.get('dealId')
    const cid = searchParams.get('customerId')
    const wantsCreate = searchParams.get('create') === '1'
    if (dealId) setFocusDealId(dealId)
    if (cid) setCustomerFilter(cid)
    if (wantsCreate) {
      setCreateError('')
      setForm({
        title: '',
        amount: 0,
        stageId: stageList[0]?.id || '',
        customerId: cid || '',
        expectedCloseDate: '',
        description: '',
      })
      setShowCreate(true)
    }
    if (!dealId && !cid && !wantsCreate) return
    const next = new URLSearchParams(searchParams)
    next.delete('dealId')
    next.delete('create')
    if (cid) next.delete('customerId')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, stageList])

  // Prefill giai đoạn đầu khi stages load sau deep-link create
  useEffect(() => {
    if (!showCreate || form.stageId || !stageList[0]?.id) return
    setForm((f) => ({ ...f, stageId: stageList[0].id }))
  }, [showCreate, form.stageId, stageList])

  // Highlight deal từ deep-link; tự lọc theo KH của deal đó
  useEffect(() => {
    if (!focusDealId || dealList.length === 0) return
    const d = dealList.find((x) => x.id === focusDealId)
    if (!d) {
      toast.message('Không tìm thấy cơ hội trên phễu hiện tại')
      setFocusDealId(null)
      return
    }
    if (d.pipelineId && d.pipelineId !== pipelineId) {
      setPipelineId(d.pipelineId)
      return
    }
    if (d.customerId) setCustomerFilter(d.customerId)
    toast.success(`Đang mở cơ hội «${d.title}»`)
    const t = window.setTimeout(() => setFocusDealId(null), 8000)
    return () => window.clearTimeout(t)
  }, [focusDealId, dealList, pipelineId])

  const onDropCard = (stageId: string) => {
    if (draggingColumnId || !draggingId) return
    // Chỉ mutate đúng deal id của thẻ đang kéo — không đụng deal khác
    const d = dealList.find((x) => x.id === draggingId)
    if (!d || d.stageId === stageId) {
      setDraggingId(null)
      setDropTargetId(null)
      return
    }
    move.mutate({ id: d.id, stageId })
    setDraggingId(null)
    setDropTargetId(null)
  }

  const persistStageOrder = (next: Stage[], rollback: Stage[]) => {
    if (!pipelineId) return
    const pipeline = pipelineList.find((p) => p.id === pipelineId)
    if (!pipeline?.name) return
    reorderStages.mutate(
      {
        id: pipelineId,
        data: {
          name: pipeline.name,
          description: pipeline.description,
          isDefault: pipeline.isDefault,
          active: pipeline.active,
          stages: next.map((s) => ({
            id: s.id,
            name: s.name,
            orderNo: s.orderNo,
            probability: s.probability,
            won: s.won,
          })),
        },
      },
      { onError: () => setStageList(rollback) },
    )
  }

  const onDropColumn = (targetStageId: string) => {
    if (!draggingColumnId || draggingColumnId === targetStageId) {
      setDraggingColumnId(null)
      setColumnDropTargetId(null)
      return
    }
    const prev = stageList
    const fromIdx = prev.findIndex((s) => s.id === draggingColumnId)
    const toIdx = prev.findIndex((s) => s.id === targetStageId)
    if (fromIdx < 0 || toIdx < 0) {
      setDraggingColumnId(null)
      setColumnDropTargetId(null)
      return
    }
    const next = [...prev]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    const ordered = next.map((s, i) => ({ ...s, orderNo: i }))
    setStageList(ordered)
    setDraggingColumnId(null)
    setColumnDropTargetId(null)
    persistStageOrder(ordered, prev)
  }

  const emptyForm = () => ({
    title: '',
    amount: 0,
    stageId: stageList[0]?.id || '',
    customerId: customerFilter || '',
    expectedCloseDate: '',
    description: '',
  })

  const onCreate = () => {
    if (!pipelineId || !form.title.trim() || !form.stageId) return
    if (!form.customerId) {
      setCreateError('Chọn khách hàng — mỗi cơ hội phải gắn 1 KH (deal id mới, không dùng chung).')
      return
    }
    setCreateError('')
    const amount = Math.max(0, Math.floor(Number(form.amount) || 0))
    create.mutate(
      {
        title: form.title.trim(),
        pipelineId,
        stageId: form.stageId,
        customerId: form.customerId,
        amount,
        expectedCloseDate: form.expectedCloseDate || undefined,
        description: form.description || undefined,
      },
      {
        onSuccess: (res) => {
          const created = unwrapOne<Deal>(res)
          setShowCreate(false)
          setForm(emptyForm())
          setCustomerFilter(form.customerId)
          if (created?.id) setFocusDealId(created.id)
        },
      },
    )
  }

  const onAmountChange = (n: number | undefined) => {
    setForm({ ...form, amount: n == null || !Number.isFinite(n) || n < 0 ? 0 : n })
  }

  const openCreate = () => {
    setCreateError('')
    setForm(emptyForm())
    setShowCreate(true)
  }

  const hasCustomerFilter = !!customerFilter
  const isFilteredEmpty = !isLoading && !isError && hasCustomerFilter && openDeals.length === 0
  const isFullyEmpty = !isLoading && !isError && !hasCustomerFilter && openDeals.length === 0 && stageList.length > 0

  const pipelineOptions = useMemo(
    () => pipelineList.map((p) => ({ value: p.id, label: p.name })),
    [pipelineList],
  )
  const stageOptions = useMemo(
    () => stageList.map((s) => ({ value: s.id, label: s.name })),
    [stageList],
  )

  if (pipelineList.length === 0) {
    return (
      <div className={pageRootClass(embedded)}>
        {!embedded && (
          <PageHeader
            title="Cơ hội bán"
            description="Chưa có phễu bán hàng. Tạo phễu mặc định gồm các giai đoạn chuẩn."
            actions={<PageGuideButton guide={DEALS_GUIDE} />}
          />
        )}
        <Button onClick={() => ensureDefault.mutate()} className="gap-2">
          <Plus size={16} /> Tạo phễu mặc định
        </Button>
      </div>
    )
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <PageGuideButton guide={DEALS_GUIDE} />
      <Button className="gap-2" onClick={openCreate}>
        <Plus size={16} /> Thêm cơ hội
      </Button>
    </div>
  )

  return (
    <div className={pageRootClass(embedded)}>
      {embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-neutral-600">
            Kanban phễu — kéo thẻ đổi giai đoạn.
            <span className="ml-2 text-xs text-neutral-400 tabular-nums">
              {openDeals.length} cơ hội · {formatCurrency(totalValue)}
            </span>
          </p>
          {headerActions}
        </div>
      ) : (
        <PageHeader
          title="Cơ hội bán"
          description={`Kéo thẻ đổi giai đoạn; kéo núm cột để sắp xếp. Đang mở: ${formatCurrency(totalValue)} · Đã chốt: ${formatCurrency(wonValue)}`}
          actions={headerActions}
        />
      )}

      <FilterBar
        hasActiveFilters={hasCustomerFilter}
        onClear={() => setCustomerFilter('')}
        countLabel={`${openDeals.length} cơ hội đang mở${hasCustomerFilter ? ' (theo KH)' : ''}`}
      >
        <div className="w-56 space-y-1">
          <Label htmlFor="crm-pipeline-select" className="text-xs text-neutral-500">Phễu bán hàng</Label>
          <Select
            id="crm-pipeline-select"
            options={pipelineOptions}
            value={pipelineId || ''}
            onChange={(v) => setPipelineId(v || undefined)}
            placeholder="Chọn phễu bán hàng…"
            showSearch={pipelineOptions.length > 5}
            aria-label="Phễu bán hàng"
          />
        </div>
        <div className="w-64 space-y-1">
          <Label htmlFor="crm-deal-customer-filter" className="text-xs text-neutral-500">
            Khách hàng
          </Label>
          <Select
            id="crm-deal-customer-filter"
            options={[{ value: '', label: 'Tất cả khách hàng' }, ...customerOptions]}
            value={customerFilter}
            onChange={(v) => setCustomerFilter(v || '')}
            placeholder="Lọc theo khách hàng…"
            showSearch={customerOptions.length > 5}
            aria-label="Lọc theo khách hàng"
          />
        </div>
      </FilterBar>

      {isError && (
        <div className="border border-border rounded-lg bg-surface">
          <ErrorState
            title="Không tải được cơ hội bán"
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </div>
      )}

      {isLoading && (
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-72 flex-shrink-0 h-[420px] rounded-xl border border-border bg-surface-secondary animate-pulse"
            />
          ))}
        </div>
      )}

      {(isFullyEmpty || isFilteredEmpty) && (
        <div className="border border-border rounded-lg bg-surface mb-2">
          <EmptyState
            icon={Trophy}
            title={isFilteredEmpty ? 'Khách hàng này chưa có cơ hội trên phễu' : 'Phễu bán hàng trống'}
            description={
              isFilteredEmpty
                ? 'Mỗi cơ hội gắn 1 khách hàng (deal id riêng). Thêm cơ hội cho KH này hoặc xoá lọc để xem tất cả.'
                : 'Chưa có cơ hội đang mở — thêm cơ hội gắn khách hàng, hoặc chuyển khách tiềm năng thành cơ hội.'
            }
            action={
              isFilteredEmpty
                ? { label: 'Thêm cơ hội cho KH này', onClick: openCreate }
                : { label: 'Thêm cơ hội', onClick: openCreate }
            }
          />
        </div>
      )}

      {!isLoading && !isError && stageList.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
          {stageList.map((stage, stageIdx) => {
            const items = dealsByStage.get(stage.id) ?? []
            const totalStage = items.reduce((s, d) => s + (d.amount || 0), 0)
            const tone = stageTone(stage.orderNo)
            const nextStage = stageList[stageIdx + 1]
            const isColumnDragging = draggingColumnId === stage.id
            const isColumnDropTarget =
              draggingColumnId != null && columnDropTargetId === stage.id && !isColumnDragging
            const isCardDropTarget =
              !draggingColumnId && dropTargetId === stage.id && draggingId != null
            const isDraggingAnyCard = !draggingColumnId && draggingId != null

            return (
              <div
                key={stage.id}
                className={`w-72 flex-shrink-0 rounded-xl flex flex-col border transition-all duration-200 ${
                  isColumnDragging
                    ? 'opacity-40 scale-[0.98] border-primary-300 border-dashed shadow-card'
                    : isColumnDropTarget
                      ? 'bg-primary-50 border-primary-400 border-dashed shadow-card ring-2 ring-primary-200'
                      : isCardDropTarget
                        ? 'bg-primary-50 border-primary-400 border-dashed shadow-card'
                        : isDraggingAnyCard
                          ? 'bg-surface-secondary border-border border-dashed opacity-80'
                          : 'bg-surface-secondary border-border'
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (draggingColumnId) {
                    if (columnDropTargetId !== stage.id) setColumnDropTargetId(stage.id)
                    return
                  }
                  if (draggingId && dropTargetId !== stage.id) setDropTargetId(stage.id)
                }}
                onDragLeave={() => {
                  if (draggingColumnId) {
                    if (columnDropTargetId === stage.id) setColumnDropTargetId(null)
                    return
                  }
                  if (dropTargetId === stage.id) setDropTargetId(null)
                }}
                onDrop={() => {
                  if (draggingColumnId) {
                    onDropColumn(stage.id)
                    return
                  }
                  onDropCard(stage.id)
                }}
              >
                {/* Column header: grip + title + count + Σ VND */}
                <div
                  className={`px-3 py-2.5 border-b rounded-t-xl ${
                    isColumnDropTarget || isCardDropTarget
                      ? 'bg-primary-50 border-primary-200'
                      : `${tone.headerBg} border-border`
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation()
                          setDraggingId(null)
                          setDropTargetId(null)
                          setDraggingColumnId(stage.id)
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData(COLUMN_DRAG_MIME, stage.id)
                          e.dataTransfer.setData('text/plain', stage.id)
                        }}
                        onDragEnd={() => {
                          setDraggingColumnId(null)
                          setColumnDropTargetId(null)
                        }}
                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-900/5 cursor-grab active:cursor-grabbing shrink-0 touch-none"
                        title="Kéo để đổi thứ tự cột"
                        aria-label={`Kéo cột ${stage.name}`}
                      >
                        <GripVertical size={16} strokeWidth={1.5} aria-hidden />
                      </span>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm ${tone.dot}`} />
                      <span
                        className={`text-sm font-semibold truncate ${
                          isColumnDropTarget || isCardDropTarget ? 'text-primary-700' : tone.headerText
                        }`}
                        title={stage.name}
                      >
                        {stage.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md tabular-nums shrink-0 ${
                        isColumnDropTarget || isCardDropTarget
                          ? 'bg-primary-600 text-white'
                          : tone.countClass
                      }`}
                    >
                      {items.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                    <span className="text-neutral-500">
                      Σ {formatCurrency(totalStage)}
                    </span>
                    {stage.probability != null && (
                      <span className={`border rounded-md px-1.5 py-0.5 shrink-0 ${tone.badge}`}>
                        {stage.probability}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px] max-h-[calc(100vh-360px)]">
                  {items.length === 0 ? (
                    <EmptyState
                      icon={LayoutGrid}
                      title={
                        isColumnDropTarget
                          ? 'Thả cột vào đây'
                          : isCardDropTarget
                            ? 'Thả cơ hội vào đây'
                            : `Cột «${stage.name}» trống`
                      }
                      description={
                        isColumnDropTarget
                          ? 'Thả để đổi thứ tự giai đoạn phễu bán hàng.'
                          : isCardDropTarget
                            ? 'Kéo thẻ từ cột khác để đổi giai đoạn.'
                            : 'Chưa có cơ hội ở giai đoạn này. Kéo thẻ vào hoặc thêm cơ hội mới.'
                      }
                      className="py-8 border-0 shadow-none bg-transparent"
                    />
                  ) : (
                    items.map((d) => {
                      const isDragging = draggingId === d.id
                      const isFocused = focusDealId === d.id
                      const custName = resolveCustomerName(d)
                      return (
                        <div
                          key={d.id}
                          data-deal-id={d.id}
                          data-customer-id={d.customerId || undefined}
                          draggable={!draggingColumnId}
                          onDragStart={() => {
                            if (draggingColumnId) return
                            setDraggingColumnId(null)
                            setColumnDropTargetId(null)
                            setDraggingId(d.id)
                          }}
                          onDragEnd={() => {
                            setDraggingId(null)
                            setDropTargetId(null)
                          }}
                          className={`bg-surface rounded-lg p-3 border border-l-4 ${tone.border} cursor-grab active:cursor-grabbing hover:border-neutral-300 hover:shadow-sm transition ${
                            isFocused
                              ? 'border-primary-400 ring-2 ring-primary-300 shadow-card'
                              : 'border-neutral-200'
                          } ${
                            isDragging
                              ? 'opacity-40 scale-[0.98] ring-2 ring-primary-200 shadow-card'
                              : ''
                          }`}
                        >
                          {/* Card: 1 dealId · 1 customerId — không gộp chung */}
                          <div className="flex items-start gap-2 mb-1">
                            <div className="text-sm font-medium text-neutral-900 flex-1 min-w-0 line-clamp-2">
                              {d.title}
                            </div>
                            {d.ownerUsername && (
                              <div
                                className="w-7 h-7 rounded-full text-[10px] font-bold text-primary-700 bg-primary-100 flex items-center justify-center shrink-0"
                                title={`Phụ trách: ${d.ownerUsername}`}
                                aria-label={`Phụ trách ${d.ownerUsername}`}
                              >
                                {ownerInitials(d.ownerUsername)}
                              </div>
                            )}
                          </div>
                          <div className="text-base font-semibold text-neutral-900 mb-1.5 tabular-nums">
                            {formatCurrency(d.amount)}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-neutral-500 mb-0.5">
                            {d.customerId && custName ? (
                              <Link
                                to={`/customers/${d.customerId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 truncate max-w-[160px] text-primary-700 hover:underline"
                                title={`KH: ${custName}`}
                              >
                                <User size={11} aria-hidden />{custName}
                              </Link>
                            ) : d.customerId ? (
                              <span className="inline-flex items-center gap-1 truncate max-w-[160px]" title={d.customerId}>
                                <User size={11} aria-hidden />{d.customerId.slice(0, 8)}…
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-warning-dark">
                                <User size={11} aria-hidden />Chưa gắn KH
                              </span>
                            )}
                            {d.expectedCloseDate && (
                              <span className="inline-flex items-center gap-1" title="Ngày dự kiến đóng">
                                <CalendarDays size={11} aria-hidden /> {formatDate(d.expectedCloseDate)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono truncate" title={d.id}>
                            deal:{d.id.slice(0, 8)}…
                          </div>
                          <div className="flex justify-end items-center gap-0.5 mt-2 pt-2 border-t border-neutral-100">
                            {nextStage && (
                              <button
                                type="button"
                                className="h-7 px-1.5 rounded-md hover:bg-primary-50 text-primary-700 inline-flex items-center gap-0.5 text-[11px] font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  move.mutate({ id: d.id, stageId: nextStage.id })
                                }}
                                title={`Chuyển → ${nextStage.name}`}
                                aria-label={`Chuyển sang ${nextStage.name}`}
                                disabled={move.isPending}
                              >
                                Tiếp <ChevronRight size={12} aria-hidden />
                              </button>
                            )}
                            <IconActionButton
                              tooltip="Bình luận"
                              tone="blue"
                              size="sm"
                              className="h-7 w-7 text-primary-600 hover:bg-primary-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCommentDeal(d)
                              }}
                            >
                              <MessageSquare size={14} aria-hidden />
                            </IconActionButton>
                            <IconActionButton
                              tooltip="Đánh dấu đã chốt"
                              tone="emerald"
                              size="sm"
                              className="h-7 w-7 text-success-dark hover:bg-success-light"
                              onClick={(e) => {
                                e.stopPropagation()
                                setWonTarget(d)
                              }}
                            >
                              <Trophy size={14} aria-hidden />
                            </IconActionButton>
                            <IconActionButton
                              tooltip="Đánh dấu thất bại"
                              tone="rose"
                              size="sm"
                              className="h-7 w-7 text-danger hover:bg-danger-light"
                              onClick={(e) => {
                                e.stopPropagation()
                                setLostReason('')
                                setLostTarget(d)
                              }}
                            >
                              <XCircle size={14} aria-hidden />
                            </IconActionButton>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AppModal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setCreateError('') }}
        title="Thêm cơ hội mới"
        description="Mỗi lần tạo = 1 deal id mới, bắt buộc gắn 1 khách hàng — không dùng chung cơ hội giữa các KH."
      >
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block">Khách hàng *</Label>
            <Select
              options={customerOptions}
              value={form.customerId}
              onChange={(v) => {
                setForm({ ...form, customerId: v || '' })
                if (createError) setCreateError('')
              }}
              placeholder="Chọn khách hàng…"
              showSearch={customerOptions.length > 5}
              aria-label="Khách hàng"
              aria-invalid={!!createError && !form.customerId}
            />
            {createError && (
              <p className="mt-1 text-xs text-danger-dark">{createError}</p>
            )}
          </div>
          <div>
            <label className="text-sm text-neutral-700 mb-1 block">Tiêu đề *</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-neutral-700 mb-1 block">Giá trị (VND)</label>
              <VndInput
                placeholder="0"
                className="w-full border rounded-md px-3 py-2 text-sm h-auto"
                value={form.amount || undefined}
                onChange={onAmountChange}
              />
            </div>
            <div>
              <Label className="mb-1 block">Giai đoạn</Label>
              <Select
                options={stageOptions}
                value={form.stageId}
                onChange={(v) => setForm({ ...form, stageId: v || '' })}
                placeholder="Chọn giai đoạn…"
                showSearch={stageOptions.length > 5}
                aria-label="Giai đoạn"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-neutral-700 mb-1 block">Ngày dự kiến đóng</label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.expectedCloseDate}
              onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-neutral-700 mb-1 block">Ghi chú</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); setCreateError('') }}>Huỷ</Button>
            <Button
              onClick={onCreate}
              disabled={create.isPending || !form.title.trim() || !form.customerId}
            >
              Thêm
            </Button>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        isOpen={!!wonTarget}
        onClose={() => setWonTarget(null)}
        onConfirm={() => {
          if (!wonTarget) return
          win.mutate(wonTarget.id, { onSuccess: () => setWonTarget(null) })
        }}
        title="Xác nhận đánh dấu đã chốt?"
        message={
          <span>
            Cơ hội <strong>«{wonTarget?.title || ''}»</strong>
            {wonTarget?.amount != null ? (
              <> ({formatCurrency(wonTarget.amount)})</>
            ) : null}
            {' '}sẽ chuyển sang trạng thái <strong>đã chốt</strong> và rời khỏi phễu đang mở.
            Hành động này cập nhật kết quả bán hàng.
          </span>
        }
        confirmText="Xác nhận đã chốt"
        cancelText="Huỷ"
        variant="default"
        isLoading={win.isPending}
      />

      <ConfirmDialog
        isOpen={!!lostTarget}
        onClose={() => { setLostTarget(null); setLostReason('') }}
        onConfirm={() => {
          if (!lostTarget) return
          lose.mutate(
            { id: lostTarget.id, reason: lostReason.trim() || undefined },
            { onSuccess: () => { setLostTarget(null); setLostReason('') } },
          )
        }}
        title="Xác nhận đánh dấu thất bại?"
        message={(
          <div className="space-y-2">
            <p>
              Cơ hội <strong>«{lostTarget?.title || ''}»</strong> sẽ chuyển sang trạng thái{' '}
              <strong>thất bại</strong> và rời khỏi phễu đang mở. Nên ghi rõ lý do để báo cáo.
            </p>
            <div>
              <Label htmlFor="deal-lost-reason" className="mb-1 block text-neutral-700">
                Lý do thất bại (tuỳ chọn)
              </Label>
              <textarea
                id="deal-lost-reason"
                className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900 bg-white"
                rows={3}
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="VD: Giá cao hơn đối thủ, khách hoãn ngân sách…"
              />
            </div>
          </div>
        )}
        confirmText="Xác nhận thất bại"
        cancelText="Huỷ"
        variant="danger"
        isLoading={lose.isPending}
      />

      <CommentDrawer
        open={!!commentDeal}
        onClose={() => setCommentDeal(null)}
        subjectType={SubjectType.DEAL}
        subjectId={commentDeal?.id || ''}
        title={commentDeal?.title || 'Cơ hội'}
        subtitle={
          commentDeal
            ? resolveCustomerName(commentDeal) || commentDeal.customerId || undefined
            : undefined
        }
      />
    </div>
  )
}
