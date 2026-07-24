// Compact recent articles strip for Home portal

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Newspaper, ChevronRight } from 'lucide-react'
import { Skeleton } from '@frezo/ui'
import { useHomeFeedArticles } from '@/modules/articles/hooks/useArticle'

function formatDate(v?: string | null) {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function RecentArticles({ skipIds = [] as string[] }: { skipIds?: string[] }) {
  const nav = useNavigate()
  const { data, isLoading } = useHomeFeedArticles()

  const items = useMemo(() => {
    const skip = new Set(skipIds)
    const list = Array.isArray(data) ? data : []
    return list
      .filter((a) => a?.id && !skip.has(a.id))
      .sort((a, b) => {
        const ta = new Date(a.publishedAt || a.publishedDate || a.createdAt || 0).getTime()
        const tb = new Date(b.publishedAt || b.publishedDate || b.createdAt || 0).getTime()
        return tb - ta
      })
      .slice(0, 6)
  }, [data, skipIds])

  if (!isLoading && items.length === 0) return null

  return (
    <section className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
          <Newspaper size={18} className="text-primary-600" />
          Tin & bài viết mới
        </h2>
        <button
          type="button"
          onClick={() => nav('/bai-viet')}
          className="text-xs font-medium text-primary-700 hover:text-primary-800 inline-flex items-center gap-0.5"
        >
          Tất cả <ChevronRight size={14} />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => nav(`/bai-viet/${a.id}`)}
              className="rounded-xl border border-neutral-200 px-3.5 py-3 text-left hover:border-primary-300 hover:bg-primary-50/30 transition"
            >
              <div className="text-sm font-medium text-neutral-800 line-clamp-2">{a.title}</div>
              <div className="text-xs text-neutral-400 mt-1">
                {formatDate(a.publishedAt || a.publishedDate || a.createdAt)}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
