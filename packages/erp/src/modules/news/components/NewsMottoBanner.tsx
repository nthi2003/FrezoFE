import { Quote } from 'lucide-react'

interface NewsMottoBannerProps {
  content?: string | null
  author?: string | null
}

export function NewsMottoBanner({ content, author }: NewsMottoBannerProps) {
  if (!content?.trim()) return null

  return (
    <aside className="rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50/80 to-white px-5 py-4 shadow-sm">
      <div className="flex gap-3">
        <Quote size={20} className="mt-0.5 shrink-0 text-primary-500" />
        <div className="min-w-0">
          <p className="text-sm italic leading-relaxed text-neutral-700">&ldquo;{content}&rdquo;</p>
          {author?.trim() && (
            <p className="mt-2 text-xs font-medium text-neutral-500">— {author}</p>
          )}
        </div>
      </div>
    </aside>
  )
}
