// ============================================================
// Docs side nav — sticky list (EU docs / CMS list)
// ============================================================

import { NavLink } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

type NavDoc = { slug: string; title: string; description?: string }

export function DocsSideNav({
  activeSlug,
  docs,
}: {
  activeSlug?: string
  docs?: NavDoc[]
}) {
  const items = docs ?? []

  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 bg-primary-50/40 flex items-center gap-2">
          <BookOpen size={14} className="text-primary-700" />
          <span className="text-xs font-semibold uppercase tracking-wide text-primary-800">
            Mục lục
          </span>
        </div>
        <nav className="p-2 space-y-0.5">
          <NavLink
            to="/docs"
            end
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm transition ${
                isActive && !activeSlug
                  ? 'bg-primary-600 text-white font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`
            }
          >
            Tất cả tài liệu
          </NavLink>
          {items.map((doc) => {
            const active = activeSlug === doc.slug
            return (
              <NavLink
                key={doc.slug}
                to={`/docs/${doc.slug}`}
                className={() =>
                  `block rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-primary-600 text-white font-medium'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`
                }
              >
                <div className="leading-snug">{doc.title}</div>
                <div
                  className={`text-[11px] mt-0.5 truncate ${
                    active ? 'text-primary-100' : 'text-neutral-400'
                  }`}
                >
                  {doc.description}
                </div>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
