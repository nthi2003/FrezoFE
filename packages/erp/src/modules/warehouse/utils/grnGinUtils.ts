import type { GinItemDto } from '../services/ginApi'
import type { GrnItemDto } from '../services/grnApi'
import { grnGinStatusLabel, issueTypeLabel } from '../constants/warehouseStatus'

/** @deprecated Use DOC_STATUS_CONFIG via WarehouseStatusBadge */
export const GRN_GIN_STATUS_META: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: 'Nháp', tone: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  APPROVED: { label: 'Đã duyệt', tone: 'bg-blue-50 text-blue-800 border-blue-200' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  CANCELLED: { label: 'Đã huỷ', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
}

export { grnGinStatusLabel, issueTypeLabel }

export function formatVnd(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
}

export function computeGrnLineStats(items: GrnItemDto[] = []) {
  let totalQty = 0
  let totalValue = 0
  for (const ln of items) {
    const qty = ln.qtyReceived && ln.qtyReceived > 0 ? ln.qtyReceived : ln.qtyExpected ?? 0
    totalQty += qty
    if (ln.unitCost != null) totalValue += qty * ln.unitCost
  }
  return { lineCount: items.length, totalQty, totalValue }
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
