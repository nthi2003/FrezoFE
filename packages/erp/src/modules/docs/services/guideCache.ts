// ============================================================
// Guide CMS cache — stale-while-revalidate + localStorage
// ============================================================

import type { GuideDetail, GuideSummary } from './guideApi'

const LIST_KEY = 'frezo.guides.published.list.v1'
const BODY_PREFIX = 'frezo.guides.published.body.v1:'
/** TTL 5 phút — Admin sửa → user reload trong TTL vẫn có thể thấy cũ; refetch khi stale. */
export const GUIDE_CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEnvelope<T> {
  savedAt: number
  data: T
}

function readEnvelope<T>(key: string): CacheEnvelope<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEnvelope<T>
    if (!parsed || typeof parsed.savedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function writeEnvelope<T>(key: string, data: T) {
  try {
    const envelope: CacheEnvelope<T> = { savedAt: Date.now(), data }
    localStorage.setItem(key, JSON.stringify(envelope))
  } catch {
    // quota / private mode — ignore
  }
}

export function getCachedPublishedList(): GuideSummary[] | null {
  const env = readEnvelope<GuideSummary[]>(LIST_KEY)
  return env?.data ?? null
}

export function setCachedPublishedList(list: GuideSummary[]) {
  writeEnvelope(LIST_KEY, list)
}

export function isPublishedListStale(): boolean {
  const env = readEnvelope<GuideSummary[]>(LIST_KEY)
  if (!env) return true
  return Date.now() - env.savedAt > GUIDE_CACHE_TTL_MS
}

export function getCachedGuideBody(slug: string): GuideDetail | null {
  const env = readEnvelope<GuideDetail>(BODY_PREFIX + slug)
  return env?.data ?? null
}

export function setCachedGuideBody(guide: GuideDetail) {
  writeEnvelope(BODY_PREFIX + guide.slug, guide)
}

export function invalidateGuideCaches(slug?: string) {
  try {
    localStorage.removeItem(LIST_KEY)
    if (slug) localStorage.removeItem(BODY_PREFIX + slug)
  } catch {
    // ignore
  }
}
