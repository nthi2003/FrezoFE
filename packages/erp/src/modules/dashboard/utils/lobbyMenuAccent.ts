// Accent token cho từng phân hệ trên Lobby — chỉ dùng semantic colors (primary/info/warning/success/danger/neutral)

export interface LobbyMenuAccent {
  iconBg: string
  iconText: string
  iconHoverBg: string
  iconHoverText: string
  hoverBorder: string
  hoverBg: string
}

const PRIMARY: LobbyMenuAccent = {
  iconBg: 'bg-primary-100',
  iconText: 'text-primary-700',
  iconHoverBg: 'group-hover:bg-primary-200',
  iconHoverText: 'group-hover:text-primary-800',
  hoverBorder: 'hover:border-primary-300',
  hoverBg: 'hover:bg-primary-50',
}

const PRIMARY_OVERVIEW: LobbyMenuAccent = {
  iconBg: 'bg-primary-100',
  iconText: 'text-primary-600',
  iconHoverBg: 'group-hover:bg-primary-200',
  iconHoverText: 'group-hover:text-primary-700',
  hoverBorder: 'hover:border-primary-400',
  hoverBg: 'hover:bg-primary-50',
}

const PRIMARY_DEEP: LobbyMenuAccent = {
  iconBg: 'bg-primary-50',
  iconText: 'text-primary-900',
  iconHoverBg: 'group-hover:bg-primary-100',
  iconHoverText: 'group-hover:text-primary-950',
  hoverBorder: 'hover:border-primary-400',
  hoverBg: 'hover:bg-primary-50',
}

const INFO: LobbyMenuAccent = {
  iconBg: 'bg-info-light',
  iconText: 'text-info-dark',
  iconHoverBg: 'group-hover:bg-info-light',
  iconHoverText: 'group-hover:text-info-dark',
  hoverBorder: 'hover:border-info',
  hoverBg: 'hover:bg-info-light/30',
}

const SUCCESS: LobbyMenuAccent = {
  iconBg: 'bg-success-light',
  iconText: 'text-success-dark',
  iconHoverBg: 'group-hover:bg-success-light',
  iconHoverText: 'group-hover:text-success-dark',
  hoverBorder: 'hover:border-success',
  hoverBg: 'hover:bg-success-light/30',
}

const WARNING: LobbyMenuAccent = {
  iconBg: 'bg-warning-light',
  iconText: 'text-warning-dark',
  iconHoverBg: 'group-hover:bg-warning-light',
  iconHoverText: 'group-hover:text-warning-dark',
  hoverBorder: 'hover:border-warning',
  hoverBg: 'hover:bg-warning-light/30',
}

const NEUTRAL: LobbyMenuAccent = {
  iconBg: 'bg-neutral-100',
  iconText: 'text-neutral-600',
  iconHoverBg: 'group-hover:bg-neutral-200',
  iconHoverText: 'group-hover:text-neutral-700',
  hoverBorder: 'hover:border-neutral-300',
  hoverBg: 'hover:bg-neutral-50',
}

const NEUTRAL_SOFT: LobbyMenuAccent = {
  iconBg: 'bg-neutral-50',
  iconText: 'text-neutral-500',
  iconHoverBg: 'group-hover:bg-neutral-100',
  iconHoverText: 'group-hover:text-neutral-600',
  hoverBorder: 'hover:border-neutral-300',
  hoverBg: 'hover:bg-neutral-50',
}

const TASK: LobbyMenuAccent = {
  iconBg: 'bg-neutral-100',
  iconText: 'text-info',
  iconHoverBg: 'group-hover:bg-info-light',
  iconHoverText: 'group-hover:text-info-dark',
  hoverBorder: 'hover:border-info',
  hoverBg: 'hover:bg-info-light/20',
}

const GROWTH: LobbyMenuAccent = {
  iconBg: 'bg-primary-200',
  iconText: 'text-primary-800',
  iconHoverBg: 'group-hover:bg-primary-300',
  iconHoverText: 'group-hover:text-primary-900',
  hoverBorder: 'hover:border-primary-400',
  hoverBg: 'hover:bg-primary-50',
}

const ACCENT_BY_CODE: Record<string, LobbyMenuAccent> = {
  dashboard: PRIMARY_OVERVIEW,
  home: PRIMARY_OVERVIEW,
  MENU_DASHBOARD: PRIMARY_OVERVIEW,

  MENU_HRM: PRIMARY,
  HRM: PRIMARY,
  QLNS: PRIMARY,

  MENU_CRM: INFO,
  CRM: INFO,
  CUSTOMER: INFO,

  MENU_PRODUCT: NEUTRAL,
  PRODUCT: NEUTRAL,
  DMDC: NEUTRAL,

  MENU_WAREHOUSE: WARNING,

  MENU_ACCOUNTING: SUCCESS,
  ACCOUNTING: SUCCESS,

  MENU_APPROVAL: PRIMARY_DEEP,
  APPROVAL: PRIMARY_DEEP,

  MENU_TASK: TASK,
  TASK: TASK,
  MENU_TOOL: TASK,
  TOOL: TASK,

  MENU_GROWTH: GROWTH,
  GROWTH: GROWTH,
  FB: GROWTH,
  FACEBOOK: GROWTH,

  MENU_QTHT: NEUTRAL,
  QTHT: NEUTRAL,
  SETTINGS: NEUTRAL,

  MENU_PROFILE: NEUTRAL_SOFT,
  PROFILE: NEUTRAL_SOFT,
  USER: NEUTRAL_SOFT,
}

const ACCENT_BY_PATH: Record<string, LobbyMenuAccent> = {
  '/profile': NEUTRAL_SOFT,
  '/dashboard': PRIMARY_OVERVIEW,
  '/': PRIMARY_OVERVIEW,
}

export function getLobbyMenuAccent(code: string, path?: string): LobbyMenuAccent {
  const normalized = code.trim().toUpperCase()
  const direct = ACCENT_BY_CODE[normalized] ?? ACCENT_BY_CODE[code]
  if (direct) return direct

  const root = normalized.split('_')[0]
  if (ACCENT_BY_CODE[root]) return ACCENT_BY_CODE[root]

  if (path) {
    const normalizedPath = path.replace(/\/+$/, '') || '/'
    if (ACCENT_BY_PATH[normalizedPath]) return ACCENT_BY_PATH[normalizedPath]
  }

  return NEUTRAL
}
