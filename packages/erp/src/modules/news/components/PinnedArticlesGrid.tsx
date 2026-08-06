import { Pin } from 'lucide-react'
import { ArticleGridCard } from '@/modules/articles/components/ArticleCards'
import type { HomeArticle } from '@/modules/articles/utils/homeArticle'

interface PinnedArticlesGridProps {
  articles: HomeArticle[]
  onOpen: (id: string) => void
}

export function PinnedArticlesGrid({ articles, onOpen }: PinnedArticlesGridProps) {
  if (!articles.length) return null

  return (
    <section className="space-y-4" aria-label="Tin nổi bật">
      <div className="flex items-center gap-2">
        <Pin size={16} className="text-primary-600" />
        <h2 className="text-base font-semibold text-neutral-900">Tin nổi bật</h2>
        <span className="text-xs text-neutral-500">({articles.length})</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {articles.map((a) => (
          <ArticleGridCard key={a.id} article={a} onOpen={onOpen} />
        ))}
      </div>
    </section>
  )
}
