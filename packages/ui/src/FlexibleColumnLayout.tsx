import { useEffect, useState, type ReactNode } from 'react'
import { Maximize2, Minimize2, PanelRightClose, X } from 'lucide-react'
import { cn } from '@frezo/utils'

export interface FlexibleColumnLayoutProps {
  /** Cột list (master) */
  master: ReactNode
  /** Cột detail — null = chỉ 1 cột */
  detail?: ReactNode | null
  /** Có bản ghi đang chọn */
  hasSelection: boolean
  /** Đóng detail / bỏ chọn */
  onCloseDetail?: () => void
  /** Tiêu đề cột detail (desktop) */
  detailTitle?: ReactNode
  className?: string
  /** Tỉ lệ master trên desktop (mặc định 40%) */
  masterRatio?: number
}

/**
 * SAP Fiori Flexible Column — desktop 2 cột (list | detail), &lt;md 1 cột.
 * FR-UX-06
 */
export function FlexibleColumnLayout({
  master,
  detail,
  hasSelection,
  onCloseDetail,
  detailTitle = 'Chi tiết',
  className,
  masterRatio = 40,
}: FlexibleColumnLayoutProps) {
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!hasSelection) setFullscreen(false)
  }, [hasSelection])

  const showDetail = hasSelection && !!detail
  const masterPct = Math.min(55, Math.max(30, masterRatio))

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row gap-3 md:gap-4 min-h-[420px]',
        className,
      )}
    >
      {/* Master — ẩn khi fullscreen detail trên desktop */}
      <div
        className={cn(
          'min-w-0 transition-all',
          showDetail && fullscreen ? 'hidden md:hidden' : 'block',
          showDetail && !fullscreen ? 'md:shrink-0' : 'flex-1',
          /* Mobile: ẩn list khi đang xem detail */
          showDetail ? 'hidden md:block' : 'block',
        )}
        style={
          showDetail && !fullscreen
            ? { width: undefined, flexBasis: `${masterPct}%`, maxWidth: `${masterPct}%` }
            : undefined
        }
      >
        {master}
      </div>

      {showDetail && (
        <div
          className={cn(
            'min-w-0 flex flex-col border border-border rounded-xl bg-surface shadow-card overflow-hidden',
            fullscreen ? 'flex-1 w-full' : 'flex-1 md:min-w-0',
          )}
          style={
            !fullscreen
              ? { flexBasis: `${100 - masterPct}%` }
              : undefined
          }
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-surface-secondary/60 shrink-0">
            <div className="min-w-0 text-sm font-semibold text-neutral-800 truncate">
              {detailTitle}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="hidden md:inline-flex p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                title={fullscreen ? 'Thu cột detail' : 'Phóng to cột detail'}
                onClick={() => setFullscreen((v) => !v)}
              >
                {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              {onCloseDetail && (
                <button
                  type="button"
                  className="inline-flex p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                  title="Đóng chi tiết"
                  onClick={onCloseDetail}
                >
                  <span className="md:hidden">
                    <X size={15} />
                  </span>
                  <span className="hidden md:inline">
                    <PanelRightClose size={15} />
                  </span>
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">{detail}</div>
        </div>
      )}
    </div>
  )
}
