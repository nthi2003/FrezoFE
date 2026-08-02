// QLNS module — canonical hub paths & permission helpers (FE consolidation, BE menus unchanged)

export const QLNS_TIME_HUB_PATH = '/qlns/time'
export const QLNS_PAYROLL_HUB_PATH = '/qlns/payroll'
export const QLNS_PEOPLE_HUB_PATH = '/qlns/people'
export const QLNS_PERFORMANCE_HUB_PATH = '/qlns/performance'

/** All legacy BE menu URLs under MENU_HRM. */
export const QLNS_ALL_LEGACY_URLS = [
  '/qlns/persons',
  '/qlns/contract',
  '/qlns/payrolls',
  '/qlns/salary-bands',
  '/qtht/salary-bands',
  '/qlns/leaves',
  '/admin/attendance',
  '/qlns/okrs',
  '/qlns/performance-reviews',
  '/qlns/onboarding',
  '/qlns/offboarding',
  '/qlns/recruitment/requisitions',
  '/qlns/recruitment/board',
] as const

export const QLNS_TIME_MENU_URLS = ['/admin/attendance', '/qlns/leaves'] as const
export const QLNS_PAYROLL_MENU_URLS = ['/qlns/payrolls', '/qlns/salary-bands', '/qtht/salary-bands'] as const
export const QLNS_PEOPLE_MENU_URLS = [
  '/qlns/persons',
  '/qlns/contract',
  '/qlns/onboarding',
  '/qlns/offboarding',
  '/qlns/recruitment/requisitions',
  '/qlns/recruitment/board',
] as const
export const QLNS_PERFORMANCE_MENU_URLS = ['/qlns/okrs', '/qlns/performance-reviews'] as const

export type TimeTab = 'overview' | 'daily' | 'records' | 'leaves'
export type PayrollTab = 'payrolls' | 'bands'
export type PeopleTab = 'persons' | 'contracts' | 'onboarding' | 'offboarding' | 'recruitment'
export type PerformanceTab = 'okrs' | 'reviews'

export const DEFAULT_TIME_TAB: TimeTab = 'daily'
export const DEFAULT_PAYROLL_TAB: PayrollTab = 'payrolls'
export const DEFAULT_PEOPLE_TAB: PeopleTab = 'persons'
export const DEFAULT_PERFORMANCE_TAB: PerformanceTab = 'okrs'

export const TIME_TABS: {
  key: TimeTab
  label: string
  menuUrls: readonly string[]
  hint?: string
}[] = [
  { key: 'overview', label: 'Tổng quan', menuUrls: ['/admin/attendance'], hint: 'KPI & heatmap cá nhân (trước: tab Tổng quan)' },
  { key: 'daily', label: 'Theo dõi ngày', menuUrls: ['/admin/attendance'], hint: 'Roster chấm công hôm nay (trước: /admin/attendance)' },
  { key: 'records', label: 'Danh sách công', menuUrls: ['/admin/attendance'], hint: 'Bảng công theo tháng' },
  { key: 'leaves', label: 'Nghỉ phép', menuUrls: ['/qlns/leaves'], hint: 'Duyệt đơn nghỉ — workflow đầy đủ (trước: /qlns/leaves)' },
]

export const PAYROLL_TABS: {
  key: PayrollTab
  label: string
  menuUrls: readonly string[]
  hint?: string
}[] = [
  { key: 'payrolls', label: 'Bảng lương', menuUrls: ['/qlns/payrolls'], hint: 'Tính · chốt · chi trả (trước: /qlns/payrolls)' },
  { key: 'bands', label: 'Bậc lương', menuUrls: ['/qlns/salary-bands', '/qtht/salary-bands'], hint: 'Khung lương theo bậc (trước: /qlns/salary-bands)' },
]

export const PEOPLE_TABS: {
  key: PeopleTab
  label: string
  menuUrls: readonly string[]
  hint?: string
}[] = [
  { key: 'persons', label: 'Nhân viên', menuUrls: ['/qlns/persons'], hint: 'Hồ sơ nhân viên (trước: /qlns/persons)' },
  { key: 'contracts', label: 'Hợp đồng', menuUrls: ['/qlns/contract'], hint: 'HĐLĐ (trước: /qlns/contract)' },
  { key: 'onboarding', label: 'Onboarding', menuUrls: ['/qlns/onboarding'], hint: 'Tiếp nhận nhân viên mới' },
  { key: 'offboarding', label: 'Nghỉ việc', menuUrls: ['/qlns/persons', '/qlns/offboarding'], hint: 'Quy trình nghỉ việc' },
  { key: 'recruitment', label: 'Tuyển dụng', menuUrls: ['/qlns/recruitment/requisitions', '/qlns/recruitment/board'], hint: 'Yêu cầu & Kanban tuyển dụng' },
]

export const PERFORMANCE_TABS: {
  key: PerformanceTab
  label: string
  menuUrls: readonly string[]
  hint?: string
}[] = [
  { key: 'okrs', label: 'OKR', menuUrls: ['/qlns/okrs'], hint: 'Mục tiêu & KPI (trước: /qlns/okrs)' },
  { key: 'reviews', label: 'Đánh giá', menuUrls: ['/qlns/performance-reviews'], hint: 'Review hiệu suất (trước: /qlns/performance-reviews)' },
]

export const PAYROLL_PERIODS_DRAWER_KEY = 'periods'

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

export function canAccessTimeHub(menuUrls: Set<string>): boolean {
  return hasAnyExactMenuUrl(menuUrls, QLNS_TIME_MENU_URLS)
}

export function canAccessPayrollHub(menuUrls: Set<string>): boolean {
  return hasAnyExactMenuUrl(menuUrls, QLNS_PAYROLL_MENU_URLS)
}

export function canAccessPeopleHub(menuUrls: Set<string>): boolean {
  return hasAnyExactMenuUrl(menuUrls, QLNS_PEOPLE_MENU_URLS)
}

export function canAccessPerformanceHub(menuUrls: Set<string>): boolean {
  return hasAnyExactMenuUrl(menuUrls, QLNS_PERFORMANCE_MENU_URLS)
}

export function canAccessTimeTab(_tab: TimeTab, menuUrls: Set<string>): boolean {
  return canAccessTimeHub(menuUrls)
}

export function canAccessPayrollTab(_tab: PayrollTab, menuUrls: Set<string>): boolean {
  return canAccessPayrollHub(menuUrls)
}

export function canAccessPeopleTab(tab: PeopleTab, menuUrls: Set<string>): boolean {
  if (canAccessPeopleHub(menuUrls)) return true
  const def = PEOPLE_TABS.find((t) => t.key === tab)
  if (!def) return false
  return hasAnyExactMenuUrl(menuUrls, def.menuUrls)
}

export function canAccessPerformanceTab(_tab: PerformanceTab, menuUrls: Set<string>): boolean {
  return canAccessPerformanceHub(menuUrls)
}

export function canAccessPayrollPeriodsDrawer(menuUrls: Set<string>): boolean {
  return hasExactMenuUrl(menuUrls, '/qlns/payrolls')
}

function resolveTab<T extends string>(
  raw: string | null,
  tabs: { key: T }[],
  canAccess: (tab: T, menuUrls: Set<string>) => boolean,
  defaultTab: T,
  menuUrls: Set<string>,
): T {
  if (raw && tabs.some((t) => t.key === raw)) {
    const key = raw as T
    if (canAccess(key, menuUrls)) return key
  }
  if (!raw && canAccess(defaultTab, menuUrls)) return defaultTab
  for (const t of tabs) {
    if (canAccess(t.key, menuUrls)) return t.key
  }
  return defaultTab
}

export function getVisibleTimeTabs(menuUrls: Set<string>): TimeTab[] {
  return TIME_TABS.filter((t) => canAccessTimeTab(t.key, menuUrls)).map((t) => t.key)
}

export function getVisiblePayrollTabs(menuUrls: Set<string>): PayrollTab[] {
  return PAYROLL_TABS.filter((t) => canAccessPayrollTab(t.key, menuUrls)).map((t) => t.key)
}

export function getVisiblePeopleTabs(menuUrls: Set<string>): PeopleTab[] {
  return PEOPLE_TABS.filter((t) => canAccessPeopleTab(t.key, menuUrls)).map((t) => t.key)
}

export function getVisiblePerformanceTabs(menuUrls: Set<string>): PerformanceTab[] {
  return PERFORMANCE_TABS.filter((t) => canAccessPerformanceTab(t.key, menuUrls)).map((t) => t.key)
}

export function resolveTimeTab(raw: string | null, menuUrls: Set<string>): TimeTab {
  return resolveTab(raw, TIME_TABS, canAccessTimeTab, DEFAULT_TIME_TAB, menuUrls)
}

export function resolvePayrollTab(raw: string | null, menuUrls: Set<string>): PayrollTab {
  return resolveTab(raw, PAYROLL_TABS, canAccessPayrollTab, DEFAULT_PAYROLL_TAB, menuUrls)
}

export function resolvePeopleTab(raw: string | null, menuUrls: Set<string>): PeopleTab {
  return resolveTab(raw, PEOPLE_TABS, canAccessPeopleTab, DEFAULT_PEOPLE_TAB, menuUrls)
}

export function resolvePerformanceTab(raw: string | null, menuUrls: Set<string>): PerformanceTab {
  return resolveTab(raw, PERFORMANCE_TABS, canAccessPerformanceTab, DEFAULT_PERFORMANCE_TAB, menuUrls)
}

export function timeHubUrl(params?: { tab?: TimeTab }): string {
  const sp = new URLSearchParams()
  if (params?.tab && params.tab !== DEFAULT_TIME_TAB) sp.set('tab', params.tab)
  const qs = sp.toString()
  return qs ? `${QLNS_TIME_HUB_PATH}?${qs}` : QLNS_TIME_HUB_PATH
}

export function payrollHubUrl(params?: { tab?: PayrollTab; drawer?: string }): string {
  const sp = new URLSearchParams()
  if (params?.tab && params.tab !== DEFAULT_PAYROLL_TAB) sp.set('tab', params.tab)
  if (params?.drawer) sp.set('drawer', params.drawer)
  const qs = sp.toString()
  return qs ? `${QLNS_PAYROLL_HUB_PATH}?${qs}` : QLNS_PAYROLL_HUB_PATH
}

export function canAccessQlnsHubPathname(pathname: string, menuFeUrls: string[]): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  const menuUrls = new Set(menuFeUrls.map(normalizeUrl))

  if (path === QLNS_TIME_HUB_PATH || path === '/admin/attendance' || path === '/qlns/leaves') {
    return canAccessTimeHub(menuUrls)
  }
  if (
    path === QLNS_PAYROLL_HUB_PATH
    || path === '/qlns/payrolls'
    || path === '/qlns/salary-bands'
    || path === '/qtht/salary-bands'
    || path === '/qlns/payroll-periods'
  ) {
    return canAccessPayrollHub(menuUrls)
  }
  if (
    path === QLNS_PEOPLE_HUB_PATH
    || path === '/qlns/persons'
    || path === '/qlns/contract'
    || path === '/qlns/onboarding'
    || path === '/qlns/offboarding'
    || path.startsWith('/qlns/contract/')
    || path.startsWith('/qlns/recruitment/')
  ) {
    return canAccessPeopleHub(menuUrls)
  }
  if (
    path === QLNS_PERFORMANCE_HUB_PATH
    || path === '/qlns/okrs'
    || path === '/qlns/performance-reviews'
  ) {
    return canAccessPerformanceHub(menuUrls)
  }

  return false
}
