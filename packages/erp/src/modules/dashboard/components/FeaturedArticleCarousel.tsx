// Carousel bài báo nổi bật — dùng home-feed articles

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Newspaper } from 'lucide-react'
import { Button, Skeleton } from '@frezo/ui'
import { cn } from '@/lib/utils/cn'
import { ArticleCover } from '@/modules/articles/components/ArticleCover'
import {
  articleCover,
  articleExcerpt,
  articleTypeLabel,
  formatArticleDate,
  type HomeArticle,
} from '@/modules/articles/utils/homeArticle'

const AUTO_MS = 6000
const MAX_SLIDES = 5

interface FeaturedArticleCarouselProps {
  articles: HomeArticle[]
  isLoading?: boolean
  /** Thu aspect ratio khi đặt cạnh headline list */
  compact?: boolean
}

export function FeaturedArticleCarousel({
  articles,
  isLoading = false,
  compact = false,
}: FeaturedArticleCarouselProps) {
  const nav = useNavigate()
  const slides = articles.slice(0, MAX_SLIDES)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [slides.length, slides[0]?.id])

  const go = useCallback(
    (delta: number) => {
      if (slides.length <= 1) return
      setIndex((i) => (i + delta + slides.length) % slides.length)
    },
    [slides.length],
  )

  useEffect(() => {
    if (slides.length <= 1) return
    const id = window.setInterval(() => go(1), AUTO_MS)
    return () => window.clearInterval(id)
  }, [go, slides.length])

  const current = slides[index]

  const openArticle = (id?: string) => {
    if (id) nav(`/bai-viet/${id}`)
  }

  const aspectClass = compact ? 'aspect-[16/9]' : 'aspect-[21/9]'

  if (isLoading) {
    return (
      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-surface shadow-sm">
        <Skeleton className={cn('w-full rounded-none', aspectClass)} />
      </section>
    )
  }

  if (!slides.length) {
    return (
      <section
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-surface-secondary',
          aspectClass,
        )}
      >
        <Newspaper size={32} strokeWidth={1.5} className="text-neutral-300" />
        <p className="text-sm text-neutral-500">Chưa có bài báo nổi bật</p>
        <Button size="sm" variant="outline" onClick={() => nav('/bai-viet')}>
          Xem tin nội bộ
        </Button>
      </section>
    )
  }

  return (
    <section
      className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-surface shadow-sm"
      aria-roledescription="carousel"
      aria-label="Bài báo nổi bật"
    >
      <button
        type="button"
        onClick={() => openArticle(current.id)}
        className="relative block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
      >
        <ArticleCover
          src={articleCover(current)}
          alt={current.title || ''}
          className={cn('w-full', aspectClass)}
          iconSize={48}
          zoomOnGroupHover
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 text-2xs text-neutral-200">
            <span className="rounded bg-primary-600/90 px-2 py-0.5 font-semibold uppercase tracking-wide text-white">
              Nổi bật
            </span>
            {articleTypeLabel(current) && <span>{articleTypeLabel(current)}</span>}
            {formatArticleDate(current) && <span>{formatArticleDate(current)}</span>}
          </div>
          <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-snug text-white sm:text-2xl md:text-3xl">
            {current.title || 'Thông báo nội bộ'}
          </h2>
          {articleExcerpt(current, 140) && (
            <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-neutral-200 sm:text-base">
              {articleExcerpt(current, 140)}
            </p>
          )}
        </div>
      </button>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Bài trước"
            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-neutral-900/40 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-neutral-900/60 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Bài sau"
            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-neutral-900/40 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-neutral-900/60 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 right-4 flex gap-1.5 sm:bottom-4 sm:right-6">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-6 bg-primary-400' : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
