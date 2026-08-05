// FE-only: gom menu CRM tách rời → 3 hub sidebar (BE seed giữ nguyên)

import type { MenuTreeNode } from '../types/menu.types'
import {
  CRM_ALL_LEGACY_URLS,
  CRM_CUSTOMER_PATH,
  CRM_PIPELINE_HUB_PATH,
  CRM_PIPELINE_MENU_URLS,
  CRM_SALES_HUB_PATH,
  CRM_SALES_MENU_URLS,
} from '@/modules/crm/utils/crmRoutes'

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

function isCrmLegacyLeaf(url: string): boolean {
  return CRM_ALL_LEGACY_URLS.includes(url as (typeof CRM_ALL_LEGACY_URLS)[number])
}

function isCrmGroup(node: MenuTreeNode): boolean {
  if (node.code === 'GRP_CRM' || node.code === 'MENU_CRM') return true
  const leaves = flattenLeaves(node.children ?? [])
  return leaves.some((l) => {
    const u = normalizeUrl(l.feUrl)
    return isCrmLegacyLeaf(u) || u.startsWith('/crm')
  })
}

function pickSeed(leaves: MenuTreeNode[], urls: readonly string[]): MenuTreeNode | undefined {
  for (const u of urls) {
    const found = leaves.find((l) => normalizeUrl(l.feUrl) === u)
    if (found) return found
  }
  return leaves.find((l) => urls.includes(normalizeUrl(l.feUrl) as (typeof urls)[number]))
}

function consolidateCrmGroup(group: MenuTreeNode): MenuTreeNode {
  const leaves = flattenLeaves(group.children ?? [])
  const crmLeaves = leaves.filter((l) => {
    const u = normalizeUrl(l.feUrl)
    return u.startsWith('/crm') || isCrmLegacyLeaf(u)
  })
  const hasLegacy = crmLeaves.some((l) => isCrmLegacyLeaf(normalizeUrl(l.feUrl)))
  if (!hasLegacy && crmLeaves.length === 0) return group

  const newChildren: MenuTreeNode[] = []

  const customerLeaf = leaves.find((l) => normalizeUrl(l.feUrl) === CRM_CUSTOMER_PATH)
  if (customerLeaf) {
    newChildren.push({ ...customerLeaf, children: [], isGroup: false })
  }

  const pipelineSeed = pickSeed(crmLeaves, CRM_PIPELINE_MENU_URLS)
  if (
    pipelineSeed
    || crmLeaves.some((l) =>
      CRM_PIPELINE_MENU_URLS.includes(normalizeUrl(l.feUrl) as (typeof CRM_PIPELINE_MENU_URLS)[number]),
    )
  ) {
    newChildren.push({
      ...(pipelineSeed ?? crmLeaves[0] ?? leaves[0]),
      name: 'Phễu bán hàng',
      feUrl: CRM_PIPELINE_HUB_PATH,
      children: [],
      isGroup: false,
    })
  }

  const salesSeed = pickSeed(crmLeaves, CRM_SALES_MENU_URLS)
  if (
    salesSeed
    || crmLeaves.some((l) =>
      CRM_SALES_MENU_URLS.includes(normalizeUrl(l.feUrl) as (typeof CRM_SALES_MENU_URLS)[number]),
    )
  ) {
    newChildren.push({
      ...(salesSeed ?? crmLeaves[0] ?? leaves[0]),
      name: 'Đơn bán & thu',
      feUrl: CRM_SALES_HUB_PATH,
      children: [],
      isGroup: false,
    })
  }

  if (newChildren.length === 0) return group
  return { ...group, children: newChildren }
}

/** Sau applyMenuGroupingFallback: gom leaf CRM → 3 mục sidebar (KH + 2 hub). */
export function consolidateCrmMenus(roots: MenuTreeNode[]): MenuTreeNode[] {
  return roots.map((node) => {
    if (isCrmGroup(node)) return consolidateCrmGroup(node)
    if (node.children?.length) {
      return { ...node, children: consolidateCrmMenus(node.children) }
    }
    return node
  })
}
