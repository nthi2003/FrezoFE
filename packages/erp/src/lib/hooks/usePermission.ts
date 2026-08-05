// ============================================================
// FREZO ERP — usePermission hook
// Check quyền của user hiện tại dựa trên authStore.
// User có `isAdmin=true` bypass mọi check.
//
// FE keys: DOMAIN.RESOURCE.ACTION (vd ACCOUNTING.ACCOUNTS.DELETE)
// BE seed: DOMAIN_RESOURCE_ACTION (vd ACCOUNTING_ACCOUNTS_DELETE)
// Hook normalize `.` ↔ `_` và resolve alias Batch I2 (LEAVE.APPROVE → QLNS_*).
//
// Nguồn: GET /auth/profile → user.permissions (permission.code).
// UI declarative: import { Can, PermissionButton } from '@/lib/permissions'
// ============================================================

import { useAuthStore } from '@/stores/authStore'

/** FE shorthand → BE seed code(s) khi không 1:1 với chấm→underscore. */
const FE_ALIASES: Record<string, readonly string[]> = {
  'LEAVE.APPROVE': ['QLNS_LEAVE_APPROVE', 'QLNS_LEAVE_REQUEST_APPROVE'],
  'LEAVE.CREATE': ['QLNS_LEAVE_CREATE', 'QLNS_LEAVE_REQUEST_CREATE'],
  'LEAVE.VIEW': ['QLNS_LEAVE_VIEW', 'QLNS_LEAVE_REQUEST_VIEW'],
  'PRODUCT.VIEW': ['PRODUCT_PRODUCT_VIEW', 'PRODUCT_VIEW', 'PRODUCT_ID_VIEW', 'PRODUCT_FILTER_VIEW'],
  'PRODUCT.CREATE': ['PRODUCT_PRODUCT_CREATE', 'PRODUCT_CREATE'],
  'PRODUCT.UPDATE': ['PRODUCT_PRODUCT_UPDATE', 'PRODUCT_ID_UPDATE'],
  'PRODUCT.DELETE': ['PRODUCT_PRODUCT_DELETE', 'PRODUCT_ID_DELETE'],
  'CONTRACT.DELETE': ['QLNS_CONTRACT_DELETE'],
  'CONTRACT.APPROVE': ['QLNS_CONTRACT_APPROVE'],
  'PAYROLL.APPROVE': ['QLNS_PAYROLL_APPROVE'],
  'ATTENDANCE.UPDATE': ['QLNS_ATTENDANCE_UPDATE'],
  'QLNS.PERFORMANCE.REVIEWS.CREATE': ['QLNS_PERFORMANCE_REVIEWS_CREATE'],
  'QLNS.PERFORMANCE.REVIEWS.SUBMIT': ['QLNS_PERFORMANCE_REVIEWS_ID_SUBMIT_UPDATE'],
  'QLNS.PERFORMANCE.REVIEWS.MANAGER_SCORE': [
    'QLNS_PERFORMANCE_REVIEWS_ID_MANAGER_SCORE_CREATE',
  ],
  'QLNS.RECOGNITION.GIFT.CREATE': ['QLNS_RECOGNITION_GIFT_CREATE'],
  'QLNS.RECOGNITION.REDEEM.CREATE': ['QLNS_RECOGNITION_REDEEM_CREATE'],
  'QLNS.RECOGNITION.REDEEM.APPROVE': [
    'QLNS_RECOGNITION_REDEEM_ID_APPROVE',
    'QLNS_RECOGNITION_REDEEM_ID_REJECT',
  ],
  'CUSTOMER.EXPORT': ['CUSTOMER_CUSTOMER_EXPORT', 'CUSTOMER_EXPORT_VIEW'],
  'CUSTOMER.VIEW': ['CUSTOMER_CUSTOMER_VIEW', 'CUSTOMER_VIEW', 'CUSTOMER_ID_VIEW'],
  'CUSTOMER.CREATE': ['CUSTOMER_CUSTOMER_CREATE', 'CUSTOMER_CREATE'],
  'CUSTOMER.UPDATE': ['CUSTOMER_CUSTOMER_UPDATE', 'CUSTOMER_ID_UPDATE'],
  'CUSTOMER.DELETE': ['CUSTOMER_CUSTOMER_DELETE', 'CUSTOMER_ID_DELETE'],
  'EMAIL.SEND': ['EMAIL_SEND_CREATE'],
  // CYCLE-QTLV-ART — CRUD + review/publish/submit: legacy entity + per-endpoint codes
  'QTBV.ARTICLES.VIEW': ['QTBV_ARTICLES_VIEW', 'QTBV_ARTICLES_ID_VIEW', 'QTBV_ARTICLES_FILTER_VIEW'],
  'QTBV.ARTICLES.CREATE': ['QTBV_ARTICLES_CREATE'],
  'QTBV.ARTICLES.UPDATE': ['QTBV_ARTICLES_UPDATE', 'QTBV_ARTICLES_ID_UPDATE'],
  'QTBV.ARTICLES.DELETE': ['QTBV_ARTICLES_DELETE', 'QTBV_ARTICLES_ID_DELETE'],
  'QTBV.ARTICLES.REVIEW': ['QTBV_ARTICLES_REVIEW_UPDATE', 'QTBV_ARTICLES_ID_REVIEW_UPDATE'],
  'QTBV.ARTICLES.PUBLISH': ['QTBV_ARTICLES_PUBLISH_UPDATE', 'QTBV_ARTICLES_ID_PUBLISH_UPDATE'],
  'QTBV.ARTICLES.SUBMIT': ['QTBV_ARTICLES_SUBMIT_UPDATE', 'QTBV_ARTICLES_ID_SUBMIT_UPDATE'],
  'QTHT.JOBS.VIEW': ['QTHT_JOBS_VIEW'],
  'QTHT.JOBS.UPDATE': ['QTHT_JOBS_CODE_UPDATE'],
  'QTHT.JOBS.RUN': ['QTHT_JOBS_CODE_RUN_EXECUTE'],
  'QTHT.JOBS.HISTORY': ['QTHT_JOBS_CODE_HISTORY_VIEW'],
}

function norm(code: string): string {
  return code.replace(/\./g, '_').toUpperCase()
}

/**
 * So khớp FE action key với `user.permissions` (BE code hoặc FE dotted).
 * @see docs/BA_PERMISSION_MATRIX.md §1
 */
export function permissionMatches(
  userPermissions: readonly string[],
  code: string,
): boolean {
  const wanted = new Set<string>([norm(code)])
  for (const alias of FE_ALIASES[code] ?? []) {
    wanted.add(norm(alias))
  }
  return userPermissions.some((p) => wanted.has(norm(p)))
}

/**
 * Check user hiện tại có 1 permission cụ thể không.
 *
 * @param code — mã permission FE (`DOMAIN.ACTION` / `DOMAIN.RESOURCE.ACTION`)
 *   hoặc BE seed underscore — hook normalize cả hai.
 * @returns `true` nếu có quyền hoặc là admin.
 *
 * @example
 * const canDelete = usePermission('PRODUCT.DELETE')
 * {canDelete && <Button variant="destructive">Xóa</Button>}
 *
 * Prefer declarative UI: `<Can permission="…">` / `<PermissionButton permission="…">`
 * (@/lib/permissions).
 */
export function usePermission(code: string): boolean {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  if (user.isAdmin) return true
  // Empty code = deny (tránh <Can> gọi hook với '' khi dùng anyOf/allOf)
  if (!code) return false
  return permissionMatches(user.permissions ?? [], code)
}

/** Alias VBPL-style — cùng `usePermission`. */
export const useHasPermission = usePermission

/**
 * Check user có ÍT NHẤT 1 trong danh sách permission (OR logic).
 *
 * @example
 * const canApprove = useAnyPermission(['APPROVALS.APPROVE', 'LEAVE.APPROVE'])
 */
export function useAnyPermission(codes: readonly string[]): boolean {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  if (user.isAdmin) return true
  if (!codes.length) return false
  const perms = user.permissions ?? []
  return codes.some((code) => permissionMatches(perms, code))
}

/**
 * Check user có TẤT CẢ các permission trong danh sách (AND logic).
 */
export function useAllPermissions(codes: readonly string[]): boolean {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  if (user.isAdmin) return true
  if (!codes.length) return false
  const perms = user.permissions ?? []
  return codes.every((code) => permissionMatches(perms, code))
}

/**
 * Non-hook version để dùng trong plain function / axios interceptor / event handler.
 * KHÔNG dùng trong render body — dùng `usePermission()` để đảm bảo re-render khi auth thay đổi.
 */
export function hasPermission(code: string): boolean {
  const user = useAuthStore.getState().user
  if (!user) return false
  if (user.isAdmin) return true
  return permissionMatches(user.permissions ?? [], code)
}
