// Approval config hub — FE consolidation (BE engines remain separate)

export const APPROVAL_CONFIG_HUB_PATH = '/approval/flows'
export const APPROVAL_INBOX_PATH = '/approval/inbox'
export const APPROVAL_TEMPLATES_LEGACY_PATH = '/qtht/workflows'

/** Legacy BE menu URLs folded into the config hub. */
export const APPROVAL_CONFIG_LEGACY_URLS = [
  '/approval/flows',
  '/qtht/workflows',
] as const

export const APPROVAL_FLOWS_MENU_URLS = ['/approval/flows'] as const
export const APPROVAL_TEMPLATES_MENU_URLS = ['/qtht/workflows'] as const

export type ApprovalConfigTab = 'flows' | 'templates'

export const DEFAULT_APPROVAL_CONFIG_TAB: ApprovalConfigTab = 'flows'

export const APPROVAL_CONFIG_TABS: {
  key: ApprovalConfigTab
  label: string
  menuUrls: readonly string[]
  hint?: string
}[] = [
  {
    key: 'flows',
    label: 'Luồng đang chạy',
    menuUrls: APPROVAL_FLOWS_MENU_URLS,
    hint: 'Gắn & kích hoạt chuỗi duyệt theo loại đơn (nghỉ / mua / lương)',
  },
  {
    key: 'templates',
    label: 'Mẫu / Designer',
    menuUrls: APPROVAL_TEMPLATES_MENU_URLS,
    hint: 'Thiết kế mẫu sơ đồ nâng cao (trước: /qtht/workflows)',
  },
]

export const APPROVAL_TEMPLATES_HUB_PATH = `${APPROVAL_CONFIG_HUB_PATH}?tab=templates`

function normalizeUrl(url?: string | null): string {
  if (!url) return ''
  const t = url.trim()
  if (!t) return ''
  const withSlash = t.startsWith('/') ? t : `/${t}`
  return withSlash.replace(/\/+$/, '') || '/'
}

function hasExactMenuUrl(menuUrls: Set<string>, url: string): boolean {
  return menuUrls.has(normalizeUrl(url))
}

function hasAnyExactMenuUrl(menuUrls: Set<string>, urls: readonly string[]): boolean {
  return urls.some((u) => hasExactMenuUrl(menuUrls, u))
}

/** Empty set = chưa biết quyền → hiện đủ tab (tránh flash “không có quyền”). */
export function canAccessApprovalConfigTab(
  tab: ApprovalConfigTab,
  menuUrls: Set<string>,
): boolean {
  if (menuUrls.size === 0) return true
  const def = APPROVAL_CONFIG_TABS.find((t) => t.key === tab)
  if (!def) return false
  return hasAnyExactMenuUrl(menuUrls, def.menuUrls)
}

export function getVisibleApprovalConfigTabs(menuUrls: Set<string>): ApprovalConfigTab[] {
  return APPROVAL_CONFIG_TABS.filter((t) => canAccessApprovalConfigTab(t.key, menuUrls)).map(
    (t) => t.key,
  )
}

export function resolveApprovalConfigTab(
  raw: string | null,
  menuUrls: Set<string>,
): ApprovalConfigTab {
  if (raw && APPROVAL_CONFIG_TABS.some((t) => t.key === raw)) {
    const key = raw as ApprovalConfigTab
    if (canAccessApprovalConfigTab(key, menuUrls)) return key
  }
  if (canAccessApprovalConfigTab(DEFAULT_APPROVAL_CONFIG_TAB, menuUrls)) {
    return DEFAULT_APPROVAL_CONFIG_TAB
  }
  for (const t of APPROVAL_CONFIG_TABS) {
    if (canAccessApprovalConfigTab(t.key, menuUrls)) return t.key
  }
  return DEFAULT_APPROVAL_CONFIG_TAB
}
