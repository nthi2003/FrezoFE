import React from 'react'
import { cn } from '@frezo/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog'

export interface AppModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  /**
   * Size preset (khuyến nghị) hoặc maxWidth legacy.
   * sm | md | lg | xl | full map sang FormModal sizes.
   * 2xl–6xl giữ tương thích call-site cũ.
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** @deprecated Dùng `size`. */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  /** Footer sticky (nút hành động). */
  footer?: React.ReactNode
  className?: string
}

function isSelectDropdownTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('[data-frezo-select-dropdown]')
}

const WIDTH_CLASS: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[min(96rem,96vw)] w-[96vw]',
  '2xl': 'max-w-2xl sm:min-w-[min(100%,42rem)]',
  '3xl': 'max-w-3xl sm:min-w-[min(100%,48rem)]',
  '4xl': 'max-w-4xl sm:min-w-[min(100%,56rem)]',
  '5xl': 'max-w-5xl sm:min-w-[min(100%,64rem)]',
  '6xl': 'max-w-6xl sm:min-w-[min(100%,72rem)]',
}

/**
 * AppModal — modal nội dung/form cơ bản (header sticky + body scroll + footer tùy chọn).
 * Form tạo/sửa phức tạp nên ưu tiên `FormModal` (footer Hủy/Lưu chuẩn).
 */
export function AppModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size,
  maxWidth = '2xl',
  footer,
  className,
}: AppModalProps) {
  const widthKey = size ?? maxWidth

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          WIDTH_CLASS[widthKey] ?? WIDTH_CLASS['2xl'],
          'flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-xl p-0 shadow-card-md',
          'motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none',
          className,
        )}
        onPointerDownOutside={(e) => {
          if (isSelectDropdownTarget(e.target)) e.preventDefault()
        }}
        onInteractOutside={(e) => {
          if (isSelectDropdownTarget(e.target)) e.preventDefault()
        }}
        onFocusOutside={(e) => {
          if (isSelectDropdownTarget(e.target)) e.preventDefault()
        }}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-5 py-4 pr-12 text-left sm:px-6 sm:pt-5">
          <DialogTitle className="text-base font-semibold tracking-tight text-neutral-900">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-sm text-neutral-500">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-visible px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-border bg-surface-secondary px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
