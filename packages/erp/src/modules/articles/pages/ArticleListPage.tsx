// Reader list — /bai-viet

import { useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Home, Newspaper, ChevronRight } from 'lucide-react'
import { EmptyState, ErrorState, PageHeader, Skeleton } from '@frezo/ui'
import { useHomeFeedArticles } from '../hooks/useArticle'

function formatDate(v?: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function ArticleListPage() {
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

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="text-sm">
        <Link to="/" className="text-primary-700 hover:underline inline-flex items-center gap-1">
          <Home size={13} /> Trang chủ
        </Link>
      </div>

      <PageHeader
        title="Tin & bài viết"
        description="Thông báo và bài viết nội bộ đã xuất bản"
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Không tải được danh sách"
          message="Thử lại sau vài giây."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : articles.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Chưa có bài viết"
          description="Khi Admin xuất bản tin, danh sách sẽ hiện tại đây."
          action={{ label: 'Về Trang chủ', onClick: () => nav('/') }}
        />
      ) : (
        <ul className="rounded-2xl border border-neutral-200/70 bg-white divide-y divide-neutral-100 shadow-sm">
          {articles.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => nav(`/bai-viet/${a.id}`)}
                className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-neutral-50 transition"
              >
                <span className="mt-0.5 w-9 h-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                  <Newspaper size={16} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900 leading-snug">
                    {a.title}
                  </span>
                  <span className="block text-xs text-neutral-400 mt-1">
                    {formatDate(a.publishedAt || a.publishedDate || a.createdAt)}
                    {a.authorName ? ` · ${a.authorName}` : ''}
                  </span>
                </span>
                <ChevronRight size={16} className="text-neutral-300 mt-1 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
