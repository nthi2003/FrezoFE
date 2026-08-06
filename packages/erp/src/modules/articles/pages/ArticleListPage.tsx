// Reader list — /bai-viet (Tin tức nội bộ)

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Newspaper, SearchX } from 'lucide-react'
import {
  Breadcrumb,
  Button,
  EmptyState,
  ErrorState,
  PageGuideButton,
  Skeleton,
} from '@frezo/ui'
import { cn } from '@frezo/utils'
import { useAuthStore } from '@/stores/authStore'
import { useNewsPageData } from '@/modules/news/hooks/useNews'
import { NewsBannerCarousel } from '@/modules/news/components/NewsBannerCarousel'
import { PinnedArticlesGrid } from '@/modules/news/components/PinnedArticlesGrid'
import { NewsMottoBanner } from '@/modules/news/components/NewsMottoBanner'
import { ARTICLES_READER_GUIDE } from '../constants/articles-reader.guide'
import {
  articleExcerpt,
  formatArticleDate,
  sortPublishedDesc,
  type HomeArticle,
} from '../utils/homeArticle'
import { ArticleGridCard } from '../components/ArticleCards'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

function searchIndex(a: HomeArticle): string {
  return normalize(
    [a.title, a.authorName, a.summary, articleExcerpt(a, 400)].filter(Boolean).join(' '),
  )
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      {hint && <span className="text-xs text-neutral-500">{hint}</span>}
    </div>
  )
}

function NewsroomSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="aspect-[21/9] w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-neutral-200 bg-surface">
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface NewsCategory {
  id: string
  name: string
  color?: string
}

export function ArticleListPage() {
  const nav = useNavigate()
  const orgId = useAuthStore((s) => s.user?.orgId)
  const { data, isLoading, isError, refetch, isFetching } = useNewsPageData(orgId)

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const pageData = data as any
  const banners = pageData?.banners ?? []
  const motto = pageData?.motto
  const categories: NewsCategory[] = pageData?.categories ?? []
  const pinned: HomeArticle[] = sortPublishedDesc(pageData?.pinnedArticles ?? [])
  const articles: HomeArticle[] = sortPublishedDesc(pageData?.articles ?? [])

  const allArticles = useMemo(() => {
    const ids = new Set<string>()
    const merged: HomeArticle[] = []
    for (const a of [...pinned, ...articles]) {
      if (a?.id && !ids.has(a.id)) {
        ids.add(a.id)
        merged.push(a)
      }
    }
    return merged
  }, [pinned, articles])

  const categoryTabs = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of allArticles) {
      const key = (a as any).categoryId || 'uncategorized'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const tabs = categories.map((c) => ({
      key: c.id,
      label: c.name,
      color: c.color || '#16a34a',
      count: counts.get(c.id) ?? 0,
    }))
    return [
      { key: 'all', label: 'Tất cả', color: '#16a34a', count: allArticles.length },
      ...tabs.filter((t) => t.count > 0),
    ]
  }, [allArticles, categories])

  const isFiltering = query.trim() !== '' || categoryFilter !== 'all'

  const visible = useMemo(() => {
    const q = normalize(query.trim())
    const pool = isFiltering ? allArticles : articles
    return pool.filter((a) => {
      if (categoryFilter !== 'all') {
        const catId = (a as any).categoryId || 'uncategorized'
        if (catId !== categoryFilter) return false
      }
      if (!q) return true
      return searchIndex(a).includes(q)
    })
  }, [allArticles, articles, query, categoryFilter, isFiltering])

  const openArticle = (article: HomeArticle) => {
    const contentType = (article as any).contentType
    const externalUrl = (article as any).externalUrl
    if (contentType === 'LINK' && externalUrl?.startsWith('http')) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer')
      return
    }
    nav(`/bai-viet/${article.id}`)
  }

  const resetFilters = () => {
    setQuery('')
    setCategoryFilter('all')
  }

  return (
    <div className="min-h-full bg-neutral-50">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 animate-fade-in md:px-6 md:py-8">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', onClick: () => nav('/') },
            { label: 'Tin tức' },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Tin tức</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Thông báo và bài viết nội bộ — cập nhật mới nhất từ ban truyền thông.
            </p>
          </div>
          <PageGuideButton guide={ARTICLES_READER_GUIDE} />
        </div>

        {isLoading ? (
          <NewsroomSkeleton />
        ) : isError ? (
          <div className="rounded-xl border border-neutral-200 bg-surface">
            <ErrorState
              title="Không tải được trang tin tức"
              message="Kết nối tới máy chủ đang có vấn đề. Thử lại sau vài giây."
              onRetry={() => void refetch()}
              isRetrying={isFetching}
            />
          </div>
        ) : (
          <>
            <NewsBannerCarousel banners={banners} />
            <NewsMottoBanner content={motto?.content} author={motto?.author} />

            {!isFiltering && pinned.length > 0 && (
              <PinnedArticlesGrid articles={pinned} onOpen={(id) => {
                const a = pinned.find((x) => x.id === id)
                if (a) openArticle(a)
              }} />
            )}

            <section className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <SectionHeading title="Danh sách tin" hint={`${visible.length} bài`} />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo tiêu đề, nội dung…"
                  aria-label="Tìm tin tức"
                  className="h-9 w-full max-w-sm rounded-md border border-neutral-200 bg-white px-3 text-sm"
                />
              </div>

              {categoryTabs.length > 1 && (
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo danh mục">
                  {categoryTabs.map((tab) => {
                    const active = tab.key === categoryFilter
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setCategoryFilter(tab.key)}
                        aria-pressed={active}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                          active
                            ? 'text-white shadow-sm'
                            : 'bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50',
                        )}
                        style={active ? { backgroundColor: tab.color } : undefined}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: tab.color }}
                        />
                        {tab.label}
                        <span className={cn('tabular-nums', active ? 'text-white/80' : 'text-neutral-400')}>
                          {tab.count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {allArticles.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-surface">
                  <EmptyState
                    icon={Newspaper}
                    title="Chưa có tin tức"
                    description="Khi Admin xuất bản tin, danh sách sẽ hiện tại đây."
                    action={{ label: 'Về Trang chủ', onClick: () => nav('/') }}
                  />
                </div>
              ) : visible.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-surface">
                  <EmptyState
                    icon={SearchX}
                    title="Không tìm thấy tin phù hợp"
                    description="Thử từ khoá khác hoặc bỏ bộ lọc danh mục."
                    action={
                      <Button variant="outline" onClick={resetFilters}>
                        Xoá bộ lọc
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((a) => (
                    <ArticleGridCard
                      key={a.id}
                      article={{
                        ...a,
                        type: (a as any).categoryName || a.type,
                      }}
                      onOpen={() => openArticle(a)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
