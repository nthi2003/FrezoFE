import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@frezo/utils'
import { organizationApi } from '@/modules/qtht/services/qthtApi'

function buildOrgTree(list: any[]): any[] {
  const nodeMap = new Map<string, any>()
  list.forEach((item) => nodeMap.set(item.id, { ...item, children: [] }))

  const roots: any[] = []
  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortTree = (nodes: any[]) => {
    nodes.sort((a, b) => {
      const oi = (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
      if (oi !== 0) return oi
      return String(a.name || '').localeCompare(String(b.name || ''), 'vi')
    })
    nodes.forEach((n) => sortTree(n.children))
  }
  sortTree(roots)
  return roots
}

interface OrgTreeNodeProps {
  node: any
  depth: number
  selectedId?: string
  onSelect: (id: string) => void
}

function OrgTreeNode({ node, depth, selectedId, onSelect }: OrgTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = Array.isArray(node.children) && node.children.length > 0
  const selected = node.id === selectedId

  return (
    <div className={depth > 0 ? 'pl-4' : ''}>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md py-1 pr-2',
          selected ? 'bg-primary-50 text-primary-800' : 'hover:bg-neutral-50',
        )}
      >
        <button
          type="button"
          onClick={() => hasChildren && setExpanded((v) => !v)}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded',
            hasChildren ? 'text-neutral-500 hover:bg-neutral-100' : 'cursor-default opacity-40',
          )}
          aria-label={hasChildren ? (expanded ? 'Thu gọn' : 'Mở rộng') : undefined}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="min-w-0 flex-1 truncate text-left text-sm"
        >
          <span className="font-medium">{node.name}</span>
          {node.code && (
            <span className="ml-1.5 text-[10px] font-mono text-neutral-400">{node.code}</span>
          )}
        </button>
      </div>
      {hasChildren && expanded && (
        <div className="border-l border-neutral-200 ml-2.5">
          {node.children.map((child: any) => (
            <OrgTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface OrganizationTreePickerProps {
  value?: string
  onChange: (organizationId: string) => void
  className?: string
}

export function OrganizationTreePicker({ value, onChange, className }: OrganizationTreePickerProps) {
  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['organizations-tree'],
    queryFn: () => organizationApi.getAll(),
  })

  const list = useMemo(() => (Array.isArray(raw) ? raw : []), [raw])
  const roots = useMemo(() => buildOrgTree(list), [list])

  if (isLoading) {
    return <p className="text-sm text-neutral-500 py-2">Đang tải cây đơn vị…</p>
  }

  if (roots.length === 0) {
    return <p className="text-sm text-neutral-500 py-2">Chưa có đơn vị nào.</p>
  }

  return (
    <div
      className={cn(
        'max-h-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-2',
        className,
      )}
      role="tree"
      aria-label="Chọn đơn vị"
    >
      {roots.map((node) => (
        <OrgTreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedId={value}
          onSelect={onChange}
        />
      ))}
    </div>
  )
}
