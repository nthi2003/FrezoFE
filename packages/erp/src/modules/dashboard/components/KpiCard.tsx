import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Skeleton } from '@frezo/ui'

export interface KpiCardProps {
  title: string
  value: string
  hint?: string
  deltaPercent?: number
  icon: LucideIcon
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'indigo' | 'teal' | 'orange'
  isLoading?: boolean
}

const TONE_MAP: Record<KpiCardProps['tone'], { chip: string; icon: string; accent: string }> = {
  blue: {
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    accent: 'text-blue-600',
  },
  emerald: {
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-600',
    accent: 'text-emerald-600',
  },
  amber: {
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'bg-amber-100 text-amber-600',
    accent: 'text-amber-600',
  },
  rose: {
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'bg-rose-100 text-rose-600',
    accent: 'text-rose-600',
  },
  violet: {
    chip: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: 'bg-violet-100 text-violet-600',
    accent: 'text-violet-600',
  },
  indigo: {
    chip: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: 'bg-indigo-100 text-indigo-600',
    accent: 'text-indigo-600',
  },
  teal: {
    chip: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: 'bg-teal-100 text-teal-600',
    accent: 'text-teal-600',
  },
  orange: {
    chip: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: 'bg-orange-100 text-orange-600',
    accent: 'text-orange-600',
  },
}

export function KpiCard({
  title, value, hint, deltaPercent, icon: Icon, tone, isLoading,
}: KpiCardProps) {
  const t = TONE_MAP[tone]
  const hasDelta = deltaPercent !== undefined && deltaPercent !== null
  const deltaUp = (deltaPercent ?? 0) >= 0
  const DeltaIcon = deltaUp ? ArrowUpRight : ArrowDownRight
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-neutral-200/60 p-4 hover:shadow-md hover:border-neutral-300 transition-all group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider truncate">
          {title}
        </p>
        <div className={`p-2 rounded-lg shrink-0 ${t.icon}`}>
          <Icon size={16} />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="text-2xl font-bold text-neutral-900 tabular-nums leading-tight">
          {value}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        {hasDelta && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md border ${
              deltaUp
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <DeltaIcon size={11} />
            {deltaUp ? '+' : ''}
            {deltaPercent!.toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-[11px] text-neutral-500 truncate">{hint}</span>}
      </div>
    </div>
  )
}
