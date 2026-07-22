// ============================================================
// CommentDrawer — side panel gắn CommentThread vào record
// ============================================================

import { X, MessageSquare } from 'lucide-react'
import { CommentThread } from './CommentThread'

interface Props {
  open: boolean
  onClose: () => void
  subjectType: string
  subjectId: string
  title?: string
  subtitle?: string
}

export function CommentDrawer({
  open,
  onClose,
  subjectType,
  subjectId,
  title = 'Bình luận',
  subtitle,
}: Props) {
  if (!open) return null
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-neutral-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <header className="px-4 py-3 border-b border-neutral-100 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
            <MessageSquare size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-neutral-900 truncate">{title}</h2>
            {subtitle && (
              <p className="text-xs text-neutral-500 truncate mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-hidden p-4">
          <CommentThread subjectType={subjectType} subjectId={subjectId} />
        </div>
      </aside>
    </>
  )
}
