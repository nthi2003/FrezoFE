// ============================================================
// Resolve notification deep-link → routes Sprint 1–2
// ============================================================

export interface NotifDeepLinkInput {
  actionUrl?: string | null
  link?: string | null
  type?: string | null
  entityType?: string | null
  entityId?: string | null
}

/** Chuẩn hoá path nội bộ (bỏ origin, đảm bảo leading /). */
function normalizePath(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const u = new URL(trimmed)
      return u.pathname + u.search + u.hash
    }
  } catch {
    /* ignore */
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

/**
 * Ưu tiên actionUrl/link; fallback map type/entity → route module.
 */
export function resolveNotificationUrl(n: NotifDeepLinkInput): string | null {
  const raw = n.actionUrl || n.link
  if (raw) {
    const path = normalizePath(raw)
    if (path) return path
  }

  const type = (n.type || '').toUpperCase()
  const entityType = (n.entityType || '').toUpperCase()
  const id = n.entityId

  if (type.startsWith('LEAVE') || entityType === 'LEAVE') {
    return id ? `/qlns/leaves` : '/approval/inbox'
  }
  if (type.startsWith('APPROVAL') || entityType === 'APPROVAL') {
    return '/approval/inbox'
  }
  if (type.startsWith('PAYROLL') || entityType === 'PAYROLL') {
    return '/qlns/payrolls'
  }
  if (
    type.includes('PURCHASE_REQUEST') ||
    entityType === 'PURCHASE_REQUEST' ||
    entityType === 'PR'
  ) {
    return id
      ? `/warehouse/purchase-requests/${id}`
      : '/warehouse/purchase-requests'
  }
  if (
    type.includes('PURCHASE_ORDER') ||
    entityType === 'PURCHASE_ORDER' ||
    entityType === 'PO'
  ) {
    return id
      ? `/warehouse/purchase-orders/${id}`
      : '/warehouse/purchase-orders'
  }
  if (type.includes('STOCK') || entityType === 'STOCK_ALERT') {
    return '/warehouse/stock-alerts'
  }
  if (type.includes('BANK') || entityType === 'BANK_STATEMENT') {
    return id
      ? `/accounting/bank-reconciliation?statementId=${id}`
      : '/accounting/bank-reconciliation'
  }
  if (type.startsWith('TICKET') || entityType === 'TICKET') {
    return '/task/tickets'
  }
  if (
    type.includes('RECRUIT') ||
    entityType === 'REQUISITION' ||
    entityType === 'APPLICATION'
  ) {
    return id
      ? `/qlns/recruitment/board?requisitionId=${id}`
      : '/qlns/recruitment/requisitions'
  }
  if (type.includes('DEAL') || entityType === 'DEAL') {
    return '/crm/deals'
  }
  if (type.includes('INVOICE') || entityType === 'INVOICE') {
    return '/crm/invoices'
  }

  return null
}
