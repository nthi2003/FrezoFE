import type { ReactNode } from 'react'
import { Download, Printer } from 'lucide-react'
import type { PageGuideConfig } from '@frezo/ui'
import { AppTooltip, Button, PageGuideButton } from '@frezo/ui'

type ReportToolbarActionsProps = {
  guide?: PageGuideConfig
  onExport?: () => void
  exportDisabled?: boolean
  onPrint?: () => void
  children?: ReactNode
}

export function ReportToolbarActions({
  guide,
  onExport,
  exportDisabled,
  onPrint,
  children,
}: ReportToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {guide && <PageGuideButton guide={guide} />}
      {onExport && (
        <AppTooltip content="Xuất CSV theo bộ lọc hiện tại">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9"
            disabled={exportDisabled}
            onClick={onExport}
            aria-label="Xuất CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Xuất CSV</span>
          </Button>
        </AppTooltip>
      )}
      {onPrint && (
        <AppTooltip content="In báo cáo">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9"
            onClick={onPrint}
            aria-label="In"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">In</span>
          </Button>
        </AppTooltip>
      )}
      {children}
    </div>
  )
}
