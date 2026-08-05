import type { GinItemDto } from '../services/ginApi'
import type { GrnItemDto } from '../services/grnApi'
import { grnGinStatusLabel, issueTypeLabel } from '../constants/warehouseStatus'
import { formatVnd } from '@frezo/utils'

/** @deprecated Use DOC_STATUS_CONFIG via WarehouseStatusBadge */
export const GRN_GIN_STATUS_META: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: 'Nháp', tone: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  APPROVED: { label: 'Đã duyệt', tone: 'bg-blue-50 text-blue-800 border-blue-200' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  CANCELLED: { label: 'Đã huỷ', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
}

export { grnGinStatusLabel, issueTypeLabel, formatVnd }

export function computeGrnLineStats(
  items: GrnItemDto[] = [],
  qtyDrafts?: Record<string, string>,
) {
  let totalQty = 0
  let totalExpected = 0
  let totalValue = 0
  let varianceLines = 0
  let netVariance = 0
  for (const ln of items) {
    const expected = ln.qtyExpected ?? 0
    const received =
      qtyDrafts && ln.id && qtyDrafts[ln.id] !== undefined
        ? Number(qtyDrafts[ln.id]) || 0
        : ln.qtyReceived && ln.qtyReceived > 0
          ? ln.qtyReceived
          : expected
    totalExpected += expected
    totalQty += received
    const diff = received - expected
    if (diff !== 0) {
      varianceLines += 1
      netVariance += diff
    }
    if (ln.unitCost != null) totalValue += received * ln.unitCost
  }
  return {
    lineCount: items.length,
    totalQty,
    totalExpected,
    totalValue,
    varianceLines,
    netVariance,
  }
}

/** Preview mã lô khi confirm — khớp BE StockBatchService.generateBatchCode pattern. */
export function previewBatchCode(productCode: string, supplierId?: string) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const sup = (supplierId || 'NCC').slice(0, 6).toUpperCase()
  return `${(productCode || 'SP').slice(0, 8)}-${sup}-${date}`
}

export function formatGrnDate(row: { createdDate?: string; receivedAt?: string }) {
  const raw = row.receivedAt || row.createdDate
  if (!raw) return '—'
  return String(raw).slice(0, 10)
}

export function formatGinDate(row: {
  createdDate?: string
  issuedAt?: string
  documentDate?: string
}) {
  const raw = row.issuedAt || row.documentDate || row.createdDate
  if (!raw) return '—'
  return String(raw).slice(0, 10)
}

export function computeGinLineStats(items: GinItemDto[] = []) {
  let totalQty = 0
  let totalValue = 0
  for (const ln of items) {
    const qty = ln.qtyIssued && ln.qtyIssued > 0 ? ln.qtyIssued : ln.qtyRequested ?? 0
    totalQty += qty
    if (ln.unitCost != null) totalValue += qty * ln.unitCost
  }
  return { lineCount: items.length, totalQty, totalValue }
}

export function parseProductLines(raw: string) {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => {
      const [productId, qtyStr, costStr] = line.split(/[,;\t]/).map((x) => x.trim())
      return {
        productId,
        qty: Number(qtyStr || 1),
        unitCost: costStr ? Number(costStr) : undefined,
      }
    })
    .filter((x) => x.productId)
}
