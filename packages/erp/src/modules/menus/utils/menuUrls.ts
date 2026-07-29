// Tiện ích kiểm tra "user có menu này không" — menu do BE trả đã lọc theo quyền,
// nên dùng làm lớp gate hiển thị cho shortcut / KPI trên Home.

import type { MenuTreeNode } from '../types/menu.types'

export function collectFeUrls(nodes: MenuTreeNode[]): Set<string> {
  const urls = new Set<string>()
  const walk = (list: MenuTreeNode[]) => {
    for (const n of list) {
      if (n.feUrl) {
        const path = n.feUrl.startsWith('/') ? n.feUrl : `/${n.feUrl}`
        urls.add(path.replace(/\/+$/, '') || '/')
      }
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return urls
}

/** True khi `to` trùng hoặc nằm dưới một feUrl user được cấp. */
export function pathAllowed(menuUrls: Set<string>, to: string): boolean {
  const norm = to.replace(/\/+$/, '') || '/'
  for (const u of menuUrls) {
    if (norm === u || norm.startsWith(`${u}/`)) return true
  }
  return false
}

/** True khi user có bất kỳ menu nào nằm dưới prefix (vd '/crm'). */
export function hasMenuUnder(menuUrls: Set<string>, prefix: string): boolean {
  const norm = prefix.replace(/\/+$/, '') || '/'
  for (const u of menuUrls) {
    if (u === norm || u.startsWith(`${norm}/`)) return true
  }
  return false
}
