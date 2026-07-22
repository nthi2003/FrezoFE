import * as React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@frezo/utils'
import { Button } from './button'

/**
 * `action` chấp nhận 2 dạng:
 * - `{ label, onClick }` — legacy shortcut, tự render Button default.
 * - `ReactNode` — full custom (nút riêng, group nhiều button, icon, gradient…).
 *
 * `icon` chấp nhận:
 * - `ReactNode` — custom (VD `<FileText size={32} />`).
 * - Function component (LucideIcon) — tự render size 32.
 */
export interface EmptyStateProps {
  title?: string
  description?: string
  /**
   * Icon — có thể truyền:
   * - Lucide component (VD `FileText` từ `lucide-react`) — tự render size 32.
   * - React node bất kỳ (VD `<FileText size={40} />` hoặc `<img />`).
   */
  icon?: React.ReactNode | React.ComponentType<any>
  action?:
    | React.ReactNode
    | {
        label: string
        onClick: () => void
      }
  className?: string
}

function isComponentType(v: unknown): v is React.ComponentType<any> {
  if (typeof v === 'function') return true
  if (
    typeof v === 'object' &&
    v !== null &&
    // forwardRef / memo / lazy components — plain object với $$typeof Symbol.
    // Lucide-react v0.3xx+ export component qua forwardRef → typeof là 'object'.
    // Nếu không handle, render sẽ crash: "Objects are not valid as a React child".
    typeof (v as any).$$typeof === 'symbol'
  ) {
    return true
  }
  return false
}

function renderIcon(icon: EmptyStateProps['icon']) {
  if (!icon) return <Inbox size={32} strokeWidth={1.5} />
  if (React.isValidElement(icon)) return icon
  if (isComponentType(icon)) {
    const Icon = icon
    return <Icon size={32} strokeWidth={1.5} />
  }
  return null
}

function renderAction(action: EmptyStateProps['action']) {
  if (!action) return null
  if (React.isValidElement(action)) return action
  if (
    typeof action === 'object' &&
    action !== null &&
    // Không phải forwardRef/memo component (có $$typeof Symbol) — thực sự là POJO { label, onClick }.
    typeof (action as any).$$typeof !== 'symbol' &&
    'label' in (action as any) &&
    'onClick' in (action as any)
  ) {
    const a = action as { label: string; onClick: () => void }
    return (
      <Button variant="default" onClick={a.onClick}>
        {a.label}
      </Button>
    )
  }
  return action as React.ReactNode
}

/**
 * EmptyState — hiển thị khi danh sách không có data.
 * Bắt buộc dùng ở mọi màn hình list rỗng (thay vì để trắng).
 * Cung cấp action CTA để user biết bước tiếp theo.
 */
export function EmptyState({
  title = 'Chưa có dữ liệu',
  description = 'Danh sách hiện đang trống.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className,
      )}
      role="status"
    >
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
        {renderIcon(icon)}
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-sm mb-6">{description}</p>
      )}
      {renderAction(action)}
    </div>
  )
}
