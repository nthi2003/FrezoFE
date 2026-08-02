// ============================================================
// Quick links Home — self-service có chủ đích (không phải pill cluster)
// Ẩn item khi user không có menu/permission tương ứng.
// ============================================================

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Clock,
  ListChecks,
  Newspaper,
  UserCircle,
  Wallet,
} from 'lucide-react'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { collectFeUrls, pathAllowed } from '@/modules/menus/utils/menuUrls'
import { useAnyPermission } from '@/lib/hooks/usePermission'
import { usePendingApprovalCount } from '@/modules/approval/hooks/useApprovals'

interface QuickLink {
  label: string
  hint: string
  icon: LucideIcon
  to: string
  /** Bỏ qua gate menu/permission — dịch vụ chung cho mọi user đăng nhập. */
  alwaysShow?: boolean
  permissions?: readonly string[]
  badgeKey?: 'inbox'
  /** Docs luôn là secondary — nhạt hơn, đứng cuối. */
  secondary?: boolean
}

const LINKS: QuickLink[] = [
  {
    label: 'Đơn nghỉ phép',
    hint: 'Tạo & theo dõi đơn',
    icon: CalendarClock,
    to: '/qlns/time?tab=leaves',
    permissions: ['LEAVE.VIEW', 'LEAVE.CREATE', 'LEAVE.APPROVE'],
  },
  {
    label: 'Bảng lương',
    hint: 'Phiếu lương kỳ gần nhất',
    icon: Wallet,
    to: '/qlns/payroll?tab=payrolls',
    permissions: ['PAYROLL.VIEW', 'QLNS_PAYROLL_VIEW', 'PAYROLL.APPROVE'],
  },
  {
    label: 'Chấm công',
    hint: 'Công trong tháng',
    icon: Clock,
    to: '/qlns/time?tab=daily',
    permissions: ['QLNS_ATTENDANCE_VIEW', 'ATTENDANCE.UPDATE'],
  },
  {
    label: 'Hộp thư duyệt',
    hint: 'Việc chờ bạn xử lý',
    icon: ClipboardCheck,
    to: '/approval/inbox',
    alwaysShow: true,
    badgeKey: 'inbox',
  },
  {
    label: 'Công việc',
    hint: 'Task & ticket của bạn',
    icon: ListChecks,
    to: '/task',
  },
  {
    label: 'Tin & bài viết',
    hint: 'Bản tin nội bộ',
    icon: Newspaper,
    to: '/bai-viet',
    alwaysShow: true,
  },
  {
    label: 'Thông báo',
    hint: 'Hoạt động hệ thống',
    icon: Bell,
    to: '/notifications',
    alwaysShow: true,
  },
  {
    label: 'Hồ sơ của tôi',
    hint: 'Thông tin cá nhân',
    icon: UserCircle,
    to: '/profile',
    alwaysShow: true,
  },
  {
    label: 'Tài liệu',
    hint: 'Hướng dẫn sử dụng',
    icon: BookOpen,
    to: '/docs',
    alwaysShow: true,
    secondary: true,
  },
]

function QuickLinkTile({
  link,
  menuUrls,
  inboxCount,
  onNavigate,
}: {
  link: QuickLink
  menuUrls: Set<string>
  inboxCount: number
  onNavigate: (to: string) => void
}) {
  const allowedByPerm = useAnyPermission(link.permissions ?? [])

  if (!link.alwaysShow) {
    if (!pathAllowed(menuUrls, link.to)) return null
    if (link.permissions?.length && !allowedByPerm) return null
  }

  const Icon = link.icon
  const badge = link.badgeKey === 'inbox' && inboxCount > 0 ? inboxCount : null

  return (
    <button
      type="button"
      onClick={() => onNavigate(link.to)}
      className={`relative flex items-start gap-3 rounded-lg border border-neutral-200 p-3.5 text-left transition-colors duration-150 hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
        link.secondary ? 'bg-surface-secondary' : 'bg-surface'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          link.secondary
            ? 'bg-neutral-100 text-neutral-500'
            : 'bg-primary-50 text-primary-700'
        }`}
      >
        <Icon size={18} strokeWidth={1.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-neutral-900">
          {link.label}
        </span>
        <span className="mt-0.5 block truncate text-xs text-neutral-500">{link.hint}</span>
      </span>
      {badge != null && (
        <span className="absolute right-2 top-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-2xs font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}

export function HomeQuickLinks() {
  const nav = useNavigate()
  const { menuTree } = useMenus()
  const menuUrls = useMemo(() => collectFeUrls(menuTree), [menuTree])
  const { count: inboxCount } = usePendingApprovalCount()

  const ordered = useMemo(
    () => [...LINKS].sort((a, b) => Number(!!a.secondary) - Number(!!b.secondary)),
    [],
  )

  return (
    <section aria-label="Truy cập nhanh">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ordered.map((link) => (
          <QuickLinkTile
            key={link.to}
            link={link}
            menuUrls={menuUrls}
            inboxCount={inboxCount}
            onNavigate={nav}
          />
        ))}
      </div>
    </section>
  )
}
