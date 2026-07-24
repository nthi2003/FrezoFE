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
  /** Desktop: default 2xl (~672px+). Create form phức tạp nên dùng 3xl–5xl. */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
}

function isSelectDropdownTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('[data-frezo-select-dropdown]')
}

const MAX_WIDTH_CLASS: Record<NonNullable<AppModalProps['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  // ERP forms: 2xl trở lên + min-width desktop để không dưới ~720px
  '2xl': 'max-w-2xl sm:min-w-[min(100%,42rem)]',
  '3xl': 'max-w-3xl sm:min-w-[min(100%,48rem)]',
  '4xl': 'max-w-4xl sm:min-w-[min(100%,56rem)]',
  '5xl': 'max-w-5xl sm:min-w-[min(100%,64rem)]',
  '6xl': 'max-w-6xl sm:min-w-[min(100%,72rem)]',
}

export function AppModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = '2xl',
}: AppModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          MAX_WIDTH_CLASS[maxWidth],
          'flex max-h-[90vh] flex-col gap-0 overflow-hidden p-6 sm:p-8',
        )}
        onPointerDownOutside={(e) => {
          // Portaled Select/MultiSelect sit outside DialogContent. preventDefault keeps
          // the modal open; options must use onMouseDown (not onClick) because this
          // also preventDefaults the original pointerdown and suppresses the click event.
          if (isSelectDropdownTarget(e.target)) e.preventDefault()
        }}
        onInteractOutside={(e) => {
          if (isSelectDropdownTarget(e.target)) e.preventDefault()
        }}
        onFocusOutside={(e) => {
          if (isSelectDropdownTarget(e.target)) e.preventDefault()
        }}
      >
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {/* Scroll body only — không overflow trên DialogContent để tránh clip dropdown non-portal */}
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto overflow-x-visible pr-0.5">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
