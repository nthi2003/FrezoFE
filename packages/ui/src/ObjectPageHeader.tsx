import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@frezo/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  onClick?: () => void
}

export interface ObjectPageKpi {
  label: string
  value: React.ReactNode
}

export interface ObjectPageHeaderProps {
  /** Breadcrumb từ trái sang phải — level cuối tự động không click được */
  breadcrumb?: BreadcrumbItem[]
  /** Tiêu đề chính (VD "HD-001") */
  title: string
  /** Subtitle mô tả (VD "Hợp đồng bán hàng — Công ty ABC") */
  subtitle?: string
  /** Avatar / icon bên trái title (VD ảnh khách hàng) */
  leading?: React.ReactNode
  /** Status badge nổi bật (dùng <StatusBadge />) */
  statusBadge?: React.ReactNode
  /** KPI grid dưới title — 3-5 field key-value */
  kpi?: ObjectPageKpi[]
  /** Nút hành động bên phải — thường: Primary + Secondary + [...] menu */
  actions?: React.ReactNode
  /** Sticky ở top khi scroll (mặc định true) */
  sticky?: boolean
  className?: string
}

/**
 * Header chuẩn cho Object Page (trang detail 1 entity) — STANDARD section 14.2.
 * Cấu trúc SAP Fiori Object Page floorplan:
 * - Breadcrumb
 * - Title + Subtitle + Status Badge nổi bật
 * - KPI grid (3-5 field summary)
 * - Actions bên phải
 *
 * Header sticky top khi user scroll xuống nội dung dài — luôn thấy title + actions.
 *
 * @example
 * <ObjectPageHeader
 *   breadcrumb={[
 *     { label: 'Hợp đồng', href: '/contracts' },
 *     { label: 'HD-001' },
 *   ]}
 *   title="HD-001"
 *   subtitle="Hợp đồng bán hàng — Công ty ABC"
 *   statusBadge={<StatusBadge label="Đang hiệu lực" color="success" icon={CheckCircle} />}
 *   kpi={[
 *     { label: 'Giá trị', value: formatCurrency(125000000) },
 *     { label: 'Ngày ký', value: formatDate(contract.signedAt) },
 *     { label: 'Người phụ trách', value: contract.owner },
 *   ]}
 *   actions={
 *     <>
 *       <Button variant="outline">Sửa</Button>
 *       <Button variant="default">Duyệt</Button>
 *     </>
 *   }
 * />
 */
export function ObjectPageHeader({
  breadcrumb,
  title,
  subtitle,
  leading,
  statusBadge,
  kpi,
  actions,
  sticky = true,
  className,
}: ObjectPageHeaderProps) {
  return (
    <header
      className={cn(
        'bg-surface border-b border-neutral-200 px-4 md:px-6 py-4',
        sticky && 'sticky top-0 z-30 backdrop-blur bg-surface/95',
        className,
      )}
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb items={breadcrumb} />
      )}

      <div className="mt-2 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0 flex-1 flex items-start gap-3">
          {leading}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-neutral-900 truncate">{title}</h1>
              {statusBadge}
            </div>
            {subtitle && (
              <p className="text-sm text-neutral-500 mt-1 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {kpi && kpi.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3">
          {kpi.map((item, idx) => (
            <div key={idx} className="min-w-0">
              <dt className="text-xs uppercase tracking-wider text-neutral-500 truncate">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-neutral-900 truncate tabular-nums">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  )
}

/**
 * Breadcrumb chuẩn — STANDARD section 6 (Navigation).
 * Level cuối là trang hiện tại, không click được.
 * Dùng `onClick` thay `href` khi điều hướng trong SPA (tránh full reload).
 */
export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1 text-xs text-neutral-500 flex-wrap">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          return (
            <li key={idx} className="flex items-center gap-1">
              {idx > 0 && (
                <ChevronRight
                  size={12}
                  className="text-neutral-300 shrink-0"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              )}
              {isLast ? (
                <span className="text-neutral-500 truncate max-w-[200px]" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="text-neutral-500 hover:text-neutral-700 hover:underline truncate max-w-[200px]"
                >
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="text-neutral-500 hover:text-neutral-700 hover:underline truncate max-w-[200px]"
                >
                  {item.label}
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
