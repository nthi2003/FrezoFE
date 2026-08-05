import { useCallback, useState, type ReactNode } from 'react'
import { Loader2, Save, X } from 'lucide-react'
import { cn } from '@frezo/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'
import { ConfirmDialog } from './ConfirmDialog'

export type FormModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

/** @deprecated Dùng `size` — giữ để tương thích call-site cũ. */
export type LegacyModalWidth =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'

export interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  /** Title sticky header. */
  title: string
  /** Subtitle dưới title. */
  description?: ReactNode
  children: ReactNode
  /**
   * Size preset:
   * - sm ≈ 28rem, md ≈ 36rem, lg ≈ 48rem, xl ≈ 64rem, full ≈ 96vw
   */
  size?: FormModalSize
  /** @deprecated Dùng `size`. */
  maxWidth?: LegacyModalWidth
  /** Footer sticky tùy chỉnh — ghi đè footer chuẩn Hủy/Lưu. */
  footer?: ReactNode
  /**
   * Ép hiện footer chuẩn. Mặc định chỉ hiện khi có `onSubmit` hoặc `formId`
   * (call-site tự render nút trong body sẽ không bị footer thừa).
   */
  showFooter?: boolean
  cancelText?: string
  submitText?: string
  /** Gắn nút submit với `<form id={formId}>` nằm trong body. */
  formId?: string
  onSubmit?: () => void | Promise<void>
  isSubmitting?: boolean
  /** Disable nút submit (invalid / !dirty). */
  submitDisabled?: boolean
  /** Nút phụ căn trái trong footer. */
  extraActions?: ReactNode
  /** Form đã sửa — ESC / X / backdrop sẽ hỏi xác nhận trước khi đóng. */
  dirty?: boolean
  /** Ẩn icon trên nút footer. */
  hideFooterIcons?: boolean
  className?: string
}

function isSelectDropdownTarget(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('[data-frezo-select-dropdown]')
}

const SIZE_CLASS: Record<FormModalSize | LegacyModalWidth, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl sm:min-w-[min(100%,32rem)]',
  lg: 'max-w-3xl sm:min-w-[min(100%,48rem)]',
  xl: 'max-w-5xl sm:min-w-[min(100%,64rem)]',
  full: 'max-w-[min(96rem,96vw)] w-[96vw]',
  '2xl': 'max-w-2xl sm:min-w-[min(100%,42rem)]',
  '3xl': 'max-w-3xl sm:min-w-[min(100%,48rem)]',
  '4xl': 'max-w-4xl sm:min-w-[min(100%,56rem)]',
  '5xl': 'max-w-5xl sm:min-w-[min(100%,64rem)]',
  '6xl': 'max-w-6xl sm:min-w-[min(100%,72rem)]',
}

/**
 * FormModal — modal chung của Frezo: header sticky (title + divider + nút X),
 * body scroll, footer sticky căn phải (Hủy outline + Lưu solid brand).
 *
 * Dùng kèm `FormSection` + `FormGrid` cho form nhiều khối.
 */
export function FormModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size,
  maxWidth = '2xl',
  footer,
  showFooter,
  cancelText = 'Hủy',
  submitText = 'Lưu',
  formId,
  onSubmit,
  isSubmitting = false,
  submitDisabled = false,
  extraActions,
  dirty = false,
  hideFooterIcons = false,
  className,
}: FormModalProps) {
  const [discardOpen, setDiscardOpen] = useState(false)
  const widthKey = size ?? maxWidth
  const useDefaultFooter =
    showFooter ?? (footer == null && (onSubmit != null || formId != null))

  const requestClose = useCallback(() => {
    if (isSubmitting) return
    if (dirty) {
      setDiscardOpen(true)
      return
    }
    onClose()
  }, [dirty, isSubmitting, onClose])

  const handleSubmitClick = () => {
    if (onSubmit) void onSubmit()
  }

  const defaultFooter = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      {extraActions ? (
        <div className="mr-auto flex flex-wrap gap-2">{extraActions}</div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={requestClose}
        disabled={isSubmitting}
      >
        {!hideFooterIcons && <X className="mr-1.5 h-4 w-4" strokeWidth={1.5} />}
        {cancelText}
      </Button>
      <Button
        type={formId ? 'submit' : 'button'}
        form={formId}
        variant="default"
        className="w-full sm:w-auto"
        onClick={formId ? undefined : handleSubmitClick}
        disabled={isSubmitting || submitDisabled}
      >
        {isSubmitting ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          !hideFooterIcons && <Save className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
        )}
        {isSubmitting ? 'Đang lưu...' : submitText}
      </Button>
    </div>
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && requestClose()}>
        <DialogContent
          className={cn(
            SIZE_CLASS[widthKey] ?? SIZE_CLASS['2xl'],
            'flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-xl p-0 shadow-card-md',
            className,
          )}
          onPointerDownOutside={(e) => {
            if (isSelectDropdownTarget(e.target)) e.preventDefault()
            if (isSubmitting || dirty) e.preventDefault()
          }}
          onInteractOutside={(e) => {
            if (isSelectDropdownTarget(e.target)) e.preventDefault()
          }}
          onFocusOutside={(e) => {
            if (isSelectDropdownTarget(e.target)) e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (isSubmitting) {
              e.preventDefault()
              return
            }
            if (dirty) {
              e.preventDefault()
              requestClose()
            }
          }}
        >
          <DialogHeader className="shrink-0 space-y-1 border-b border-border px-5 py-4 pr-12 text-left sm:px-6">
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

          {(footer != null || useDefaultFooter) && (
            <div className="shrink-0 border-t border-border bg-surface-secondary px-5 py-3.5 sm:px-6">
              {footer ?? defaultFooter}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false)
          onClose()
        }}
        title="Hủy thay đổi?"
        description="Bạn có thay đổi chưa lưu. Đóng sẽ mất các thay đổi này."
        confirmText="Hủy thay đổi"
        cancelText="Tiếp tục sửa"
        variant="warning"
      />
    </>
  )
}

/** @deprecated Dùng `FormModal` — alias giữ tương thích call-site cũ. */
export const AppModal = FormModal
/** @deprecated Dùng `FormModalProps`. */
export type AppModalProps = FormModalProps
