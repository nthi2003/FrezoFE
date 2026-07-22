import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog'
import { Button } from './button'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@frezo/utils'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  /**
   * Nội dung mô tả — accept ReactNode để render inline warning, code chip, list…
   * Khi truyền JSX, wrapper dùng DialogDescription (`<p>`), nên tránh block-level bên trong.
   * Dùng `<span>` / `<code>` / <strong> để an toàn về semantic HTML.
   */
  message: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  isLoading?: boolean
}

/**
 * ConfirmDialog — hộp thoại xác nhận cho hành động đơn giản (xóa, duyệt...).
 * Với action không hoàn tác, nên đặt title rõ ràng ("Xóa hợp đồng #HD-001?")
 * thay vì title chung chung ("Xác nhận").
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  // Icon container: nền light + text dark — theo token semantic
  const iconContainerClass = {
    danger: 'bg-danger-light text-danger-dark',
    warning: 'bg-warning-light text-warning-dark',
    default: 'bg-primary-100 text-primary-700',
  }[variant]

  // Confirm button: dùng đúng Button variant, không hardcode class
  const confirmButtonVariant: 'destructive' | 'default' =
    variant === 'danger' ? 'destructive' : 'default'

  // warning variant chưa có sẵn trong Button — override bằng className token
  const warningOverride =
    variant === 'warning'
      ? 'bg-warning text-white hover:bg-warning-dark focus-visible:ring-warning'
      : ''

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                iconContainerClass,
              )}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle>{title}</DialogTitle>
              {/* DialogDescription mặc định render <p> — với ReactNode phức tạp (list, div)
                  sẽ hydration mismatch. Dùng DialogDescription cho string, div cho JSX phức tạp. */}
              {message ? (
                typeof message === 'string' ? (
                  <DialogDescription>{message}</DialogDescription>
                ) : (
                  <div className="text-sm text-neutral-500 mt-1">{message}</div>
                )
              ) : null}
            </div>
          </div>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={confirmButtonVariant}
            className={warningOverride}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Đang xử lý...' : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
