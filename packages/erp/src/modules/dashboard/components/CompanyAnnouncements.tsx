// ============================================================
// Công bố nội bộ — card grid có cover ảnh thật
// Bài nổi bật nhất do HomeHero giữ; section này nhận phần còn lại.
// ============================================================

import { useNavigate } from 'react-router-dom'
import { ChevronRight, Megaphone } from 'lucide-react'
import { EmptyState, ErrorState, Skeleton } from '@frezo/ui'
import { ArticleCover } from '@/modules/articles/components/ArticleCover'
import {
  articleCover,
  articleExcerpt,
  articleTypeLabel,
  formatArticleDate,
  type HomeArticle,
} from '@/modules/articles/utils/homeArticle'

interface CompanyAnnouncementsProps {
  items: HomeArticle[]
  isLoading?: boolean
  isError?: boolean
  isFetching?: boolean
  onRetry?: () => void
  /** true khi feed rỗng hoàn toàn (kể cả bài đã lên Hero). */
  isFeedEmpty?: boolean
}

export function CompanyAnnouncements({
  items,
  isLoading = false,
  isError = false,
  isFetching = false,
  onRetry,
  isFeedEmpty = false,
}: CompanyAnnouncementsProps) {
  const nav = useNavigate()

  // Hero đã cover trường hợp rỗng bằng thông điệp riêng — không lặp empty state.
  if (!isLoading && !isError && items.length === 0 && isFeedEmpty) return null

  return (
    <section className="rounded-xl border border-neutral-200 bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
            <Megaphone size={18} strokeWidth={1.5} className="text-primary-600" />
            Thông báo &amp; tin nội bộ
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Nội dung đã xuất bản cho toàn công ty
          </p>
        </div>
        <button
          type="button"
          onClick={() => nav('/bai-viet')}
          className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary-700 hover:text-primary-800"
        >
          Xem tất cả <ChevronRight size={14} strokeWidth={1.5} />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[16/9] w-full rounded-lg" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Không tải được thông báo"
          message="Kiểm tra kết nối rồi thử lại."
          onRetry={onRetry}
          isRetrying={isFetching}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Không còn thông báo nào khác"
          description="Các công bố tiếp theo của công ty sẽ hiện ở đây."
          action={{ label: 'Mở trang tin', onClick: () => nav('/bai-viet') }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => {
            const typeLabel = articleTypeLabel(a)
            const date = formatArticleDate(a)
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => nav(`/bai-viet/${a.id}`)}
                className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface text-left transition-colors duration-150 hover:border-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                <ArticleCover
                  src={articleCover(a)}
                  alt={a.title || ''}
                  zoomOnGroupHover
                  className="aspect-[16/9] w-full border-b border-neutral-200"
                />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-2 text-2xs text-neutral-400">
                    {typeLabel && (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium text-neutral-600">
                        {typeLabel}
                      </span>
                    )}
                    {date && <span>{date}</span>}
                  </div>
                  <h3 className="mt-1.5 text-sm font-semibold leading-snug text-neutral-900 line-clamp-2">
                    {a.title || 'Thông báo'}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-500 line-clamp-2">
                    {articleExcerpt(a, 120)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
