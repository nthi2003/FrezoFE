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
 * BE từng emit `/tasks?ticketId=...` hoặc `/task/tickets?...`.
 * Canonical FE: `/task?tab=board&ticketId=...`.
 */
function canonicalizeTicketDeepLink(path: string): string {
  let rest = ''
  if (path === '/tasks' || path.startsWith('/tasks?') || path.startsWith('/tasks#')) {
    rest = path.slice('/tasks'.length)
  } else if (path === '/task/tickets' || path.startsWith('/task/tickets?') || path.startsWith('/task/tickets#')) {
    rest = path.slice('/task/tickets'.length)
  } else {
    return path
  }

  const qIdx = rest.indexOf('?')
  const query = qIdx >= 0 ? rest.slice(qIdx + 1) : ''
  const sp = new URLSearchParams(query)
  if (!sp.has('tab')) sp.set('tab', 'board')
  const qs = sp.toString()
  return qs ? `/task?${qs}` : '/task?tab=board'
}

/** Legacy QLNS leaf routes → hub canonical URLs (preserve query except tab rewrite). */
function canonicalizeQlnsDeepLink(path: string): string {
  const qIdx = path.indexOf('?')
  const pathname = qIdx >= 0 ? path.slice(0, qIdx) : path
  const sp = new URLSearchParams(qIdx >= 0 ? path.slice(qIdx + 1) : '')

  const hubMap: Record<string, { hub: string; tab: string; drawer?: string }> = {
    '/admin/attendance': { hub: '/qlns/time', tab: 'daily' },
    '/qlns/leaves': { hub: '/qlns/time', tab: 'leaves' },
    '/qlns/payrolls': { hub: '/qlns/payroll', tab: 'payrolls' },
    '/qlns/salary-bands': { hub: '/qlns/payroll', tab: 'bands' },
    '/qtht/salary-bands': { hub: '/qlns/payroll', tab: 'bands' },
    '/qlns/payroll-periods': { hub: '/qlns/payroll', tab: 'payrolls', drawer: 'periods' },
    '/qlns/persons': { hub: '/qlns/people', tab: 'persons' },
    '/qlns/contract': { hub: '/qlns/people', tab: 'contracts' },
    '/qlns/onboarding': { hub: '/qlns/people', tab: 'onboarding' },
    '/qlns/offboarding': { hub: '/qlns/people', tab: 'offboarding' },
    '/qlns/recruitment/requisitions': { hub: '/qlns/people', tab: 'recruitment' },
    '/qlns/recruitment/board': { hub: '/qlns/people', tab: 'recruitment' },
    '/qlns/okrs': { hub: '/qlns/performance', tab: 'okrs' },
    '/qlns/performance-reviews': { hub: '/qlns/performance', tab: 'reviews' },
  }

  const mapped = hubMap[pathname.replace(/\/+$/, '') || '/']
  if (!mapped) return path

  sp.set('tab', mapped.tab)
  if (mapped.drawer) sp.set('drawer', mapped.drawer)
  const qs = sp.toString()
  return qs ? `${mapped.hub}?${qs}` : mapped.hub
}

function canonicalizeDeepLink(path: string): string {
  return canonicalizeQlnsDeepLink(canonicalizeTicketDeepLink(path))
}

/**
 * Ưu tiên actionUrl/link; fallback map type/entity → route module.
 */
export function resolveNotificationUrl(n: NotifDeepLinkInput): string | null {
  const raw = n.actionUrl || n.link
  if (raw) {
    const path = normalizePath(raw)
    if (path) return canonicalizeDeepLink(path)
  }

  const type = (n.type || '').toUpperCase()
  const entityType = (n.entityType || '').toUpperCase()
  const id = n.entityId
  if (type.startsWith('LEAVE') || entityType === 'LEAVE') {
    return id ? `/qlns/time?tab=leaves&highlight=${encodeURIComponent(id)}` : '/approval/inbox'
  }
  if (type.startsWith('APPROVAL') || entityType === 'APPROVAL') {
    return '/approval/inbox'
  }
  if (type.startsWith('PAYROLL') || entityType === 'PAYROLL') {
    return '/qlns/payroll?tab=payrolls'
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
  if (
    type.includes('GOODS_RECEIPT') ||
    type.includes('GRN') ||
    entityType === 'GRN' ||
    entityType === 'GOODS_RECEIPT_NOTE'
  ) {
    return id ? `/warehouse/grn/${id}` : '/warehouse/grn'
  }
  if (
    type.includes('GOODS_ISSUE') ||
    type.includes('GIN') ||
    entityType === 'GIN' ||
    entityType === 'GOODS_ISSUE_NOTE'
  ) {
    return id ? `/warehouse/gin/${id}` : '/warehouse/gin'
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
    return id
      ? `/task?tab=board&ticketId=${encodeURIComponent(id)}`
      : '/task?tab=board'
  }
  if (
    type.includes('RECRUIT') ||
    entityType === 'REQUISITION' ||
    entityType === 'APPLICATION'
  ) {
    return id
      ? `/qlns/people?tab=recruitment&requisitionId=${id}`
      : '/qlns/people?tab=recruitment'
  }
  if (type.includes('DEAL') || entityType === 'DEAL') {
    return '/crm/deals'
  }
  if (type.includes('INVOICE') || entityType === 'INVOICE') {
    return '/crm/invoices'
  }

  return null
}
