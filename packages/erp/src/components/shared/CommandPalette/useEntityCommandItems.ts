// ============================================================
// FREZO ERP — Entity search từ TanStack Query cache
// Quét cache các module (Customers/Deals/Leads/Invoices/Persons/Payrolls)
// để CommandPalette tìm nhanh entity đã được page trước đó fetch.
// Không gọi HTTP mới — 100% offline, giữ palette luôn instant.
// ============================================================

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Users, Sparkles, Receipt, UserRound, Wallet, Handshake,
  type LucideIcon,
} from 'lucide-react'

export type EntitySection = 'customer' | 'lead' | 'deal' | 'invoice' | 'person' | 'payroll'

export interface EntityCommandItem {
  id: string
  section: EntitySection
  label: string
  hint?: string
  icon: LucideIcon
  keywords: string[]
  action: () => void
}

interface EntityDef {
  kind: EntitySection
  /** Prefix queryKey — TanStack Query so khớp prefix. */
  queryKeyPrefix: unknown[]
  icon: LucideIcon
  /** Trích label chính (tên hiển thị). */
  extractLabel: (row: Record<string, unknown>) => string
  /** Trích gợi ý phụ (SĐT/email/mã…). */
  extractHint: (row: Record<string, unknown>) => string
  /** Từ khoá tìm kiếm bổ sung ngoài label/hint. */
  extractKeywords?: (row: Record<string, unknown>) => string[]
  /** Đường dẫn khi click. */
  buildNavPath: (row: Record<string, unknown>) => string
}

const ENTITY_DEFS: EntityDef[] = [
  {
    kind: 'customer',
    queryKeyPrefix: ['customers'],
    icon: Users,
    extractLabel: (r) => str(r.name) || 'Khách hàng',
    extractHint: (r) => str(r.phone) || str(r.email) || str(r.taxCode) || '',
    extractKeywords: (r) => [str(r.taxCode), str(r.address)].filter(Boolean),
    buildNavPath: (r) => (str(r.id) ? `/customer/${r.id}/360` : '/customer'),
  },
  {
    kind: 'lead',
    queryKeyPrefix: ['crm', 'leads'],
    icon: Sparkles,
    extractLabel: (r) => str(r.fullName) || 'Lead',
    extractHint: (r) => str(r.companyName) || str(r.phone) || str(r.email) || '',
    extractKeywords: (r) => [str(r.source), str(r.status)].filter(Boolean),
    buildNavPath: () => '/crm/leads',
  },
  {
    kind: 'deal',
    queryKeyPrefix: ['crm', 'deals'],
    icon: Handshake,
    extractLabel: (r) => str(r.name) || str(r.title) || 'Cơ hội',
    extractHint: (r) => {
      const amt = Number(r.amount ?? r.value ?? 0)
      if (amt) return `${amt.toLocaleString('vi-VN')} ₫`
      return str(r.stageName) || str(r.status) || ''
    },
    extractKeywords: (r) => [str(r.customerName), str(r.status)].filter(Boolean),
    buildNavPath: () => '/crm/deals',
  },
  {
    kind: 'invoice',
    queryKeyPrefix: ['crm', 'invoices'],
    icon: Receipt,
    extractLabel: (r) => str(r.code) || str(r.invoiceNo) || 'Hoá đơn',
    extractHint: (r) => {
      const total = Number(r.totalAmount ?? r.total ?? r.amount ?? 0)
      const status = str(r.status)
      const parts = [total ? `${total.toLocaleString('vi-VN')} ₫` : '', status]
      return parts.filter(Boolean).join(' · ')
    },
    extractKeywords: (r) => [str(r.customerName)].filter(Boolean),
    buildNavPath: () => '/crm/invoices',
  },
  {
    kind: 'person',
    queryKeyPrefix: ['persons'],
    icon: UserRound,
    extractLabel: (r) => str(r.fullName) || str(r.name) || 'Nhân viên',
    extractHint: (r) => str(r.departmentName) || str(r.email) || str(r.phone) || '',
    extractKeywords: (r) => [str(r.employeeCode), str(r.position)].filter(Boolean),
    buildNavPath: () => '/qlns/persons',
  },
  {
    kind: 'payroll',
    queryKeyPrefix: ['payrolls'],
    icon: Wallet,
    extractLabel: (r) => {
      const person = str(r.personName) || str(r.fullName) || 'Bảng lương'
      const period = str(r.period) || str(r.month) || ''
      return period ? `${person} · ${period}` : person
    },
    extractHint: (r) => {
      const net = Number(r.netSalary ?? r.total ?? 0)
      return net ? `${net.toLocaleString('vi-VN')} ₫` : str(r.status) || ''
    },
    buildNavPath: () => '/qlns/payrolls',
  },
]

const MAX_PER_SECTION = 6
const MAX_TOTAL = 30

/**
 * Trả về danh sách item khớp query từ TanStack cache.
 * Nếu query < 2 ký tự → empty (tránh spam list khi user chưa nhập gì).
 */
export function useEntityCommandItems(query: string, onDone: () => void): EntityCommandItem[] {
  const qc = useQueryClient()
  const navigate = useNavigate()

  return useMemo(() => {
    const q = deburr(query.trim().toLowerCase())
    if (q.length < 2) return []

    const items: EntityCommandItem[] = []

    for (const def of ENTITY_DEFS) {
      const perSection: EntityCommandItem[] = []
      const cached = qc.getQueriesData({ queryKey: def.queryKeyPrefix })
      for (const [, data] of cached) {
        const rows = normalizeList(data)
        for (const row of rows) {
          if (!row || typeof row !== 'object') continue
          const r = row as Record<string, unknown>
          const label = def.extractLabel(r)
          const hint = def.extractHint(r)
          const extra = def.extractKeywords?.(r) ?? []
          const hay = deburr([label, hint, ...extra].join(' ').toLowerCase())
          if (!hay.includes(q)) continue

          const idPart = str(r.id) || label
          if (perSection.find((x) => x.id === `${def.kind}:${idPart}`)) continue

          perSection.push({
            id: `${def.kind}:${idPart}`,
            section: def.kind,
            label,
            hint,
            icon: def.icon,
            keywords: [label, hint, ...extra],
            action: () => {
              navigate(def.buildNavPath(r))
              onDone()
            },
          })
          if (perSection.length >= MAX_PER_SECTION) break
        }
        if (perSection.length >= MAX_PER_SECTION) break
      }
      items.push(...perSection)
      if (items.length >= MAX_TOTAL) break
    }

    return items.slice(0, MAX_TOTAL)
  }, [qc, query, navigate, onDone])
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}

/** Rút danh sách row từ nhiều dạng response được cache. */
function normalizeList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (Array.isArray(d.items)) return d.items
    if (Array.isArray(d.data)) return d.data
    if (d.data && typeof d.data === 'object') {
      const dd = d.data as Record<string, unknown>
      if (Array.isArray(dd.items)) return dd.items
      if (Array.isArray(dd.content)) return dd.content
    }
    if (Array.isArray(d.content)) return d.content
  }
  return []
}

function deburr(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

// ------------------------------------------------------------
// Section metadata (dùng cho CommandPalette render nhóm)
// ------------------------------------------------------------

export const ENTITY_SECTION_TITLE: Record<EntitySection, string> = {
  customer: 'Khách hàng',
  lead: 'Lead',
  deal: 'Cơ hội bán',
  invoice: 'Hoá đơn',
  person: 'Nhân sự',
  payroll: 'Bảng lương',
}
