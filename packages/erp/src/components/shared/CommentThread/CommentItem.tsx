import { useState } from 'react'
import { Pencil, Trash2, Reply, MoreHorizontal } from 'lucide-react'
import type { CommentDto } from './types'

interface Props {
  comment: CommentDto
  depth?: 0 | 1
  onReply?: (parent: CommentDto) => void
  onEdit?: (id: string, content: string) => void
  onDelete?: (id: string) => void
  canEdit?: boolean
}

export function CommentItem({
  comment,
  depth = 0,
  onReply,
  onEdit,
  onDelete,
  canEdit,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)

  if (comment.isSystem) {
    return (
      <div className="flex items-center gap-2 py-1.5 text-xs text-neutral-400">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
        <span>{comment.content}</span>
        <span className="ml-auto">{formatWhen(comment.createdAt)}</span>
      </div>
    )
  }

  return (
    <div className={`flex gap-2.5 ${depth === 1 ? 'ml-10 mt-2' : 'py-2'}`}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
        {(comment.authorName || '?').charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-800">{comment.authorName}</span>
          <span className="text-[11px] text-neutral-400">{formatWhen(comment.createdAt)}</span>
          {comment.updatedAt && (
            <span className="text-[10px] text-neutral-400">(đã sửa)</span>
          )}
          {canEdit && !comment.deleted && (
            <div className="relative ml-auto">
              <button
                type="button"
                className="p-1 text-neutral-400 hover:text-neutral-700"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal size={14} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-6 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 py-1 w-32">
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 flex items-center gap-1.5"
                    onClick={() => {
                      setEditing(true)
                      setMenuOpen(false)
                    }}
                  >
                    <Pencil size={12} /> Sửa
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                    onClick={() => {
                      onDelete?.(comment.id)
                      setMenuOpen(false)
                    }}
                  >
                    <Trash2 size={12} /> Xoá
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-1 space-y-1.5">
            <textarea
              rows={2}
              className="w-full border rounded-md px-2 py-1.5 text-sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-primary-600 text-white"
                onClick={() => {
                  onEdit?.(comment.id, draft)
                  setEditing(false)
                }}
              >
                Lưu
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded border"
                onClick={() => {
                  setDraft(comment.content)
                  setEditing(false)
                }}
              >
                Huỷ
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-neutral-700 mt-0.5 leading-relaxed whitespace-pre-wrap">
            {renderContentWithMentions(comment.content, comment.mentions)}
          </div>
        )}

        {depth === 0 && !comment.deleted && onReply && (
          <button
            type="button"
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-primary-600"
            onClick={() => onReply(comment)}
          >
            <Reply size={11} /> Trả lời
          </button>
        )}
      </div>
    </div>
  )
}

function renderContentWithMentions(content: string, _mentionIds: string[]) {
  const parts = content.split(/(@[\w.]+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span
          key={i}
          className="inline-flex items-center px-1 py-0.5 rounded bg-primary-50 text-primary-700 font-medium text-[13px] border border-primary-100 cursor-default"
          title={part}
        >
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function formatWhen(iso: string): string {
  try {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
    if (mins < 1) return 'vừa xong'
    if (mins < 60) return `${mins} phút trước`
    const h = Math.floor(mins / 60)
    if (h < 24) return `${h} giờ trước`
    return new Date(iso).toLocaleDateString('vi-VN')
  } catch {
    return ''
  }
}
