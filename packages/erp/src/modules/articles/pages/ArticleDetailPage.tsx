// Reader view — /bai-viet/:id

import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Home, Link2, Newspaper } from 'lucide-react'
import {
  Breadcrumb,
  Button,
  EmptyState,
  ErrorState,
  PageGuideButton,
  Skeleton,
} from '@frezo/ui'
import { toast } from '@/lib/toast'
import { useHomeArticleById } from '../hooks/useArticle'
import { ARTICLES_READER_GUIDE } from '../constants/articles-reader.guide'
import type { HomeArticle } from '../utils/homeArticle'
import {
  ArticleReaderBanner,
  ArticleReaderHeadline,
} from '../components/ArticleReaderHero'
import { RelatedArticles } from '../components/RelatedArticles'

const LIST_PATH = '/bai-viet'

/** Card nội dung đè lên chân ảnh cover — tạo chiều sâu cho khối đọc. */
const READER_CARD =
  'relative -mt-10 mx-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-card sm:-mt-14 sm:mx-6 sm:p-8 lg:mx-10 lg:p-10'

/** Cột chữ hẹp hơn card để dòng văn không dài quá tầm mắt. */
const READER_COLUMN = 'mx-auto max-w-2xl'

function httpStatus(err: unknown): number | undefined {
  const res = (err as { response?: { status?: number } } | null)?.response
  return typeof res?.status === 'number' ? res.status : undefined
}

/** Khung chung cho mọi trạng thái để nền + bề rộng cột đọc không nhảy. */
function ReaderShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary-50/80 via-primary-50/25 to-transparent"
      />
      <div className="relative mx-auto max-w-4xl space-y-6 p-4 animate-fade-in md:p-6">
        {children}
      </div>
    </div>
  )
}

function ReaderSkeleton() {
  return (
    <div>
      <Skeleton className="h-52 w-full rounded-2xl sm:h-64 lg:h-80" />
      <div className={READER_CARD}>
        <div className={READER_COLUMN}>
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="mt-2 h-7 w-2/5" />
          <div className="mt-5 flex items-center gap-3 border-b border-neutral-200 pb-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ArticleDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data, isLoading, isError, error, refetch, isFetching } = useHomeArticleById(id)
  const article = data as HomeArticle | undefined

  const status = httpStatus(error)
  // 404/403 = bài không tồn tại / chưa xuất bản → empty state, không phải lỗi hệ thống.
  const isMissing =
    !id ||
    status === 404 ||
    status === 403 ||
    (!isLoading && !isError && !article?.id && !article?.title)

  const crumbs = (current: string) => (
    <Breadcrumb
      items={[
        { label: 'Trang chủ', onClick: () => nav('/') },
        { label: 'Tin & bài viết', onClick: () => nav(LIST_PATH) },
        { label: current },
      ]}
    />
  )

  const homeCtas = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button onClick={() => nav('/')}>
        <Home size={16} strokeWidth={1.5} className="mr-1.5" /> Về Trang chủ
      </Button>
      <Button variant="outline" onClick={() => nav(LIST_PATH)}>
        Xem tin khác
      </Button>
    </div>
  )

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Đã sao chép liên kết bài viết')
    } catch {
      toast.error('Trình duyệt không cho phép sao chép liên kết')
    }
  }

  if (isLoading) {
    return (
      <ReaderShell>
        {crumbs('Đang tải…')}
        <ReaderSkeleton />
      </ReaderShell>
    )
  }

  if (isError && !isMissing) {
    return (
      <ReaderShell>
        {crumbs('Bài viết')}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-card">
          <ErrorState
            title="Không tải được bài viết"
            message="Kết nối tới máy chủ đang có vấn đề. Thử lại sau vài giây."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        </div>
        {homeCtas}
      </ReaderShell>
    )
  }

  if (isMissing || !article) {
    return (
      <ReaderShell>
        {crumbs('Không tìm thấy')}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-card">
          <EmptyState
            icon={Newspaper}
            title="Không tìm thấy bài viết"
            description="Liên kết có thể đã hết hạn, bài đã gỡ hoặc chưa được xuất bản."
            action={homeCtas}
          />
        </div>
      </ReaderShell>
    )
  }

  const body = article.content || article.summary || ''
  const bodyHtml = body.includes('<') ? body : body.replace(/\n/g, '<br/>')
  const hasSummaryLead = !!article.summary && !!article.content

  return (
    <ReaderShell>
      {crumbs(article.title || 'Bài viết')}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => nav(-1)} className="-ml-2 gap-1.5">
          <ArrowLeft size={16} strokeWidth={1.5} /> Quay lại
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void copyLink()}>
            <Link2 size={16} strokeWidth={1.5} className="mr-1.5" /> Sao chép liên kết
          </Button>
          <PageGuideButton guide={ARTICLES_READER_GUIDE} />
        </div>
      </div>

      <article>
        <ArticleReaderBanner article={article} />

        <div className={READER_CARD}>
          <div className={READER_COLUMN}>
            <ArticleReaderHeadline article={article} />

            {hasSummaryLead && (
              <p className="mt-6 border-l-2 border-primary-300 pl-4 text-base leading-relaxed text-neutral-600">
                {article.summary}
              </p>
            )}

            {body ? (
              <div
                className="prose prose-neutral mt-6 max-w-none text-neutral-800
                  prose-headings:font-semibold prose-headings:tracking-tight
                  prose-h2:mt-10 prose-h2:text-xl prose-h3:text-lg
                  prose-p:leading-relaxed
                  prose-a:font-medium prose-a:text-primary-700 hover:prose-a:text-primary-800
                  prose-strong:text-neutral-900
                  prose-blockquote:border-l-primary-300 prose-blockquote:not-italic prose-blockquote:text-neutral-600
                  prose-img:rounded-xl prose-img:border prose-img:border-neutral-200
                  prose-hr:border-neutral-200
                  prose-li:marker:text-primary-500"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            ) : (
              <p className="mt-6 rounded-xl bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
                Bài viết này chưa có nội dung chi tiết.
              </p>
            )}
          </div>
        </div>
      </article>

      <RelatedArticles current={article} onOpen={(next) => nav(`${LIST_PATH}/${next}`)} />

      <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-white to-primary-50/60 p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">Hết bài</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Xem thêm thông báo và bài viết nội bộ mới nhất của Frezo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => nav(LIST_PATH)}>Xem tin khác</Button>
            <Button variant="outline" onClick={() => nav('/')}>
              <Home size={16} strokeWidth={1.5} className="mr-1.5" /> Về Trang chủ
            </Button>
          </div>
        </div>
      </div>
    </ReaderShell>
  )
}
