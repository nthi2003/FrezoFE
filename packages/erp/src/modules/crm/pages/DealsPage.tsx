import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Trophy, XCircle, User, CalendarDays, MessageSquare, ChevronRight, LayoutGrid,
  GripVertical,
} from 'lucide-react'
import {
  Button, PageHeader, AppModal, ConfirmDialog, EmptyState, ErrorState, Select, Label,
} from '@frezo/ui'
import { formatCurrency, formatDate } from '@frezo/utils'
import {
  usePipelines, usePipelineStages, useDealsByPipeline, useCreateDeal,
  useMoveDealStage, useMarkDealWon, useMarkDealLost, useEnsureDefaultPipeline,
  useReorderPipelineStages,
} from '../hooks/useCrm'
import type { Deal, Pipeline, Stage } from '../services/crmApi'
import { CommentDrawer } from '@/components/shared/CommentThread'
import { SubjectType } from '@/modules/approval/types'

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

export function DealsPage() {
  const { data: pipelines } = usePipelines()
  const pipelineList = useMemo(
    () => ((pipelines as Pipeline[] | undefined) ?? []),
    [pipelines],
  )
  const ensureDefault = useEnsureDefaultPipeline()

  const [pipelineId, setPipelineId] = useState<string | undefined>()
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

  const dealsByStage = useMemo(() => {
    const m = new Map<string, Deal[]>()
    stageList.forEach((s) => m.set(s.id, []))
    dealList.forEach((d) => {
      if (d.status === 'OPEN' || d.status === 'STALLED') {
        const arr = m.get(d.stageId) ?? []
        arr.push(d)
        m.set(d.stageId, arr)
      }
    })
    return m
  }, [dealList, stageList])

  const openDeals = useMemo(
    () => dealList.filter((d) => d.status === 'OPEN' || d.status === 'STALLED'),
    [dealList],
  )
  const totalValue = useMemo(
    () => dealList.filter((d) => d.status === 'OPEN').reduce((s, d) => s + (d.amount || 0), 0),
    [dealList],
  )
  const wonValue = useMemo(
    () => dealList.filter((d) => d.status === 'WON').reduce((s, d) => s + (d.amount || 0), 0),
    [dealList],
  )

  const move = useMoveDealStage()
  const win = useMarkDealWon()
  const lose = useMarkDealLost()
  const create = useCreateDeal()
  const reorderStages = useReorderPipelineStages()

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [commentDeal, setCommentDeal] = useState<Deal | null>(null)
  const [wonTarget, setWonTarget] = useState<Deal | null>(null)
  const [lostTarget, setLostTarget] = useState<Deal | null>(null)
  const [lostReason, setLostReason] = useState('')
  const [form, setForm] = useState({
    title: '', amount: 0, stageId: '', expectedCloseDate: '', description: '',
  })

  const onDropCard = (stageId: string) => {
    if (draggingColumnId || !draggingId) return
    const d = dealList.find((x) => x.id === draggingId)
    if (!d || d.stageId === stageId) {
      setDraggingId(null)
      setDropTargetId(null)
      return
    }
    move.mutate({ id: draggingId, stageId })
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

  const onCreate = () => {
    if (!pipelineId || !form.title || !form.stageId) return
    const amount = Math.max(0, Math.floor(Number(form.amount) || 0))
    create.mutate(
      { ...form, pipelineId, amount },
      { onSuccess: () => {
        setShowCreate(false)
        setForm({ title: '', amount: 0, stageId: '', expectedCloseDate: '', description: '' })
      }},
    )
  }

  const onAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
    const n = digits === '' ? 0 : Number(digits)
    setForm({ ...form, amount: Number.isFinite(n) && n >= 0 ? n : 0 })
  }

  const openCreate = () => {
    if (stageList[0]) setForm((f) => ({ ...f, stageId: stageList[0].id }))
    setShowCreate(true)
  }

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
      <div className="p-6">
        <PageHeader
          title="Cơ hội bán"
          description="Chưa có phễu bán hàng. Bấm bên dưới để tạo phễu mặc định gồm 5 giai đoạn."
        />
        <Button onClick={() => ensureDefault.mutate()} className="gap-2">
          <Plus size={16} /> Tạo phễu mặc định
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Cơ hội bán"
        description={`Kéo thẻ để đổi giai đoạn; kéo núm trên header cột để sắp xếp cột. Tổng đang mở: ${formatCurrency(totalValue)} · Đã chốt: ${formatCurrency(wonValue)}`}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64 space-y-1.5">
          <Label htmlFor="crm-pipeline-select">Phễu bán hàng</Label>
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
        <div className="flex-1" />
        <Button className="gap-2" onClick={openCreate}>
          <Plus size={16} /> Thêm cơ hội
        </Button>
      </div>

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

      {!isLoading && !isError && openDeals.length === 0 && stageList.length > 0 && (
        <div className="border border-border rounded-lg bg-surface mb-2">
          <EmptyState
            icon={Trophy}
            title="Phễu bán hàng trống"
            description="Chưa có cơ hội đang mở — thêm cơ hội mới hoặc chuyển khách tiềm năng thành cơ hội. Kéo-thả để đổi giai đoạn (1 bước)."
            action={{ label: 'Thêm cơ hội', onClick: openCreate }}
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
                      return (
                        <div
                          key={d.id}
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
                          className={`bg-surface rounded-lg p-3 border border-neutral-200 border-l-4 ${tone.border} cursor-grab active:cursor-grabbing hover:border-neutral-300 hover:shadow-sm transition ${
                            isDragging
                              ? 'opacity-40 scale-[0.98] ring-2 ring-primary-200 shadow-card'
                              : ''
                          }`}
                        >
                          {/* Card density: tên / giá / owner / ngày */}
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
                          <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                            {d.customerName && (
                              <span className="inline-flex items-center gap-1 truncate max-w-[140px]" title={d.customerName}>
                                <User size={11} aria-hidden />{d.customerName}
                              </span>
                            )}
                            {d.expectedCloseDate && (
                              <span className="inline-flex items-center gap-1" title="Ngày dự kiến đóng">
                                <CalendarDays size={11} aria-hidden /> {formatDate(d.expectedCloseDate)}
                              </span>
                            )}
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
                            <button
                              type="button"
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-primary-50 text-primary-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCommentDeal(d)
                              }}
                              title="Bình luận"
                              aria-label="Bình luận"
                            >
                              <MessageSquare size={14} aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-success-light text-success-dark"
                              onClick={(e) => {
                                e.stopPropagation()
                                setWonTarget(d)
                              }}
                              title="Đánh dấu đã chốt"
                              aria-label="Đánh dấu đã chốt"
                            >
                              <Trophy size={14} aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-danger-light text-danger"
                              onClick={(e) => {
                                e.stopPropagation()
                                setLostReason('')
                                setLostTarget(d)
                              }}
                              title="Đánh dấu thất bại"
                              aria-label="Đánh dấu thất bại"
                            >
                              <XCircle size={14} aria-hidden />
                            </button>
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

      <AppModal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Thêm cơ hội mới">
        <div className="space-y-3">
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
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                className="w-full border rounded-md px-3 py-2 text-sm tabular-nums"
                value={form.amount ? form.amount.toLocaleString('vi-VN') : ''}
                onChange={(e) => onAmountChange(e.target.value)}
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
            <Button variant="outline" onClick={() => setShowCreate(false)}>Huỷ</Button>
            <Button onClick={onCreate} disabled={create.isPending || !form.title}>
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
        subtitle={commentDeal?.customerName}
      />
    </div>
  )
}
