import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@frezo/utils'

export interface BulkSelectionBarProps {
  /** Số item đã chọn — bar hiển thị khi > 0 */
  selectedCount: number
  /** Tổng số item trong list (optional, hiển thị "X / Y") */
  totalCount?: number
  /** Handler bỏ chọn tất cả */
  onDeselect: () => void
  /** Cụm nút hành động bên phải: Xóa, Duyệt, Đổi trạng thái, Xuất... */
  actions: React.ReactNode
  /** Label prefix — mặc định "Đã chọn" */
  label?: string
  /** Nếu app có sidebar, cần offset bar (VD "md:left-64") */
  offsetLeftClass?: string
  className?: string
}

/**
 * Thanh hiển thị dưới cùng khi user chọn nhiều row trong table (STANDARD section 17.1).
 * Sticky bottom, animation slide-up, dark theme để nổi bật trên nội dung.
 *
 * @example
 * <BulkSelectionBar
 *   selectedCount={selected.length}
 *   totalCount={total}
 *   onDeselect={clearSelection}
 *   actions={
 *     <>
 *       <Button variant="outline" size="sm" onClick={onExportSelected}>Xuất chọn</Button>
 *       <Button variant="destructive" size="sm" onClick={onBulkDelete}>Xóa {selected.length} mục</Button>
 *     </>
 *   }
 * />
 */
export function BulkSelectionBar({
  selectedCount,
  totalCount,
  onDeselect,
  actions,
  label = 'Đã chọn',
  offsetLeftClass,
  className,
}: BulkSelectionBarProps) {
  const isVisible = selectedCount > 0

  return (
    <div
      role="toolbar"
      aria-label="Thanh thao tác hàng loạt"
      aria-hidden={!isVisible}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-neutral-900 text-white shadow-card-md',
        'transition-transform duration-200 ease-out',
        isVisible ? 'translate-y-0' : 'translate-y-full pointer-events-none',
        offsetLeftClass,
        className,
      )}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 px-4 md:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onDeselect}
            className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shrink-0"
            title="Bỏ chọn tất cả"
            aria-label="Bỏ chọn tất cả"
          >
            <X size={16} strokeWidth={2} />
          </button>

          <span className="text-sm font-medium tabular-nums truncate">
            {label} <span className="text-primary-400">{selectedCount}</span>
            {totalCount !== undefined && (
              <span className="text-neutral-400"> / {totalCount}</span>
            )}
            <span className="hidden sm:inline"> mục</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      </div>
    </div>
  )
}
