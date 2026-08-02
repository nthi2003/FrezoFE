// ============================================================
// Card bài viết cho /bai-viet — featured hero + lưới danh sách.
// ============================================================

import { ArrowRight, Clock3 } from 'lucide-react'
import { cn } from '@frezo/utils'
import { ArticleArtwork, articleTone } from './ArticleArtwork'
import {
  articleCover,
  articleExcerpt,
  articleReadingMinutes,
  formatArticleDate,
  type HomeArticle,
} from '../utils/homeArticle'

interface CardProps {
  article: HomeArticle
  onOpen: (id: string) => void
  index?: number
}

function authorInitial(a: HomeArticle) {
  const name = a.authorName?.trim()
  return name ? name.charAt(0).toUpperCase() : '•'
}

function ArticleMeta({
  tone,
  date,
  readMinutes,
  className,
}: {
  tone: ReturnType<typeof articleTone>
  date: string
  readMinutes: number
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500', className)}>
      <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 font-medium', tone.chip)}>
        {tone.label}
      </span>
      {date && <span className="tabular-nums">{date}</span>}
      {readMinutes > 0 && (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Clock3 size={12} strokeWidth={1.5} />
          {readMinutes} phút đọc
        </span>
      )}
    </div>
  )
}

/** Bài mới nhất — layout ngang, dễ quét trên desktop và mobile. */
export function FeaturedArticleCard({ article, onOpen }: CardProps) {
  const tone = articleTone(article)
  const date = formatArticleDate(article)
  const excerpt = articleExcerpt(article, 180)
  const readMinutes = articleReadingMinutes(article)

  return (
    <button
      type="button"
      onClick={() => onOpen(article.id)}
      className={cn(
        'group flex w-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-surface text-left',
        'motion-safe:transition-shadow motion-safe:duration-150 hover:shadow-sm',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        tone.hoverBorder,
      )}
    >
      <div className="flex flex-col md:flex-row">
        <ArticleArtwork
          src={articleCover(article)}
          alt={article.title || ''}
          tone={tone}
          showLabel={!articleCover(article)}
          iconSize={32}
          zoomOnGroupHover
          eager
          className="aspect-[16/10] w-full shrink-0 md:aspect-auto md:h-auto md:w-[42%] md:min-h-[14rem]"
        />

        <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6">
          <ArticleMeta tone={tone} date={date} readMinutes={readMinutes} />

          <h2 className="mt-3 text-lg font-semibold leading-snug text-neutral-900 line-clamp-2 motion-safe:transition-colors group-hover:text-primary-700 md:text-xl">
            {article.title || 'Thông báo nội bộ'}
          </h2>

          {excerpt && (
            <p className="mt-2 text-sm leading-relaxed text-neutral-500 line-clamp-3">
              {excerpt}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 pt-4">
            <span className="flex min-w-0 items-center gap-2 text-xs text-neutral-500">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white',
                  tone.dot,
                )}
              >
                {authorInitial(article)}
              </span>
              <span className="truncate">{article.authorName || 'Ban truyền thông'}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary-700">
              Đọc bài
              <ArrowRight
                size={14}
                strokeWidth={1.5}
                className="motion-safe:transition-transform motion-safe:duration-150 motion-safe:group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

/** Card compact cho sidebar "Đọc tiếp" — giữ export để tái sử dụng nếu cần. */
export function SpotlightArticleCard({ article, onOpen }: CardProps) {
  const tone = articleTone(article)
  const date = formatArticleDate(article)

  return (
    <button
      type="button"
      onClick={() => onOpen(article.id)}
      className={cn(
        'group flex w-full gap-3 rounded-xl border border-neutral-200 bg-surface p-3 text-left',
        'motion-safe:transition-shadow motion-safe:duration-150 hover:shadow-sm',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        tone.hoverBorder,
      )}
    >
      <ArticleArtwork
        src={articleCover(article)}
        alt={article.title || ''}
        tone={tone}
        iconSize={18}
        zoomOnGroupHover
        className="h-16 w-24 shrink-0 rounded-lg"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs text-neutral-500">
          <span className={cn('inline-flex rounded px-1.5 py-0.5 font-medium', tone.chip)}>
            {tone.label}
          </span>
          {date && <span className="tabular-nums">{date}</span>}
        </span>
        <span className="mt-1 text-sm font-semibold leading-snug text-neutral-900 line-clamp-2 group-hover:text-primary-700">
          {article.title || 'Thông báo nội bộ'}
        </span>
      </span>
    </button>
  )
}

export function ArticleGridCard({ article, onOpen }: CardProps) {
  const tone = articleTone(article)
  const date = formatArticleDate(article)
  const excerpt = articleExcerpt(article, 140)
  const readMinutes = articleReadingMinutes(article)

  return (
    <button
      type="button"
      onClick={() => onOpen(article.id)}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-surface text-left',
        'motion-safe:transition-shadow motion-safe:duration-150 hover:shadow-sm',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        tone.hoverBorder,
      )}
    >
      <ArticleArtwork
        src={articleCover(article)}
        alt={article.title || ''}
        tone={tone}
        iconSize={28}
        zoomOnGroupHover
        className="aspect-[16/10] w-full"
      />

      <div className="flex flex-1 flex-col p-4">
        <ArticleMeta tone={tone} date={date} readMinutes={readMinutes} />

        <h3 className="mt-2 text-sm font-semibold leading-snug text-neutral-900 line-clamp-2 group-hover:text-primary-700">
          {article.title || 'Thông báo nội bộ'}
        </h3>

        {excerpt && (
          <p className="mt-2 text-xs leading-relaxed text-neutral-500 line-clamp-2">
            {excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-3 text-2xs text-neutral-500">
          <span
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white',
              tone.dot,
            )}
          >
            {authorInitial(article)}
          </span>
          <span className="min-w-0 flex-1 truncate">
            {article.authorName || 'Ban truyền thông'}
          </span>
        </div>
      </div>
    </button>
  )
}
