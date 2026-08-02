// Đồng bộ với CommandPalette — lịch sử điều hướng gần đây (localStorage)

export const RECENT_NAV_KEY = 'frezo:command-palette:recent'
export const MAX_RECENT_NAV = 6

/** id dạng `nav:/crm/leads` → path `/crm/leads` */
export function parseRecentNavId(id: string): string | null {
  if (!id.startsWith('nav:')) return null
  const path = id.slice(4).trim()
  if (!path.startsWith('/')) return null
  return path.replace(/\/+$/, '') || '/'
}

function loadRecentNavIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_NAV_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT_NAV) : []
  } catch {
    return []
  }
}

/** Ghi path vào lịch sử — đồng bộ với CommandPalette (`nav:{path}`). */
export function recordRecentNav(path: string): void {
  const normalized = path.replace(/\/+$/, '') || '/'
  if (normalized === '/') return
  try {
    const id = `nav:${normalized}`
    const next = [id, ...loadRecentNavIds().filter((x) => x !== id)].slice(0, MAX_RECENT_NAV)
    localStorage.setItem(RECENT_NAV_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent('frezo:recent-nav-changed'))
  } catch {
    // ignore quota / private mode
  }
}

export function loadRecentNavPaths(limit = MAX_RECENT_NAV): string[] {
  return loadRecentNavIds()
    .map((id) => parseRecentNavId(id))
    .filter((p): p is string => !!p && p !== '/')
    .slice(0, limit)
}
