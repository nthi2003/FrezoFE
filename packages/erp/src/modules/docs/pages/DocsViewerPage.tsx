// ============================================================
// DocsViewerPage — /docs/:slug (FR-DOC-02 + FR-DOC-04)
// ============================================================

import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { Button, EmptyState, ErrorState, PageHeader } from '@frezo/ui'
import { MarkdownView } from '../components/MarkdownView'
import { DocsSideNav } from '../components/DocsSideNav'
import { useHubDocs, useResolvedDoc } from '../hooks/useGuides'

export function DocsViewerPage() {
  const { slug } = useParams<{ slug: string }>()
  const nav = useNavigate()
  const hub = useHubDocs()
  const { data: doc, isLoading, isError, refetch, isFetching } = useResolvedDoc(slug)
  const list = hub.data?.docs ?? []
  const euIdx = doc ? list.findIndex((d) => d.slug === doc.slug) : -1
  const prev = euIdx > 0 ? list[euIdx - 1] : undefined
  const next = euIdx >= 0 && euIdx < list.length - 1 ? list[euIdx + 1] : undefined

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto w-full text-sm text-neutral-500">
        Đang tải tài liệu…
      </div>
    )
  }

  if (isError && !doc) {
    return (
      <div className="p-6 max-w-6xl mx-auto w-full">
        <ErrorState
          title="Không tải được bài hướng dẫn"
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="p-6 max-w-6xl mx-auto w-full">
        <EmptyState
          icon={BookOpen}
          title="Không tìm thấy tài liệu"
          description="Bài này không còn trong danh sách hướng dẫn. Quay lại danh sách để chọn bài khác."
          action={{ label: 'Về danh sách tài liệu', onClick: () => nav('/docs') }}
        />
      </div>
    )
  }

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto w-full">
      <PageHeader
        title={doc.title}
        description={doc.description}
        actions={
          <Button
            variant="outline"
            className="gap-1"
            onClick={() => nav('/docs')}
          >
            <ArrowLeft size={14} /> Tất cả tài liệu
          </Button>
        }
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
        <DocsSideNav activeSlug={doc.slug} docs={list} />

        <div className="min-w-0 space-y-4">
          <article className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <MarkdownView source={doc.body} skipFirstH1 />
          </article>

          {euIdx >= 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {prev ? (
                <Link
                  to={`/docs/${prev.slug}`}
                  className="group flex items-center gap-3 p-4 rounded-xl border border-neutral-200 bg-white hover:border-primary-300 hover:shadow-sm transition"
                >
                  <ArrowLeft
                    size={16}
                    className="text-neutral-400 group-hover:text-primary-600 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-neutral-400 font-semibold">
                      Trước
                    </div>
                    <div className="text-sm font-medium text-neutral-900 group-hover:text-primary-800 truncate">
                      {prev.title}
                    </div>
                  </div>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  to={`/docs/${next.slug}`}
                  className="group flex items-center justify-end gap-3 p-4 rounded-xl border border-neutral-200 bg-white hover:border-primary-300 hover:shadow-sm transition text-right"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-neutral-400 font-semibold">
                      Tiếp
                    </div>
                    <div className="text-sm font-medium text-neutral-900 group-hover:text-primary-800 truncate">
                      {next.title}
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-neutral-400 group-hover:text-primary-600 shrink-0"
                  />
                </Link>
              ) : null}
            </div>
          ) : null}

          <nav className="flex flex-wrap gap-2 pt-1">
            {list
              .filter((d) => d.slug !== doc.slug)
              .map((d) => (
                <Link
                  key={d.slug}
                  to={`/docs/${d.slug}`}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50/50 transition"
                >
                  {d.title}
                </Link>
              ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
