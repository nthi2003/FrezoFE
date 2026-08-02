// ============================================================
// FREZO ERP — Notifications Page (/notifications)
// ============================================================

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, Search, Filter, CircleDot, Sparkles, Zap,
  Inbox, RefreshCw, AlertCircle,
} from 'lucide-react'
import { PageHeader, Button, EmptyState, Select } from '@frezo/ui'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/modules/common/hooks/useNotification'
import { resolveNotificationUrl } from '@/modules/common/utils/resolveNotificationUrl'
import {
  collectNotificationTypes,
  computeNotificationStats,
  filterNotifications,
  getNotificationTypeLabel,
  isNotificationRead,
} from '@/modules/common/utils/notificationHelpers'
import { NotificationsList } from '../components/NotificationsList'
import type { NotificationItem } from '../types'

type FilterTab = 'all' | 'unread' | 'urgent'

const TABS: Array<{ key: FilterTab; label: string; icon: typeof Bell }> = [
  { key: 'all', label: 'Tất cả', icon: Inbox },
  { key: 'unread', label: 'Chưa đọc', icon: CircleDot },
  { key: 'urgent', label: 'Khẩn', icon: Zap },
]

export function NotificationsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch, isFetching } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const [tab, setTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')

  const items = useMemo<NotificationItem[]>(
    () => (Array.isArray(data) ? data : []),
    [data],
  )

  const filtered = useMemo(
    () => filterNotifications(items, { tab, type: typeFilter, search }),
    [items, tab, typeFilter, search],
  )

  const stats = useMemo(() => computeNotificationStats(items), [items])
  const availableTypes = useMemo(() => collectNotificationTypes(items), [items])

  const handleClick = (n: NotificationItem) => {
    if (!isNotificationRead(n) && n.id) markRead.mutate(n.id)
    const url = resolveNotificationUrl(n)
    if (url) navigate(url)
  }

  const handleMarkAllRead = () => {
    const unreadIds = items.filter((n) => !isNotificationRead(n) && n.id).map((n) => n.id!)
    if (unreadIds.length > 0) markAll.mutate(unreadIds)
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <PageHeader
        title="Thông báo"
        description="Trung tâm thông báo — theo dõi mọi cập nhật quan trọng từ ticket, hoá đơn, chấm công, tuyển dụng…"
        actions={
          <>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
              Tải lại
            </Button>
            <Button
              className="gap-1.5"
              onClick={handleMarkAllRead}
              disabled={stats.unread === 0 || markAll.isPending}
            >
              <CheckCheck size={15} /> Đánh dấu tất cả đã đọc
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={Inbox} label="Tổng thông báo" value={stats.total} tone="neutral" />
        <StatTile icon={CircleDot} label="Chưa đọc" value={stats.unread} tone="primary" />
        <StatTile icon={Zap} label="Khẩn chưa đọc" value={stats.urgent} tone="rose" />
      </div>

      <div className="p-3 bg-white border border-neutral-200 shadow-sm rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              className="h-9 w-full pl-9 pr-3 text-sm bg-neutral-50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition placeholder:text-neutral-400"
              placeholder="Tìm theo tiêu đề, nội dung, người gửi…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {availableTypes.length > 0 && (
            <div className="inline-flex items-center gap-2">
              <Filter size={14} className="text-neutral-400" />
              <div className="min-w-[160px]">
                <Select
                  options={[
                    { value: 'ALL', label: 'Tất cả loại' },
                    ...availableTypes.map((t) => ({
                      value: t,
                      label: getNotificationTypeLabel(t),
                    })),
                  ]}
                  value={typeFilter}
                  onChange={setTypeFilter}
                  placeholder="Loại thông báo"
                  aria-label="Lọc loại thông báo"
                  showSearch={availableTypes.length > 8}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            const badge =
              t.key === 'unread' ? stats.unread : t.key === 'urgent' ? stats.urgent : stats.total
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border transition ${
                  active
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <Icon size={12} />
                {t.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-4 rounded-full text-[10px] font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {badge}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-neutral-500">
            <div className="inline-flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin" /> Đang tải…
            </div>
          </div>
        ) : isError ? (
          <EmptyState
            icon={AlertCircle}
            title="Không tải được thông báo"
            description={
              (error as { response?: { status?: number } })?.response?.status === 401
                ? 'Phiên đăng nhập hết hạn (401) — vui lòng đăng nhập lại.'
                : 'Lỗi mạng hoặc server. Thử tải lại.'
            }
            action={{ label: 'Thử lại', onClick: () => refetch() }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={
              tab === 'unread'
                ? 'Không có thông báo chưa đọc'
                : tab === 'urgent'
                  ? 'Không có thông báo khẩn'
                  : 'Chưa có thông báo'
            }
            description="Thông báo mới sẽ xuất hiện ở đây khi có ticket, hoá đơn hay cập nhật liên quan."
          />
        ) : (
          <NotificationsList items={filtered} onItemClick={handleClick} />
        )}
      </div>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Bell
  label: string
  value: number
  tone: 'neutral' | 'primary' | 'rose'
}) {
  const toneMap = {
    neutral: 'bg-white border-neutral-200 [&_.ico]:bg-neutral-100 [&_.ico]:text-neutral-600',
    primary: 'bg-primary-50 border-primary-200 [&_.ico]:bg-primary-100 [&_.ico]:text-primary-700',
    rose: 'bg-rose-50 border-rose-200 [&_.ico]:bg-rose-100 [&_.ico]:text-rose-600',
  }[tone]
  return (
    <div className={`rounded-xl border p-3 flex items-center gap-3 ${toneMap}`}>
      <div className="ico w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80 truncate">
          {label}
        </div>
        <div className="text-xl font-bold tabular-nums text-neutral-900 leading-none mt-0.5">
          {value.toLocaleString('vi-VN')}
        </div>
      </div>
    </div>
  )
}
