import { WarehouseStatusBadge } from './WarehouseStatusBadge'

/** Badge trạng thái GRN/GIN — delegate warehouseStatus.doc */
export function GrnGinStatusBadge({ status }: { status?: string }) {
  return <WarehouseStatusBadge status={status} kind="doc" />
}
