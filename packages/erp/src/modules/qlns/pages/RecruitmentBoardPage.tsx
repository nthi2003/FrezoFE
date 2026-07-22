// ============================================================
// FREZO ERP — Recruitment Kanban Board
// Stages sync BE: APPLIED → SCREENING → INTERVIEW → OFFER → HIRED | REJECTED
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Briefcase, ChevronLeft, Loader2, Mail, Phone, Star, User, UserCheck,
} from 'lucide-react'
import { Button, PageHeader, EmptyState } from '@frezo/ui'
import {
  useApplications, useMoveApplication, useHireApplication, useRequisitions,
} from '../hooks/useRecruitment'
import type {
  Application, ApplicationStage, Requisition,
} from '../services/recruitmentApi'
import { normalizeStage } from '../services/recruitmentApi'

const STAGES: Array<{
  key: ApplicationStage
  label: string
  border: string
  dot: string
  headerBg: string
}> = [
  {
    key: 'APPLIED', label: 'Ứng tuyển',
    border: 'border-l-blue-500', dot: 'bg-blue-500', headerBg: 'bg-blue-50 text-blue-700',
  },
  {
    key: 'SCREENING', label: 'Sàng lọc CV',
    border: 'border-l-violet-500', dot: 'bg-violet-500', headerBg: 'bg-violet-50 text-violet-700',
  },
  {
    key: 'INTERVIEW', label: 'Phỏng vấn',
    border: 'border-l-amber-500', dot: 'bg-amber-500', headerBg: 'bg-amber-50 text-amber-700',
  },
  {
    key: 'OFFER', label: 'Offer',
    border: 'border-l-cyan-500', dot: 'bg-cyan-500', headerBg: 'bg-cyan-50 text-cyan-700',
  },
  {
    key: 'HIRED', label: 'Đã nhận',
    border: 'border-l-emerald-500', dot: 'bg-emerald-500', headerBg: 'bg-emerald-50 text-emerald-700',
  },
  {
    key: 'REJECTED', label: 'Loại',
    border: 'border-l-neutral-400', dot: 'bg-neutral-400', headerBg: 'bg-neutral-100 text-neutral-600',
  },
]

export function RecruitmentBoardPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const requisitionId = params.get('requisitionId') || undefined

  const { data: reqRows, isError: reqError } = useRequisitions()
  const { data: appRows, isLoading, isError: appError } = useApplications({ requisitionId })
  const move = useMoveApplication()
  const hire = useHireApplication()

  const requisitions = (reqRows as Requisition[] | undefined) ?? []
  const applications = (appRows as Application[] | undefined) ?? []
  const currentReq = requisitions.find((r) => r.id === requisitionId)

  const [draggingId, setDraggingId] = useState<string | null>(null)

  const byStage = useMemo(() => {
    const map = new Map<ApplicationStage, Application[]>()
    STAGES.forEach((s) => map.set(s.key, []))
    applications.forEach((a) => {
      const stage = normalizeStage(a.stage)
      const arr = map.get(stage) ?? []
      arr.push({ ...a, stage })
      map.set(stage, arr)
    })
    return map
  }, [applications])

  const onDrop = (stage: ApplicationStage) => {
    if (!draggingId) return
    const app = applications.find((a) => a.id === draggingId)
    if (!app || normalizeStage(app.stage) === stage) {
      setDraggingId(null)
      return
    }
    move.mutate({ id: draggingId, stage })
    setDraggingId(null)
  }

  const headcount = currentReq?.headcount ?? currentReq?.quantity ?? 0
  const filled = currentReq?.filledCount ?? currentReq?.hiredCount ?? 0

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <button
              onClick={() => nav('/qlns/recruitment/requisitions')}
              className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition"
              title="Về danh sách tin tuyển dụng"
            >
              <ChevronLeft size={18} />
            </button>
            Kanban ứng viên
            {currentReq && (
              <span className="text-sm font-medium text-neutral-500 ml-2">
                · {currentReq.title}
              </span>
            )}
          </span>
        }
        description={
          currentReq
            ? `Cần tuyển ${headcount} · Đã lấp ${filled}`
            : 'Kéo-thả để chuyển ứng viên giữa các bước (APPLIED → … → HIRED).'
        }
        actions={
          <>
            {!requisitionId && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => nav('/qlns/recruitment/requisitions')}
              >
                <Briefcase size={15} /> Chọn tin tuyển dụng
              </Button>
            )}
          </>
        }
      />

      {!requisitionId && requisitions.length > 0 && (
        <div className="p-3 bg-white border rounded-lg flex flex-wrap gap-2 items-center">
          <span className="text-sm text-neutral-500 mr-2">Chọn tin:</span>
          {requisitions.slice(0, 8).map((r) => (
            <button
              key={r.id}
              onClick={() => nav(`/qlns/recruitment/board?requisitionId=${r.id}`)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
            >
              <Briefcase size={11} /> {r.title}
            </button>
          ))}
        </div>
      )}

      {(appError || reqError) && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
          Không tải được dữ liệu tuyển dụng (401/network không bị nuốt).
        </p>
      )}

      {isLoading ? (
        <div className="p-8 border rounded-lg bg-white text-center text-neutral-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Đang tải…
        </div>
      ) : applications.length === 0 ? (
        <div className="border rounded-lg bg-white">
          <EmptyState
            icon={User}
            title="Chưa có ứng viên"
            description={
              requisitionId
                ? 'Tin này chưa có đơn ứng tuyển. Khi có apply, ứng viên sẽ hiện theo stage BE.'
                : 'Chọn một tin tuyển dụng hoặc chờ ứng viên apply.'
            }
            action={
              !requisitionId
                ? {
                    label: 'Danh sách tin',
                    onClick: () => nav('/qlns/recruitment/requisitions'),
                  }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
          {STAGES.map((s) => {
            const items = byStage.get(s.key) ?? []
            return (
              <div
                key={s.key}
                className="w-72 flex-shrink-0 bg-neutral-100 rounded-lg p-2 flex flex-col"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(s.key)}
              >
                <div className={`flex items-center justify-between px-3 py-2 rounded-md ${s.headerBg}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="text-sm font-semibold">{s.label}</span>
                  </div>
                  <span className="text-xs font-medium bg-white/70 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="flex-1 space-y-2 mt-2 overflow-y-auto">
                  {items.map((a) => (
                    <ApplicationCard
                      key={a.id}
                      app={a}
                      borderClass={s.border}
                      showHire={s.key === 'OFFER'}
                      hiring={hire.isPending}
                      onHire={() => hire.mutate(a.id)}
                      onDragStart={() => setDraggingId(a.id)}
                      onDragEnd={() => setDraggingId(null)}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="p-4 text-center text-xs text-neutral-400">
                      Kéo ứng viên vào đây
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ApplicationCard({
  app,
  borderClass,
  showHire,
  hiring,
  onHire,
  onDragStart,
  onDragEnd,
}: {
  app: Application
  borderClass: string
  showHire?: boolean
  hiring?: boolean
  onHire?: () => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-md p-3 border border-neutral-200 border-l-4 ${borderClass} shadow-sm cursor-move hover:shadow-md transition`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-bold text-white flex items-center justify-center shrink-0">
          {initials(app.candidateName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-neutral-900 truncate">
            {app.candidateName}
          </div>
          {app.requisitionTitle && (
            <div className="text-[11px] text-neutral-500 truncate">
              {app.requisitionTitle}
            </div>
          )}
        </div>
      </div>
      {(app.candidatePhone || app.candidateEmail) && (
        <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500 mb-1.5">
          {app.candidatePhone && (
            <span className="inline-flex items-center gap-1">
              <Phone size={10} />
              <span className="font-mono">{app.candidatePhone}</span>
            </span>
          )}
          {app.candidateEmail && (
            <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
              <Mail size={10} /> {app.candidateEmail}
            </span>
          )}
        </div>
      )}
      {app.ratingScore != null && (
        <div className="flex items-center gap-0.5 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={11}
              className={
                i < Math.round(app.ratingScore || 0)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-neutral-200'
              }
            />
          ))}
        </div>
      )}
      {showHire && onHire && (
        <button
          type="button"
          disabled={hiring}
          onClick={(e) => {
            e.stopPropagation()
            onHire()
          }}
          className="mt-2 w-full inline-flex items-center justify-center gap-1 h-7 rounded-md text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <UserCheck size={12} /> Duyệt thuê
        </button>
      )}
    </div>
  )
}

function initials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
