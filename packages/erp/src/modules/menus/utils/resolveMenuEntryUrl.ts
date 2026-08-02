// Resolve first navigable URL for a top-level menu (root → first leaf).

import type { MenuTreeNode } from '../types/menu.types'

const SKIP_PATHS = new Set(['/', '/home'])

function normalizeFeUrl(feUrl: string): string {
  const path = feUrl.startsWith('/') ? feUrl : `/${feUrl}`
  return path.replace(/\/+$/, '') || '/'
}

function firstLeafUrl(nodes: MenuTreeNode[]): string | null {
  for (const n of nodes) {
    if (n.children?.length) {
      const found = firstLeafUrl(n.children)
      if (found) return found
    } else if (n.feUrl) {
      const url = normalizeFeUrl(n.feUrl)
      if (!SKIP_PATHS.has(url)) return url
    }
  }
  return null
}

/** Entry URL for lobby / sidebar root click — own feUrl or first descendant leaf. */
export function resolveMenuEntryUrl(node: MenuTreeNode): string | null {
  if (node.children?.length) {
    const fromChildren = firstLeafUrl(node.children)
    if (fromChildren) return fromChildren
  }
  if (node.feUrl) {
    const url = normalizeFeUrl(node.feUrl)
    return SKIP_PATHS.has(url) ? null : url
  }
  return null
}
