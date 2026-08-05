import type { ReactNode } from 'react'
import { cn } from '@frezo/utils'

export interface FormSectionProps {
  /** Tiêu đề section — có divider mảnh chạy ngang bên dưới. */
  title: string
  description?: ReactNode
  /** Slot hành động bên phải title (VD: nút "Thêm dòng"). */
  action?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * FormSection — khối form có title + divider ngang (chuẩn modal tham khảo).
 */
export function FormSection({
  title,
  description,
  action,
  children,
  className,
}: FormSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border pb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

export interface FormGridProps {
  /** Số cột desktop. Tablet = min(cols, 2), mobile = 1. */
  cols?: 1 | 2 | 3 | 4
  children: ReactNode
  className?: string
}

const COLS: Record<NonNullable<FormGridProps['cols']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
}

/**
 * FormGrid — lưới field responsive (3 cột desktop → 2 tablet → 1 mobile).
 */
export function FormGrid({ cols = 3, children, className }: FormGridProps) {
  return (
    <div className={cn('grid gap-4', COLS[cols], className)}>{children}</div>
  )
}
