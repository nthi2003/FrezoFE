// FE-only: gom menu Nhân sự tách rời → 4 hub (BE seed giữ nguyên)

import type { MenuTreeNode } from '../types/menu.types'
import {
  QLNS_ALL_LEGACY_URLS,
  QLNS_TIME_HUB_PATH,
  QLNS_PAYROLL_HUB_PATH,
  QLNS_PEOPLE_HUB_PATH,
  QLNS_PERFORMANCE_HUB_PATH,
  QLNS_TIME_MENU_URLS,
  QLNS_PAYROLL_MENU_URLS,
  QLNS_PEOPLE_MENU_URLS,
  QLNS_PERFORMANCE_MENU_URLS,
} from '@/modules/qlns/utils/qlnsRoutes'

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

function isQlnsGroup(node: MenuTreeNode): boolean {
  if (node.code === 'GRP_QLNS' || node.code === 'MENU_HRM') return true
  const leaves = flattenLeaves(node.children ?? [])
  return leaves.some((l) => {
    const u = normalizeUrl(l.feUrl)
    return QLNS_ALL_LEGACY_URLS.includes(u as (typeof QLNS_ALL_LEGACY_URLS)[number])
      || u.startsWith('/qlns')
      || u === '/admin/attendance'
  })
}

function pickSeed(leaves: MenuTreeNode[], urls: readonly string[]): MenuTreeNode | undefined {
  for (const u of urls) {
    const found = leaves.find((l) => normalizeUrl(l.feUrl) === u)
    if (found) return found
  }
  return leaves.find((l) => urls.includes(normalizeUrl(l.feUrl) as (typeof urls)[number]))
}

function hasAnyUrl(leaves: MenuTreeNode[], urls: readonly string[]): boolean {
  return leaves.some((l) => urls.includes(normalizeUrl(l.feUrl) as (typeof urls)[number]))
}

function consolidateQlnsGroup(group: MenuTreeNode): MenuTreeNode {
  const leaves = flattenLeaves(group.children ?? [])
  const hasLegacy = leaves.some((l) =>
    QLNS_ALL_LEGACY_URLS.includes(normalizeUrl(l.feUrl) as (typeof QLNS_ALL_LEGACY_URLS)[number])
      || normalizeUrl(l.feUrl) === '/admin/attendance',
  )
  if (!hasLegacy) return group

  const newChildren: MenuTreeNode[] = []

  const peopleSeed = pickSeed(leaves, QLNS_PEOPLE_MENU_URLS)
  if (peopleSeed || hasAnyUrl(leaves, QLNS_PEOPLE_MENU_URLS)) {
    newChildren.push({
      ...(peopleSeed ?? leaves[0]),
      name: 'Hồ sơ & tổ chức',
      feUrl: QLNS_PEOPLE_HUB_PATH,
      children: [],
      isGroup: false,
    })
  }

  const timeSeed = pickSeed(leaves, QLNS_TIME_MENU_URLS)
  if (timeSeed || hasAnyUrl(leaves, QLNS_TIME_MENU_URLS)) {
    newChildren.push({
      ...(timeSeed ?? leaves[0]),
      name: 'Chấm công & nghỉ phép',
      feUrl: QLNS_TIME_HUB_PATH,
      children: [],
      isGroup: false,
    })
  }

  const payrollSeed = pickSeed(leaves, QLNS_PAYROLL_MENU_URLS)
  if (payrollSeed || hasAnyUrl(leaves, QLNS_PAYROLL_MENU_URLS)) {
    newChildren.push({
      ...(payrollSeed ?? leaves[0]),
      name: 'Lương & đãi ngộ',
      feUrl: QLNS_PAYROLL_HUB_PATH,
      children: [],
      isGroup: false,
    })
  }

  const perfSeed = pickSeed(leaves, QLNS_PERFORMANCE_MENU_URLS)
  if (perfSeed || hasAnyUrl(leaves, QLNS_PERFORMANCE_MENU_URLS)) {
    newChildren.push({
      ...(perfSeed ?? leaves[0]),
      name: 'Hiệu suất',
      feUrl: QLNS_PERFORMANCE_HUB_PATH,
      children: [],
      isGroup: false,
    })
  }

  if (newChildren.length === 0) return group
  return { ...group, children: newChildren }
}

/** Sau applyMenuGroupingFallback: gom leaf QLNS → 4 hub sidebar. */
export function consolidateQlnsMenus(roots: MenuTreeNode[]): MenuTreeNode[] {
  return roots.map((node) => {
    if (isQlnsGroup(node)) return consolidateQlnsGroup(node)
    if (node.children?.length) {
      return { ...node, children: consolidateQlnsMenus(node.children) }
    }
    return node
  })
}
