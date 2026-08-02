import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  EmptyState,
  ErrorState,
  ObjectPageHeader,
  type BreadcrumbItem,
  type ObjectPageKpi,
} from '@frezo/ui'

export interface WarehouseDetailShellProps {
  breadcrumb?: BreadcrumbItem[]
  title: string
  subtitle?: string
  statusBadge?: ReactNode
  kpi?: ObjectPageKpi[]
  actions?: ReactNode
  pipeline?: ReactNode
  alert?: ReactNode
  isLoading?: boolean
  isError?: boolean
  isFetching?: boolean
  onRetry?: () => void
  errorTitle?: string
  backHref: string
  backLabel?: string
  missingIdTitle?: string
  missingIdDescription?: string
  missingIcon?: React.ComponentType<{ className?: string }>
  children?: ReactNode
  footer?: ReactNode
  /** Override content width/alignment (vd. tab Xem phiếu cần rộng hơn) */
  contentClassName?: string
}

export function WarehouseDetailShell({
  breadcrumb,
  title,
  subtitle,
  statusBadge,
  kpi,
  actions,
  pipeline,
  alert,
  isLoading,
  isError,
  isFetching,
  onRetry,
  errorTitle = 'Không tải được dữ liệu',
  backHref,
  backLabel = 'Quay lại danh sách',
  missingIdTitle,
  missingIdDescription,
  missingIcon,
  children,
  footer,
  contentClassName,
}: WarehouseDetailShellProps) {
  const nav = useNavigate()

  if (missingIdTitle && missingIcon) {
    return (
      <EmptyState icon={missingIcon} title={missingIdTitle} description={missingIdDescription} />
    )
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 space-y-4">
        <ErrorState
          title={errorTitle}
          message="Kiểm tra kết nối hoặc thử lại."
          onRetry={onRetry ? () => void onRetry() : undefined}
          isRetrying={isFetching}
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => nav(backHref)}>
            {backLabel}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <ObjectPageHeader
        breadcrumb={breadcrumb}
        title={title}
        subtitle={subtitle}
        statusBadge={statusBadge}
        kpi={kpi}
        actions={actions}
      />

      <div
        className={
          contentClassName ??
          'p-6 space-y-4 max-w-6xl w-full mx-auto'
        }
      >
        {pipeline}
        {alert}
        {children}
        {footer}
      </div>
    </div>
  )
}
