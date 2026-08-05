import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from 'lucide-react'
import { cn } from '@frezo/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'
import { Input } from './input'

/** Severity — mỗi variant có icon + màu accent riêng theo token Frezo. */
export type ConfirmVariant = 'info' | 'success' | 'warning' | 'danger'

/** @deprecated Dùng `info` — giữ để tương thích call-site cũ. */
type LegacyConfirmVariant = 'default'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  /**
   * Confirm handler. Hỗ trợ async: tự bật loading, disable nút;
   * chỉ gọi `onClose` khi resolve thành công (không tự đóng khi reject/throw).
   */
  onConfirm: () => void | Promise<void>
  /** Tiêu đề ngắn, dạng câu hỏi ("Xóa hợp đồng #HD-001?"). */
  title: string
  /**
   * Mô tả — ưu tiên prop này. Accept ReactNode (span/code/strong; tránh block trong `<p>`).
   * Alias: `message` (giữ tương thích).
   */
  description?: ReactNode
  /** @deprecated Dùng `description`. */
  message?: ReactNode
  confirmText?: string
  cancelText?: string
  /** `default` = alias của `info` (backward-compat). */
  variant?: ConfirmVariant | LegacyConfirmVariant
  /** Controlled loading — nếu không truyền, tự quản khi `onConfirm` async. */
  isLoading?: boolean
  onCancel?: () => void
  /**
   * Bắt buộc gõ đúng chuỗi mới enable nút confirm (hành động không hoàn tác).
   * VD: `requireTypeToConfirm="XÓA"`.
   */
  requireTypeToConfirm?: string
  /** Slot phụ dưới description (checklist, warning box…). */
  extra?: ReactNode
}

const VARIANT_CONFIG: Record<
  ConfirmVariant,
  {
    icon: typeof AlertTriangle
    iconWrap: string
    confirmVariant: 'destructive' | 'default'
    confirmClass?: string
  }
> = {
  info: {
    icon: Info,
    iconWrap: 'bg-info-light text-info-dark',
    confirmVariant: 'default',
  },
  success: {
    icon: CheckCircle2,
    iconWrap: 'bg-success-light text-success-dark',
    confirmVariant: 'default',
    confirmClass: 'bg-success hover:bg-success-dark focus-visible:ring-success',
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: 'bg-warning-light text-warning-dark',
    confirmVariant: 'default',
    confirmClass: 'bg-warning text-white hover:bg-warning-dark focus-visible:ring-warning',
  },
  danger: {
    icon: XCircle,
    iconWrap: 'bg-danger-light text-danger-dark',
    confirmVariant: 'destructive',
  },
}

function resolveVariant(v: ConfirmDialogProps['variant']): ConfirmVariant {
  if (!v || v === 'default') return 'info'
  return v
}

/**
 * ConfirmDialog — hộp thoại xác nhận (alertdialog) cho hành động quan trọng.
 *
 * Design principles (shadcn AlertDialog / Radix / Atlassian / MD3):
 * - Icon severity trong vòng tròn nền nhạt, hierarchy title > description rõ.
 * - Cancel (safe) trái / Confirm phải; mobile full-width stack.
 * - ESC + backdrop đóng (trừ khi loading); focus trap qua Radix Dialog.
 * - Async confirm: loading + không đóng khi lỗi.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  isLoading: controlledLoading,
  onCancel,
  requireTypeToConfirm,
  extra,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [internalLoading, setInternalLoading] = useState(false)
  const [typed, setTyped] = useState('')
  const loading = controlledLoading ?? internalLoading
  const resolved = resolveVariant(variant)
  const cfg = VARIANT_CONFIG[resolved]
  const Icon = cfg.icon
  const body = description ?? message
  const typeOk =
    !requireTypeToConfirm || typed.trim() === requireTypeToConfirm

  useEffect(() => {
    if (!isOpen) {
      setTyped('')
      setInternalLoading(false)
    }
  }, [isOpen])

  const handleClose = () => {
    if (loading) return
    onCancel?.()
    onClose()
  }

  const handleConfirm = async () => {
    if (loading || !typeOk) return
    try {
      const result = onConfirm()
      const isPromise =
        result != null && typeof (result as PromiseLike<void>).then === 'function'
      // Sync / fire-and-forget: parent tự quản isOpen.
      if (!isPromise) return
      const unmanaged = controlledLoading === undefined
      if (unmanaged) setInternalLoading(true)
      await result
      // Controlled loading (vd. hook): parent tự đóng. Unmanaged: đóng sau success.
      if (unmanaged) onClose()
    } catch {
      // Giữ mở khi lỗi — caller tự toast
    } finally {
      if (controlledLoading === undefined) setInternalLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent
        hideCloseButton
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={body ? descId : undefined}
        className={cn(
          'max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0 sm:max-w-md',
          'rounded-xl border-border shadow-card-md',
          'motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none',
        )}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          cancelRef.current?.focus()
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          if (loading) e.preventDefault()
        }}
      >
        <DialogHeader className="space-y-0 p-5 pb-4 sm:p-6 sm:pb-4 sm:text-left">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                cfg.iconWrap,
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
              <DialogTitle
                id={titleId}
                className="text-base font-semibold leading-snug tracking-tight text-neutral-900"
              >
                {title}
              </DialogTitle>
              {body ? (
                typeof body === 'string' ? (
                  <DialogDescription
                    id={descId}
                    className="text-sm leading-relaxed text-neutral-500"
                  >
                    {body}
                  </DialogDescription>
                ) : (
                  <div
                    id={descId}
                    className="text-sm leading-relaxed text-neutral-500"
                  >
                    {body}
                  </div>
                )
              ) : null}
              {extra ? <div className="pt-2">{extra}</div> : null}
              {requireTypeToConfirm ? (
                <div className="space-y-1.5 pt-3">
                  <p className="text-xs text-neutral-500">
                    Gõ{' '}
                    <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-2xs font-semibold text-neutral-800">
                      {requireTypeToConfirm}
                    </code>{' '}
                    để xác nhận
                  </p>
                  <Input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={requireTypeToConfirm}
                    disabled={loading}
                    autoComplete="off"
                    className="h-9"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <DialogFooter
          className={cn(
            'flex-col-reverse gap-2 border-t border-border bg-surface-secondary px-5 py-4 sm:flex-row sm:justify-end sm:space-x-0 sm:px-6',
          )}
        >
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={cfg.confirmVariant}
            className={cn('w-full sm:w-auto', cfg.confirmClass)}
            onClick={() => void handleConfirm()}
            disabled={loading || !typeOk}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Đang xử lý...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
