import * as React from 'react'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@frezo/utils'

import { Portal } from './Portal'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  /** Kích thước drawer:
   * - sm = 360px (danh sách phụ, quick view)
   * - md = 480px (detail chuẩn — default)
   * - lg = 640px (form phức tạp)
   * - xl = 800px (dashboard, activity log)
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Trượt từ phải (default) hoặc trái */
  side?: 'right' | 'left'
  /** Footer cố định (buttons) — tuỳ chọn */
  footer?: React.ReactNode
  children?: React.ReactNode
  /** ĐÓNG khi click backdrop. Default true */
  closeOnBackdrop?: boolean
  /** Ẩn nút X ở header */
  hideCloseButton?: boolean
  className?: string
}

/**
 * Drawer — slide-in panel phù hợp cho detail view, quick edit, activity log.
 * So với Modal:
 * - Modal ép user focus vào 1 tác vụ; Drawer cho phép "peek" mà không mất context page.
 * - Modal center; Drawer side. Modal blocking cao; Drawer feel nhẹ hơn.
 *
 * Nguyên tắc dùng:
 * - Detail 360-view của record → Drawer
 * - Form edit đơn giản → Modal
 * - Form phức tạp nhiều bước → dedicated Page
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  side = 'right',
  footer,
  children,
  closeOnBackdrop = true,
  hideCloseButton = false,
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Lock body scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClass = {
    sm: 'w-[360px]',
    md: 'w-[480px]',
    lg: 'w-[640px]',
    xl: 'w-[800px]',
  }[size]

  const sideClass = side === 'right' ? 'right-0' : 'left-0'
  const enterAnim = side === 'right' ? 'drawer-in-right' : 'drawer-in-left'

  return (
    <Portal>
      {/* Backdrop — `fixed` + portal để luôn phủ kín viewport, kể cả khi trang
          có tổ tiên transform/filter (sẽ neo `fixed` vào tổ tiên đó). */}
      <div
        className="fixed inset-0 z-[900] bg-neutral-900/40 backdrop-blur-[2px] animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed top-0 bottom-0 z-[901] max-w-[calc(100vw-24px)] bg-white shadow-2xl border-neutral-200 flex flex-col',
          side === 'right' ? 'border-l' : 'border-r',
          sideClass,
          sizeClass,
          className,
        )}
        style={{ animation: `${enterAnim} 240ms cubic-bezier(0.16, 1, 0.3, 1)` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 className="text-base font-semibold text-neutral-900 leading-tight truncate">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-neutral-500 mt-0.5 leading-snug">{description}</p>
              )}
            </div>
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -mr-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors shrink-0"
                title="Đóng (Esc)"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/70 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>

      {/* Keyframes inline (Tailwind version varies — inline is safer) */}
      <style>{`
        @keyframes drawer-in-right {
          from { opacity: 0.6; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes drawer-in-left {
          from { opacity: 0.6; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </Portal>
  )
}
