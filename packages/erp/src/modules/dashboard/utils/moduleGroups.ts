// Gom leaf menu (đã permission hoá bởi BE) thành nhóm cho ModuleLauncher.

import { getMenuIcon } from '@/modules/menus/utils/menuIcons'
import type { MenuTreeNode } from '@/modules/menus/types/menu.types'

export const UNGROUPED_KEY = '__ungrouped__'

/** Path đã có lối vào riêng (Home / Quick link / Header) — không đưa vào Chức năng. */
const EXCLUDED_LAUNCHER_PATHS = new Set([
  '/',
  '/home',
  '/dashboard',
  '/profile',
])

export interface ModuleTile {
  key: string
  label: string
  to: string
  icon: ReturnType<typeof getMenuIcon>
}

export interface ModuleGroup {
  key: string
  name: string
  tiles: ModuleTile[]
}

function normalizeFeUrl(feUrl: string): string {
  const path = feUrl.startsWith('/') ? feUrl : `/${feUrl}`
  return path.replace(/\/+$/, '') || '/'
}

/** Nhóm theo cha cấp 1; bỏ Home/Dashboard/Profile vì đã có lối vào riêng. */
export function collectModuleGroups(nodes: MenuTreeNode[]): ModuleGroup[] {
  const groups = new Map<string, ModuleGroup>()
  const seen = new Set<string>()

  const push = (groupKey: string, groupName: string, node: MenuTreeNode) => {
    if (!node.feUrl) return
    const to = normalizeFeUrl(node.feUrl)
    if (EXCLUDED_LAUNCHER_PATHS.has(to)) return
    if (seen.has(to)) return
    seen.add(to)

    const group = groups.get(groupKey) ?? { key: groupKey, name: groupName, tiles: [] }
    group.tiles.push({
      key: node.code || to,
      label: node.name || to,
      to,
      icon: getMenuIcon(node),
    })
    groups.set(groupKey, group)
  }

  const walkLeaves = (list: MenuTreeNode[], groupKey: string, groupName: string) => {
    for (const n of list) {
      if (n.children?.length) walkLeaves(n.children, groupKey, groupName)
      else push(groupKey, groupName, n)
    }
  }

  for (const root of nodes) {
    if (root.children?.length) {
      walkLeaves(root.children, root.code || root.name, root.name || 'Khác')
    } else {
      push(UNGROUPED_KEY, 'Khác', root)
    }
  }

  // Bỏ nhóm rỗng (vd. "Khác" chỉ còn Thông tin cá nhân đã loại).
  return [...groups.values()]
    .filter((g) => g.tiles.length > 0)
    .sort((a, b) => Number(a.key === UNGROUPED_KEY) - Number(b.key === UNGROUPED_KEY))
}
