// ============================================================
// Warehouse display helpers — enriched BE fields with UUID fallback
// ============================================================

export interface WarehouseDisplayFields {
  warehouseName?: string
  warehouseCode?: string
  warehouseId?: string
}

export interface SupplierDisplayFields {
  supplierName?: string
  supplierId?: string
}

/** Prefer warehouseName/code from API; fallback to warehouseId. */
export function formatWarehouseLabel(row: WarehouseDisplayFields): string {
  return row.warehouseName || row.warehouseCode || row.warehouseId || '—'
}

/** Prefer supplierName from API; fallback to supplierId. */
export function formatSupplierLabel(row: SupplierDisplayFields): string {
  return row.supplierName || row.supplierId || '—'
}

export interface ProductDisplayFields {
  productName?: string
  productCode?: string
  productId?: string
}

/** Prefer productName/code from API; fallback to productId. */
export function formatProductLabel(row: ProductDisplayFields): string {
  if (row.productName && row.productCode) return `${row.productCode} — ${row.productName}`
  return row.productName || row.productCode || row.productId || '—'
}

export interface CustomerDisplayFields {
  customerName?: string
  customerId?: string
}

export function formatCustomerLabel(row: CustomerDisplayFields): string {
  return row.customerName || row.customerId || '—'
}

export function warehouseSelectLabel(w: { id: string; name?: string; code?: string }): string {
  return w.name || w.code || w.id
}
