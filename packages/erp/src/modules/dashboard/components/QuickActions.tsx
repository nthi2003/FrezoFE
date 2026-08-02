import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Calculator, FileText, UserPlus, ClipboardCheck, BookOpen,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { collectFeUrls, pathAllowed } from '@/modules/menus/utils/menuUrls'
import { useAnyPermission } from '@/lib/hooks/usePermission'
import { usePendingApprovalCount } from '@/modules/approval/hooks/useApprovals'

interface QuickAction {
  label: string
  icon: LucideIcon
  tone: 'blue' | 'emerald' | 'violet' | 'amber' | 'slate'
  to: string
  /** Permission codes — hide nếu thiếu tất cả (OR). */
  permissions?: readonly string[]
  /** true = luôn hiện khi login (vd Docs Hub). */
  alwaysShow?: boolean
  /** Badge count key — hiện số chờ duyệt. */
  badgeKey?: 'inbox'
  /** Docs = secondary flat. */
  secondary?: boolean
}

/** Flat semantic tones — không gradient (FR-UX-09). */
const TONE_MAP: Record<QuickAction['tone'], { wrap: string; icon: string }> = {
  blue: { wrap: 'bg-primary-50 border-primary-200 hover:bg-primary-100', icon: 'bg-primary-100 text-primary-700' },
  emerald: { wrap: 'bg-success-light border-success/30 hover:bg-success-light/80', icon: 'bg-success-light text-success-dark' },
  violet: { wrap: 'bg-info-light border-info/30 hover:bg-info-light/80', icon: 'bg-info-light text-info-dark' },
  amber: { wrap: 'bg-warning-light border-warning/30 hover:bg-warning-light/80', icon: 'bg-warning-light text-warning-dark' },
  slate: { wrap: 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100', icon: 'bg-neutral-100 text-neutral-600' },
}

const ACTIONS: QuickAction[] = [
  {
    label: 'Tạo bảng lương',
    icon: Calculator,
    tone: 'blue',
    to: '/qlns/payroll?tab=payrolls',
    permissions: ['PAYROLL.VIEW', 'QLNS_PAYROLL_VIEW', 'PAYROLL.APPROVE'],
  },
  {
    label: 'Thêm lead',
    icon: UserPlus,
    tone: 'emerald',
    to: '/crm/leads',
    permissions: ['CRM.LEAD.VIEW', 'CRM_LEAD_VIEW', 'CRM.LEADS.VIEW'],
  },
  {
    label: 'Xuất hoá đơn',
    icon: FileText,
    tone: 'violet',
    to: '/crm/invoices',
    permissions: ['CRM.INVOICE.VIEW', 'CRM_INVOICE_VIEW'],
  },
  {
    label: 'Duyệt nghỉ',
    icon: ClipboardCheck,
    tone: 'amber',
    to: '/approval/inbox',
    permissions: ['APPROVALS.APPROVE', 'LEAVE.APPROVE'],
    badgeKey: 'inbox',
  },
  {
    label: 'Tài liệu',
    icon: BookOpen,
    tone: 'slate',
    to: '/docs',
    alwaysShow: true,
    secondary: true,
  },
]

function ActionGate({
  action,
  menuUrls,
  onNavigate,
  inboxCount,
}: {
  action: QuickAction
  menuUrls: Set<string>
  onNavigate: (to: string) => void
  inboxCount: number
}) {
  const allowedByPerm = useAnyPermission(action.permissions ?? [])
  if (!action.alwaysShow) {
    if (!pathAllowed(menuUrls, action.to)) return null
    if (action.permissions?.length && !allowedByPerm) return null
  }

  const Icon = action.icon
  const tone = TONE_MAP[action.tone]
  const badge =
    action.badgeKey === 'inbox' && inboxCount > 0 ? inboxCount : null

  return (
    <button
      type="button"
      onClick={() => onNavigate(action.to)}
      className={`relative rounded-xl border p-4 text-left transition ${tone.wrap} ${
        action.secondary ? 'opacity-90' : ''
      }`}
    >
      {badge != null && (
        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold inline-flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${tone.icon}`}>
        <Icon size={17} />
      </div>
      <div className="text-sm font-semibold leading-tight text-neutral-900">{action.label}</div>
    </button>
  )
}

/**
 * Quick actions v2 (FR-UX-09) — flat semantic, badge Inbox, ẩn khi thiếu menu+permission.
 */
export function QuickActions() {
  const nav = useNavigate()
  const { menuTree } = useMenus()
  const menuUrls = useMemo(() => collectFeUrls(menuTree), [menuTree])
  const { count: inboxCount } = usePendingApprovalCount()

  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-neutral-900">Thao tác nhanh</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          Chỉ hiện chức năng bạn có quyền truy cập
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {ACTIONS.map((a) => (
          <ActionGate
            key={a.label}
            action={a}
            menuUrls={menuUrls}
            onNavigate={nav}
            inboxCount={inboxCount}
          />
        ))}
      </div>
    </div>
  )
}
