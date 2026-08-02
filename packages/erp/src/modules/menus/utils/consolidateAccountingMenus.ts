// FE-only: gom menu Kế toán tách rời → 3 hub (BE seed giữ nguyên)

import type { MenuTreeNode } from '../types/menu.types'
import {
  ACCOUNTING_ALL_LEGACY_URLS,
  ACCOUNTING_OPS_HUB_PATH,
  ACCOUNTING_REPORTS_HUB_PATH,
  ACCOUNTING_SETUP_HUB_PATH,
  ACCOUNTING_OPS_MENU_URLS,
  ACCOUNTING_REPORTS_MENU_URLS,
  ACCOUNTING_SETUP_MENU_URLS,
} from '@/modules/accounting/utils/accountingRoutes'

function normalizeUrl(url?: string | null): string {
  if (!url) return ''
  const t = url.trim()
  if (!t) return ''
  const withSlash = t.startsWith('/') ? t : `/${t}`
  return withSlash.replace(/\/+$/, '') || '/'
}

function flattenLeaves(nodes: MenuTreeNode[]): MenuTreeNode[] {
  const out: MenuTreeNode[] = []
  const walk = (list: MenuTreeNode[]) => {
    for (const n of list) {
      if (n.children?.length) walk(n.children)
      else if (n.feUrl) out.push(n)
    }
  }
  walk(nodes)
  return out
}

function isAccountingGroup(node: MenuTreeNode): boolean {
  if (node.code === 'GRP_ACCOUNTING' || node.code === 'MENU_ACCOUNTING') return true
  const leaves = flattenLeaves(node.children ?? [])
  return leaves.some((l) => {
    const u = normalizeUrl(l.feUrl)
    return ACCOUNTING_ALL_LEGACY_URLS.includes(u as (typeof ACCOUNTING_ALL_LEGACY_URLS)[number])
      || u.startsWith('/accounting')
  })
}

function pickSeed(leaves: MenuTreeNode[], urls: readonly string[]): MenuTreeNode | undefined {
  for (const u of urls) {
    const found = leaves.find((l) => normalizeUrl(l.feUrl) === u)
    if (found) return found
  }
  return leaves.find((l) => urls.includes(normalizeUrl(l.feUrl) as (typeof urls)[number]))
}

function consolidateAccountingGroup(group: MenuTreeNode): MenuTreeNode {
  const leaves = flattenLeaves(group.children ?? [])
  const hasLegacy = leaves.some((l) =>
    ACCOUNTING_ALL_LEGACY_URLS.includes(normalizeUrl(l.feUrl) as (typeof ACCOUNTING_ALL_LEGACY_URLS)[number]),
  )
  if (!hasLegacy) return group

  const newChildren: MenuTreeNode[] = []

  const opsSeed = pickSeed(leaves, ACCOUNTING_OPS_MENU_URLS)
  if (opsSeed || leaves.some((l) => ACCOUNTING_OPS_MENU_URLS.includes(normalizeUrl(l.feUrl) as (typeof ACCOUNTING_OPS_MENU_URLS)[number]))) {
    newChildren.push({
      ...(opsSeed ?? leaves[0]),
      name: 'Sổ & chứng từ',
      feUrl: ACCOUNTING_OPS_HUB_PATH,
      children: [],
      isGroup: false,
    })
  }

  const reportsSeed = pickSeed(leaves, ACCOUNTING_REPORTS_MENU_URLS)
  if (
    reportsSeed
    || leaves.some((l) =>
      ACCOUNTING_REPORTS_MENU_URLS.includes(normalizeUrl(l.feUrl) as (typeof ACCOUNTING_REPORTS_MENU_URLS)[number]),
    )
  ) {
    newChildren.push({
      ...(reportsSeed ?? leaves[0]),
      name: 'Báo cáo kế toán',
      feUrl: ACCOUNTING_REPORTS_HUB_PATH,
      children: [],
      isGroup: false,
    })
  }

  const setupSeed = pickSeed(leaves, ACCOUNTING_SETUP_MENU_URLS)
  if (
    setupSeed
    || leaves.some((l) =>
      ACCOUNTING_SETUP_MENU_URLS.includes(normalizeUrl(l.feUrl) as (typeof ACCOUNTING_SETUP_MENU_URLS)[number]),
    )
  ) {
    newChildren.push({
      ...(setupSeed ?? leaves[0]),
      name: 'Thiết lập kế toán',
      feUrl: ACCOUNTING_SETUP_HUB_PATH,
      children: [],
      isGroup: false,
    })
  }

  if (newChildren.length === 0) return group
  return { ...group, children: newChildren }
}

/** Sau applyMenuGroupingFallback: gom leaf accounting → 3 mục sidebar. */
export function consolidateAccountingMenus(roots: MenuTreeNode[]): MenuTreeNode[] {
  return roots.map((node) => {
    if (isAccountingGroup(node)) return consolidateAccountingGroup(node)
    if (node.children?.length) {
      return { ...node, children: consolidateAccountingMenus(node.children) }
    }
    return node
  })
}
