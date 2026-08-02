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
  /** Enriched line/DTO fields */
  productName?: string
  productCode?: string
  productId?: string
  /** Catalog product from `/product` API (`useProducts`) */
  name?: string
  code?: string
  id?: string
}

/**
 * Label for product combobox / display.
 * Accepts both enriched DTO shape (`productCode`/`productName`) and catalog shape (`code`/`name`).
 */
export function formatProductLabel(row: ProductDisplayFields): string {
  const code = row.productCode || row.code
  const name = row.productName || row.name
  const id = row.productId || row.id
  if (code && name) return `${code} — ${name}`
  return name || code || id || '—'
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
