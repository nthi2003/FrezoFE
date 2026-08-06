// ============================================================
// Phần đầu trang đọc bài /bai-viet/:id.
// - ArticleReaderBanner: ảnh cover lớn (hoặc artwork theo nhóm nội
//   dung khi thiếu ảnh) + chip nhóm + scrim để chữ đè lên đọc được.
// - ArticleReaderHeadline: tiêu đề, tác giả, ngày, thời lượng đọc.
// ============================================================

import { CalendarDays, Clock3 } from 'lucide-react'
import { cn } from '@frezo/utils'
import { ArticleArtwork, articleTone } from './ArticleArtwork'
import {
  articleCover,
  articleReadingMinutes,
  formatArticleDateLong,
  type HomeArticle,
} from '../utils/homeArticle'

export function ArticleReaderBanner({ article }: { article: HomeArticle }) {
  const tone = articleTone(article)
  const cover = articleCover(article)

  return (
    <div className="relative">
      <ArticleArtwork
        src={cover}
        alt={article.title || ''}
        tone={tone}
        showLabel={!cover}
        iconSize={44}
        eager
        className="h-52 w-full rounded-xl sm:h-64 lg:h-80"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-2xl bg-gradient-to-t from-neutral-900/70 via-neutral-900/10 to-transparent"
      />
      <span
        className={cn(
          'absolute left-4 top-4 rounded-full px-3 py-1 text-2xs font-semibold uppercase tracking-wide shadow-sm',
          tone.chipOnCover,
        )}
      >
        {(article as any).categoryName || tone.label}
      </span>
    </div>
  )
}

function authorInitial(article: HomeArticle) {
  const name = article.authorName?.trim()
  return name ? name.charAt(0).toUpperCase() : '•'
}

export function ArticleReaderHeadline({ article }: { article: HomeArticle }) {
  const tone = articleTone(article)
  const date = formatArticleDateLong(article)
  const minutes = articleReadingMinutes(article)

  return (
    <header className="space-y-4">
      <h1 className="text-2xl font-bold leading-tight tracking-tight text-neutral-900 text-balance sm:text-3xl">
        {article.title || 'Bài viết'}
      </h1>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-neutral-200 pb-4 text-xs text-neutral-500">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white',
              tone.dot,
            )}
          >
            {authorInitial(article)}
          </span>
          <span className="text-sm font-medium text-neutral-800">
            {article.authorName || 'Ban truyền thông'}
          </span>
        </span>

        {date && (
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} strokeWidth={1.5} />
            {date}
          </span>
        )}

        {minutes > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock3 size={14} strokeWidth={1.5} />
            {minutes} phút đọc
          </span>
        )}

        {article.code && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 tabular-nums text-neutral-500">
            {article.code}
          </span>
        )}
      </div>
    </header>
  )
}
