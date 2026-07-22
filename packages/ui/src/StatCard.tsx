import * as React from 'react'
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'
import { cn } from '@frezo/utils'
import { Skeleton } from './skeleton'

export interface StatCardProps {
  label: string
  value: React.ReactNode
  /** Sub-value nhỏ dưới value, VD "so với tháng trước" */
  hint?: React.ReactNode
  /** Delta % so kỳ trước — số dương xanh, số âm đỏ, 0 xám */
  delta?: number
  /** Label mô tả delta, VD "so tháng trước" */
  deltaLabel?: string
  /** Icon trang trí (Lucide) — hiển thị góc phải trên */
  icon?: LucideIcon
  isLoading?: boolean
  onClick?: () => void
  className?: string
}

/**
 * KPI card cho Dashboard (STANDARD section 7).
 *
 * Layout theo Linear/Vercel dashboard: label uppercase muted → value đậm lớn → delta nhỏ dưới.
 * KHÔNG shadow đậm, KHÔNG gradient, KHÔNG border màu.
 *
 * @example
 * <StatCard
 *   label="Doanh thu tháng"
 *   value={formatCurrency(125000000)}
 *   delta={12.3}
 *   deltaLabel="so tháng trước"
 *   icon={TrendingUp}
 * />
 */
export function StatCard({
  label,
  value,
  hint,
  delta,
  deltaLabel = 'so kỳ trước',
  icon: Icon,
  isLoading = false,
  onClick,
  className,
}: StatCardProps) {
  const isClickable = !!onClick

  if (isLoading) {
    return (
      <div className={cn('bg-surface border border-neutral-200 rounded-xl p-6', className)}>
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-surface border border-neutral-200 rounded-xl p-6 transition-shadow',
        isClickable && 'cursor-pointer hover:shadow-sm',
        className,
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <span className="text-xs uppercase tracking-wider font-medium text-neutral-500">
          {label}
        </span>
        {Icon && (
          <Icon size={20} strokeWidth={1.5} className="text-neutral-400 shrink-0" />
        )}
      </div>

      <div className="text-2xl font-bold text-neutral-900 tabular-nums leading-tight">
        {value}
      </div>

      {(delta !== undefined || hint) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta !== undefined && <DeltaIndicator delta={delta} label={deltaLabel} />}
          {hint && <span className="text-neutral-500">{hint}</span>}
        </div>
      )}
    </div>
  )
}

function DeltaIndicator({ delta, label }: { delta: number; label: string }) {
  const isPositive = delta > 0
  const isNegative = delta < 0
  const isZero = delta === 0

  const colorClass = isPositive
    ? 'text-success-dark'
    : isNegative
      ? 'text-danger-dark'
      : 'text-neutral-500'

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  const sign = isPositive ? '+' : ''

  return (
    <span className={cn('inline-flex items-center gap-1 font-medium tabular-nums', colorClass)}>
      <Icon size={12} strokeWidth={2} />
      {sign}
      {delta.toFixed(1)}%
      {label && <span className="font-normal text-neutral-500 ml-1">{label}</span>}
    </span>
  )
}
