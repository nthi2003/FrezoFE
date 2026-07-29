// ============================================================
// Khối "Đọc tiếp" cuối trang bài viết.
// Lấy lại feed đã cache của /bai-viet, ưu tiên bài cùng nhóm nội
// dung. Feed lỗi hoặc không đủ bài → không render gì (không dựng
// error state ở cuối bài, tránh nhiễu người đọc).
// ============================================================

import { useMemo } from 'react'
import { useHomeFeedArticles } from '../hooks/useArticle'
import { sortPublishedDesc, type HomeArticle } from '../utils/homeArticle'
import { articleTone } from './ArticleArtwork'
import { ArticleGridCard } from './ArticleCards'

const RELATED_LIMIT = 3

interface RelatedArticlesProps {
  current: HomeArticle
  onOpen: (id: string) => void
}

function pickRelated(all: HomeArticle[], current: HomeArticle): HomeArticle[] {
  const pool = all.filter((a) => a.id !== current.id)
  const toneKey = articleTone(current).key
  const sameTone = pool.filter((a) => articleTone(a).key === toneKey)
  const rest = pool.filter((a) => articleTone(a).key !== toneKey)
  return [...sameTone, ...rest].slice(0, RELATED_LIMIT)
}

export function RelatedArticles({ current, onOpen }: RelatedArticlesProps) {
  const { data, isLoading, isError } = useHomeFeedArticles()

  const related = useMemo(() => {
    if (!data) return []
    return pickRelated(sortPublishedDesc(data), current)
  }, [data, current])

  if (isLoading || isError || related.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
          <span
            aria-hidden="true"
            className="h-4 w-1 rounded-full bg-gradient-to-b from-primary-500 to-emerald-400"
          />
          Đọc tiếp
        </h2>
        <span className="text-xs text-neutral-500">Bài viết cùng chuyên mục</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((a, i) => (
          <ArticleGridCard key={a.id} article={a} onOpen={onOpen} index={i} />
        ))}
      </div>
    </section>
  )
}
