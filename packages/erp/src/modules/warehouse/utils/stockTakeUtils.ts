import type { StockTakeDto, StockTakeLineDto } from '../services/stockTakeApi'

export const STOCK_TAKE_STATUS_META: Record<
  string,
  { label: string; tone: string }
> = {
  DRAFT: {
    label: 'Nháp',
    tone: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  },
  IN_PROGRESS: {
    label: 'Đang đếm',
    tone: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  SUBMITTED: {
    label: 'Đã gửi',
    tone: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  POSTED: {
    label: 'Hoàn tất',
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  CANCELLED: {
    label: 'Đã huỷ',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
  },
}

export function stockTakeStatusLabel(status?: string) {
  const key = (status || '').toUpperCase()
  return STOCK_TAKE_STATUS_META[key]?.label ?? status ?? '—'
}

export interface StockTakeLineStats {
  totalLines: number
  matched: number
  surplus: number
  shortage: number
  pending: number
  netVariance: number
}

export function computeLineStats(lines: StockTakeLineDto[] = []): StockTakeLineStats {
  let matched = 0
  let surplus = 0
  let shortage = 0
  let pending = 0
  let netVariance = 0

  for (const ln of lines) {
    const v = ln.varianceQty
    if (v == null) {
      pending += 1
      continue
    }
    netVariance += Number(v)
    if (v === 0) matched += 1
    else if (Number(v) > 0) surplus += 1
    else shortage += 1
  }

  return {
    totalLines: lines.length,
    matched,
    surplus,
    shortage,
    pending,
    netVariance,
  }
}

export function formatVariance(v: number | null | undefined) {
  if (v == null) return '—'
  if (v === 0) return '0'
  return v > 0 ? `+${v}` : String(v)
}

export function varianceClass(v: number | null | undefined) {
  if (v == null) return 'text-neutral-400'
  if (v === 0) return 'text-emerald-600'
  return Number(v) > 0 ? 'text-blue-600' : 'text-rose-600'
}

export function resolveProductTokens(
  raw: string,
  products: Array<{ id: string; code?: string; name?: string }>,
): { resolved: string[]; unknown: string[] } {
  const tokens = raw
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean)

  const byCode = new Map<string, string>()
  const byId = new Set<string>()
  for (const p of products) {
    if (p.code) byCode.set(p.code.toUpperCase(), p.id)
    byId.add(p.id)
  }

  const resolved: string[] = []
  const unknown: string[] = []

  for (const token of tokens) {
    const upper = token.toUpperCase()
    if (byId.has(token)) {
      resolved.push(token)
    } else if (byCode.has(upper)) {
      resolved.push(byCode.get(upper)!)
    } else {
      unknown.push(token)
    }
  }

  return { resolved: [...new Set(resolved)], unknown }
}

export function countLinesWithVariance(st: StockTakeDto) {
  return (st.lines || []).filter(
    (ln) => ln.varianceQty != null && ln.varianceQty !== 0,
  ).length
}
