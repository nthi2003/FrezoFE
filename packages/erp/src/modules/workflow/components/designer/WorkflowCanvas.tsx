// ============================================================
// WorkflowCanvas — React Flow: reposition, drop palette, connect
// ============================================================

import { useCallback, useMemo, type DragEvent, type Dispatch, type SetStateAction } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  ConnectionLineType,
  BackgroundVariant,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeDragHandler,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import { Skeleton } from '@frezo/ui'
import type { GraphNodeType, WorkflowSwimlane } from '../../services/workflowApi'
import { wfNodeTypes, type WfNodeData } from './WfNodes'
import {
  LANE_GAP,
  LANE_HEIGHT,
  WF_DND_MIME,
  buildAutoEdge,
  buildDecisionBranchStubs,
  defaultLabel,
  findAutoConnectSourceId,
  isValidWfConnection,
  laneIdAtY,
  nextId,
  parseGraphNodeType,
} from './graphUtils'

type WorkflowCanvasProps = {
  nodes: Node[]
  edges: Edge[]
  lanes: WorkflowSwimlane[]
  selectedLaneId?: string | null
  isLoading: boolean
  hydrated: boolean
  onNodesChange: OnNodesChange<Node>
  onEdgesChange: OnEdgesChange<Edge>
  setNodes: Dispatch<SetStateAction<Node[]>>
  setEdges: Dispatch<SetStateAction<Edge[]>>
  onLanesChange?: (lanes: WorkflowSwimlane[]) => void
  onSelectLane?: (laneId: string) => void
  canvasHeight: number
  /** Hide mutate interactions when user lacks WORKFLOWS.DEFINITIONS.UPDATE */
  readOnly?: boolean
}

export function WorkflowCanvas({
  nodes,
  edges,
  lanes,
  selectedLaneId,
  isLoading,
  hydrated,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onLanesChange,
  onSelectLane,
  canvasHeight,
  readOnly = false,
}: WorkflowCanvasProps) {
  const { screenToFlowPosition } = useReactFlow()

  const onConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) return
      if (!isValidWfConnection(connection, nodes)) return
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: nextId('e'),
            type: 'smoothstep',
          },
          eds,
        ),
      )
    },
    [nodes, readOnly, setEdges],
  )

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => isValidWfConnection(connection, nodes),
    [nodes],
  )

  const placeNode = useCallback(
    (type: GraphNodeType, position: { x: number; y: number }) => {
      const laneId = laneIdAtY(lanes, position.y) ?? selectedLaneId ?? lanes[0]?.id
      const idN = nextId(type.toLowerCase())
      const newNode: Node = {
        id: idN,
        type: 'wfNode',
        position,
        data: {
          label: defaultLabel(type),
          nodeType: type,
          laneId,
        } satisfies WfNodeData,
      }

      const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id)
      const sourceId = findAutoConnectSourceId(nodes, position, type, selectedIds)

      const stubs =
        type === 'DECISION'
          ? buildDecisionBranchStubs(idN, laneId, position)
          : { nodes: [] as Node[], edges: [] as Edge[] }

      setNodes((ns) => [...ns, newNode, ...stubs.nodes])
      setEdges((eds) => {
        const next = [...eds]
        if (sourceId) next.push(buildAutoEdge(sourceId, idN))
        next.push(...stubs.edges)
        return next
      })
    },
    [lanes, nodes, selectedLaneId, setEdges, setNodes],
  )

  const onDragOver = useCallback((event: DragEvent) => {
    if (readOnly) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [readOnly])

  const onDrop = useCallback(
    (event: DragEvent) => {
      if (readOnly) return
      event.preventDefault()
      const type = parseGraphNodeType(event.dataTransfer.getData(WF_DND_MIME))
      if (!type) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      placeNode(type, position)
    },
    [placeNode, readOnly, screenToFlowPosition],
  )

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, node) => {
      if (readOnly) return
      const laneId = laneIdAtY(lanes, node.position.y) ?? lanes[0]?.id
      const data = node.data as WfNodeData
      if (data.laneId === laneId) return
      setNodes((ns) =>
        ns.map((n) =>
          n.id === node.id
            ? { ...n, data: { ...data, laneId } satisfies WfNodeData }
            : n,
        ),
      )
    },
    [lanes, readOnly, setNodes],
  )

  const sortedLanes = useMemo(
    () => [...lanes].sort((a, b) => a.order - b.order),
    [lanes],
  )

  const renameLane = (laneId: string, label: string) => {
    if (!onLanesChange) return
    onLanesChange(lanes.map((l) => (l.id === laneId ? { ...l, label } : l)))
  }

  return (
    <div
      className="flex-1 min-h-[420px] rounded-xl border border-neutral-200 bg-white overflow-hidden relative"
      style={{ height: canvasHeight }}
    >
      {isLoading && !hydrated ? (
        <div
          className="absolute inset-0 z-20 bg-white p-4 flex flex-col gap-3"
          role="status"
          aria-label="Đang tải canvas"
        >
          <Skeleton className="h-8 w-40" />
          <Skeleton className="flex-1 w-full rounded-lg min-h-[320px]" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      ) : null}

      {/* Lane backgrounds — decorative; rename controls use pointer-events-auto */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {sortedLanes.map((lane, i) => {
          const selected = selectedLaneId === lane.id
          return (
            <div
              key={lane.id}
              className={`absolute left-0 right-0 border-b border-dashed ${
                selected ? 'border-primary-300 bg-primary-50/40' : 'border-neutral-200'
              }`}
              style={{
                top: i * (LANE_HEIGHT + LANE_GAP),
                height: LANE_HEIGHT,
                background: selected
                  ? undefined
                  : i % 2 === 0
                    ? 'rgba(248,250,252,0.9)'
                    : 'rgba(255,255,255,0.9)',
              }}
            >
              <div className="absolute left-2 top-2 pointer-events-auto flex items-center gap-1">
                {!readOnly && onSelectLane ? (
                  <button
                    type="button"
                    onClick={() => onSelectLane(lane.id)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      selected
                        ? 'bg-primary-100 text-primary-700 border-primary-200'
                        : 'bg-white text-neutral-500 border-neutral-100 hover:border-primary-200'
                    }`}
                    title="Chọn lane để thêm node"
                  >
                    Lane
                  </button>
                ) : null}
                {readOnly || !onLanesChange ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-white/80 px-1.5 py-0.5 rounded border border-neutral-100">
                    {lane.label}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={lane.label}
                    onChange={(e) => renameLane(lane.id, e.target.value)}
                    onFocus={() => onSelectLane?.(lane.id)}
                    className="h-6 min-w-[100px] max-w-[180px] text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-white px-1.5 rounded border border-neutral-200 focus:border-primary-300 focus:ring-1 focus:ring-primary-100 outline-none"
                    aria-label={`Đổi tên lane ${lane.label}`}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ReactFlow
        className="z-[1]"
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        isValidConnection={readOnly ? undefined : isValidConnection}
        onDragOver={readOnly ? undefined : onDragOver}
        onDrop={readOnly ? undefined : onDrop}
        onNodeDragStop={readOnly ? undefined : onNodeDragStop}
        nodeTypes={wfNodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  )
}

/** Click-add helper used by the page palette (same auto-connect rules as drop). */
export function createNodeAtDefaultPosition(
  type: GraphNodeType,
  nodes: Node[],
  lanes: WorkflowSwimlane[],
  selectedLaneId?: string | null,
): { nodes: Node[]; edges: Edge[] } {
  const sorted = [...lanes].sort((a, b) => a.order - b.order)
  const lane =
    (selectedLaneId ? sorted.find((l) => l.id === selectedLaneId) : undefined) ??
    sorted[0]
  const laneIndex = lane ? sorted.findIndex((l) => l.id === lane.id) : 0
  const yBase = Math.max(0, laneIndex) * (LANE_HEIGHT + LANE_GAP) + 40
  const position = { x: 80 + nodes.length * 40, y: yBase }
  const idN = nextId(type.toLowerCase())
  const node: Node = {
    id: idN,
    type: 'wfNode',
    position,
    data: {
      label: defaultLabel(type),
      nodeType: type,
      laneId: lane?.id,
    } satisfies WfNodeData,
  }
  const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id)
  const sourceId = findAutoConnectSourceId(nodes, position, type, selectedIds)
  const edges: Edge[] = []
  if (sourceId) edges.push(buildAutoEdge(sourceId, idN))

  const resultNodes: Node[] = [node]
  if (type === 'DECISION') {
    const stubs = buildDecisionBranchStubs(idN, lane?.id, position)
    resultNodes.push(...stubs.nodes)
    edges.push(...stubs.edges)
  }
  return { nodes: resultNodes, edges }
}
