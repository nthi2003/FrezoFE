import { WarehouseStatusBadge } from './WarehouseStatusBadge'

/** @deprecated Use WarehouseStatusBadge with kind="stockTake" */
export function StockTakeStatusBadge({ status }: { status?: string }) {
  return <WarehouseStatusBadge status={status} kind="stockTake" />
}
