// ============================================================
// Docs Hub registry — API + cache + fallback markdown local
// FR-DOC-04
// ============================================================

import { unwrapList, unwrapOne } from '@frezo/utils'
import { DOCS, EU_DOCS, getDocBySlug, type DocMeta } from '@/docs'
import { guideApi, type GuideDetail, type GuideSummary } from './guideApi'
import {
  getCachedGuideBody,
  getCachedPublishedList,
  isPublishedListStale,
  setCachedGuideBody,
  setCachedPublishedList,
} from './guideCache'

export type DocsSource = 'api' | 'cache' | 'local'

export interface ResolvedDoc extends DocMeta {
  source: DocsSource
}

function summaryToDoc(s: GuideSummary, body = ''): ResolvedDoc {
  return {
    slug: s.slug,
    title: s.title,
    description: s.summary || s.module || '',
    order: s.sortOrder ?? 99,
    body,
    audience: 'eu',
    source: 'api',
  }
}

function localAsResolved(d: DocMeta): ResolvedDoc {
  return { ...d, source: 'local' }
}

/** Merge API list với local fallback theo slug; ưu tiên API order/title/summary. */
export function mergeDocsWithLocal(
  remote: GuideSummary[],
  source: DocsSource,
): ResolvedDoc[] {
  const bySlug = new Map<string, ResolvedDoc>()

  for (const local of EU_DOCS) {
    bySlug.set(local.slug, localAsResolved(local))
  }

  for (const s of remote) {
    const local = getDocBySlug(s.slug)
    bySlug.set(s.slug, {
      slug: s.slug,
      title: s.title || local?.title || s.slug,
      description: s.summary || local?.description || '',
      order: s.sortOrder ?? local?.order ?? 99,
      body: local?.body ?? '',
      audience: 'eu',
      source,
    })
  }

  return [...bySlug.values()].sort((a, b) => a.order - b.order)
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
    return { docs: mergeDocsWithLocal(list, 'api'), source: 'api' }
  } catch (err: any) {
    if (cached && cached.length > 0) {
      return {
        docs: mergeDocsWithLocal(cached, 'cache'),
        source: 'cache',
        error: err?.response?.data?.message || err?.message,
      }
    }
    return {
      docs: EU_DOCS.map(localAsResolved),
      source: 'local',
      error: err?.response?.data?.message || err?.message,
    }
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
  const local = getDocBySlug(slug)

  try {
    const res = await guideApi.getPublishedBySlug(slug)
    const detail = unwrapOne<GuideDetail>(res)
    if (detail?.body) {
      setCachedGuideBody(detail)
      return {
        slug: detail.slug,
        title: detail.title || local?.title || slug,
        description: detail.summary || local?.description || '',
        order: detail.sortOrder ?? local?.order ?? 99,
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
        title: cached.title || local?.title || slug,
        description: cached.summary || local?.description || '',
        order: cached.sortOrder ?? local?.order ?? 99,
        body: cached.body,
        audience: 'eu',
        source: 'cache',
      }
    }
  }

  if (local) return localAsResolved(local)
  return null
}

/** PageGuide CMS resolver — body BE hoặc null → giữ steps local. */
export async function resolvePublishedGuideBody(slug: string): Promise<string | null> {
  const cached = getCachedGuideBody(slug)
  if (cached?.body) {
    // background refresh
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

  // local markdown fallback for PageGuide
  const local = getDocBySlug(slug)
  return local?.body ?? null
}

export { DOCS, EU_DOCS, getDocBySlug }
