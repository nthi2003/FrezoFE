/**
 * Button-level permission helpers (Frezo ERP).
 *
 * Model: BE `permission.code` (vd `APPROVALS_APPROVE`) ↔ FE key `APPROVALS.APPROVE`
 * → gán qua Role → RolePermission; FE chỉ check code, không hard-code “cấp trên”.
 *
 * @see docs/BA_BUTTON_PERMISSION_HELPER.md
 */
export { Can, type CanProps } from './Can'
export { PermissionButton, type PermissionButtonProps } from './PermissionButton'
export {
  usePermission,
  useHasPermission,
  useAnyPermission,
  useAllPermissions,
  hasPermission,
  permissionMatches,
} from '@/lib/hooks/usePermission'
