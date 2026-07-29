// ============================================================
// Client-side menu grouping fallback
// Khi BE trả flat list (mọi node root có feUrl, gần như không có children)
// → nhóm theo prefix path để sidebar không flat.
// ============================================================

import type { MenuTreeNode } from '../types/menu.types'

interface PathGroup {
  code: string
  name: string
  icon: string
  /** Match pathname prefix (leading slash, no trailing). */
  prefixes: string[]
  order: number
}

const PATH_GROUPS: PathGroup[] = [
  { code: 'GRP_HOME', name: 'Trang chủ', icon: 'home', prefixes: ['/'], order: 5 },
  { code: 'GRP_DASHBOARD', name: 'Tổng quan', icon: 'dashboard', prefixes: ['/dashboard'], order: 10 },
  { code: 'GRP_QLNS', name: 'Nhân sự', icon: 'QLNS', prefixes: ['/qlns'], order: 20 },
  { code: 'GRP_ACCOUNTING', name: 'Kế toán', icon: 'dollar', prefixes: ['/accounting'], order: 30 },
  { code: 'GRP_WAREHOUSE', name: 'Kho vận', icon: 'warehouse', prefixes: ['/warehouse'], order: 40 },
  { code: 'GRP_CRM', name: 'CRM', icon: 'customer', prefixes: ['/crm'], order: 50 },
  { code: 'GRP_APPROVAL', name: 'Phê duyệt', icon: 'clipboard', prefixes: ['/approval'], order: 60 },
  { code: 'GRP_TASK', name: 'Công việc', icon: 'task', prefixes: ['/task', '/tasks'], order: 70 },
  { code: 'GRP_CUSTOMER', name: 'Khách hàng', icon: 'customer', prefixes: ['/customer', '/customers'], order: 80 },
  { code: 'GRP_PRODUCT', name: 'Sản phẩm', icon: 'package', prefixes: ['/product', '/products'], order: 90 },
  { code: 'GRP_ASSETS', name: 'Tài sản', icon: 'layers', prefixes: ['/assets'], order: 100 },
  { code: 'GRP_SUPPLIER', name: 'Nhà cung cấp', icon: 'building', prefixes: ['/suppliers', '/ncc'], order: 110 },
  { code: 'GRP_FB', name: 'Marketing / FB', icon: 'FB', prefixes: ['/fb'], order: 120 },
  { code: 'GRP_EMAIL', name: 'Email', icon: 'EMAIL', prefixes: ['/email'], order: 130 },
  { code: 'GRP_QTHT', name: 'Quản trị', icon: 'QTHT', prefixes: ['/qtht'], order: 140 },
  { code: 'GRP_DOCS', name: 'Tài liệu', icon: 'filetext', prefixes: ['/docs'], order: 150 },
]

function normalizeUrl(url?: string | null): string {
  if (!url) return ''
  const t = url.trim()
  if (!t) return ''
  const withSlash = t.startsWith('/') ? t : `/${t}`
  return withSlash.replace(/\/+$/, '') || '/'
}

function matchGroup(feUrl: string): PathGroup | null {
  const path = normalizeUrl(feUrl)
  if (!path) return null

  // Exact home / dashboard leaves
  if (path === '/' || path === '/home') {
    return PATH_GROUPS.find((g) => g.code === 'GRP_HOME') || null
  }
  if (path === '/dashboard') {
    return PATH_GROUPS.find((g) => g.code === 'GRP_DASHBOARD') || null
  }

  // Longest prefix wins (skip dashboard "/")
  let best: PathGroup | null = null
  let bestLen = -1
  for (const g of PATH_GROUPS) {
    if (g.code === 'GRP_DASHBOARD') continue
    if (g.code === 'GRP_HOME') continue
    for (const p of g.prefixes) {
      if (path === p || path.startsWith(p + '/')) {
        if (p.length > bestLen) {
          best = g
          bestLen = p.length
        }
      }
    }
  }
  return best
}

/** Có ít nhất 1 root có children thật → coi như BE đã seed tree. */
export function hasRealParentStructure(roots: MenuTreeNode[]): boolean {
  const withKids = roots.filter((r) => (r.children?.length ?? 0) > 0).length
  if (withKids === 0) return false
  // ≥30% roots là folder, hoặc ≥2 folder có ≥2 children
  const folderish = roots.filter(
    (r) => (r.children?.length ?? 0) >= 1 && (!r.feUrl || r.menuType === 1),
  )
  return folderish.length >= 2 || withKids / Math.max(roots.length, 1) >= 0.25
}

function makeGroupNode(g: PathGroup, children: MenuTreeNode[]): MenuTreeNode {
  return {
    id: `client-${g.code}`,
    code: g.code,
    name: g.name,
    parentCode: null,
    orderIndex: g.order,
    menuType: 1,
    icon: g.icon,
    feUrl: null,
    children,
    isGroup: true,
  }
}

/**
 * Nếu tree đã có parent thật → giữ nguyên.
 * Nếu flat → nhóm theo prefix path; item không khớp → "Khác".
 */
export function applyMenuGroupingFallback(roots: MenuTreeNode[]): MenuTreeNode[] {
  if (!roots.length) return roots
  if (hasRealParentStructure(roots)) return roots

  // Flatten one level if somehow nested shallowly without real parents
  const leaves: MenuTreeNode[] = []
  const walk = (nodes: MenuTreeNode[]) => {
    for (const n of nodes) {
      if (n.children?.length) walk(n.children)
      else leaves.push({ ...n, children: [] })
    }
  }
  walk(roots)

  const buckets = new Map<string, { group: PathGroup; items: MenuTreeNode[] }>()
  const orphan: MenuTreeNode[] = []

  for (const leaf of leaves) {
    const url = normalizeUrl(leaf.feUrl)
    if (!url) {
      orphan.push(leaf)
      continue
    }
    const g = matchGroup(url)
    if (!g) {
      orphan.push(leaf)
      continue
    }
    // Home / Dashboard single leaves — keep as root (không bọc group 1 item)
    if (g.code === 'GRP_HOME' || g.code === 'GRP_DASHBOARD') {
      orphan.push(leaf) // will re-sort as top
      continue
    }
    const bucket = buckets.get(g.code) ?? { group: g, items: [] }
    bucket.items.push(leaf)
    buckets.set(g.code, bucket)
  }

  const grouped: MenuTreeNode[] = []

  // Home + Dashboard roots first (exact /, /home, /dashboard)
  const dashLeaves = orphan.filter((n) => {
    const u = normalizeUrl(n.feUrl)
    return u === '/' || u === '/home' || u === '/dashboard'
  })
  const otherOrphans = orphan.filter((n) => {
    const u = normalizeUrl(n.feUrl)
    return u !== '/' && u !== '/home' && u !== '/dashboard'
  })

  // Prefer Home before Dashboard when both present
  dashLeaves.sort((a, b) => {
    const ua = normalizeUrl(a.feUrl)
    const ub = normalizeUrl(b.feUrl)
    const rank = (u: string) => (u === '/' || u === '/home' ? 0 : 1)
    return rank(ua) - rank(ub) || (a.orderIndex || 0) - (b.orderIndex || 0)
  })

  for (const d of dashLeaves) grouped.push(d)

  const sortedBuckets = [...buckets.values()].sort(
    (a, b) => a.group.order - b.group.order,
  )
  for (const { group, items } of sortedBuckets) {
    items.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
    if (items.length === 1 && group.code === 'GRP_DOCS') {
      grouped.push(items[0])
    } else {
      grouped.push(makeGroupNode(group, items))
    }
  }

  if (otherOrphans.length > 0) {
    otherOrphans.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
    grouped.push(
      makeGroupNode(
        {
          code: 'GRP_OTHER',
          name: 'Khác',
          icon: 'folder',
          prefixes: [],
          order: 999,
        },
        otherOrphans,
      ),
    )
  }

  return grouped
}
