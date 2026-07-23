// ============================================================
// TransferRequestsPanel — danh sách ticket cấp phát / thu hồi
// ------------------------------------------------------------
// Hiển thị:
//   - Filter chip theo trạng thái (Chờ duyệt / Đã duyệt / Đã bàn giao / ...)
//   - Search theo asset code / person / requester / reason
//   - Card mỗi request: asset preview + person + reason + WorkflowStepper
//   - Action buttons phụ thuộc status: Duyệt / Từ chối / Bàn giao / Huỷ
// ============================================================

import { useMemo, useState } from 'react'
import {
  Search, X, RefreshCw, ClipboardCheck, Package, Loader2, User,
  ThumbsUp, ThumbsDown, PackageCheck, XCircle, ArrowRightLeft, CalendarDays,
} from 'lucide-react'
import { Button, EmptyState } from '@frezo/ui'
import { useTransferRequests } from '../hooks/useTransferRequest'
import type { TransferRequestItem, TransferStatus } from '../services/assetApi'
import { TRANSFER_STATUS_META, TRANSFER_TYPE_LABEL, fmtDate } from '../constants/assetMeta'
import { WorkflowStepper, type WorkflowStepItem } from '@/components/workflow/WorkflowStepper'
import { useWorkflowInstanceByEntity } from '@/modules/workflow/hooks/useWorkflow'
import type { WorkflowInstance, WorkflowTask } from '@/modules/workflow/services/workflowApi'
import {
  TransferRequestActionModal, type TransferAction,
} from './TransferRequestActionModal'

export function TransferRequestsPanel() {
  const [status, setStatus] = useState<'all' | TransferStatus>('PENDING')
  const [search, setSearch] = useState('')

  const [target, setTarget] = useState<TransferRequestItem | null>(null)
  const [action, setAction] = useState<TransferAction | null>(null)

  const { data, isLoading, isFetching, refetch } = useTransferRequests({
    status: status !== 'all' ? status : undefined,
    keyword: search.trim() || undefined,
    size: 100,
  })
  const items = data?.items || []

  // Stats theo status để hiện badge trên filter chip
  const stats = useMemo(() => {
    const s: Record<string, number> = { PENDING: 0, APPROVED: 0, HANDED_OVER: 0, REJECTED: 0, CANCELLED: 0 }
    // Chỉ đếm được từ items hiện tại → không hoàn toàn chính xác khi lọc, nhưng ổn cho UX.
    for (const it of items) s[it.status] = (s[it.status] || 0) + 1
    return s
  }, [items])

  const openAction = (req: TransferRequestItem, act: TransferAction) => {
    setTarget(req); setAction(act)
  }
  const closeAction = () => { setTarget(null); setAction(null) }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên nhân viên, requester, lý do..."
            className="w-full h-9 pl-9 pr-9 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-1 flex-wrap">
          <StatusChip label="Tất cả" active={status === 'all'} onClick={() => setStatus('all')} />
          <StatusChip label="Chờ duyệt" tone="amber"    active={status === 'PENDING'}     count={stats.PENDING}     onClick={() => setStatus('PENDING')} />
          <StatusChip label="Đã duyệt"  tone="blue"     active={status === 'APPROVED'}    count={stats.APPROVED}    onClick={() => setStatus('APPROVED')} />
          <StatusChip label="Đã bàn giao" tone="emerald" active={status === 'HANDED_OVER'} count={stats.HANDED_OVER} onClick={() => setStatus('HANDED_OVER')} />
          <StatusChip label="Từ chối"   tone="rose"     active={status === 'REJECTED'}    count={stats.REJECTED}    onClick={() => setStatus('REJECTED')} />
          <StatusChip label="Đã huỷ"    tone="neutral"  active={status === 'CANCELLED'}   count={stats.CANCELLED}   onClick={() => setStatus('CANCELLED')} />
        </div>

        <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 ml-auto">
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Làm mới
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-16 bg-white rounded-xl border border-neutral-200 flex flex-col items-center justify-center gap-3 text-neutral-400">
          <Loader2 size={22} className="animate-spin text-primary-500" />
          <span className="text-sm">Đang tải yêu cầu...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200">
          <EmptyState
            icon={ClipboardCheck}
            title="Không có yêu cầu"
            description={
              status !== 'all' || search
                ? 'Không có yêu cầu nào khớp bộ lọc. Thử bỏ lọc hoặc đổi trạng thái.'
                : 'Chưa có yêu cầu cấp phát nào. Từ tab Tài sản, chọn 1 asset "Sẵn sàng" và bấm Cấp phát.'
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {items.map((req) => (
            <TransferRequestCard key={req.id} req={req} onAction={openAction} />
          ))}
        </div>
      )}

      <TransferRequestActionModal request={target} action={action} onClose={closeAction} />
    </div>
  )
}

// ============================================================
// Card cho từng request
// ============================================================

function TransferRequestCard({
  req, onAction,
}: { req: TransferRequestItem; onAction: (r: TransferRequestItem, a: TransferAction) => void }) {
  const st = TRANSFER_STATUS_META[req.status]

  // Hỏi workflow engine để lấy state chi tiết — CHỈ khi ticket đã wire vào engine.
  // Tương thích ngược: ticket cũ (workflowInstanceId=null) sẽ fallback về stepper 3 bước (không hardcode Admin/HR).
  const hasEngine = !!req.workflowInstanceId
  const { data: instance, isLoading: instanceLoading } = useWorkflowInstanceByEntity(
    'ASSET_TRANSFER',
    hasEngine ? req.id : undefined,
  ) as { data: WorkflowInstance | null | undefined; isLoading: boolean }

  const { steps, currentIndex } = buildStepper(req, instance)
  const waitingInstance = hasEngine && instanceLoading && !instance
  const pendingInfo = resolvePendingApprover(req, instance)

  const isTerminal = req.status === 'REJECTED' || req.status === 'CANCELLED' || req.status === 'HANDED_OVER'

  // Với engine mode, nút hiện label bước tiếp theo cần duyệt (thay vì generic "Duyệt")
  const nextStepLabel = hasEngine && !isTerminal
    ? (req.currentStepName || pendingInfo?.stepName || nextPendingTaskLabel(instance))
    : null

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition">
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-neutral-100 text-neutral-600">
              <ArrowRightLeft size={10} /> {TRANSFER_TYPE_LABEL[req.requestType]}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${st.tone}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
            {hasEngine && (
              <span
                title="Ticket đang chạy theo quy trình duyệt đã cấu hình"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-700 border border-primary-100"
              >
                Workflow
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Package size={14} className="text-neutral-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-neutral-900 truncate">{req.assetName}</div>
              <div className="text-xs font-mono text-neutral-500">{req.assetCode}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="text-neutral-500 inline-flex items-center gap-1">
            <User size={11} /> Người nhận: <b className="text-neutral-800 ml-0.5">{req.personName || '—'}</b>
          </span>
          <span className="text-neutral-500 inline-flex items-center gap-1">
            <User size={11} /> Requester: <b className="text-neutral-800 ml-0.5">@{req.requesterUsername}</b>
          </span>
          {req.plannedDate && (
            <span className="text-neutral-500 inline-flex items-center gap-1">
              <CalendarDays size={11} /> Dự kiến: <b className="text-neutral-800 ml-0.5">{fmtDate(req.plannedDate)}</b>
            </span>
          )}
        </div>

        {req.reason && (
          <div className="text-xs text-neutral-700 bg-neutral-50 border border-neutral-100 rounded-md p-2 leading-relaxed whitespace-pre-wrap italic">
            "{req.reason}"
          </div>
        )}

        {/* Workflow progress — engine state khi có, fallback khi không */}
        <div className="border-t border-neutral-100 pt-3 space-y-2">
          {pendingInfo && !isTerminal && (
            <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 leading-relaxed">
              Đang chờ duyệt: <b>{pendingInfo.stepName}</b>
              {pendingInfo.actor ? <> — {pendingInfo.actor}</> : null}
              {hasEngine && (
                <span className="text-amber-700/80"> (theo workflow definition)</span>
              )}
            </div>
          )}
          {waitingInstance ? (
            <div className="text-[11px] text-neutral-500 inline-flex items-center gap-1.5 py-1">
              <Loader2 size={12} className="animate-spin text-primary-500" />
              Đang tải bước duyệt từ workflow...
            </div>
          ) : (
            <WorkflowStepper
              steps={steps}
              currentIndex={currentIndex}
              rejected={req.status === 'REJECTED'}
              cancelled={req.status === 'CANCELLED'}
            />
          )}
        </div>

        {(req.rejectReason || req.handoverNote || req.approveNote) && (
          <div className="text-[11px] text-neutral-600 bg-neutral-50 border border-neutral-100 rounded p-2 leading-relaxed">
            {req.status === 'REJECTED' && req.rejectReason && (
              <><b className="text-rose-700">Lý do từ chối:</b> {req.rejectReason}</>
            )}
            {req.status === 'APPROVED' && req.approveNote && (
              <><b className="text-blue-700">Duyệt gần nhất:</b> {req.approveNote}</>
            )}
            {req.status === 'HANDED_OVER' && req.handoverNote && (
              <><b className="text-emerald-700">Bàn giao:</b> {req.handoverNote}</>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      {!isTerminal && (
        <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/40 flex flex-wrap items-center gap-2">
          {/* Với engine: 1 nút duyệt dynamic — mỗi lần bấm là advance 1 bước.
              Với legacy (không có engine): giữ 2 nút riêng "Duyệt" + "Bàn giao". */}
          {hasEngine ? (
            <>
              <Button onClick={() => onAction(req, 'approve')} className="gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs h-8 px-3">
                <ThumbsUp size={12} /> {nextStepLabel ? `Duyệt: ${nextStepLabel}` : 'Duyệt bước hiện tại'}
              </Button>
              <Button variant="outline" onClick={() => onAction(req, 'reject')} className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-8 px-3">
                <ThumbsDown size={12} /> Từ chối
              </Button>
              {req.status === 'PENDING' && (
                <Button variant="outline" onClick={() => onAction(req, 'cancel')} className="gap-1.5 ml-auto text-neutral-500 text-xs h-8 px-3">
                  <XCircle size={12} /> Huỷ ticket
                </Button>
              )}
            </>
          ) : (
            <>
              {req.status === 'PENDING' && (
                <>
                  <Button onClick={() => onAction(req, 'approve')} className="gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs h-8 px-3">
                    <ThumbsUp size={12} /> Duyệt
                  </Button>
                  <Button variant="outline" onClick={() => onAction(req, 'reject')} className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 text-xs h-8 px-3">
                    <ThumbsDown size={12} /> Từ chối
                  </Button>
                  <Button variant="outline" onClick={() => onAction(req, 'cancel')} className="gap-1.5 ml-auto text-neutral-500 text-xs h-8 px-3">
                    <XCircle size={12} /> Huỷ ticket
                  </Button>
                </>
              )}
              {req.status === 'APPROVED' && (
                <Button onClick={() => onAction(req, 'handover')} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3">
                  <PackageCheck size={12} /> Xác nhận bàn giao
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Convert ticket + workflow instance → list step cho `<WorkflowStepper />`.
 * <p>
 * Ưu tiên state từ engine (steps + tasks động, N bước tuỳ config). Nếu chưa có
 * instance (legacy ticket hoặc engine chưa reply), fallback về 3 bước hardcoded
 * (Yêu cầu → Duyệt → Bàn giao) để không blank UI.
 */
function buildStepper(req: TransferRequestItem, instance: WorkflowInstance | null | undefined): {
  steps: WorkflowStepItem[]
  currentIndex: number
} {
  if (instance && instance.steps && instance.steps.length > 0) {
    // Build từ definition steps + tasks đã tạo
    const tasksByOrder = new Map<number, WorkflowTask>()
    ;(instance.tasks || []).forEach((t) => tasksByOrder.set(t.stepOrder, t))

    // Step 0 là "Yêu cầu" (do requester tạo) — prepend để show lịch sử đầy đủ
    const engineSteps: WorkflowStepItem[] = [
      {
        label: 'Yêu cầu',
        actor: req.requesterUsername,
        at: req.createdDate,
        status: 'DONE',
      },
      ...instance.steps.map((s, idx) => {
        const task = tasksByOrder.get(idx)
        const status =
          task?.status === 'APPROVED' ? ('DONE' as const) :
          task?.status === 'REJECTED' ? ('REJECTED' as const) :
          task?.status === 'SKIPPED'  ? ('SKIPPED' as const) :
          task?.status === 'PENDING'  ? ('ACTIVE' as const) :
          undefined
        return {
          label: s.stepName,
          actor: task?.decidedBy || task?.assigneeUsername || task?.assigneeRole || describeType(s.approverType, s.approverValue),
          at: task?.decidedAt || undefined,
          note: task?.comment || undefined,
          status,
        }
      }),
    ]
    // currentIndex chỉ dùng khi status chưa được set — với engine ta set explicit status,
    // truyền -1 để không đè.
    return { steps: engineSteps, currentIndex: -1 }
  }

  // Fallback legacy — 3 bước cố định
  return {
    steps: [
      { label: 'Yêu cầu', actor: req.requesterUsername, at: req.createdDate, status: 'DONE' },
      {
        label: 'Duyệt',
        actor: req.approvedBy || req.rejectedBy || 'Chờ',
        at: req.approvedAt || req.rejectedAt,
        note: req.approveNote || req.rejectReason,
      },
      {
        label: 'Bàn giao',
        actor: req.handedOverBy || 'Chờ',
        at: req.handedOverAt,
        note: req.handoverNote,
      },
    ],
    currentIndex:
      req.status === 'PENDING' ? 1 :
      req.status === 'APPROVED' ? 2 :
      req.status === 'HANDED_OVER' ? 3 :
      req.status === 'REJECTED' ? 1 :
      req.status === 'CANCELLED' ? 1 : 0,
  }
}

function describeType(type: string, value?: string | null): string {
  if (type === 'USER') return value?.trim() || 'Người cụ thể'
  if (type === 'ROLE') return value?.trim() ? `Role: ${value}` : 'Role'
  if (type === 'MANAGER') return 'Quản lý'
  if (type === 'ADMIN') return 'Admin'
  return type
}

function nextPendingTaskLabel(instance: WorkflowInstance | null | undefined): string | null {
  if (!instance || !instance.tasks) return null
  const pending = instance.tasks.find((t) => t.status === 'PENDING')
  return pending?.stepName || null
}

/** Banner Path A: bước hiện tại + assignee/role từ instance (hoặc enrichment trên ticket). */
function resolvePendingApprover(
  req: TransferRequestItem,
  instance: WorkflowInstance | null | undefined,
): { stepName: string; actor?: string } | null {
  if (req.status !== 'PENDING' && req.status !== 'APPROVED') return null

  if (instance?.tasks?.length) {
    const pending = instance.tasks.find((t) => t.status === 'PENDING')
    if (pending) {
      const step =
        instance.steps?.find((s, idx) =>
          (s.stepOrder ?? idx) === pending.stepOrder || s.stepName === pending.stepName,
        ) || instance.steps?.[pending.stepOrder]
      return {
        stepName: pending.stepName || req.currentStepName || 'Bước hiện tại',
        actor:
          pending.assigneeUsername ||
          pending.assigneeRole ||
          (step ? describeType(step.approverType, step.approverValue) : undefined),
      }
    }
  }

  if (req.currentStepName) {
    return { stepName: req.currentStepName }
  }

  if (!req.workflowInstanceId && req.status === 'PENDING') {
    return { stepName: 'Duyệt', actor: 'Theo cấu hình / quyền hiện có' }
  }
  if (!req.workflowInstanceId && req.status === 'APPROVED') {
    return { stepName: 'Bàn giao', actor: 'Người xác nhận bàn giao' }
  }
  return null
}

// ============================================================
// Status filter chip
// ============================================================

function StatusChip({
  label, count, active, onClick, tone,
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
  tone?: 'amber' | 'blue' | 'emerald' | 'rose' | 'neutral'
}) {
  const activeCls = {
    amber:   'bg-amber-100 text-amber-700 border-amber-200',
    blue:    'bg-blue-100 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rose:    'bg-rose-100 text-rose-700 border-rose-200',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  }[tone || 'blue']
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 px-2.5 rounded-md text-xs font-medium transition border inline-flex items-center gap-1 ${
        active
          ? tone ? activeCls : 'bg-primary-50 text-primary-700 border-primary-200'
          : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 border-transparent'
      }`}
    >
      {label}
      {typeof count === 'number' && count > 0 && (
        <span className={`text-[10px] font-bold px-1 rounded ${active ? 'bg-white/60' : 'bg-neutral-200 text-neutral-600'}`}>
          {count}
        </span>
      )}
    </button>
  )
}
