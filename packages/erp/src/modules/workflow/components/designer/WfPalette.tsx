// ============================================================
// Palette — kéo node vào canvas (HTML5 DnD → React Flow drop)
// ============================================================

import type { DragEvent } from 'react'
import {
  Play, Square, GitBranch, ShieldCheck, Zap, type LucideIcon,
} from 'lucide-react'
import { Skeleton } from '@frezo/ui'
import type { GraphNodeType } from '../../services/workflowApi'
import { WF_DND_MIME } from './graphUtils'

export const WF_PALETTE: {
  type: GraphNodeType
  label: string
  hint: string
  icon: LucideIcon
}[] = [
  { type: 'START', label: 'Bắt đầu', hint: 'Điểm bắt đầu', icon: Play },
  { type: 'ACTION', label: 'Hành động', hint: 'Hành động / xử lý', icon: Zap },
  { type: 'DECISION', label: 'Điều kiện', hint: 'Tự tạo 2 nhánh Có/Không', icon: GitBranch },
  { type: 'APPROVAL', label: 'Duyệt', hint: 'Bước duyệt', icon: ShieldCheck },
  { type: 'END', label: 'Kết thúc', hint: 'Kết thúc', icon: Square },
]

type WfPaletteProps = {
  onAddClick: (type: GraphNodeType) => void
  loading?: boolean
}

export function WfPalette({ onAddClick, loading }: WfPaletteProps) {
  const onDragStart = (event: DragEvent, type: GraphNodeType) => {
    event.dataTransfer.setData(WF_DND_MIME, type)
    event.dataTransfer.effectAllowed = 'move'
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 w-full sm:w-44 shrink-0" role="status" aria-label="Đang tải palette">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full" />
        {WF_PALETTE.map((p) => (
          <Skeleton key={p.type} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full sm:w-44 shrink-0">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
        Bảng node
      </p>
      <p className="text-[11px] text-neutral-500 leading-snug">
        Kéo thả vào canvas, hoặc click để thêm vào lane đang chọn. Kéo từ handle để nối edge.
      </p>
      <ul className="flex flex-row sm:flex-col flex-wrap gap-1.5">
        {WF_PALETTE.map((p) => {
          const Icon = p.icon
          return (
            <li key={p.type} className="list-none">
              <button
                type="button"
                draggable
                onDragStart={(e) => onDragStart(e, p.type)}
                onClick={() => onAddClick(p.type)}
                title={`${p.hint} — kéo vào canvas`}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-neutral-200 bg-white text-left text-sm text-neutral-800 hover:border-primary-300 hover:bg-primary-50/40 cursor-grab active:cursor-grabbing select-none"
              >
                <Icon size={14} strokeWidth={1.5} className="text-neutral-500 shrink-0" />
                <span className="font-medium truncate">{p.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
