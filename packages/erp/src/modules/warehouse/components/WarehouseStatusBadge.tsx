import { StatusBadge } from '@frezo/ui'
import {
  resolveWarehouseStatus,
  type WarehouseStatusKind,
} from '../constants/warehouseStatus'

interface Props {
  status?: string
  kind: WarehouseStatusKind
  compact?: boolean
}

export function WarehouseStatusBadge({ status, kind, compact }: Props) {
  const cfg = resolveWarehouseStatus(status, kind)
  return <StatusBadge label={cfg.label} color={cfg.color} compact={compact} />
}
