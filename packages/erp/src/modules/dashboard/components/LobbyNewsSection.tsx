// Carousel + headline list — responsive layout cho tin nội bộ lobby

import { FeaturedArticleCarousel } from './FeaturedArticleCarousel'
import { LobbyArticleHeadlines } from './LobbyArticleHeadlines'
import type { HomeArticle } from '@/modules/articles/utils/homeArticle'

interface LobbyNewsSectionProps {
  articles: HomeArticle[]
  isLoading?: boolean
}

export function LobbyNewsSection({ articles, isLoading = false }: LobbyNewsSectionProps) {
  const showCarousel = isLoading || articles.length > 0
  const useSideBySide = !isLoading && articles.length >= 2

  if (!showCarousel && !isLoading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-surface-secondary p-6">
        <LobbyArticleHeadlines articles={articles} isLoading={isLoading} />
      </div>
    )
  }

  if (useSideBySide) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
        <LobbyArticleHeadlines articles={articles} isLoading={isLoading} />
        <FeaturedArticleCarousel articles={articles} isLoading={isLoading} compact />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FeaturedArticleCarousel articles={articles} isLoading={isLoading} compact={articles.length <= 1} />
      {!isLoading && articles.length > 0 && (
        <LobbyArticleHeadlines articles={articles.slice(1)} isLoading={false} limit={2} />
      )}
    </div>
  )
}
