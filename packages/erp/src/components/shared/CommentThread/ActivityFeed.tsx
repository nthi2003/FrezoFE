// ============================================================
// ActivityFeed — merge system log + comment (đã sort sẵn từ API)
// Đệ quy nhiều lớp reply (max MAX_COMMENT_DEPTH)
// ============================================================

import { CommentItem } from './CommentItem'
import type { CommentDto } from './types'
import { MAX_COMMENT_DEPTH } from './types'

interface Props {
  items: CommentDto[]
  onReply?: (parent: CommentDto) => void
  onEdit?: (id: string, content: string) => void
  onDelete?: (id: string) => void
  currentUserId?: string
}

export function ActivityFeed({
  items,
  onReply,
  onEdit,
  onDelete,
  currentUserId,
}: Props) {
  const roots = items.filter((c) => !c.parentId)
  const repliesOf = (parentId: string) =>
    items.filter((c) => c.parentId === parentId)

  const renderBranch = (comment: CommentDto, depth: number) => {
    const children = repliesOf(comment.id)
    const allowReply =
      !comment.isSystem && depth < MAX_COMMENT_DEPTH ? onReply : undefined

    return (
      <div key={comment.id}>
        <CommentItem
          comment={comment}
          depth={depth}
          onReply={allowReply}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={
            !comment.isSystem &&
            !!currentUserId &&
            comment.authorId === currentUserId
          }
        />
        {children.length > 0 && (
          <div className="ml-8 border-l border-neutral-100 pl-2">
            {children.map((child) => renderBranch(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {roots.map((root) => renderBranch(root, 0))}
    </div>
  )
}
