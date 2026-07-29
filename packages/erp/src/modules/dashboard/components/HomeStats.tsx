// ============================================================
// Stats strip Home — số liệu user thật sự cần, gate theo quyền.
// Semantic token only (primary / warning / danger / info), không màu raw.
// ============================================================

import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  CalendarClock,
  ClipboardCheck,
  ListChecks,
  Target,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react'
import { Skeleton } from '@frezo/ui'
import { formatCurrencyShort } from '@frezo/utils'
import type { useHomeInsights } from '../hooks/useHomeInsights'

type Insights = ReturnType<typeof useHomeInsights>
type Tone = 'primary' | 'warning' | 'danger' | 'info'

const TONE_MAP: Record<Tone, string> = {
  primary: 'bg-primary-50 text-primary-700',
  warning: 'bg-warning-light text-warning-dark',
  danger: 'bg-danger-light text-danger-dark',
  info: 'bg-info-light text-info-dark',
}

/** Class tĩnh để Tailwind giữ lại khi purge — không nội suy chuỗi. */
const GRID_BY_COUNT: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6',
  7: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  8: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

interface StatItem {
  key: string
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone: Tone
  to: string
  isLoading?: boolean
}

function StatCardItem({ item, onNavigate }: { item: StatItem; onNavigate: (to: string) => void }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.to)}
      className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-surface p-4 text-left transition-colors duration-150 hover:border-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_MAP[item.tone]}`}
      >
        <Icon size={18} strokeWidth={1.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium uppercase tracking-wider text-neutral-500">
          {item.label}
        </span>
        {item.isLoading ? (
          <Skeleton className="mt-1.5 h-7 w-16" />
        ) : (
          <span className="mt-0.5 block text-2xl font-bold leading-tight tabular-nums text-neutral-900">
            {item.value}
          </span>
        )}
        <span className="mt-1 block truncate text-xs text-neutral-500">{item.hint}</span>
      </span>
    </button>
  )
}

export function HomeStats({ insights }: { insights: Insights }) {
  const nav = useNavigate()
  const {
    approvals,
    notifications,
    tasks,
    leaves,
    deals,
    hr,
    canSeeOverview,
    canSeeLeaves,
    canSeeTasks,
  } = insights

  const items: StatItem[] = [
    {
      key: 'approvals',
      label: 'Chờ tôi duyệt',
      value: String(approvals.count),
      hint: approvals.count > 0 ? 'Cần xử lý sớm' : 'Không còn tồn đọng',
      icon: ClipboardCheck,
      tone: approvals.count > 0 ? 'warning' : 'primary',
      to: '/approval/inbox',
      isLoading: approvals.isLoading,
    },
    {
      key: 'notifications',
      label: 'Thông báo chưa đọc',
      value: String(notifications.unread),
      hint: notifications.unread > 0 ? 'Có cập nhật mới' : 'Bạn đã đọc hết',
      icon: Bell,
      tone: notifications.unread > 0 ? 'info' : 'primary',
      to: '/notifications',
      isLoading: notifications.isLoading,
    },
  ]

  if (canSeeTasks) {
    items.push({
      key: 'tasks',
      label: 'Việc chưa xong',
      value: String(tasks.open),
      hint: tasks.open > 0 ? 'Task & ticket đang mở' : 'Đã dọn sạch',
      icon: ListChecks,
      tone: tasks.open > 0 ? 'warning' : 'primary',
      to: '/task',
      isLoading: tasks.isLoading,
    })
  }

  if (canSeeLeaves) {
    items.push({
      key: 'leaves',
      label: 'Đơn nghỉ chờ duyệt',
      value: String(leaves.pending),
      hint: leaves.pending > 0 ? 'Đang chờ phê duyệt' : 'Không có đơn tồn',
      icon: CalendarClock,
      tone: leaves.pending > 0 ? 'warning' : 'primary',
      to: '/qlns/leaves',
      isLoading: leaves.isLoading,
    })
  }

  // KPI tổng quan công ty — chỉ QTHT.DASHBOARD.VIEW (hoặc isAdmin)
  if (canSeeOverview) {
    items.push(
      {
        key: 'deals-open',
        label: 'Cơ hội đang mở',
        value: String(deals.openCount),
        hint: formatCurrencyShort(deals.openValue),
        icon: Target,
        tone: 'info',
        to: '/crm/deals',
        isLoading: deals.isLoading,
      },
      {
        key: 'deals-won',
        label: 'Chốt trong tháng',
        value: String(deals.wonMonthCount),
        hint: formatCurrencyShort(deals.wonMonthValue),
        icon: Trophy,
        tone: 'primary',
        to: '/crm/deals',
        isLoading: deals.isLoading,
      },
      {
        key: 'headcount',
        label: 'Nhân sự hoạt động',
        value: String(hr.headcount),
        hint: 'Toàn công ty',
        icon: Users,
        tone: 'info',
        to: '/qlns/persons',
        isLoading: hr.isLoading,
      },
      {
        key: 'attendance',
        label: 'Chấm công hôm nay',
        value: `${hr.attendancePct}%`,
        hint: `${hr.attendanceToday}/${hr.headcount} người`,
        icon: UserCheck,
        tone: hr.attendancePct >= 80 ? 'primary' : 'warning',
        to: '/admin/attendance',
        isLoading: hr.isLoading,
      },
    )
  }

  const gridClass = GRID_BY_COUNT[items.length] ?? GRID_BY_COUNT[4]

  return (
    <section aria-label="Chỉ số nhanh">
      <div className={`grid gap-3 ${gridClass}`}>
        {items.map((item) => (
          <StatCardItem key={item.key} item={item} onNavigate={nav} />
        ))}
      </div>
    </section>
  )
}
