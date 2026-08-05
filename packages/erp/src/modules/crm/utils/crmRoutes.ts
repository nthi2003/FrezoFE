// CRM module — hub paths, tab gating (FE consolidation, BE menus unchanged)

export const CRM_PIPELINE_HUB_PATH = '/crm'
export const CRM_SALES_HUB_PATH = '/crm/sales'
export const CRM_CUSTOMER_PATH = '/customer'

/** Legacy BE menu URLs merged into pipeline hub. */
export const CRM_PIPELINE_MENU_URLS = [
  CRM_PIPELINE_HUB_PATH,
  '/crm/leads',
  '/crm/deals',
  '/crm/meetings',
  '/crm/email-sequences',
] as const

/** Legacy BE menu URLs merged into sales hub. */
export const CRM_SALES_MENU_URLS = [
  CRM_SALES_HUB_PATH,
  '/crm/quotes',
  '/crm/invoices',
] as const

export type PipelineTab = 'leads' | 'deals' | 'meetings'
export type SalesTab = 'quotes' | 'invoices' | 'commissions'

export const CRM_PIPELINE_TABS: {
  key: PipelineTab
  label: string
  hint?: string
  menuUrls: readonly string[]
}[] = [
  { key: 'leads', label: 'Khách tiềm năng', hint: 'Trước khi thành cơ hội bán', menuUrls: ['/crm/leads'] },
  { key: 'deals', label: 'Cơ hội bán', hint: 'Bảng phễu — kéo thẻ đổi giai đoạn', menuUrls: ['/crm/deals'] },
  { key: 'meetings', label: 'Cuộc họp', hint: 'Lịch họp gắn cơ hội bán / khách hàng', menuUrls: ['/crm/meetings'] },
]

export const CRM_SALES_TABS: {
  key: SalesTab
  label: string
  hint?: string
  menuUrls: readonly string[]
}[] = [
  { key: 'quotes', label: 'Báo giá', hint: 'Theo dõi báo giá gửi khách', menuUrls: ['/crm/quotes'] },
  { key: 'invoices', label: 'Hóa đơn', hint: 'Hoá đơn bán & thu tiền', menuUrls: ['/crm/invoices'] },
  { key: 'commissions', label: 'Hoa hồng', hint: 'Cài % theo nhân viên bán · phát sinh theo đơn', menuUrls: ['/crm/sales', '/crm/invoices'] },
]

export const CRM_ALL_LEGACY_URLS = [
  ...CRM_PIPELINE_MENU_URLS,
  ...CRM_SALES_MENU_URLS,
] as const

export const CRM_SEQUENCES_DRAWER_KEY = 'sequences'
export const CRM_EXPORT_DRAWER_KEY = 'export'

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

export function canAccessCrmPipelineHub(menuUrls: Set<string>): boolean {
  return hasAnyExactMenuUrl(menuUrls, CRM_PIPELINE_MENU_URLS)
}

export function canAccessCrmSalesHub(menuUrls: Set<string>): boolean {
  return hasAnyExactMenuUrl(menuUrls, CRM_SALES_MENU_URLS)
}

export function canAccessPipelineTab(tab: PipelineTab, menuUrls: Set<string>): boolean {
  if (canAccessCrmPipelineHub(menuUrls)) return true
  const def = CRM_PIPELINE_TABS.find((t) => t.key === tab)
  return def ? hasAnyExactMenuUrl(menuUrls, def.menuUrls) : false
}

export function canAccessSalesTab(tab: SalesTab, menuUrls: Set<string>): boolean {
  if (canAccessCrmSalesHub(menuUrls)) return true
  const def = CRM_SALES_TABS.find((t) => t.key === tab)
  return def ? hasAnyExactMenuUrl(menuUrls, def.menuUrls) : false
}

export function canAccessSequencesDrawer(menuUrls: Set<string>): boolean {
  return hasExactMenuUrl(menuUrls, '/crm/email-sequences') || canAccessCrmPipelineHub(menuUrls)
}

export function canAccessPipelineExportDrawer(menuUrls: Set<string>): boolean {
  return canAccessPipelineTab('deals', menuUrls)
}

export function resolvePipelineTab(raw: string | null, menuUrls: Set<string>): PipelineTab {
  if (raw && CRM_PIPELINE_TABS.some((t) => t.key === raw)) {
    const key = raw as PipelineTab
    if (canAccessPipelineTab(key, menuUrls)) return key
  }
  for (const t of CRM_PIPELINE_TABS) {
    if (canAccessPipelineTab(t.key, menuUrls)) return t.key
  }
  return 'leads'
}

export function resolveSalesTab(raw: string | null, menuUrls: Set<string>): SalesTab {
  if (raw && CRM_SALES_TABS.some((t) => t.key === raw)) {
    const key = raw as SalesTab
    if (canAccessSalesTab(key, menuUrls)) return key
  }
  for (const t of CRM_SALES_TABS) {
    if (canAccessSalesTab(t.key, menuUrls)) return t.key
  }
  return 'quotes'
}

/** ProtectedRoute: hub paths allowed when user has any legacy menu in that group. */
export function canAccessCrmHubPathname(pathname: string, menuFeUrls: string[]): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  const menuUrls = new Set(menuFeUrls.map(normalizeUrl))
  if (path === CRM_PIPELINE_HUB_PATH) return canAccessCrmPipelineHub(menuUrls)
  if (path === CRM_SALES_HUB_PATH) return canAccessCrmSalesHub(menuUrls)
  return false
}

export function crmPipelineHubUrl(params?: { tab?: PipelineTab; drawer?: string }): string {
  const sp = new URLSearchParams()
  if (params?.tab && params.tab !== 'leads') sp.set('tab', params.tab)
  if (params?.drawer) sp.set('drawer', params.drawer)
  const qs = sp.toString()
  return qs ? `${CRM_PIPELINE_HUB_PATH}?${qs}` : CRM_PIPELINE_HUB_PATH
}

export function crmSalesHubUrl(tab?: SalesTab): string {
  const sp = new URLSearchParams()
  if (tab && tab !== 'quotes') sp.set('tab', tab)
  const qs = sp.toString()
  return qs ? `${CRM_SALES_HUB_PATH}?${qs}` : CRM_SALES_HUB_PATH
}
