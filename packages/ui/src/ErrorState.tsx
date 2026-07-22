import * as React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@frezo/utils'
import { Button } from './button'

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  isRetrying?: boolean
  className?: string
}

/**
 * ErrorState — hiển thị khi API trả lỗi.
 * Bắt buộc kèm nút "Thử lại" nếu có thể retry.
 * Message nên map từ i18n key của AppException, không show raw stack.
 */
export function ErrorState({
  title = 'Đã xảy ra lỗi',
  message = 'Không thể tải dữ liệu. Vui lòng thử lại.',
  onRetry,
  retryLabel = 'Thử lại',
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className,
      )}
      role="alert"
    >
      <div className="w-16 h-16 rounded-full bg-danger-light flex items-center justify-center text-danger-dark mb-4">
        <AlertCircle size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
          <RefreshCw
            size={16}
            className={cn('mr-2', isRetrying && 'animate-spin')}
          />
          {isRetrying ? 'Đang thử lại...' : retryLabel}
        </Button>
      )}
    </div>
  )
}
