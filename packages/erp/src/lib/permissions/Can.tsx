// ============================================================
// <Can> — declarative button/UI gate by permission code
// Mirror VBPL <Access>: ẩn children khi thiếu quyền (không disable).
// Nguồn quyền: authStore.user.permissions từ GET /auth/profile.
// ============================================================

import type { ReactNode } from 'react'
import {
  useAllPermissions,
  useAnyPermission,
  usePermission,
} from '@/lib/hooks/usePermission'

export type CanProps = {
  /** Một permission — FE dotted (`APPROVALS.APPROVE`) hoặc BE underscore. */
  permission?: string
  /** OR: hiện nếu có ÍT NHẤT 1 code. */
  anyOf?: readonly string[]
  /** AND: hiện nếu có TẤT CẢ codes. */
  allOf?: readonly string[]
  /** Render khi thiếu quyền — mặc định ẩn (`null`). */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Wrapper ẩn UI khi user không có permission.
 *
 * @example
 * <Can permission="APPROVALS.APPROVE">
 *   <Button>Duyệt</Button>
 * </Can>
 *
 * @example
 * <Can anyOf={['LEAVE.APPROVE', 'APPROVALS.APPROVE']}>
 *   <Button>Duyệt nghỉ phép</Button>
 * </Can>
 */
export function Can({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: CanProps) {
  const single = usePermission(permission ?? '')
  const any = useAnyPermission(anyOf ?? [])
  const all = useAllPermissions(allOf ?? [])

  let allowed = false
  if (allOf && allOf.length > 0) {
    allowed = all
  } else if (anyOf && anyOf.length > 0) {
    allowed = any
  } else if (permission) {
    allowed = single
  }

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}
