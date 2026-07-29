// ============================================================
// "Tháng này" — chương trình / sự kiện đặc sắc nội bộ.
// Chưa có API program riêng → suy từ published articles (type event/
// promotion hoặc tag chương trình). Ghi rõ scope khi phải fallback.
// ============================================================

import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, CalendarDays, Sparkles } from 'lucide-react'
import { EmptyState, Skeleton } from '@frezo/ui'
import { ArticleCover } from '@/modules/articles/components/ArticleCover'
import {
  articleCover,
  articleExcerpt,
  articleTypeLabel,
  formatArticleDate,
  type HomeArticle,
  type ProgramSelection,
} from '@/modules/articles/utils/homeArticle'

interface MonthlyProgramsProps {
  selection: ProgramSelection
  isLoading?: boolean
}

const MONTH_LABEL = () => {
  const d = new Date()
  return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
}

function ProgramCard({ item, onOpen }: { item: HomeArticle; onOpen: (id: string) => void }) {
  const typeLabel = articleTypeLabel(item)
  const date = formatArticleDate(item)

  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-surface text-left transition-colors duration-150 hover:border-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
    >
      <ArticleCover
        src={articleCover(item)}
        alt={item.title || ''}
        iconSize={32}
        zoomOnGroupHover
        className="aspect-[16/9] w-full border-b border-neutral-200"
      />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-2xs">
          <span className="inline-flex items-center gap-1 rounded bg-primary-50 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-primary-700">
            <Sparkles size={10} strokeWidth={2} />
            {typeLabel || 'Chương trình'}
          </span>
          {date && (
            <span className="inline-flex items-center gap-1 text-neutral-400">
              <CalendarDays size={11} strokeWidth={1.5} />
              {date}
            </span>
          )}
        </div>

        <h3 className="mt-2 text-sm font-semibold leading-snug text-neutral-900 line-clamp-2">
          {item.title || 'Chương trình nội bộ'}
        </h3>
        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-neutral-500 line-clamp-2">
          {articleExcerpt(item, 130)}
        </p>

        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 group-hover:text-primary-800">
          Xem chi tiết
          <ArrowUpRight size={14} strokeWidth={2} />
        </span>
      </div>
    </button>
  )
}

export function MonthlyPrograms({ selection, isLoading = false }: MonthlyProgramsProps) {
  const nav = useNavigate()
  const { items, scope } = selection

  return (
    <section className="flex h-full flex-col rounded-xl border border-neutral-200 bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900">
            <Sparkles size={18} strokeWidth={1.5} className="text-primary-600" />
            Chương trình nổi bật
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {scope === 'month'
              ? `Hoạt động nội bộ ${MONTH_LABEL()}`
              : 'Chương trình gần đây — tháng này chưa có bài mới'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => nav('/bai-viet')}
          className="shrink-0 text-xs font-medium text-primary-700 hover:text-primary-800"
        >
          Xem thêm
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[16/9] w-full rounded-lg" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Chưa có chương trình nào trong tháng"
          description="Sự kiện, chương trình thi đua và hoạt động nội bộ sẽ hiển thị tại đây khi được xuất bản."
          action={{ label: 'Mở trang tin', onClick: () => nav('/bai-viet') }}
        />
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item) => (
            <ProgramCard key={item.id} item={item} onOpen={(id) => nav(`/bai-viet/${id}`)} />
          ))}
        </div>
      )}
    </section>
  )
}
