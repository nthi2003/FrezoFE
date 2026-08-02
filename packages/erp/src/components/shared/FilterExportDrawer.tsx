import type { ReactNode } from 'react'
import { Download, Filter, RotateCw, SlidersHorizontal } from 'lucide-react'
import { AppTooltip, Button, Drawer } from '@frezo/ui'

export interface FilterExportDrawerProps {
  isOpen: boolean
  onClose: () => void
  hasActiveFilters?: boolean
  onClear?: () => void
  onExport?: () => void
  exportDisabled?: boolean
  exportTooltip?: string
  description?: string
  children: ReactNode
}

/** Drawer bên phải — lọc / sắp xếp / xuất (progressive disclosure, dùng chung hub). */
export function FilterExportDrawer({
  isOpen,
  onClose,
  hasActiveFilters,
  onClear,
  onExport,
  exportDisabled,
  exportTooltip = 'Xuất danh sách đang hiển thị ra CSV',
  description = 'Lọc dữ liệu hiển thị hoặc xuất ra file.',
  children,
}: FilterExportDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Filter size={16} className="text-primary-600" />
          Bộ lọc & xuất
        </span>
      }
      description={description}
      size="sm"
      footer={
        <div className="flex w-full flex-wrap gap-2">
          {onClear && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={onClear}
              disabled={!hasActiveFilters}
            >
              <RotateCw size={14} />
              Xoá lọc
            </Button>
          )}
          {onExport && (
            <AppTooltip content={exportTooltip}>
              <span className="flex-1">
                <Button
                  type="button"
                  className="w-full gap-1.5 bg-primary-600 hover:bg-primary-700 text-white"
                  onClick={() => {
                    onExport()
                    onClose()
                  }}
                  disabled={exportDisabled}
                >
                  <Download size={14} />
                  Xuất CSV
                </Button>
              </span>
            </AppTooltip>
          )}
          {!onExport && (
            <Button type="button" className="flex-1" onClick={onClose}>
              Áp dụng
            </Button>
          )}
        </div>
      }
    >
      <div className="px-5 py-4 space-y-5">{children}</div>
    </Drawer>
  )
}

export interface FilterExportTriggerProps {
  onClick: () => void
  activeCount?: number
  className?: string
}

/** Nút mở drawer — đặt trên toolbar trang chính (embedded hub). */
export function FilterExportTrigger({ onClick, activeCount = 0, className }: FilterExportTriggerProps) {
  return (
    <AppTooltip content="Lọc, sắp xếp và xuất dữ liệu">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        className={`relative gap-1.5 h-9 ${className ?? ''}`}
      >
        <SlidersHorizontal size={15} />
        Bộ lọc & xuất
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
            {activeCount > 9 ? '9+' : activeCount}
          </span>
        )}
      </Button>
    </AppTooltip>
  )
}
