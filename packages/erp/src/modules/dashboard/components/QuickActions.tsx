import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Calculator, FileText, UserPlus, ClipboardCheck, BookOpen,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMenus } from '@/modules/menus/hooks/useMenus'
import { useAnyPermission } from '@/lib/hooks/usePermission'
import type { MenuTreeNode } from '@/modules/menus/types/menu.types'

interface QuickAction {
  label: string
  icon: LucideIcon
  tone: 'blue' | 'emerald' | 'violet' | 'amber' | 'slate'
  to: string
  /** Permission codes — hide nếu thiếu tất cả (OR). */
  permissions?: readonly string[]
  /** true = luôn hiện khi login (vd Docs Hub). */
  alwaysShow?: boolean
}

const TONE_MAP: Record<QuickAction['tone'], string> = {
  blue: 'from-blue-500 to-blue-600',
  emerald: 'from-emerald-500 to-emerald-600',
  violet: 'from-violet-500 to-violet-600',
  amber: 'from-amber-500 to-amber-600',
  slate: 'from-slate-600 to-slate-700',
}

const ACTIONS: QuickAction[] = [
  {
    label: 'Tạo bảng lương',
    icon: Calculator,
    tone: 'blue',
    to: '/qlns/payrolls',
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
  },
  {
    label: 'Tài liệu',
    icon: BookOpen,
    tone: 'slate',
    to: '/docs',
    alwaysShow: true,
  },
]

function collectFeUrls(nodes: MenuTreeNode[]): Set<string> {
  const urls = new Set<string>()
  const walk = (list: MenuTreeNode[]) => {
    for (const n of list) {
      if (n.feUrl) {
        const path = n.feUrl.startsWith('/') ? n.feUrl : `/${n.feUrl}`
        urls.add(path.replace(/\/+$/, '') || '/')
      }
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return urls
}

function pathAllowed(menuUrls: Set<string>, to: string): boolean {
  const norm = to.replace(/\/+$/, '') || '/'
  if (menuUrls.has(norm)) return true
  for (const u of menuUrls) {
    if (norm === u || norm.startsWith(`${u}/`)) return true
  }
  return false
}

function ActionGate({
  action,
  menuUrls,
  onNavigate,
}: {
  action: QuickAction
  menuUrls: Set<string>
  onNavigate: (to: string) => void
}) {
  const allowedByPerm = useAnyPermission(action.permissions ?? [])
  if (!action.alwaysShow) {
    if (!pathAllowed(menuUrls, action.to)) return null
    if (action.permissions?.length && !allowedByPerm) return null
  }

  const Icon = action.icon
  return (
    <button
      type="button"
      onClick={() => onNavigate(action.to)}
      className={`relative overflow-hidden group rounded-xl bg-gradient-to-br ${TONE_MAP[action.tone]} p-4 text-white text-left transition-all hover:shadow-lg hover:scale-[1.02]`}
    >
      <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30 transition">
        <Icon size={17} />
      </div>
      <div className="text-sm font-semibold leading-tight">{action.label}</div>
    </button>
  )
}

/**
 * Quick actions — chỉ hiện CTA có menu + permission (R48 / LNK-08 related).
 * Không hard-code link BGHD / placeholder.
 */
export function QuickActions() {
  const nav = useNavigate()
  const { menuTree } = useMenus()
  const menuUrls = useMemo(() => collectFeUrls(menuTree), [menuTree])

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
          <ActionGate key={a.label} action={a} menuUrls={menuUrls} onNavigate={nav} />
        ))}
      </div>
    </div>
  )
}
