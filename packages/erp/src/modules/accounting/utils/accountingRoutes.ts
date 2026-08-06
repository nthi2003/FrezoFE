// Accounting module — hub paths, tab gating (FE consolidation, BE menus unchanged)

export const ACCOUNTING_OPS_HUB_PATH = '/accounting'
export const ACCOUNTING_REPORTS_HUB_PATH = '/accounting/reports'
export const ACCOUNTING_SETUP_HUB_PATH = '/accounting/setup'

/** Legacy BE menu URLs merged into operations hub (+ consolidated hub path). */
export const ACCOUNTING_OPS_MENU_URLS = [
  ACCOUNTING_OPS_HUB_PATH,
  '/accounting/journals',
  '/accounting/ledger',
  '/accounting/bank-reconciliation',
] as const

/** Legacy BE menu URLs merged into reports hub. */
export const ACCOUNTING_REPORTS_MENU_URLS = [
  '/accounting/trial-balance',
  '/accounting/financial-statements',
  '/accounting/tax',
] as const

/** Legacy BE menu URLs merged into setup hub. */
export const ACCOUNTING_SETUP_MENU_URLS = [
  '/accounting/settings',
  '/accounting/periods',
  '/accounting/accounts',
] as const

export type OpsTab = 'journals' | 'ledger' | 'bank'
export type ReportsTab = 'trial-balance' | 'financial' | 'tax'
export type SetupTab = 'settings' | 'accounts'

/** Tabs hiển thị trên hub — kỳ kế toán mở qua drawer, không phải tab riêng. */
export const ACCOUNTING_SETUP_HUB_TABS: {
  key: SetupTab
  label: string
  menuUrls: readonly string[]
}[] = [
  { key: 'settings', label: 'Cài đặt', menuUrls: ['/accounting/settings'] },
  { key: 'accounts', label: 'Hệ thống TK', menuUrls: ['/accounting/accounts'] },
]

/** @deprecated alias — dùng ACCOUNTING_SETUP_HUB_TABS cho UI tabs */
export const ACCOUNTING_SETUP_TABS = [
  ...ACCOUNTING_SETUP_HUB_TABS,
  { key: 'periods' as const, label: 'Kỳ kế toán', menuUrls: ['/accounting/periods'] as const },
]

export const ACCOUNTING_OPS_TABS: {
  key: OpsTab
  label: string
  menuUrls: readonly string[]
}[] = [
  { key: 'journals', label: 'Chứng từ', menuUrls: ['/accounting/journals'] },
  { key: 'ledger', label: 'Sổ cái', menuUrls: ['/accounting/ledger'] },
  { key: 'bank', label: 'Đối chiếu NH', menuUrls: ['/accounting/bank-reconciliation'] },
]

export const ACCOUNTING_REPORTS_TABS: {
  key: ReportsTab
  label: string
  hint?: string
  menuUrls: readonly string[]
}[] = [
  {
    key: 'trial-balance',
    label: 'Cân đối thử',
    hint: 'Tổng hợp số dư & phát sinh theo tài khoản — kiểm tra Nợ = Có trong kỳ',
    menuUrls: ['/accounting/trial-balance'],
  },
  {
    key: 'financial',
    label: 'BC tài chính',
    hint: 'Bảng cân đối kế toán (BCĐKT) và Kết quả kinh doanh (KQKD)',
    menuUrls: ['/accounting/financial-statements'],
  },
  {
    key: 'tax',
    label: 'Tờ khai GTGT',
    hint: 'Tổng hợp thuế GTGT đầu vào / đầu ra theo tháng',
    menuUrls: ['/accounting/tax'],
  },
]

/** All legacy accounting leaf URLs (for menu consolidation detection). */
export const ACCOUNTING_ALL_LEGACY_URLS = [
  ...ACCOUNTING_OPS_MENU_URLS,
  ...ACCOUNTING_REPORTS_MENU_URLS,
  ...ACCOUNTING_SETUP_MENU_URLS,
] as const

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

export function canAccessAccountingOpsHub(menuUrls: Set<string>): boolean {
  return hasAnyExactMenuUrl(menuUrls, ACCOUNTING_OPS_MENU_URLS)
}

export function canAccessAccountingReportsHub(menuUrls: Set<string>): boolean {
  return hasAnyExactMenuUrl(menuUrls, ACCOUNTING_REPORTS_MENU_URLS)
}

export function canAccessAccountingSetupHub(menuUrls: Set<string>): boolean {
  return hasAnyExactMenuUrl(menuUrls, ACCOUNTING_SETUP_MENU_URLS)
}

/** Hub access → all tabs in that hub visible (menus merged client-side). */
export function canAccessOpsTab(tab: OpsTab, menuUrls: Set<string>): boolean {
  if (canAccessAccountingOpsHub(menuUrls)) return true
  const def = ACCOUNTING_OPS_TABS.find((t) => t.key === tab)
  return def ? hasAnyExactMenuUrl(menuUrls, def.menuUrls) : false
}

export function canAccessReportsTab(tab: ReportsTab, menuUrls: Set<string>): boolean {
  if (canAccessAccountingReportsHub(menuUrls)) return true
  const def = ACCOUNTING_REPORTS_TABS.find((t) => t.key === tab)
  return def ? hasAnyExactMenuUrl(menuUrls, def.menuUrls) : false
}

export function canAccessSetupTab(tab: SetupTab, menuUrls: Set<string>): boolean {
  if (canAccessAccountingSetupHub(menuUrls)) return true
  const def = ACCOUNTING_SETUP_HUB_TABS.find((t) => t.key === tab)
  return def ? hasAnyExactMenuUrl(menuUrls, def.menuUrls) : false
}

export function canAccessPeriodsDrawer(menuUrls: Set<string>): boolean {
  return hasExactMenuUrl(menuUrls, '/accounting/periods')
    || canAccessAccountingSetupHub(menuUrls)
}

export function resolveOpsTab(raw: string | null, menuUrls: Set<string>): OpsTab {
  if (raw && ACCOUNTING_OPS_TABS.some((t) => t.key === raw)) {
    const key = raw as OpsTab
    if (canAccessOpsTab(key, menuUrls)) return key
  }
  for (const t of ACCOUNTING_OPS_TABS) {
    if (canAccessOpsTab(t.key, menuUrls)) return t.key
  }
  return 'journals'
}

export function resolveReportsTab(raw: string | null, menuUrls: Set<string>): ReportsTab {
  if (raw && ACCOUNTING_REPORTS_TABS.some((t) => t.key === raw)) {
    const key = raw as ReportsTab
    if (canAccessReportsTab(key, menuUrls)) return key
  }
  for (const t of ACCOUNTING_REPORTS_TABS) {
    if (canAccessReportsTab(t.key, menuUrls)) return t.key
  }
  return 'trial-balance'
}

export function resolveSetupTab(raw: string | null, menuUrls: Set<string>): SetupTab {
  if (raw === 'periods') return 'settings'
  if (raw && ACCOUNTING_SETUP_HUB_TABS.some((t) => t.key === raw)) {
    const key = raw as SetupTab
    if (canAccessSetupTab(key, menuUrls)) return key
  }
  for (const t of ACCOUNTING_SETUP_HUB_TABS) {
    if (canAccessSetupTab(t.key, menuUrls)) return t.key
  }
  return 'settings'
}

/** ProtectedRoute: hub paths allowed when user has any legacy menu in that group. */
export function canAccessAccountingHubPathname(pathname: string, menuFeUrls: string[]): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  const menuUrls = new Set(menuFeUrls.map(normalizeUrl))
  if (path === ACCOUNTING_OPS_HUB_PATH) return canAccessAccountingOpsHub(menuUrls)
  if (path === ACCOUNTING_REPORTS_HUB_PATH) return canAccessAccountingReportsHub(menuUrls)
  if (path === ACCOUNTING_SETUP_HUB_PATH) return canAccessAccountingSetupHub(menuUrls)
  return false
}

export function accountingSetupHubUrl(params?: { tab?: SetupTab; drawer?: 'periods' }): string {
  const sp = new URLSearchParams()
  if (params?.tab && params.tab !== 'settings') sp.set('tab', params.tab)
  if (params?.drawer === 'periods') sp.set('drawer', 'periods')
  const qs = sp.toString()
  return qs ? `${ACCOUNTING_SETUP_HUB_PATH}?${qs}` : ACCOUNTING_SETUP_HUB_PATH
}

export function accountingOpsHubUrl(tab?: OpsTab): string {
  const sp = new URLSearchParams()
  if (tab && tab !== 'journals') sp.set('tab', tab)
  const qs = sp.toString()
  return qs ? `${ACCOUNTING_OPS_HUB_PATH}?${qs}` : ACCOUNTING_OPS_HUB_PATH
}

export function accountingReportsHubUrl(tab?: ReportsTab): string {
  const sp = new URLSearchParams()
  if (tab && tab !== 'trial-balance') sp.set('tab', tab)
  const qs = sp.toString()
  return qs ? `${ACCOUNTING_REPORTS_HUB_PATH}?${qs}` : ACCOUNTING_REPORTS_HUB_PATH
}
