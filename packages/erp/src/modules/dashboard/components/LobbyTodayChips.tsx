// Gợi ý hôm nay — chip ngắn, gate theo menu/permission

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  ListChecks,
  Sparkles,
  UserCircle,
} from 'lucide-react'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { collectFeUrls, pathAllowed } from '@/modules/menus/utils/menuUrls'
import { useAnyPermission } from '@/lib/hooks/usePermission'

interface TodayChip {
  label: string
  to: string
  icon: LucideIcon
  alwaysShow?: boolean
  permissions?: readonly string[]
}

const CHIPS: TodayChip[] = [
  {
    label: 'Hộp thư duyệt',
    to: '/approval/inbox',
    icon: ClipboardCheck,
    alwaysShow: true,
  },
  {
    label: 'Đơn nghỉ phép',
    to: '/qlns/time?tab=leaves',
    icon: CalendarClock,
    permissions: ['LEAVE.VIEW', 'LEAVE.CREATE', 'LEAVE.APPROVE'],
  },
  {
    label: 'Công việc của tôi',
    to: '/task',
    icon: ListChecks,
  },
  {
    label: 'Hồ sơ cá nhân',
    to: '/profile',
    icon: UserCircle,
    alwaysShow: true,
  },
  {
    label: 'Tài liệu hướng dẫn',
    to: '/docs',
    icon: BookOpen,
    alwaysShow: true,
  },
]

function TodayChipButton({
  chip,
  menuUrls,
  onNavigate,
}: {
  chip: TodayChip
  menuUrls: Set<string>
  onNavigate: (to: string) => void
}) {
  const allowedByPerm = useAnyPermission(chip.permissions ?? [])

  if (!chip.alwaysShow) {
    if (!pathAllowed(menuUrls, chip.to)) return null
    if (chip.permissions?.length && !allowedByPerm) return null
  }

  const Icon = chip.icon

  return (
    <button
      type="button"
      onClick={() => onNavigate(chip.to)}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-neutral-300 bg-neutral-50/80 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <Icon size={14} strokeWidth={1.5} />
      {chip.label}
    </button>
  )
}

export function LobbyTodayChips() {
  const nav = useNavigate()
  const { menuTree } = useMenus()
  const menuUrls = useMemo(() => collectFeUrls(menuTree), [menuTree])

  return (
    <section aria-label="Gợi ý hôm nay">
      <h2 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
        <Sparkles size={15} strokeWidth={1.5} className="text-neutral-400" />
        Gợi ý hôm nay
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CHIPS.map((chip) => (
          <TodayChipButton key={chip.to} chip={chip} menuUrls={menuUrls} onNavigate={nav} />
        ))}
      </div>
    </section>
  )
}
