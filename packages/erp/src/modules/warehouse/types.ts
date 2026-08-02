// ============================================================
// Warehouse types — Reorder Rules + Stock Alerts (FZ-010 / FE-3)
// ============================================================

export type StockAlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO'
export type StockAlertStatus = 'OPEN' | 'DISMISSED' | 'RESOLVED'
export type StockAlertType = 'LOW_STOCK' | 'EXPIRY_SOON'

export interface ReorderRuleDto {
  id: string
  warehouseId: string
  warehouseName?: string
  productId: string
  productCode?: string
  productName?: string
  categoryName?: string
  minQty: number
  maxQty: number
  reorderQty?: number
  active: boolean
  updatedAt?: string
}

export interface ReorderRuleRequest {
  warehouseId: string
  productId: string
  minQty: number
  maxQty: number
  reorderQty?: number
  active?: boolean
}

export interface StockAlertDto {
  id: string
  warehouseId: string
  warehouseName?: string
  productId: string
  productCode?: string
  productName?: string
  categoryName?: string
  /** Preferred supplier — multi-select PR cùng supplier */
  supplierId?: string
  supplierName?: string
  currentQty: number
  minQty: number
  severity: StockAlertSeverity
  status: StockAlertStatus
  alertType?: StockAlertType
  batchId?: string
  batchCode?: string
  expiryDate?: string
  daysToExpiry?: number
  triggeredAt: string
  dismissedAt?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  number: number
  size: number
}

export interface WarehouseOption {
  id: string
  name: string
  code?: string
}
