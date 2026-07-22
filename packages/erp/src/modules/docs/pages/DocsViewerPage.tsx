// ============================================================
// DocsViewerPage — /docs/:slug (DOC-01…08)
// ============================================================

import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { Button, EmptyState, PageHeader } from '@frezo/ui'
import { DOCS, getDocBySlug } from '@/docs'
import { MarkdownView } from '../components/MarkdownView'
import { DocsSideNav } from '../components/DocsSideNav'

export function DocsViewerPage() {
  const { slug } = useParams<{ slug: string }>()
  const nav = useNavigate()
  const doc = slug ? getDocBySlug(slug) : undefined
  const idx = doc ? DOCS.findIndex((d) => d.slug === doc.slug) : -1
  const prev = idx > 0 ? DOCS[idx - 1] : undefined
  const next = idx >= 0 && idx < DOCS.length - 1 ? DOCS[idx + 1] : undefined

  if (!doc) {
    return (
      <div className="p-6 max-w-6xl mx-auto w-full">
        <EmptyState
          icon={BookOpen}
          title="Không tìm thấy tài liệu"
          description={`Slug “${slug || ''}” không có trong registry.`}
          action={{ label: 'Về hub', onClick: () => nav('/docs') }}
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
        <DocsSideNav activeSlug={doc.slug} />

        <div className="min-w-0 space-y-4">
          <article className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <MarkdownView source={doc.body} skipFirstH1 />
          </article>

          {/* DOC-07/08 related / prev-next */}
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

          <nav className="flex flex-wrap gap-2 pt-1">
            {DOCS.filter((d) => d.slug !== doc.slug).map((d) => (
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
