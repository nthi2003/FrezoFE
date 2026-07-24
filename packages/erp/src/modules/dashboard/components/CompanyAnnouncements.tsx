// Company announcements — pinned banner + recent list (P0: published articles)

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, ChevronRight, Pin } from 'lucide-react'
import { EmptyState, ErrorState, Skeleton } from '@frezo/ui'
import { useHomeFeedArticles } from '@/modules/articles/hooks/useArticle'

function formatDate(v?: string | null) {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function stripHtml(html?: string | null, max = 140): string {
  if (!html) return ''
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function CompanyAnnouncements() {
  const nav = useNavigate()
  const { data, isLoading, isError, refetch, isFetching } = useHomeFeedArticles()

  const articles = useMemo(() => {
    const list = Array.isArray(data) ? data : []
    return [...list].sort((a, b) => {
      const ta = new Date(a.publishedAt || a.publishedDate || a.createdAt || 0).getTime()
      const tb = new Date(b.publishedAt || b.publishedDate || b.createdAt || 0).getTime()
      return tb - ta
    })
  }, [data])

  // P0 pin heuristic: newest published = featured banner (FR-HOME-04 pin field later)
  const featured = articles[0]
  const rest = articles.slice(1, 5)

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <Megaphone size={18} className="text-amber-600" />
            Thông báo công ty
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Tin quan trọng nội bộ — bấm để đọc đầy đủ
          </p>
        </div>
        <button
          type="button"
          onClick={() => nav('/bai-viet')}
          className="text-xs font-medium text-primary-700 hover:text-primary-800 inline-flex items-center gap-0.5"
        >
          Xem tất cả <ChevronRight size={14} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Không tải được thông báo"
          message="Kiểm tra kết nối rồi thử lại."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : !featured ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6">
          <EmptyState
            title="Chưa có thông báo"
            description="Khi công ty xuất bản bài viết, thông báo sẽ hiện ở đây."
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => nav(`/bai-viet/${featured.id}`)}
            className="w-full text-left rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white p-5 transition hover:border-amber-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                <Pin size={11} /> Nổi bật
              </span>
              <span className="text-xs text-neutral-400">
                {formatDate(featured.publishedAt || featured.publishedDate || featured.createdAt)}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 leading-snug tracking-tight">
              {featured.title || 'Thông báo'}
            </h3>
            {(featured.summary || featured.content) && (
              <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed line-clamp-2">
                {featured.summary || stripHtml(featured.content)}
              </p>
            )}
          </button>

          {rest.length > 0 && (
            <ul className="rounded-xl border border-neutral-200/70 bg-white divide-y divide-neutral-100">
              {rest.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => nav(`/bai-viet/${a.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-neutral-800 truncate">
                        {a.title}
                      </span>
                      <span className="block text-xs text-neutral-400 mt-0.5">
                        {formatDate(a.publishedAt || a.publishedDate || a.createdAt)}
                        {a.authorName ? ` · ${a.authorName}` : ''}
                      </span>
                    </span>
                    <ChevronRight size={16} className="text-neutral-300 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
