// ============================================================
// Custom React Flow nodes — START / ACTION / DECISION / APPROVAL / END
// ============================================================

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GraphNodeType } from '../../services/workflowApi'

const STYLE: Record<
  GraphNodeType,
  { bg: string; border: string; text: string; shape?: string }
> = {
  START: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    text: 'text-emerald-800',
  },
  END: {
    bg: 'bg-neutral-100',
    border: 'border-neutral-400',
    text: 'text-neutral-800',
  },
  ACTION: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-800',
  },
  APPROVAL: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-900',
  },
  DECISION: {
    bg: 'bg-violet-50',
    border: 'border-violet-400',
    text: 'text-violet-900',
    shape: 'diamond',
  },
}

export type WfNodeData = {
  label: string
  nodeType: GraphNodeType
  laneId?: string
}

function WfNodeInner({ data, selected }: NodeProps) {
  const d = data as WfNodeData
  const st = STYLE[d.nodeType] || STYLE.ACTION
  const isDiamond = d.nodeType === 'DECISION'

  const handleCls =
    '!w-2.5 !h-2.5 !border-2 !border-white !bg-neutral-500 hover:!bg-primary-500'

  if (isDiamond) {
    return (
      <div className="relative w-[120px] h-[120px] flex items-center justify-center">
        <Handle
          type="target"
          position={Position.Top}
          className={handleCls}
          isConnectable
        />
        <div
          className={`w-20 h-20 rotate-45 border-2 ${st.border} ${st.bg} shadow-sm ${
            selected ? 'ring-2 ring-primary-400' : ''
          }`}
        />
        <div
          className={`absolute inset-0 flex items-center justify-center px-2 text-center text-[11px] font-semibold ${st.text}`}
        >
          {d.label || 'Điều kiện'}
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className={handleCls}
          isConnectable
        />
        <Handle
          type="source"
          position={Position.Right}
          id="no"
          className={`${handleCls} !bg-danger`}
          isConnectable
        />
      </div>
    )
  }

  const rounded =
    d.nodeType === 'START' || d.nodeType === 'END' ? 'rounded-full' : 'rounded-lg'

  return (
    <div
      className={`min-w-[140px] max-w-[200px] px-3 py-2 border-2 ${st.border} ${st.bg} ${rounded} shadow-sm ${
        selected ? 'ring-2 ring-primary-400' : ''
      }`}
    >
      {d.nodeType !== 'START' && (
        <Handle
          type="target"
          position={Position.Top}
          className={handleCls}
          isConnectable
        />
      )}
      <div className="text-[9px] font-bold uppercase tracking-wide opacity-60">
        {d.nodeType}
      </div>
      <div className={`text-xs font-semibold leading-snug ${st.text}`}>
        {d.label || d.nodeType}
      </div>
      {d.nodeType !== 'END' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={handleCls}
          isConnectable
        />
      )}
    </div>
  )
}

export const WfFlowNode = memo(WfNodeInner)

export const wfNodeTypes = {
  wfNode: WfFlowNode,
}
