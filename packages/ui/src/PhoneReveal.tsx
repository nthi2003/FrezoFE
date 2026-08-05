import * as React from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@frezo/utils'

const AUTO_HIDE_MS = 30_000

export interface PhoneRevealProps {
  /** Giá trị hiển thị mặc định (đã masked ở BE hoặc format bằng maskPhone) */
  maskedPhone: string
  /** Handler gọi API để lấy phone thật — BE tự log audit */
  onReveal: () => Promise<string>
  /** Format phone thật khi đã reveal — mặc định trả về nguyên gốc */
  formatRevealed?: (raw: string) => string
  /** User có quyền reveal không (dùng usePermission bên ngoài) */
  canReveal?: boolean
  /** Auto ẩn lại sau X ms — mặc định 30s (STANDARD section 18.3) */
  autoHideMs?: number
  className?: string
}

/**
 * Hiển thị số điện thoại nhạy cảm với pattern "masked → reveal → auto-hide 30s".
 * (STANDARD section 18.3 — Sensitive Data Reveal)
 *
 * Backend tự log reveal vào audit log. FE không cần code audit.
 * Auto-hide chống lộ khi user rời máy quên tab.
 *
 * @example
 * const canReveal = usePermission('CUSTOMER.REVEAL_PHONE')
 * <PhoneReveal
 *   maskedPhone={customer.phoneMasked}    // "•••• 5678"
 *   onReveal={() => customerApi.revealPhone(customer.id)}
 *   formatRevealed={formatPhoneVN}
 *   canReveal={canReveal}
 * />
 */
export function PhoneReveal({
  maskedPhone,
  onReveal,
  formatRevealed = (v) => v,
  canReveal = true,
  autoHideMs = AUTO_HIDE_MS,
  className,
}: PhoneRevealProps) {
  const [revealed, setRevealed] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  React.useEffect(() => clearTimer, [clearTimer])

  const handleReveal = async () => {
    if (isLoading || revealed) return
    setIsLoading(true)
    try {
      const raw = await onReveal()
      setRevealed(raw)
      clearTimer()
      timerRef.current = setTimeout(() => setRevealed(null), autoHideMs)
    } finally {
      setIsLoading(false)
    }
  }

  const handleHide = () => {
    setRevealed(null)
    clearTimer()
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="tabular-nums">
        {revealed ? formatRevealed(revealed) : maskedPhone}
      </span>

      {canReveal && !revealed && (
        <button
          type="button"
          onClick={handleReveal}
          disabled={isLoading}
          className="inline-flex items-center justify-center h-6 w-6 rounded text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
          title="Hiện số điện thoại (được ghi nhật ký)"
          aria-label="Hiện số điện thoại"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" strokeWidth={2} />
          ) : (
            <Eye size={14} strokeWidth={1.5} />
          )}
        </button>
      )}

      {revealed && (
        <button
          type="button"
          onClick={handleHide}
          className="inline-flex items-center justify-center h-6 w-6 rounded text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          title="Ẩn số điện thoại"
          aria-label="Ẩn số điện thoại"
        >
          <EyeOff size={14} strokeWidth={1.5} />
        </button>
      )}
    </span>
  )
}
