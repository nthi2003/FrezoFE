// Reader view — /bai-viet/:id

import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Home, Calendar, User as UserIcon } from 'lucide-react'
import { Button, EmptyState, ErrorState, PageHeader, Skeleton } from '@frezo/ui'
import { useHomeArticleById } from '../hooks/useArticle'

function formatDate(v?: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ArticleDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: article, isLoading, isError, refetch, isFetching } = useHomeArticleById(id)

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 max-w-3xl mx-auto animate-fade-in">
        <ErrorState
          title="Không tải được bài viết"
          message="Bài có thể đã gỡ hoặc bạn không có quyền xem."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
        <div className="mt-4 flex gap-2 justify-center">
          <Button variant="outline" onClick={() => nav('/bai-viet')}>
            Danh sách bài viết
          </Button>
          <Button variant="outline" onClick={() => nav('/')}>
            <Home size={14} className="mr-1.5" /> Trang chủ
          </Button>
        </div>
      </div>
    )
  }

  if (!article?.id && !article?.title) {
    return (
      <div className="p-6 max-w-3xl mx-auto animate-fade-in">
        <EmptyState
          title="Không tìm thấy bài viết"
          description="Liên kết có thể đã hết hạn hoặc bài chưa xuất bản."
          action={{ label: 'Về Trang chủ', onClick: () => nav('/') }}
        />
      </div>
    )
  }

  const body = article.content || article.summary || ''

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" onClick={() => nav(-1)} className="gap-1.5 -ml-2">
          <ArrowLeft size={14} /> Quay lại
        </Button>
        <span className="text-neutral-300">·</span>
        <Link to="/" className="text-primary-700 hover:underline inline-flex items-center gap-1">
          <Home size={13} /> Trang chủ
        </Link>
        <span className="text-neutral-300">·</span>
        <Link to="/bai-viet" className="text-primary-700 hover:underline">
          Tin & bài viết
        </Link>
      </div>

      <PageHeader
        title={article.title || 'Bài viết'}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <Calendar size={13} />
              {formatDate(article.publishedAt || article.publishedDate || article.createdAt)}
            </span>
            {article.authorName && (
              <span className="inline-flex items-center gap-1">
                <UserIcon size={13} />
                {article.authorName}
              </span>
            )}
            {article.code && (
              <span className="text-neutral-400 tabular-nums">{article.code}</span>
            )}
          </span>
        }
      />

      {article.summary && (
        <p className="text-base text-neutral-600 leading-relaxed border-l-2 border-primary-300 pl-4">
          {article.summary}
        </p>
      )}

      <article
        className="prose prose-neutral max-w-none text-neutral-800 leading-relaxed
          prose-headings:font-semibold prose-a:text-primary-700
          bg-white rounded-2xl border border-neutral-200/60 shadow-sm p-6 md:p-8"
        dangerouslySetInnerHTML={{
          __html: body.includes('<') ? body : body.replace(/\n/g, '<br/>'),
        }}
      />

      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" onClick={() => nav('/bai-viet')}>
          Xem tin khác
        </Button>
        <Button variant="ghost" onClick={() => nav('/')}>
          <Home size={14} className="mr-1.5" /> Về Trang chủ
        </Button>
      </div>
    </div>
  )
}
