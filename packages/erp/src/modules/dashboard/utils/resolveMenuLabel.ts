import type { MenuTreeNode } from '@/modules/menus/types/menu.types'

function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/'
}

export interface MenuPathMatch {
  path: string
  label: string
  icon?: string | null
  code: string
}

/** Tìm menu khớp path gần nhất (prefix match). */
export function resolveMenuByPath(
  nodes: MenuTreeNode[],
  targetPath: string,
): MenuPathMatch | null {
  const target = normalizePath(targetPath)
  let best: MenuPathMatch | null = null

  const walk = (list: MenuTreeNode[]) => {
    for (const node of list) {
      if (node.feUrl) {
        const path = normalizePath(
          node.feUrl.startsWith('/') ? node.feUrl : `/${node.feUrl}`,
        )
        if (target === path || target.startsWith(`${path}/`)) {
          if (!best || path.length > best.path.length) {
            best = { path, label: node.name, icon: node.icon, code: node.code }
          }
        }
      }
      if (node.children?.length) walk(node.children)
    }
  }

  walk(nodes)
  return best
}

export function resolveMenuLabelByPath(
  nodes: MenuTreeNode[],
  targetPath: string,
): string | null {
  return resolveMenuByPath(nodes, targetPath)?.label ?? null
}
