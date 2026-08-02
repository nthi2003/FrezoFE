// Task module — canonical paths & permission helpers (FE consolidation, BE menus unchanged)



export const TASK_HUB_PATH = '/task'

export const TASK_CATEGORY_PATH = '/task/categories'



/** Legacy BE menu URLs merged into the Công việc hub. */

export const TASK_HUB_MENU_URLS = ['/task', '/task/tickets', '/tasks', '/task/tags'] as const



/** Legacy routes that redirect into the hub (keep ProtectedRoute + deep links working). */

export const TASK_LEGACY_PATHS = [

  '/task/tickets',

  '/tasks',

  '/task/tags',

  TASK_CATEGORY_PATH,

] as const



export type WorkTab = 'board' | 'list' | 'mine' | 'tags' | 'categories'



/** Canonical `/task` opens Danh sách (legacy `/task` menu). */

export const DEFAULT_WORK_TAB: WorkTab = 'list'



export const WORK_TABS: { key: WorkTab; label: string; menuUrls: readonly string[]; hint?: string }[] = [

  { key: 'board', label: 'Bảng', menuUrls: ['/task/tickets', '/tasks'], hint: 'Bảng Kanban giao việc (trước: /task/tickets)' },

  { key: 'list', label: 'Danh sách', menuUrls: ['/task'], hint: 'Task nội bộ dạng bảng (trước: /task)' },

  { key: 'mine', label: 'Của tôi', menuUrls: ['/task/tickets', '/tasks'], hint: 'Việc được giao cho bạn' },

  { key: 'tags', label: 'Thẻ', menuUrls: ['/task/tags'], hint: 'Quản lý nhãn màu (trước: /task/tags)' },

  { key: 'categories', label: 'Danh mục', menuUrls: [TASK_CATEGORY_PATH], hint: 'Danh mục loại ticket (trước: /task/categories)' },

]



function normalizeUrl(url?: string | null): string {

  if (!url) return ''

  const t = url.trim()

  if (!t) return ''

  const withSlash = t.startsWith('/') ? t : `/${t}`

  return withSlash.replace(/\/+$/, '') || '/'

}



export function hasExactMenuUrl(menuUrls: Set<string>, url: string): boolean {

  return menuUrls.has(normalizeUrl(url))

}



export function hasAnyExactMenuUrl(menuUrls: Set<string>, urls: readonly string[]): boolean {

  return urls.some((u) => hasExactMenuUrl(menuUrls, u))

}



/** User may open `/task` hub if they had any legacy task/ticket/tag menu. */

export function canAccessTaskHub(menuUrls: Set<string>): boolean {

  return hasAnyExactMenuUrl(menuUrls, TASK_HUB_MENU_URLS)

}



export function canAccessTaskCategories(menuUrls: Set<string>): boolean {

  return hasExactMenuUrl(menuUrls, TASK_CATEGORY_PATH)

}



/**

 * Tab visibility: hub access shows all in-hub tabs (IA merge — not per legacy leaf).

 * Danh mục ticket vẫn gate riêng theo menu `/task/categories`.

 */

export function canAccessWorkTab(tab: WorkTab, menuUrls: Set<string>): boolean {

  if (tab === 'categories') return canAccessTaskCategories(menuUrls)

  if (canAccessTaskHub(menuUrls)) return true

  const def = WORK_TABS.find((t) => t.key === tab)

  if (!def) return false

  return hasAnyExactMenuUrl(menuUrls, def.menuUrls)

}



export function getVisibleWorkTabs(menuUrls: Set<string>): WorkTab[] {

  return WORK_TABS.filter((t) => canAccessWorkTab(t.key, menuUrls)).map((t) => t.key)

}



export function resolveWorkTab(raw: string | null, menuUrls: Set<string>): WorkTab {

  if (raw && (WORK_TABS as { key: WorkTab }[]).some((t) => t.key === raw)) {

    const key = raw as WorkTab

    if (canAccessWorkTab(key, menuUrls)) return key

  }

  if (!raw && canAccessWorkTab(DEFAULT_WORK_TAB, menuUrls)) {

    return DEFAULT_WORK_TAB

  }

  for (const t of WORK_TABS) {

    if (canAccessWorkTab(t.key, menuUrls)) return t.key

  }

  return DEFAULT_WORK_TAB

}



/** ProtectedRoute: task hub, legacy redirects, and ticket categories. */

export function canAccessTaskPathname(pathname: string, menuFeUrls: string[]): boolean {

  const path = pathname.replace(/\/+$/, '') || '/'

  const menuUrls = new Set(menuFeUrls.map(normalizeUrl))



  if (path === TASK_CATEGORY_PATH) {

    return canAccessTaskCategories(menuUrls) || canAccessTaskHub(menuUrls)

  }



  if (

    path === TASK_HUB_PATH ||

    (TASK_LEGACY_PATHS as readonly string[]).filter((p) => p !== TASK_CATEGORY_PATH).includes(path)

  ) {

    return canAccessTaskHub(menuUrls)

  }



  return false

}



/** Build canonical ticket deep-link on the hub. */

export function taskHubUrl(params?: { tab?: WorkTab; ticketId?: string | null }): string {

  const sp = new URLSearchParams()

  if (params?.tab && params.tab !== DEFAULT_WORK_TAB) sp.set('tab', params.tab)

  if (params?.ticketId) sp.set('ticketId', params.ticketId)

  const qs = sp.toString()

  return qs ? `${TASK_HUB_PATH}?${qs}` : TASK_HUB_PATH

}

