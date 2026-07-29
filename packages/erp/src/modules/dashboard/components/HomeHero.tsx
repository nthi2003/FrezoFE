// ============================================================
// Home masthead — brand signal + lời chào + 1 công bố nội bộ nổi bật
// Chiếm trọn first viewport, thay cho PageHeader trần.
// ============================================================

import { useNavigate } from 'react-router-dom'
import { ArrowRight, Pin } from 'lucide-react'
import { Button, Skeleton } from '@frezo/ui'
import logoSrc from '@/img/logo.png'
import { ArticleCover } from '@/modules/articles/components/ArticleCover'
import {
  articleCover,
  articleExcerpt,
  articleTypeLabel,
  formatArticleDate,
  type HomeArticle,
} from '@/modules/articles/utils/homeArticle'

interface HomeHeroProps {
  greeting: string
  userLabel: string
  dateLabel: string
  featured?: HomeArticle | null
  isLoading?: boolean
}

export function HomeHero({
  greeting,
  userLabel,
  dateLabel,
  featured,
  isLoading = false,
}: HomeHeroProps) {
  const nav = useNavigate()
  const openFeatured = () => {
    if (featured?.id) nav(`/bai-viet/${featured.id}`)
  }

  const typeLabel = featured ? articleTypeLabel(featured) : null
  const publishedAt = featured ? formatArticleDate(featured) : ''
  const excerpt = featured ? articleExcerpt(featured, 220) : ''

  return (
    <section className="rounded-xl border border-neutral-200 bg-surface shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-surface-secondary px-5 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={logoSrc} alt="Frezo" className="h-6 w-auto object-contain shrink-0" />
          <span className="text-2xs font-semibold uppercase tracking-wider text-neutral-500 truncate">
            Cổng thông tin nội bộ
          </span>
        </div>
        <span className="text-xs text-neutral-500 shrink-0">{dateLabel}</span>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-12 lg:gap-6 lg:p-6">
        <div className="lg:col-span-7 min-w-0 flex flex-col">
          <h1 className="text-xl font-bold text-neutral-900">
            {greeting}, <span className="text-primary-700">{userLabel}</span>
          </h1>

          {isLoading ? (
            <div className="mt-5 space-y-2.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : featured ? (
            <div className="mt-5 flex flex-col flex-1">
              <div className="flex flex-wrap items-center gap-2 text-2xs">
                <span className="inline-flex items-center gap-1 rounded bg-warning-light px-2 py-0.5 font-semibold uppercase tracking-wide text-warning-dark">
                  <Pin size={11} strokeWidth={2} /> Công bố nổi bật
                </span>
                {typeLabel && <span className="text-neutral-400">{typeLabel}</span>}
                {publishedAt && <span className="text-neutral-400">{publishedAt}</span>}
                {featured.authorName && (
                  <span className="text-neutral-400 truncate">{featured.authorName}</span>
                )}
              </div>

              <h2 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-neutral-900 line-clamp-2">
                {featured.title || 'Thông báo nội bộ'}
              </h2>

              {excerpt && (
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 line-clamp-3">
                  {excerpt}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={openFeatured}>
                  Đọc thông báo
                  <ArrowRight size={16} strokeWidth={1.5} className="ml-1.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => nav('/bai-viet')}>
                  Tất cả tin nội bộ
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex flex-col flex-1">
              <h2 className="text-2xl font-bold leading-snug tracking-tight text-neutral-900">
                Chưa có công bố nội bộ nào
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Thông báo, chính sách và tin công ty sẽ xuất hiện ngay tại đây khi được
                xuất bản. Trong lúc chờ, bạn có thể mở nhanh các chức năng bên dưới.
              </p>
              <div className="mt-5">
                <Button size="sm" variant="outline" onClick={() => nav('/bai-viet')}>
                  Xem trang tin nội bộ
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          {isLoading ? (
            <Skeleton className="aspect-[16/10] w-full rounded-lg" />
          ) : featured ? (
            <button
              type="button"
              onClick={openFeatured}
              aria-label={featured.title || 'Mở thông báo nổi bật'}
              className="group block w-full overflow-hidden rounded-lg border border-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <ArticleCover
                src={articleCover(featured)}
                alt={featured.title || ''}
                iconSize={40}
                zoomOnGroupHover
                className="aspect-[16/10] w-full"
              />
            </button>
          ) : (
            <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-surface-secondary">
              <img src={logoSrc} alt="Frezo" className="h-10 w-auto object-contain opacity-60" />
              <span className="text-xs text-neutral-400">Frezo ERP</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
