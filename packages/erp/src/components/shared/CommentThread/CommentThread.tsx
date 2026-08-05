// ============================================================
// CommentThread — panel bình luận + activity feed (FZ-004 / FE-2)
// ============================================================

import { useRef, useState } from 'react'
import { MessageSquare, Paperclip, Send, Loader2, X } from 'lucide-react'
import { Button } from '@frezo/ui'
import { toast } from 'sonner'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import { useAuthStore } from '@/stores/authStore'
import { MentionInput, type MentionInputHandle } from './MentionInput'
import { EmojiPicker } from './EmojiPicker'
import { ActivityFeed } from './ActivityFeed'
import {
  useComments, useCreateComment, useUpdateComment, useDeleteComment,
  useUploadCommentAttachment,
} from './useComments'
import type { CommentAttachment, CommentDto } from './types'
import { COMMENT_ATTACH_ACCEPT, COMMENT_ATTACH_MAX_BYTES } from './types'

interface Props {
  subjectType: string
  subjectId: string
  title?: string
  className?: string
}

interface PendingFile {
  key: string
  file: File
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
  const upload = useUploadCommentAttachment()

  const [text, setText] = useState('')
  const [mentionedIds, setMentionedIds] = useState<string[]>([])
  const [replyTo, setReplyTo] = useState<CommentDto | null>(null)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mentionRef = useRef<MentionInputHandle>(null)
  const { askConfirm, confirmDialog } = useConfirmDialog()

  const userComments = items.filter((c) => !c.isSystem && !c.deleted)
  const busy = create.isPending || upload.isPending
  const canSubmit = !!text.trim() || pendingFiles.length > 0

  const onPickFiles = (list: FileList | null) => {
    if (!list?.length) return
    const next: PendingFile[] = []
    for (const file of Array.from(list)) {
      if (file.size > COMMENT_ATTACH_MAX_BYTES) {
        toast.error(`"${file.name}" vượt quá 10MB`)
        continue
      }
      next.push({ key: `${file.name}-${file.size}-${file.lastModified}`, file })
    }
    if (next.length) {
      setPendingFiles((prev) => {
        const seen = new Set(prev.map((p) => p.key))
        return [...prev, ...next.filter((n) => !seen.has(n.key))]
      })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const submit = async () => {
    const content = text.trim()
    if (!content && pendingFiles.length === 0) return

    let attachments: CommentAttachment[] = []
    try {
      if (pendingFiles.length > 0) {
        const uploaded = await Promise.all(
          pendingFiles.map((p) => upload.mutateAsync(p.file)),
        )
        attachments = uploaded.filter(Boolean).map((u) => ({
          url: u!.url,
          name: u!.name,
          contentType: u!.contentType,
          size: u!.size,
          objectName: u!.objectName,
        }))
      }
    } catch {
      return
    }

    create.mutate(
      {
        content,
        parentId: replyTo?.id,
        mentionedUserIds: mentionedIds,
        attachments: attachments.length ? attachments : undefined,
      },
      {
        onSuccess: () => {
          setText('')
          setMentionedIds([])
          setReplyTo(null)
          setPendingFiles([])
        },
      },
    )
  }

  return (
    <>
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
            {items.length > 0 && (
              <ActivityFeed
                items={items}
                currentUserId={currentUserId}
                onReply={setReplyTo}
                onEdit={(id, content) => update.mutate({ id, content })}
                onDelete={(id) => {
                  askConfirm({
                    title: 'Xoá bình luận này?',
                    message: 'Bình luận sẽ bị xoá và không hoàn tác.',
                    confirmText: 'Xoá',
                    onConfirm: () => remove.mutate(id),
                  })
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
          ref={mentionRef}
          value={text}
          mentionedIds={mentionedIds}
          onChange={(v, ids) => {
            setText(v)
            setMentionedIds(ids)
          }}
          onSubmit={() => {
            void submit()
          }}
          disabled={busy}
        />
        {pendingFiles.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {pendingFiles.map((p) => (
              <li
                key={p.key}
                className="inline-flex items-center gap-1 max-w-full text-[11px] px-2 py-1 rounded-md bg-neutral-50 border border-neutral-200 text-neutral-700"
              >
                <Paperclip size={11} className="shrink-0 text-neutral-400" />
                <span className="truncate" title={p.file.name}>{p.file.name}</span>
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-neutral-200 text-neutral-500"
                  aria-label={`Bỏ ${p.file.name}`}
                  onClick={() =>
                    setPendingFiles((prev) => prev.filter((x) => x.key !== p.key))
                  }
                >
                  <X size={11} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={COMMENT_ATTACH_ACCEPT}
            multiple
            onChange={(e) => onPickFiles(e.target.files)}
          />
          <button
            type="button"
            className="inline-flex items-center gap-1 h-8 px-2.5 text-xs text-neutral-700 border border-neutral-200 rounded-md hover:bg-neutral-50 hover:border-neutral-300 transition disabled:opacity-50"
            title="Đính kèm ảnh, PDF hoặc Word (tối đa 10MB)"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={12} /> Đính kèm
          </button>
          <EmojiPicker
            disabled={busy}
            onPick={(emoji) => mentionRef.current?.insertAtCursor(emoji)}
          />
          <div className="flex-1" />
          <Button
            size="sm"
            className="gap-1.5"
            disabled={busy || !canSubmit}
            onClick={() => {
              void submit()
            }}
          >
            {busy ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            Gửi
          </Button>
        </div>
      </div>
    </div>
    {confirmDialog}
    </>
  )
}
