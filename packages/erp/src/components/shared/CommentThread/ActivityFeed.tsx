// ============================================================
// ActivityFeed — merge system log + comment (đã sort sẵn từ API)
// ============================================================

import { CommentItem } from './CommentItem'
import type { CommentDto } from './types'

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
  // Flat thread: roots + replies 1 tầng
  const roots = items.filter((c) => !c.parentId)
  const repliesOf = (parentId: string) =>
    items.filter((c) => c.parentId === parentId)

  return (
    <div className="space-y-1">
      {roots.map((root) => (
        <div key={root.id}>
          <CommentItem
            comment={root}
            depth={0}
            onReply={root.isSystem ? undefined : onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={!root.isSystem && !!currentUserId && root.authorId === currentUserId}
          />
          {repliesOf(root.id).map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              depth={1}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={!r.isSystem && !!currentUserId && r.authorId === currentUserId}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
