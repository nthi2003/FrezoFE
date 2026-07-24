import { useEffect, useMemo, useState } from 'react'
import { Plus, Trophy, XCircle, User, CalendarDays, MessageSquare } from 'lucide-react'
import { Button, PageHeader, AppModal, ConfirmDialog, EmptyState, ErrorState } from '@frezo/ui'
import { formatCurrency, formatDate } from '@frezo/utils'
import {
  usePipelines, usePipelineStages, useDealsByPipeline, useCreateDeal,
  useMoveDealStage, useMarkDealWon, useMarkDealLost, useEnsureDefaultPipeline,
} from '../hooks/useCrm'
import type { Deal, Stage } from '../services/crmApi'
import { CommentDrawer } from '@/components/shared/CommentThread'
import { SubjectType } from '@/modules/approval/types'

// ============================================================
// Style helpers cho Kanban card
// ============================================================

// Palette xoay vòng theo stage.orderNo — border trái + header dot
const STAGE_PALETTE = [
  { border: 'border-l-blue-500', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { border: 'border-l-violet-500', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  { border: 'border-l-amber-500', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { border: 'border-l-emerald-500', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { border: 'border-l-rose-500', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  { border: 'border-l-cyan-500', dot: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
]

function stageColor(orderNo: number) {
  return STAGE_PALETTE[Math.max(0, orderNo - 1) % STAGE_PALETTE.length]
}

function ownerInitials(username?: string): string {
  if (!username) return '?'
  const parts = username.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return username[0]?.toUpperCase() || '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ownerAvatarClass(username?: string): string {
  const gradients = [
    'from-blue-500 to-indigo-500',
    'from-emerald-500 to-teal-500',
    'from-violet-500 to-fuchsia-500',
    'from-orange-500 to-rose-500',
    'from-cyan-500 to-blue-500',
    'from-amber-500 to-orange-500',
  ]
  if (!username) return `bg-gradient-to-br ${gradients[0]}`
  const idx = username.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % gradients.length
  return `bg-gradient-to-br ${gradients[idx]}`
}

export function DealsPage() {
  const { data: pipelines } = usePipelines()
  const pipelineList = (pipelines as any[]) ?? []
  const ensureDefault = useEnsureDefaultPipeline()

  const [pipelineId, setPipelineId] = useState<string | undefined>()
  useEffect(() => {
    if (pipelineList.length > 0 && !pipelineId) {
      const def = pipelineList.find((p: any) => p.isDefault) || pipelineList[0]
      setPipelineId(def.id)
    }
  }, [pipelineList, pipelineId])

  const { data: stages } = usePipelineStages(pipelineId)
  const stageList = ((stages as any[]) ?? []) as Stage[]

  const { data: deals, isLoading, isError, refetch, isFetching } = useDealsByPipeline(pipelineId)
  const dealList = ((deals as any[]) ?? []) as Deal[]

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

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [commentDeal, setCommentDeal] = useState<Deal | null>(null)
  const [wonTarget, setWonTarget] = useState<Deal | null>(null)
  const [lostTarget, setLostTarget] = useState<Deal | null>(null)
  const [lostReason, setLostReason] = useState('')
  const [form, setForm] = useState({
    title: '', amount: 0, stageId: '', expectedCloseDate: '', description: '',
  })

  const onDrop = (stageId: string) => {
    if (!draggingId) return
    const d = dealList.find((x) => x.id === draggingId)
    if (!d || d.stageId === stageId) return
    move.mutate({ id: draggingId, stageId })
    setDraggingId(null)
  }

  const onCreate = () => {
    if (!pipelineId || !form.title || !form.stageId) return
    create.mutate(
      { ...form, pipelineId, amount: Number(form.amount) || 0 },
      { onSuccess: () => {
        setShowCreate(false)
        setForm({ title: '', amount: 0, stageId: '', expectedCloseDate: '', description: '' })
      }},
    )
  }

  if (pipelineList.length === 0) {
    return (
      <div className="p-6">
        <PageHeader
          title="Pipeline Deals"
          description="Chưa có pipeline. Bấm bên dưới để tạo pipeline mặc định 5 stage."
        />
        <Button onClick={() => ensureDefault.mutate()} className="gap-2">
          <Plus size={16} /> Tạo Pipeline mặc định
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Pipeline Deals"
        description={`Kéo-thả để di chuyển deal giữa các giai đoạn. Tổng OPEN: ${formatCurrency(totalValue)} · WON: ${formatCurrency(wonValue)}`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={pipelineId || ''}
          onChange={(e) => setPipelineId(e.target.value)}
        >
          {pipelineList.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="flex-1" />
        <Button
          className="gap-2"
          onClick={() => {
            if (stageList[0]) setForm((f) => ({ ...f, stageId: stageList[0].id }))
            setShowCreate(true)
          }}
        >
          <Plus size={16} /> Thêm Deal
        </Button>
      </div>

      {isError && (
        <div className="border rounded-lg bg-white">
          <ErrorState
            title="Không tải được deals"
            onRetry={() => refetch()}
            isRetrying={isFetching}
          />
        </div>
      )}

      {isLoading && <div className="text-sm text-neutral-500">Đang tải pipeline…</div>}

      {!isLoading && !isError && dealList.filter((d) => d.status === 'OPEN' || d.status === 'STALLED').length === 0 && (
        <div className="border rounded-lg bg-white mb-2">
          <EmptyState
            icon={Trophy}
            title="Pipeline trống"
            description="Chưa có deal OPEN — thêm deal hoặc kéo từ stage khác. Kéo-thả để đổi stage (1 bước)."
            action={{
              label: 'Thêm Deal',
              onClick: () => {
                if (stageList[0]) setForm((f) => ({ ...f, stageId: stageList[0].id }))
                setShowCreate(true)
              },
            }}
          />
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
        {stageList.map((stage) => {
          const items = dealsByStage.get(stage.id) ?? []
          const totalStage = items.reduce((s, d) => s + (d.amount || 0), 0)
          const color = stageColor(stage.orderNo)
          return (
            <div
              key={stage.id}
              className="w-72 flex-shrink-0 bg-neutral-100 rounded-lg p-2 flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(stage.id)}
            >
              <div className="flex items-center justify-between p-2 pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-neutral-900 truncate">{stage.name}</div>
                    <div className="text-xs text-neutral-500">
                      {items.length} deals · {formatCurrency(totalStage)}
                    </div>
                  </div>
                </div>
                {stage.probability != null && (
                  <span className={`text-xs border rounded-full px-2 py-0.5 shrink-0 ${color.badge}`}>
                    {stage.probability}%
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-2 mt-2 overflow-y-auto">
                {items.map((d) => (
                  <div
                    key={d.id}
                    draggable
                    onDragStart={() => setDraggingId(d.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className={`bg-white rounded-md p-3 border border-neutral-200 border-l-4 ${color.border} shadow-sm cursor-move hover:shadow-md transition`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <div className="text-sm font-medium text-neutral-900 flex-1 min-w-0 truncate">
                        {d.title}
                      </div>
                      {d.ownerUsername && (
                        <div
                          className={`w-7 h-7 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0 shadow-sm ${ownerAvatarClass(d.ownerUsername)}`}
                          title={`Owner: ${d.ownerUsername}`}
                        >
                          {ownerInitials(d.ownerUsername)}
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-bold text-emerald-700 mb-2 tabular-nums">
                      {formatCurrency(d.amount)}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                      {d.customerName && (
                        <span className="inline-flex items-center gap-1"><User size={11} />{d.customerName}</span>
                      )}
                      {d.expectedCloseDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={11} /> {formatDate(d.expectedCloseDate)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-neutral-100">
                      <button
                        className="p-1 rounded hover:bg-primary-50 text-primary-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCommentDeal(d)
                        }}
                        title="Bình luận"
                      ><MessageSquare size={14} /></button>
                      <button
                        className="p-1 rounded hover:bg-emerald-50 text-emerald-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          setWonTarget(d)
                        }}
                        title="WON"
                      ><Trophy size={14} /></button>
                      <button
                        className="p-1 rounded hover:bg-red-50 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          setLostReason('')
                          setLostTarget(d)
                        }}
                        title="LOST"
                      ><XCircle size={14} /></button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="p-4 text-center text-xs text-neutral-400">Kéo deal vào đây</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AppModal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Thêm Deal mới">
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
                type="number"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm text-neutral-700 mb-1 block">Giai đoạn</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.stageId}
                onChange={(e) => setForm({ ...form, stageId: e.target.value })}
              >
                {stageList.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
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
        title={`Đánh dấu WON?`}
        message={`Deal "${wonTarget?.title || ''}" sẽ chuyển sang trạng thái thắng.`}
        confirmText="Xác nhận WON"
        variant="default"
        isLoading={win.isPending}
      />

      <AppModal
        isOpen={!!lostTarget}
        onClose={() => { setLostTarget(null); setLostReason('') }}
        title="Đánh dấu deal LOST"
        description={lostTarget?.title}
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm text-neutral-700 mb-1 block">Lý do LOST</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={3}
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="VD: Giá cao hơn đối thủ, khách hoãn ngân sách…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setLostTarget(null); setLostReason('') }}>Huỷ</Button>
            <Button
              variant="destructive"
              disabled={lose.isPending}
              onClick={() => {
                if (!lostTarget) return
                lose.mutate(
                  { id: lostTarget.id, reason: lostReason.trim() || undefined },
                  { onSuccess: () => { setLostTarget(null); setLostReason('') } },
                )
              }}
            >
              Xác nhận LOST
            </Button>
          </div>
        </div>
      </AppModal>

      <CommentDrawer
        open={!!commentDeal}
        onClose={() => setCommentDeal(null)}
        subjectType={SubjectType.DEAL}
        subjectId={commentDeal?.id || ''}
        title={commentDeal?.title || 'Deal'}
        subtitle={commentDeal?.customerName}
      />
    </div>
  )
}
