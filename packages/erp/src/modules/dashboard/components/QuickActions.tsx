import type { LucideIcon } from 'lucide-react'
import {
  Calculator, FileText, UserPlus, ClipboardCheck, BookOpen,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface QuickAction {
  label: string
  icon: LucideIcon
  tone: 'blue' | 'emerald' | 'violet' | 'amber' | 'slate'
  to: string
}

const TONE_MAP: Record<QuickAction['tone'], string> = {
  blue: 'from-blue-500 to-blue-600',
  emerald: 'from-emerald-500 to-emerald-600',
  violet: 'from-violet-500 to-violet-600',
  amber: 'from-amber-500 to-amber-600',
  slate: 'from-slate-600 to-slate-700',
}

const ACTIONS: QuickAction[] = [
  { label: 'Tạo bảng lương', icon: Calculator, tone: 'blue', to: '/qlns/payrolls' },
  { label: 'Thêm lead', icon: UserPlus, tone: 'emerald', to: '/crm/leads' },
  { label: 'Xuất hoá đơn', icon: FileText, tone: 'violet', to: '/crm/invoices' },
  { label: 'Duyệt nghỉ', icon: ClipboardCheck, tone: 'amber', to: '/approval/inbox' },
  { label: 'Tài liệu', icon: BookOpen, tone: 'slate', to: '/docs' },
]

/**
 * Quick actions — 4 nút CTA lớn ở dashboard.
 * Dùng navigate của react-router — click là chuyển page.
 */
export function QuickActions() {
  const nav = useNavigate()
  return (
    <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-neutral-900">Thao tác nhanh</h3>
        <p className="text-xs text-neutral-500 mt-0.5">Các tác vụ thường xuyên</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {ACTIONS.map((a) => {
          const Icon = a.icon
          return (
            <button
              key={a.label}
              onClick={() => nav(a.to)}
              className={`relative overflow-hidden group rounded-xl bg-gradient-to-br ${TONE_MAP[a.tone]} p-4 text-white text-left transition-all hover:shadow-lg hover:scale-[1.02]`}
            >
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center mb-2 group-hover:bg-white/30 transition">
                <Icon size={17} />
              </div>
              <div className="text-sm font-semibold leading-tight">{a.label}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
