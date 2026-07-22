// ============================================================
// DocsHubPage — /docs list (DOC-01, 03, 07)
// ============================================================

import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight } from 'lucide-react'
import { PageHeader } from '@frezo/ui'
import { DOCS } from '@/docs'
import { DocsSideNav } from '../components/DocsSideNav'

export function DocsHubPage() {
  const nav = useNavigate()

  return (
    <div className="p-6 animate-fade-in max-w-6xl mx-auto w-full">
      <PageHeader
        title="Tài liệu"
        description="Hướng dẫn in-app — bắt đầu, menu, changelog sprint."
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
        <DocsSideNav />

        <div className="space-y-3 min-w-0">
          {DOCS.map((doc) => (
            <button
              key={doc.slug}
              type="button"
              onClick={() => nav(`/docs/${doc.slug}`)}
              className="w-full text-left group flex items-start gap-4 p-4 rounded-xl border border-neutral-200 bg-white hover:border-primary-300 hover:shadow-sm transition"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-neutral-900 group-hover:text-primary-800">
                  {doc.title}
                </div>
                <p className="text-sm text-neutral-500 mt-0.5">{doc.description}</p>
                <code className="inline-flex mt-2 px-1.5 py-0.5 rounded-md bg-primary-50 text-primary-800 text-[11px] font-mono border border-primary-100">
                  /docs/{doc.slug}
                </code>
              </div>
              <ChevronRight
                size={16}
                className="text-neutral-300 group-hover:text-primary-600 mt-1 shrink-0"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
