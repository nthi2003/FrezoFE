// ============================================================
// Graph ↔ React Flow helpers + auto-connect for designer
// ============================================================

import { type Connection, type Edge, type Node } from '@xyflow/react'
import {
  emptyGraph,
  type GraphNodeType,
  type WorkflowGraphDto,
  type WorkflowGraphEdge,
  type WorkflowGraphNode,
  type WorkflowSwimlane,
} from '../../services/workflowApi'
import type { WfNodeData } from './WfNodes'

export const LANE_HEIGHT = 160
export const LANE_GAP = 8
/** Max distance (flow coords) to snap auto-connect to a nearby source node. */
export const AUTO_CONNECT_RADIUS = 280

export const WF_DND_MIME = 'application/frezo-wf-node'

const GRAPH_NODE_TYPES: readonly GraphNodeType[] = [
  'START',
  'ACTION',
  'DECISION',
  'APPROVAL',
  'END',
] as const

export function parseGraphNodeType(raw: string): GraphNodeType | null {
  return (GRAPH_NODE_TYPES as readonly string[]).includes(raw)
    ? (raw as GraphNodeType)
    : null
}

let idSeq = 0
export function nextId(prefix: string): string {
  idSeq += 1
  return `${prefix}-${Date.now()}-${idSeq}`
}

export function defaultLabel(type: GraphNodeType): string {
  if (type === 'START') return 'Bắt đầu'
  if (type === 'END') return 'Kết thúc'
  if (type === 'DECISION') return 'Điều kiện'
  if (type === 'APPROVAL') return 'Duyệt'
  return 'Hành động'
}

export function graphToFlow(graph: WorkflowGraphDto): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = (graph.nodes || []).map((n) => ({
    id: n.id,
    type: 'wfNode',
    position: n.position || { x: 0, y: 0 },
    data: {
      label: n.label,
      nodeType: n.type,
      laneId: n.laneId,
    } satisfies WfNodeData,
  }))
  const edges: Edge[] = (graph.edges || []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: 'smoothstep',
    animated: false,
  }))
  return { nodes, edges }
}

export function flowToGraph(
  nodes: Node[],
  edges: Edge[],
  lanes: WorkflowGraphDto['lanes'],
  version?: number,
): WorkflowGraphDto {
  const gNodes: WorkflowGraphNode[] = nodes.map((n) => {
    const d = n.data as WfNodeData
    return {
      id: n.id,
      type: d.nodeType,
      label: d.label,
      laneId: d.laneId,
      position: { x: n.position.x, y: n.position.y },
    }
  })
  const gEdges: WorkflowGraphEdge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: typeof e.label === 'string' ? e.label : undefined,
  }))
  return {
    version: version ?? 1,
    lanes: lanes?.length ? lanes : emptyGraph().lanes,
    nodes: gNodes,
    edges: gEdges,
  }
}

export function laneIdAtY(lanes: WorkflowSwimlane[], y: number): string | undefined {
  if (!lanes.length) return undefined
  const sorted = [...lanes].sort((a, b) => a.order - b.order)
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor(y / (LANE_HEIGHT + LANE_GAP))),
  )
  return sorted[idx]?.id
}

export function canBeSource(nodeType: GraphNodeType): boolean {
  return nodeType !== 'END'
}

export function canBeTarget(nodeType: GraphNodeType): boolean {
  return nodeType !== 'START'
}

export function getNodeType(node: Node): GraphNodeType {
  return (node.data as WfNodeData).nodeType
}

/** Reject invalid handle connections (START as target, END as source, self-loop). */
export function isValidWfConnection(
  connection: Connection | Edge,
  nodes: Node[],
): boolean {
  if (!connection.source || !connection.target) return false
  if (connection.source === connection.target) return false
  const source = nodes.find((n) => n.id === connection.source)
  const target = nodes.find((n) => n.id === connection.target)
  if (!source || !target) return false
  return canBeSource(getNodeType(source)) && canBeTarget(getNodeType(target))
}

/**
 * Pick a source node to auto-connect when dropping a new node.
 * Priority: selected eligible → nearest eligible within radius → latest eligible.
 */
export function findAutoConnectSourceId(
  nodes: Node[],
  dropPosition: { x: number; y: number },
  newNodeType: GraphNodeType,
  selectedNodeIds: string[],
): string | null {
  if (!canBeTarget(newNodeType)) return null

  const eligible = nodes.filter((n) => canBeSource(getNodeType(n)))
  if (!eligible.length) return null

  const selected = eligible.find((n) => selectedNodeIds.includes(n.id))
  if (selected) return selected.id

  let nearest: Node | null = null
  let nearestDist = Infinity
  for (const n of eligible) {
    const cx = n.position.x + 70
    const cy = n.position.y + 24
    const dx = dropPosition.x - cx
    const dy = dropPosition.y - cy
    const dist = Math.hypot(dx, dy)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = n
    }
  }

  if (nearest && nearestDist <= AUTO_CONNECT_RADIUS) {
    return nearest.id
  }

  return eligible[eligible.length - 1]?.id ?? null
}

export function buildAutoEdge(sourceId: string, targetId: string): Edge {
  return {
    id: nextId('e'),
    source: sourceId,
    target: targetId,
    type: 'smoothstep',
  }
}
