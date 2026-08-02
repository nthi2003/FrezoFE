// FE-only: gom 「Cấu hình luồng duyệt」 + 「Quy Trình Duyệt」 → 1 hub (BE seed giữ nguyên)

import type { MenuTreeNode } from '../types/menu.types'
import {
  APPROVAL_CONFIG_HUB_PATH,
  APPROVAL_CONFIG_LEGACY_URLS,
} from '@/modules/approval/utils/approvalRoutes'

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

function isApprovalConfigUrl(url: string): boolean {
  return APPROVAL_CONFIG_LEGACY_URLS.includes(
    url as (typeof APPROVAL_CONFIG_LEGACY_URLS)[number],
  )
}

function consolidateGroup(group: MenuTreeNode): MenuTreeNode {
  const children = group.children ?? []
  const configLeaves = children.filter((c) => {
    if (c.children?.length) return false
    return isApprovalConfigUrl(normalizeUrl(c.feUrl))
  })
  if (configLeaves.length < 2) {
    // Một leaf trỏ workflows → vẫn đổi sang hub để không còn peer URL cũ
    const only = configLeaves[0]
    if (only && normalizeUrl(only.feUrl) === '/qtht/workflows') {
      return {
        ...group,
        children: children.map((c) =>
          c === only
            ? {
                ...only,
                name: 'Cấu hình luồng duyệt',
                feUrl: APPROVAL_CONFIG_HUB_PATH,
                children: [],
                isGroup: false,
              }
            : c,
        ),
      }
    }
    return group
  }

  const seed =
    configLeaves.find((l) => normalizeUrl(l.feUrl) === APPROVAL_CONFIG_HUB_PATH) ||
    configLeaves.find((l) => l.code === 'APPR_FLOWS') ||
    configLeaves[0]

  const hubNode: MenuTreeNode = {
    ...seed,
    name: 'Cấu hình luồng duyệt',
    feUrl: APPROVAL_CONFIG_HUB_PATH,
    children: [],
    isGroup: false,
  }

  const newChildren: MenuTreeNode[] = []
  let hubInserted = false
  for (const c of children) {
    if (configLeaves.includes(c)) {
      if (!hubInserted) {
        newChildren.push(hubNode)
        hubInserted = true
      }
      continue
    }
    newChildren.push(c)
  }

  return { ...group, children: newChildren }
}

/** Sau applyMenuGroupingFallback: gom 2 leaf config duyệt → 1 hub sidebar. */
export function consolidateApprovalMenus(roots: MenuTreeNode[]): MenuTreeNode[] {
  return roots.map((node) => {
    if (node.children?.length) {
      const withNested = { ...node, children: consolidateApprovalMenus(node.children) }
      return consolidateGroup(withNested)
    }
    return node
  })
}
