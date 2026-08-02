// ============================================================
// PermissionButton — Button tự ẩn khi thiếu permission
// ============================================================

import { forwardRef, type ReactNode } from 'react'
import { Button, type ButtonProps } from '@frezo/ui'
import { Can } from './Can'

export type PermissionButtonProps = ButtonProps & {
  /** Một permission code (ưu tiên). */
  permission?: string
  /** OR logic — dùng thay cho `permission`. */
  anyOf?: readonly string[]
  /** AND logic — dùng thay cho `permission`. */
  allOf?: readonly string[]
  /** Khi thiếu quyền: mặc định ẩn. Đặt node nếu muốn hiện fallback. */
  fallback?: ReactNode
}

/**
 * `@frezo/ui` Button bọc `<Can>` — chỉ render khi user có quyền.
 *
 * @example
 * <PermissionButton
 *   permission="APPROVALS.APPROVE"
 *   size="sm"
 *   className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
 *   onClick={onApprove}
 * >
 *   Duyệt
 * </PermissionButton>
 */
export const PermissionButton = forwardRef<HTMLButtonElement, PermissionButtonProps>(
  function PermissionButton(
    { permission, anyOf, allOf, fallback = null, children, ...buttonProps },
    ref,
  ) {
    return (
      <Can permission={permission} anyOf={anyOf} allOf={allOf} fallback={fallback}>
        <Button ref={ref} {...buttonProps}>
          {children}
        </Button>
      </Can>
    )
  },
)
