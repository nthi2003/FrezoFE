// ============================================================
// Docs Hub registry — BE Guide API + localStorage cache
// FR-DOC-04 (không còn fallback markdown /src/docs)
// ============================================================

import { unwrapList, unwrapOne } from '@frezo/utils'
import { guideApi, type GuideDetail, type GuideSummary } from './guideApi'
import {
  getCachedGuideBody,
  getCachedPublishedList,
  isPublishedListStale,
  setCachedGuideBody,
  setCachedPublishedList,
} from './guideCache'

export type DocsSource = 'api' | 'cache'

export interface ResolvedDoc {
  slug: string
  title: string
  description: string
  order: number
  body: string
  audience?: 'eu' | 'it'
  source: DocsSource
}

function summaryToDoc(s: GuideSummary, source: DocsSource, body = ''): ResolvedDoc {
  return {
    slug: s.slug,
    title: s.title,
    description: s.summary || s.module || '',
    order: s.sortOrder ?? 99,
    body,
    audience: 'eu',
    source,
  }
}

export function mapPublishedList(remote: GuideSummary[], source: DocsSource): ResolvedDoc[] {
  return remote
    .map((s) => summaryToDoc(s, source))
    .sort((a, b) => a.order - b.order)
}

/** Breadcrumb / label từ cache CMS (sau khi Hub đã load). */
export function getDocTitleBySlug(slug: string): string | undefined {
  const body = getCachedGuideBody(slug)
  if (body?.title) return body.title
  return getCachedPublishedList()?.find((g) => g.slug === slug)?.title
}

export async function fetchHubDocs(): Promise<{
  docs: ResolvedDoc[]
  source: DocsSource
  error?: string
}> {
  const cached = getCachedPublishedList()

  try {
    const res = await guideApi.listPublished()
    const list = unwrapList<GuideSummary>(res)
    setCachedPublishedList(list)
    return { docs: mapPublishedList(list, 'api'), source: 'api' }
  } catch (err: any) {
    const message = err?.response?.data?.message || err?.message
    if (cached && cached.length > 0) {
      return {
        docs: mapPublishedList(cached, 'cache'),
        source: 'cache',
        error: message,
      }
    }
    throw err
  }
}

/** Prefetch stale-while-revalidate khi đã có cache. */
export async function revalidateHubDocsIfStale() {
  if (!isPublishedListStale()) return
  try {
    const res = await guideApi.listPublished()
    setCachedPublishedList(unwrapList<GuideSummary>(res))
  } catch {
    // keep cache
  }
}

export async function resolveDocBySlug(slug: string): Promise<ResolvedDoc | null> {
  try {
    const res = await guideApi.getPublishedBySlug(slug)
    const detail = unwrapOne<GuideDetail>(res)
    if (detail?.body) {
      setCachedGuideBody(detail)
      return {
        slug: detail.slug,
        title: detail.title || slug,
        description: detail.summary || '',
        order: detail.sortOrder ?? 99,
        body: detail.body,
        audience: 'eu',
        source: 'api',
      }
    }
  } catch {
    const cached = getCachedGuideBody(slug)
    if (cached?.body) {
      return {
        slug: cached.slug,
        title: cached.title || slug,
        description: cached.summary || '',
        order: cached.sortOrder ?? 99,
        body: cached.body,
        audience: 'eu',
        source: 'cache',
      }
    }
  }

  return null
}

/** PageGuide CMS resolver — body BE hoặc null → giữ steps local trên PageGuideConfig. */
export async function resolvePublishedGuideBody(slug: string): Promise<string | null> {
  const cached = getCachedGuideBody(slug)
  if (cached?.body) {
    void guideApi
      .getPublishedBySlug(slug)
      .then((res) => {
        const detail = unwrapOne<GuideDetail>(res)
        if (detail?.body) setCachedGuideBody(detail)
      })
      .catch(() => undefined)
    return cached.body
  }

  try {
    const res = await guideApi.getPublishedBySlug(slug)
    const detail = unwrapOne<GuideDetail>(res)
    if (detail?.body) {
      setCachedGuideBody(detail)
      return detail.body
    }
  } catch {
    // fall through
  }

  return null
}
