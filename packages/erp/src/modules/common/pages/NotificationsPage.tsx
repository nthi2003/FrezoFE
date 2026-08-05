// ============================================================
// FREZO ERP — Notifications Page (/notifications)
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, Search, Filter, CircleDot, Sparkles, Zap,
  Inbox, RefreshCw, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { PageHeader, Button, EmptyState, Select } from '@frezo/ui'
import {
  useNotificationsPage,
  useNotificationStats,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/modules/common/hooks/useNotification'
import { resolveNotificationUrl } from '@/modules/common/utils/resolveNotificationUrl'
import {
  getNotificationTypeLabel,
  isNotificationRead,
} from '@/modules/common/utils/notificationHelpers'
import { NOTIFICATION_TYPE_LABELS } from '@/modules/common/constants/notificationTypes'
import { NotificationsList } from '../components/NotificationsList'
import type { NotificationItem } from '../types'

type FilterTab = 'all' | 'unread' | 'urgent'

const TABS: Array<{ key: FilterTab; label: string; icon: typeof Bell }> = [
  { key: 'all', label: 'Tất cả', icon: Inbox },
  { key: 'unread', label: 'Chưa đọc', icon: CircleDot },
  { key: 'urgent', label: 'Khẩn', icon: Zap },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50]
const DEFAULT_PAGE_SIZE = 20

export function NotificationsPage() {
  const navigate = useNavigate()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const { data: statsData } = useNotificationStats()

  const [tab, setTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [tab, typeFilter, debouncedSearch])

  const listParams = useMemo(
    () => ({
      page,
      size: pageSize,
      tab,
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      search: debouncedSearch || undefined,
    }),
    [page, pageSize, tab, typeFilter, debouncedSearch],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useNotificationsPage(listParams)

  const items = data?.items ?? []
  const totalElements = data?.total ?? 0
  const totalPages = Math.max(1, data?.totalPages ?? 1)

  // Clamp nếu filter làm giảm số trang
  useEffect(() => {
    if (data && data.totalPages > 0 && page > data.totalPages) {
      setPage(data.totalPages)
    }
  }, [data, page])

  const stats = useMemo(
    () => ({
      total: statsData?.total ?? 0,
      unread: statsData?.count ?? 0,
      urgent: statsData?.urgent ?? 0,
    }),
    [statsData],
  )

  const availableTypes = useMemo(() => Object.keys(NOTIFICATION_TYPE_LABELS).sort(), [])

  const handlePageChange = (nextPage: number, nextSize: number) => {
    setPageSize(nextSize)
    setPage(Math.max(1, nextPage))
  }

  const handleClick = (n: NotificationItem) => {
    if (!isNotificationRead(n) && n.id) markRead.mutate(n.id)
    const url = resolveNotificationUrl(n)
    if (url) navigate(url)
  }

  const handleMarkAllRead = () => {
    if (stats.unread > 0) markAll.mutate([])
  }

  const rangeFrom = totalElements === 0 ? 0 : Math.min((page - 1) * pageSize + 1, totalElements)
  const rangeTo = Math.min(page * pageSize, totalElements)

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
        ) : items.length === 0 ? (
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
          <>
            <NotificationsList items={items} onItemClick={handleClick} />
            {/* Pagination footer — cùng pattern AppTable */}
            {totalElements > 0 && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-2 text-sm border-t border-neutral-100">
                <div className="text-neutral-500 flex items-center gap-1.5 flex-wrap">
                  <span>Hiển thị</span>
                  <span className="font-medium text-neutral-900">{rangeFrom}</span>
                  <span>–</span>
                  <span className="font-medium text-neutral-900">{rangeTo}</span>
                  <span>của</span>
                  <span className="font-medium text-neutral-900">{totalElements}</span>
                  <span>bản ghi</span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-1.5 text-neutral-500">
                    <span className="text-xs shrink-0">Hiển thị</span>
                    <div className="w-[110px]">
                      <Select
                        options={PAGE_SIZE_OPTIONS.map((n) => ({
                          value: String(n),
                          label: `${n} / trang`,
                        }))}
                        value={String(pageSize)}
                        onChange={(v) => handlePageChange(1, Number(v))}
                        placeholder="Size"
                        aria-label="Số bản ghi mỗi trang"
                        showSearch={false}
                      />
                    </div>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePageChange(1, pageSize)}
                      disabled={page <= 1}
                      title="Trang đầu"
                      className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={14} />
                      <ChevronLeft size={14} className="-ml-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePageChange(page - 1, pageSize)}
                      disabled={page <= 1}
                      title="Trang trước"
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-2 min-w-[70px] text-center text-neutral-700 text-xs">
                      Trang <b className="text-neutral-900">{page}</b> /{' '}
                      <b className="text-neutral-900">{totalPages}</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePageChange(page + 1, pageSize)}
                      disabled={page >= totalPages}
                      title="Trang sau"
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages, pageSize)}
                      disabled={page >= totalPages}
                      title="Trang cuối"
                      className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={14} />
                      <ChevronRight size={14} className="-ml-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
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
