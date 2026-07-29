// ============================================================
// Bộ card cho bản tin nội bộ /bai-viet.
// - FeaturedArticleCard: bài nổi bật, ảnh full-bleed + scrim.
// - SpotlightArticleCard: 2 bài kế tiếp, dạng ngang gọn.
// - ArticleGridCard: lưới bài còn lại.
// ============================================================

import { ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@frezo/utils'
import { ArticleArtwork, articleTone } from './ArticleArtwork'
import {
  articleCover,
  articleExcerpt,
  formatArticleDate,
  type HomeArticle,
} from '../utils/homeArticle'

interface CardProps {
  article: HomeArticle
  onOpen: (id: string) => void
  /** Thứ tự trong lưới — dùng để stagger animation. */
  index?: number
}

function staggerStyle(index?: number) {
  if (index == null) return undefined
  return {
    animationDelay: `${Math.min(index, 8) * 60}ms`,
    animationFillMode: 'backwards' as const,
  }
}

function authorInitial(a: HomeArticle) {
  const name = a.authorName?.trim()
  return name ? name.charAt(0).toUpperCase() : '•'
}

export function FeaturedArticleCard({ article, onOpen }: CardProps) {
  const tone = articleTone(article)
  const date = formatArticleDate(article)
  const excerpt = articleExcerpt(article, 200)

  return (
    <button
      type="button"
      onClick={() => onOpen(article.id)}
      className="group relative block w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-900 text-left shadow-card
        motion-safe:transition-shadow motion-safe:duration-200 hover:shadow-card-md
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <ArticleArtwork
        src={articleCover(article)}
        alt={article.title || ''}
        tone={tone}
        seed={article.id}
        showLabel={!articleCover(article)}
        iconSize={44}
        zoomOnGroupHover
        className="h-60 w-full sm:h-72 lg:h-[26rem]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-neutral-900/92 via-neutral-900/45 to-transparent"
      />

      <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2 text-2xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 font-semibold uppercase tracking-wide text-amber-950">
            <Sparkles size={11} strokeWidth={2.2} /> Tin nổi bật
          </span>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 font-semibold uppercase tracking-wide',
              tone.chipOnCover,
            )}
          >
            {tone.label}
          </span>
          {date && <span className="text-white/70">{date}</span>}
          {article.authorName && (
            <span className="truncate text-white/70">{article.authorName}</span>
          )}
        </div>

        <h2 className="mt-3 text-xl font-bold leading-tight tracking-tight text-white line-clamp-2 md:text-2xl lg:text-3xl">
          {article.title || 'Thông báo nội bộ'}
        </h2>

        {excerpt && (
          <p className="mt-2 hidden max-w-2xl text-sm leading-relaxed text-white/80 line-clamp-2 sm:block">
            {excerpt}
          </p>
        )}

        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-primary-800 shadow-sm">
          Đọc bài viết
          <ArrowRight
            size={14}
            strokeWidth={2}
            className="motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-x-1"
          />
        </span>
      </div>
    </button>
  )
}

export function SpotlightArticleCard({ article, onOpen, index }: CardProps) {
  const tone = articleTone(article)
  const date = formatArticleDate(article)

  return (
    <button
      type="button"
      onClick={() => onOpen(article.id)}
      style={staggerStyle(index)}
      className={cn(
        'group flex w-full gap-3 rounded-xl border border-neutral-200 bg-white p-2.5 text-left shadow-sm',
        'motion-safe:animate-slide-up motion-safe:transition-all motion-safe:duration-200 hover:shadow-card',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        tone.hoverBorder,
      )}
    >
      <ArticleArtwork
        src={articleCover(article)}
        alt={article.title || ''}
        tone={tone}
        seed={article.id}
        iconSize={18}
        zoomOnGroupHover
        className="h-[4.5rem] w-24 shrink-0 rounded-lg"
      />
      <span className="flex min-w-0 flex-1 flex-col py-0.5">
        <span className="flex items-center gap-1.5 text-2xs">
          <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
          <span className="font-medium text-neutral-500">{tone.label}</span>
          {date && <span className="text-neutral-400">· {date}</span>}
        </span>
        <span className="mt-1 text-sm font-semibold leading-snug text-neutral-900 line-clamp-2 motion-safe:transition-colors group-hover:text-primary-700">
          {article.title || 'Thông báo nội bộ'}
        </span>
        {article.authorName && (
          <span className="mt-auto truncate pt-1 text-2xs text-neutral-400">
            {article.authorName}
          </span>
        )}
      </span>
    </button>
  )
}

export function ArticleGridCard({ article, onOpen, index }: CardProps) {
  const tone = articleTone(article)
  const date = formatArticleDate(article)
  const excerpt = articleExcerpt(article, 150)

  return (
    <button
      type="button"
      onClick={() => onOpen(article.id)}
      style={staggerStyle(index)}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-sm',
        'motion-safe:animate-slide-up motion-safe:transition-all motion-safe:duration-200',
        'hover:shadow-card-md motion-safe:hover:-translate-y-0.5',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        tone.hoverBorder,
      )}
    >
      <div className="relative">
        <ArticleArtwork
          src={articleCover(article)}
          alt={article.title || ''}
          tone={tone}
          seed={article.id}
          iconSize={30}
          zoomOnGroupHover
          className="aspect-[16/10] w-full"
        />
        <span
          className={cn(
            'absolute left-3 top-3 rounded-full px-2.5 py-1 text-2xs font-semibold uppercase tracking-wide shadow-sm',
            tone.chipOnCover,
          )}
        >
          {tone.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold leading-snug text-neutral-900 line-clamp-2 motion-safe:transition-colors group-hover:text-primary-700">
          {article.title || 'Thông báo nội bộ'}
        </h3>
        {excerpt && (
          <p className="mt-2 text-xs leading-relaxed text-neutral-500 line-clamp-3">
            {excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-dashed border-neutral-200 pt-3 text-2xs text-neutral-500">
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white',
              tone.dot,
            )}
          >
            {authorInitial(article)}
          </span>
          <span className="min-w-0 flex-1 truncate">
            {article.authorName || 'Ban truyền thông'}
          </span>
          {date && <span className="shrink-0 text-neutral-400">{date}</span>}
        </div>
      </div>
    </button>
  )
}
