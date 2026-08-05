import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface PortalProps {
  children: ReactNode
  /** Node đích — mặc định `document.body`. */
  container?: Element | null
}

/**
 * Portal — render overlay ra ngoài `document.body`.
 *
 * Bắt buộc cho mọi backdrop/panel dùng `position: fixed`: nếu overlay nằm trong
 * cây DOM của trang, chỉ cần một tổ tiên có `transform` / `filter` /
 * `backdrop-filter` là `fixed` bị neo vào tổ tiên đó thay vì viewport, gây hở
 * mép (thường là hở đúng chiều cao header).
 */
export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  return createPortal(children, container ?? document.body)
}
