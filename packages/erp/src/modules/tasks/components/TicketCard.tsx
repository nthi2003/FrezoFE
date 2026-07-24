import { useEffect, useRef, useState } from 'react'
import {
  MessageSquare,
  Paperclip,
  MoreVertical,
  Pencil,
  Trash2,
  Circle,
  CheckCircle2,
  ListChecks,
  type LucideIcon,
} from 'lucide-react'

export type KanbanTone = 'info' | 'warning' | 'success' | 'danger' | 'primary' | 'neutral'

export interface TicketChecklistItem {
  label: string
  done?: boolean
}

type TagTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'primary'

interface TicketTag {
  key: string
  label: string
  tone: TagTone
  mono?: boolean
}

interface Props {
  ticket: any
  isDragging?: boolean
  onClick?: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onComment?: () => void
  onDelete?: () => void
  priorityMeta?: { color?: string; name?: string }
  assigneeName?: string
  assigneeAvatarUrl?: string
  /** Current user's personId — dùng để đánh dấu "Của tôi". */
  currentPersonId?: string
}

const TAG_TONE_CLASS: Record<TagTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  info: 'bg-info-light text-info-dark border-info/30',
  success: 'bg-success-light text-success-dark border-success/30',
  warning: 'bg-warning-light text-warning-dark border-warning/30',
  danger: 'bg-danger-light text-danger-dark border-danger/30',
  primary: 'bg-primary-100 text-primary-800 border-primary-200',
}

/**
 * Kanban ticket card — tone nền + viền trái theo category;
 * badge category/priority dùng semantic color (STANDARD §20.2).
 */
export function TicketCard({
  ticket,
  isDragging,
  onClick,
  onDragStart,
  onDragEnd,
  onComment,
  onDelete,
  priorityMeta,
  assigneeName,
  assigneeAvatarUrl,
  currentPersonId,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isMine = currentPersonId && ticket.assigneeId === currentPersonId
  const initials = getInitials(assigneeName || ticket.assigneeId || '?')
  const tone = resolveTone(ticket)
  const progress = resolveProgress(ticket)
  const checklist: TicketChecklistItem[] = Array.isArray(ticket.checklist)
    ? ticket.checklist
    : Array.isArray(ticket.checklistItems)
      ? ticket.checklistItems
      : []
  // BE aggregate (user comments only). Fallback 0 khi chưa có field — không nhầm với checklist.
  const commentCount =
    typeof ticket.commentCount === 'number' ? ticket.commentCount : 0
  const attachmentCount =
    typeof ticket.attachmentCount === 'number' ? ticket.attachmentCount : null
  const checklistDone = checklist.filter((i) => !!i.done).length
  const tags = buildTags(ticket, priorityMeta)

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])

  const hasMenu = !!(onClick || onComment || onDelete)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`kanban-card-tone kanban-card-tone-${tone} relative rounded-xl border border-border/80 p-3 cursor-grab active:cursor-grabbing shadow-card hover:shadow-card-md transition-all duration-200 group ${
        isDragging ? 'opacity-30 border-dashed scale-95 border-primary-400' : ''
      }`}
    >
      {/* Header: tags + more */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {tags.map((tag) => (
            <span
              key={tag.key}
              className={`inline-flex items-center max-w-full truncate text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-md border ${TAG_TONE_CLASS[tag.tone]} ${
                tag.mono ? 'font-mono' : ''
              }`}
            >
              {tag.label}
            </span>
          ))}
          {isMine && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${TAG_TONE_CLASS.primary}`}>
              Của tôi
            </span>
          )}
        </div>

        {hasMenu && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              aria-label="Menu ticket"
              className="p-1 rounded-md text-neutral-500 opacity-70 hover:opacity-100 hover:bg-neutral-900/5 hover:text-neutral-800 transition"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((o) => !o)
              }}
            >
              <MoreVertical size={14} strokeWidth={1.5} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-7 z-20 w-40 bg-surface rounded-lg shadow-card-md border border-border py-1 text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {onClick && (
                  <MenuItem
                    icon={Pencil}
                    label="Chỉnh sửa"
                    onClick={() => {
                      setMenuOpen(false)
                      onClick()
                    }}
                  />
                )}
                {onComment && (
                  <MenuItem
                    icon={MessageSquare}
                    label="Bình luận"
                    onClick={() => {
                      setMenuOpen(false)
                      onComment()
                    }}
                  />
                )}
                {onDelete && (
                  <MenuItem
                    icon={Trash2}
                    label="Xoá"
                    danger
                    onClick={() => {
                      setMenuOpen(false)
                      onDelete()
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-neutral-900 leading-snug mb-1.5 line-clamp-2">
        {ticket.title}
      </h4>

      {/* Note / description preview */}
      {(ticket.resolutionNote || ticket.description) && (
        <p className="text-[11px] leading-relaxed mb-2 line-clamp-2 text-neutral-600">
          {ticket.resolutionNote
            ? `Ghi chú: ${ticket.resolutionNote}`
            : ticket.description}
        </p>
      )}

      {/* Checklist preview — only when BE provides items */}
      {checklist.length > 0 && (
        <ul className="space-y-1 mb-2.5">
          {checklist.slice(0, 3).map((item, idx) => {
            const done = !!item.done
            const Icon = done ? CheckCircle2 : Circle
            return (
              <li
                key={`${item.label}-${idx}`}
                className="flex items-center gap-1.5 text-[11px] leading-snug text-neutral-700"
              >
                <Icon
                  size={14}
                  strokeWidth={1.5}
                  className="shrink-0"
                  style={{ color: done ? 'var(--kc-dot)' : 'var(--kc-muted)' }}
                />
                <span className={done ? 'line-through opacity-60' : ''}>{item.label}</span>
              </li>
            )
          })}
          {checklist.length > 3 && (
            <li className="text-[10px] text-neutral-500 pl-5">+{checklist.length - 3} mục nữa</li>
          )}
        </ul>
      )}

      {/* Progress bar — status heuristic unless progressPercent from BE */}
      {progress != null && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between text-[10px] font-semibold mb-1.5 text-neutral-600">
            <span>Tiến độ</span>
            <span className="tabular-nums font-bold" style={{ color: 'var(--kc-dot)' }}>
              {progress}%
            </span>
          </div>
          <div
            className="h-1.5 w-full rounded-full bg-white/70 border border-border/50 overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: 'var(--kc-dot)',
              }}
            />
          </div>
        </div>
      )}

      {/* Footer: avatars + meta counts */}
      <div className="flex items-center justify-between gap-2 mt-1 pt-0.5">
        <div className="flex items-center -space-x-1.5">
          {(assigneeName || ticket.assigneeId) ? (
            assigneeAvatarUrl ? (
              <img
                src={assigneeAvatarUrl}
                alt={assigneeName || ''}
                title={assigneeName}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-white shadow-card"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white shadow-card"
                style={{ backgroundColor: 'var(--kc-dot)', color: '#fff' }}
                title={assigneeName || ticket.assigneeId}
              >
                {initials}
              </div>
            )
          ) : (
            <div
              className="w-7 h-7 rounded-full ring-2 ring-white border border-dashed border-border bg-surface/40"
              title="Chưa giao"
            />
          )}
        </div>

        <div className="flex items-center gap-2.5 text-[11px] font-medium text-neutral-600">
          {checklist.length > 0 && (
            <span
              className="inline-flex items-center gap-1"
              title={`Checklist ${checklistDone}/${checklist.length}`}
            >
              <ListChecks size={13} strokeWidth={1.5} />
              <span className="tabular-nums">
                {checklistDone}/{checklist.length}
              </span>
            </span>
          )}
          {(onComment || commentCount > 0) && (
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-neutral-900 transition"
              title={`${commentCount} bình luận`}
              onClick={(e) => {
                e.stopPropagation()
                onComment?.()
              }}
            >
              <MessageSquare size={13} strokeWidth={1.5} />
              <span className="tabular-nums">{commentCount}</span>
            </button>
          )}
          {attachmentCount != null && attachmentCount > 0 && (
            <span className="inline-flex items-center gap-1" title="Đính kèm trên bình luận">
              <Paperclip size={13} strokeWidth={1.5} />
              <span className="tabular-nums">{attachmentCount}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 inline-flex items-center gap-2 hover:bg-neutral-50 ${
        danger ? 'text-danger-dark' : 'text-neutral-700'
      }`}
    >
      <Icon size={12} strokeWidth={1.5} /> {label}
    </button>
  )
}

/** Soft tone by category (fallback priority) — controlled token set only. */
function resolveTone(ticket: any): KanbanTone {
  const cat = ticket.category as string | undefined
  if (cat === 'BUG') return 'danger'
  if (cat === 'FEATURE_REQUEST') return 'info'
  if (cat === 'SUPPORT') return 'primary'
  if (cat === 'OTHER') return 'warning'

  const p = ticket.priority as string | undefined
  if (p === 'URGENT') return 'danger'
  if (p === 'HIGH') return 'warning'
  if (p === 'MEDIUM') return 'info'
  if (p === 'LOW') return 'neutral'
  return 'neutral'
}

/**
 * Prefer BE `progressPercent` / `progress`.
 * Else map status → heuristic % (visual only; BA gap for real checklist progress).
 */
function resolveProgress(ticket: any): number | null {
  const raw = ticket.progressPercent ?? ticket.progress
  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    return Math.max(0, Math.min(100, Math.round(raw)))
  }
  const statusMap: Record<string, number> = {
    OPEN: 10,
    IN_PROGRESS: 45,
    RESOLVED: 85,
    CLOSED: 100,
  }
  if (ticket.status && statusMap[ticket.status] != null) return statusMap[ticket.status]
  return 10
}

function buildTags(
  ticket: any,
  priorityMeta?: { color?: string; name?: string },
): TicketTag[] {
  const tags: TicketTag[] = []
  if (ticket.code) {
    tags.push({ key: 'code', label: ticket.code, tone: 'neutral', mono: true })
  }
  const cat = getCategoryMeta(ticket.category)
  if (cat) tags.push({ key: 'cat', label: cat.label, tone: cat.tone })
  const pName = priorityMeta?.name || getPriorityLabel(ticket.priority)
  if (pName) {
    tags.push({
      key: 'pri',
      label: pName,
      tone: getPriorityTone(ticket.priority),
    })
  }
  return tags.slice(0, 3)
}

function getCategoryMeta(
  category: string | undefined,
): { label: string; tone: TagTone } | null {
  if (!category) return null
  const map: Record<string, { label: string; tone: TagTone }> = {
    BUG: { label: 'Bug', tone: 'danger' },
    FEATURE_REQUEST: { label: 'Feature', tone: 'info' },
    SUPPORT: { label: 'Hỗ trợ', tone: 'primary' },
    OTHER: { label: 'Khác', tone: 'warning' },
  }
  return map[category] || { label: category, tone: 'neutral' }
}

function getPriorityLabel(priority: string | undefined): string | null {
  if (!priority) return null
  const map: Record<string, string> = {
    URGENT: 'Khẩn cấp',
    HIGH: 'Cao',
    MEDIUM: 'Trung bình',
    LOW: 'Thấp',
  }
  return map[priority] || priority
}

function getPriorityTone(priority: string | undefined): TagTone {
  if (priority === 'URGENT') return 'danger'
  if (priority === 'HIGH') return 'warning'
  if (priority === 'MEDIUM') return 'info'
  if (priority === 'LOW') return 'neutral'
  return 'neutral'
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
