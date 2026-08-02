// Headline list tin nội bộ — bổ sung carousel, compact 2–3 dòng

import { useNavigate } from 'react-router-dom'
import { ChevronRight, Newspaper } from 'lucide-react'
import { Button, Skeleton } from '@frezo/ui'
import {
  articleTypeLabel,
  formatArticleDate,
  type HomeArticle,
} from '@/modules/articles/utils/homeArticle'

interface LobbyArticleHeadlinesProps {
  articles: HomeArticle[]
  isLoading?: boolean
  limit?: number
}

export function LobbyArticleHeadlines({
  articles,
  isLoading = false,
  limit = 3,
}: LobbyArticleHeadlinesProps) {
  const nav = useNavigate()
  const items = articles.slice(0, limit)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-start gap-2 py-2">
        <p className="text-sm text-neutral-500">Chưa có tin mới</p>
        <Button size="sm" variant="outline" onClick={() => nav('/bai-viet')}>
          Xem tin nội bộ
        </Button>
      </div>
    )
  }

  return (
    <section aria-label="Tin nội bộ">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
          <Newspaper size={15} strokeWidth={1.5} className="text-neutral-400" />
          Tin nội bộ
        </h2>
        <button
          type="button"
          onClick={() => nav('/bai-viet')}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-primary-600 hover:text-primary-800"
        >
          Xem tất cả
          <ChevronRight size={13} />
        </button>
      </div>
      <ul className="space-y-1">
        {items.map((article) => {
          const typeLabel = articleTypeLabel(article)
          const dateLabel = formatArticleDate(article)
          return (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => nav(`/bai-viet/${article.id}`)}
                className="group flex w-full items-baseline gap-2 rounded-lg px-1 py-2 text-left transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {typeLabel && (
                  <span className="shrink-0 text-2xs font-semibold uppercase tracking-wide text-neutral-400">
                    {typeLabel}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-neutral-800 group-hover:text-primary-800">
                  {article.title || 'Thông báo nội bộ'}
                </span>
                {dateLabel && (
                  <span className="shrink-0 text-xs tabular-nums text-neutral-400">{dateLabel}</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
