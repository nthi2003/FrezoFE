import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckSquare, ArrowRight } from 'lucide-react'
import { EmptyState, ErrorState, Skeleton } from '@frezo/ui'
import { useTickets } from '../../tasks/hooks/useTicketTag'
import { profileApi } from '@/modules/profile/services/profileApi'

/** Cột board khớp TicketsPage kanban (OPEN → IN_PROGRESS → RESOLVED). */
const COLUMNS = [
  { key: 'OPEN', label: 'Mở', headerBg: 'bg-neutral-100', headerText: 'text-neutral-800', countClass: 'bg-neutral-500 text-white' },
  { key: 'IN_PROGRESS', label: 'Đang xử lý', headerBg: 'bg-info-light', headerText: 'text-info-dark', countClass: 'bg-info text-white' },
  { key: 'RESOLVED', label: 'Đã giải quyết', headerBg: 'bg-success-light', headerText: 'text-success-dark', countClass: 'bg-success text-white' },
] as const

const DONE_STATUSES = new Set(['RESOLVED', 'CLOSED'])

interface TaskBoardWidgetProps {
  /** true = chỉ ticket assignee = person hiện tại */
  mineOnly?: boolean
}

/**
 * Mini task board trên Dashboard — data từ GET /task/ticket (cùng nguồn Kanban).
 */
export function TaskBoardWidget({ mineOnly = true }: TaskBoardWidgetProps) {
  const nav = useNavigate()
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000,
  })
  const currentPersonId = profile?.personId
  /** Chờ profile khi mineOnly — tránh flash count all → mine. */
  const awaitMine = mineOnly && profileLoading

  const { data: raw, isLoading, isError, refetch, isFetching } = useTickets()
  const tickets = useMemo(() => {
    let list = raw ?? []
    if (mineOnly) {
      if (!currentPersonId) return []
      list = list.filter((t: { assigneeId?: string }) => t.assigneeId === currentPersonId)
    }
    return list
  }, [raw, mineOnly, currentPersonId])
  const boardLoading = isLoading || awaitMine

  const columns = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        items: tickets.filter(
          (t: { status?: string }) =>
            t.status === col.key || (!t.status && col.key === 'OPEN'),
        ),
      })),
    [tickets],
  )

  const incomplete = tickets.filter(
    (t: { status?: string }) => !DONE_STATUSES.has(t.status || 'OPEN'),
  ).length
  const total = tickets.length

  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Task board</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {boardLoading
              ? 'Đang tải…'
              : total > 0
                ? `${incomplete} trong ${total} task chưa xong`
                : mineOnly
                  ? 'Ticket được giao cho bạn'
                  : 'Ticket trên board'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => nav('/task?tab=board')}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-800 shrink-0"
        >
          Mở board <ArrowRight size={14} />
        </button>
      </div>

      {isError ? (
        <ErrorState
          title="Không tải được task board"
          message="Lỗi mạng hoặc máy chủ. Thử lại."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
          className="py-8"
        />
      ) : boardLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {COLUMNS.map((c) => (
            <div key={c.key} className="rounded-xl border border-neutral-100 p-3 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={mineOnly ? 'Chưa có task của bạn' : 'Chưa có ticket'}
          description={
            mineOnly
              ? 'Khi được giao ticket, chúng sẽ hiện trên board này.'
              : 'Tạo ticket đầu tiên trên Kanban.'
          }
          action={{ label: 'Mở board', onClick: () => nav('/task?tab=board') }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {columns.map((col) => (
            <div
              key={col.key}
              className="rounded-xl border border-neutral-100 bg-neutral-50/50 min-h-[120px] flex flex-col"
            >
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-t-xl ${col.headerBg}`}
              >
                <span className={`text-xs font-semibold ${col.headerText}`}>{col.label}</span>
                <span
                  className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold inline-flex items-center justify-center ${col.countClass}`}
                >
                  {col.items.length}
                </span>
              </div>
              <ul className="p-2 space-y-1.5 flex-1">
                {col.items.slice(0, 4).map((t: { id: string; title?: string; priority?: string }) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() =>
                        nav(`/task?tab=board&ticketId=${encodeURIComponent(t.id)}`)
                      }
                      className="w-full text-left px-2.5 py-2 rounded-lg bg-white border border-neutral-100 hover:border-neutral-300 hover:shadow-sm transition"
                    >
                      <div className="text-xs font-medium text-neutral-800 truncate">
                        {t.title || 'Không tiêu đề'}
                      </div>
                      {t.priority && (
                        <div className="text-[10px] text-neutral-400 mt-0.5">{t.priority}</div>
                      )}
                    </button>
                  </li>
                ))}
                {col.items.length === 0 && (
                  <li className="text-[11px] text-neutral-400 px-2 py-3 text-center">Trống</li>
                )}
                {col.items.length > 4 && (
                  <li className="text-[10px] text-neutral-500 px-2 pt-0.5">
                    +{col.items.length - 4} khác
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Hook helper: count incomplete/total từ GET /task/ticket (mine optional). */
export function useTaskBoardCounts(mineOnly = false) {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    staleTime: 5 * 60 * 1000,
  })
  const currentPersonId = profile?.personId
  const awaitMine = mineOnly && profileLoading

  const query = useTickets()
  const tickets = useMemo(() => {
    let list = query.data ?? []
    if (mineOnly) {
      if (!currentPersonId) return []
      list = list.filter((t: { assigneeId?: string }) => t.assigneeId === currentPersonId)
    }
    return list
  }, [query.data, mineOnly, currentPersonId])

  const incomplete = tickets.filter(
    (t: { status?: string }) => !DONE_STATUSES.has(t.status || 'OPEN'),
  ).length

  return {
    ...query,
    isLoading: query.isLoading || awaitMine,
    tickets,
    incomplete,
    total: tickets.length,
  }
}
