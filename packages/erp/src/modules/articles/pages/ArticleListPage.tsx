// Reader list — /bai-viet

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
import { useHomeFeedArticles } from '../hooks/useArticle'
import { ARTICLES_READER_GUIDE } from '../constants/articles-reader.guide'
import {
  articleExcerpt,
  formatArticleDate,
  isInCurrentMonth,
  sortPublishedDesc,
  type HomeArticle,
} from '../utils/homeArticle'
import { articleTone, articleToneByKey } from '../components/ArticleArtwork'
import { ArticleGridCard, FeaturedArticleCard } from '../components/ArticleCards'
import { NewsroomMasthead } from '../components/NewsroomMasthead'

/** Bỏ dấu để tìm kiếm tiếng Việt không phụ thuộc bộ gõ. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

function searchIndex(a: HomeArticle): string {
  return normalize(
    [a.title, a.authorName, a.tags, articleExcerpt(a, 400)].filter(Boolean).join(' '),
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
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-surface">
        <div className="flex flex-col md:flex-row">
          <Skeleton className="aspect-[16/10] w-full rounded-none md:w-[42%] md:min-h-[14rem]" />
          <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="mt-auto h-4 w-40" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-neutral-200 bg-surface"
          >
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ArticleListPage() {
  const nav = useNavigate()
  const { data, isLoading, isError, refetch, isFetching } = useHomeFeedArticles()

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const articles = useMemo(() => sortPublishedDesc(data), [data])

  const filters = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of articles) {
      const key = articleTone(a).key
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    const byType = [...counts.entries()]
      .map(([key, count]) => ({ key, label: articleToneByKey(key).label, count }))
      .sort((a, b) => b.count - a.count)
    return [{ key: 'all', label: 'Tất cả', count: articles.length }, ...byType]
  }, [articles])

  const isFiltering = query.trim() !== '' || typeFilter !== 'all'

  const visible = useMemo(() => {
    const q = normalize(query.trim())
    return articles.filter((a) => {
      if (typeFilter !== 'all' && articleTone(a).key !== typeFilter) return false
      if (!q) return true
      return searchIndex(a).includes(q)
    })
  }, [articles, query, typeFilter])

  const openArticle = (id: string) => nav(`/bai-viet/${id}`)
  const resetFilters = () => {
    setQuery('')
    setTypeFilter('all')
  }

  const monthCount = useMemo(() => articles.filter(isInCurrentMonth).length, [articles])
  const latestLabel = articles.length ? formatArticleDate(articles[0]) : ''

  const featured = !isFiltering ? visible[0] : undefined
  const gridItems = isFiltering ? visible : visible.slice(1)

  return (
    <div className="min-h-full bg-neutral-50">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 animate-fade-in md:px-6 md:py-8">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', onClick: () => nav('/') },
            { label: 'Tin & bài viết' },
          ]}
        />

        <NewsroomMasthead
          total={articles.length}
          monthCount={monthCount}
          latestLabel={latestLabel}
          query={query}
          onQueryChange={setQuery}
          filters={filters}
          activeFilter={typeFilter}
          onFilterChange={setTypeFilter}
          actions={<PageGuideButton guide={ARTICLES_READER_GUIDE} />}
          isLoading={isLoading}
        />

        {isLoading ? (
          <NewsroomSkeleton />
        ) : isError ? (
          <div className="rounded-xl border border-neutral-200 bg-surface">
            <ErrorState
              title="Không tải được danh sách"
              message="Kết nối tới máy chủ đang có vấn đề. Thử lại sau vài giây."
              onRetry={() => void refetch()}
              isRetrying={isFetching}
            />
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-surface">
            <EmptyState
              icon={Newspaper}
              title="Chưa có bài viết"
              description="Khi Admin xuất bản tin, danh sách sẽ hiện tại đây."
              action={{ label: 'Về Trang chủ', onClick: () => nav('/') }}
            />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-surface">
            <EmptyState
              icon={SearchX}
              title="Không tìm thấy bài viết phù hợp"
              description="Thử từ khoá khác hoặc bỏ bộ lọc nhóm nội dung."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Xoá bộ lọc
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-8">
            {featured && (
              <section aria-label="Bài mới nhất">
                <FeaturedArticleCard article={featured} onOpen={openArticle} />
              </section>
            )}

            {gridItems.length > 0 && (
              <section className="space-y-4" aria-label="Danh sách bài viết">
                <SectionHeading
                  title={isFiltering ? 'Kết quả tìm kiếm' : 'Tất cả bài viết'}
                  hint={`${gridItems.length} bài`}
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gridItems.map((a) => (
                    <ArticleGridCard key={a.id} article={a} onOpen={openArticle} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
