// FE-only: gom menu Công việc tách rời → hub + danh mục ticket (BE seed giữ nguyên)

import type { MenuTreeNode } from '../types/menu.types'
import { TASK_CATEGORY_PATH, TASK_HUB_MENU_URLS, TASK_HUB_PATH } from '@/modules/tasks/utils/taskRoutes'

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

function isTaskGroup(node: MenuTreeNode): boolean {
  if (node.code === 'GRP_TASK') return true
  const leaves = flattenLeaves(node.children ?? [])
  return leaves.some((l) => {
    const u = normalizeUrl(l.feUrl)
    return u === TASK_HUB_PATH || u.startsWith(`${TASK_HUB_PATH}/`) || u.startsWith('/tasks')
  })
}

function consolidateTaskGroup(group: MenuTreeNode): MenuTreeNode {
  const leaves = flattenLeaves(group.children ?? [])
  if (leaves.length <= 2) {
    const onlyHub = leaves.every((l) => {
      const u = normalizeUrl(l.feUrl)
      return u === TASK_HUB_PATH || u === TASK_CATEGORY_PATH
    })
    if (onlyHub && leaves.length <= 2) return group
  }

  const hasHubMenu = leaves.some((l) =>
    TASK_HUB_MENU_URLS.includes(normalizeUrl(l.feUrl) as (typeof TASK_HUB_MENU_URLS)[number]),
  )
  const categoriesLeaf = leaves.find((l) => normalizeUrl(l.feUrl) === TASK_CATEGORY_PATH)

  const newChildren: MenuTreeNode[] = []

  if (hasHubMenu) {
    const seed =
      leaves.find((l) => normalizeUrl(l.feUrl) === TASK_HUB_PATH) ||
      leaves.find((l) => normalizeUrl(l.feUrl) === '/task/tickets') ||
      leaves.find((l) => TASK_HUB_MENU_URLS.includes(normalizeUrl(l.feUrl) as (typeof TASK_HUB_MENU_URLS)[number])) ||
      leaves[0]

    newChildren.push({
      ...seed,
      name: 'Công việc',
      feUrl: TASK_HUB_PATH,
      children: [],
      isGroup: false,
    })
  }

  if (categoriesLeaf) {
    newChildren.push({
      ...categoriesLeaf,
      name: 'Danh mục ticket',
      feUrl: TASK_CATEGORY_PATH,
      children: [],
      isGroup: false,
    })
  }

  if (newChildren.length === 0) return group
  return { ...group, children: newChildren }
}

/**
 * Sau applyMenuGroupingFallback: gom leaf task/ticket/tag → hub Công việc.
 * Danh mục ticket: tab trong hub (?tab=categories) hoặc sidebar (redirect /task/categories).
 */
export function consolidateTaskMenus(roots: MenuTreeNode[]): MenuTreeNode[] {
  return roots.map((node) => {
    if (isTaskGroup(node)) return consolidateTaskGroup(node)
    if (node.children?.length) {
      return { ...node, children: consolidateTaskMenus(node.children) }
    }
    return node
  })
}
