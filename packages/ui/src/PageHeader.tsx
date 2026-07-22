import * as React from 'react'
import { cn } from '@frezo/utils'

export interface PageHeaderProps {
  /** String hoặc ReactNode (cho phép chèn emoji, span highlight...) */
  title: React.ReactNode
  description?: React.ReactNode
  breadcrumb?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

/**
 * PageHeader — header chuẩn cho mọi trang.
 * Layout: [breadcrumb] / [title + description] --- [actions]
 * Actions area nên đặt 1 nút Primary bên phải, phụ (Outline) bên trái nó.
 *
 * ⚠️ KHÔNG truyền `breadcrumb` khi trang đã nằm trong Layout chính có Header —
 * `components/layout/Header` tự build breadcrumb từ menu tree theo pathname,
 * truyền thêm sẽ bị double. Chỉ dùng `breadcrumb` cho page standalone (login,
 * embed dashboard, external report…).
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumb && <div className="mb-2 text-xs text-neutral-500">{breadcrumb}</div>}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-neutral-900 truncate">{title}</h1>
          {description && (
            <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  )
}
