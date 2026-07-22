// ============================================================
// CommentThread — panel bình luận + activity feed (FZ-004 / FE-2)
// ============================================================

import { useState } from 'react'
import { MessageSquare, Paperclip, Send, Loader2 } from 'lucide-react'
import { Button } from '@frezo/ui'
import { useAuthStore } from '@/stores/authStore'
import { MentionInput } from './MentionInput'
import { ActivityFeed } from './ActivityFeed'
import {
  useComments, useCreateComment, useUpdateComment, useDeleteComment,
} from './useComments'
import type { CommentDto } from './types'

interface Props {
  subjectType: string
  subjectId: string
  title?: string
  className?: string
}

export function CommentThread({
  subjectType,
  subjectId,
  title = 'Bình luận',
  className,
}: Props) {
  const user = useAuthStore((s) => s.user)
  const currentUserId = user?.id || user?.username || ''

  const { data: items = [], isLoading } = useComments(subjectType, subjectId)
  const create = useCreateComment(subjectType, subjectId)
  const update = useUpdateComment(subjectType, subjectId)
  const remove = useDeleteComment(subjectType, subjectId)

  const [text, setText] = useState('')
  const [mentionedIds, setMentionedIds] = useState<string[]>([])
  const [replyTo, setReplyTo] = useState<CommentDto | null>(null)

  const userComments = items.filter((c) => !c.isSystem && !c.deleted)

  const submit = () => {
    const content = text.trim()
    if (!content) return
    create.mutate(
      {
        content,
        parentId: replyTo?.id,
        mentionedUserIds: mentionedIds,
      },
      {
        onSuccess: () => {
          setText('')
          setMentionedIds([])
          setReplyTo(null)
        },
      },
    )
  }

  return (
    <div className={`flex flex-col h-full min-h-[320px] ${className || ''}`}>
      <div className="flex items-center gap-2 px-1 pb-3 border-b border-neutral-100">
        <MessageSquare size={15} className="text-primary-600" />
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
        <span className="text-[11px] text-neutral-400 ml-auto">
          {userComments.length} bình luận
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-3 min-h-[160px]">
        {isLoading ? (
          <div className="space-y-3 px-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-2.5 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-neutral-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-neutral-100 rounded w-1/3" />
                  <div className="h-3 bg-neutral-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* BUG-13: luôn hiện ActivityFeed (system log) kể cả khi chưa có comment user */}
            {items.length > 0 && (
              <ActivityFeed
                items={items}
                currentUserId={currentUserId}
                onReply={setReplyTo}
                onEdit={(id, content) => update.mutate({ id, content })}
                onDelete={(id) => {
                  if (confirm('Xoá bình luận này?')) remove.mutate(id)
                }}
              />
            )}
            {userComments.length === 0 && (
              <p className="text-sm text-neutral-400 text-center py-6">
                Chưa có bình luận, hãy là người đầu tiên — dùng @ để mention.
              </p>
            )}
          </>
        )}
      </div>

      <div className="border-t border-neutral-100 pt-3 space-y-2">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs bg-primary-50 text-primary-700 px-2 py-1.5 rounded-md">
            Đang trả lời <b>{replyTo.authorName}</b>
            <button
              type="button"
              className="ml-auto text-primary-500 hover:underline"
              onClick={() => setReplyTo(null)}
            >
              Huỷ
            </button>
          </div>
        )}
        <MentionInput
          value={text}
          mentionedIds={mentionedIds}
          onChange={(v, ids) => {
            setText(v)
            setMentionedIds(ids)
          }}
          onSubmit={submit}
          disabled={create.isPending}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 h-8 px-2.5 text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-md cursor-not-allowed"
            title="Coming — chờ MinIO upload"
            disabled
          >
            <Paperclip size={12} /> Đính kèm (Coming)
          </button>
          <div className="flex-1" />
          <Button
            size="sm"
            className="gap-1.5"
            disabled={create.isPending || !text.trim()}
            onClick={submit}
          >
            {create.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            Gửi
          </Button>
        </div>
      </div>
    </div>
  )
}
