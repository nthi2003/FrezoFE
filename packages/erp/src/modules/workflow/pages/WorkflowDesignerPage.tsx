// ============================================================
// WorkflowDesignerPage — /qtht/workflows/:id/designer
// React Flow canvas + swimlanes; DnD palette + connect edges
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ArrowLeft, Save, Loader2, Plus, BookOpen, ChevronDown, ChevronUp,
  GitBranch, ShieldAlert, Trash2, CircleCheck, Pencil,
} from 'lucide-react'
import {
  Button, PageHeader, EmptyState, ErrorState, ConfirmDialog, PageGuideButton,
} from '@frezo/ui'
import { toast } from 'sonner'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  useSaveWorkflowGraph,
  useValidateWorkflowGraph,
  useWorkflowGraph,
} from '../hooks/useWorkflowGraph'
import {
  emptyGraph,
  type GraphNodeType,
  type WorkflowSwimlane,
} from '../services/workflowApi'
import { MarkdownView } from '@/modules/docs/components/MarkdownView'
import { WORKFLOWS_GUIDE } from '../constants/workflows.guide'
import { WfPalette } from '../components/designer/WfPalette'
import {
  WorkflowCanvas,
  createNodeAtDefaultPosition,
} from '../components/designer/WorkflowCanvas'
import type { WfNodeData } from '../components/designer/WfNodes'
import {
  LANE_GAP,
  LANE_HEIGHT,
  flowToGraph,
  graphToFlow,
  nextId,
} from '../components/designer/graphUtils'

function WorkflowDesignerInner() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const {
    data: graph,
    definition: def,
    guideMarkdown,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useWorkflowGraph(id)
  const save = useSaveWorkflowGraph(id || '')
  const validate = useValidateWorkflowGraph(id || '')
  const canUpdate = usePermission('WORKFLOWS.DEFINITIONS.UPDATE')

  const [lanes, setLanes] = useState(emptyGraph().lanes)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [hydrated, setHydrated] = useState(false)
  const [guideOpen, setGuideOpen] = useState(true)
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null)
  const [leaveConfirm, setLeaveConfirm] = useState<(() => void) | null>(null)
  const [deleteNodeConfirm, setDeleteNodeConfirm] = useState(false)
  const [validateErrors, setValidateErrors] = useState<string[]>([])
  const baselineRef = useRef('')

  useEffect(() => {
    if (!graph || hydrated) return
    const flow = graphToFlow(graph)
    const nextLanes = graph.lanes?.length ? graph.lanes : emptyGraph().lanes
    setLanes(nextLanes)
    setNodes(flow.nodes)
    setEdges(flow.edges)
    setSelectedLaneId(nextLanes[0]?.id ?? null)
    baselineRef.current = JSON.stringify(flowToGraph(flow.nodes, flow.edges, nextLanes, graph.version))
    setHydrated(true)
  }, [graph, hydrated, setNodes, setEdges])

  useEffect(() => {
    setHydrated(false)
    setValidateErrors([])
  }, [id])

  const dirty = useMemo(() => {
    if (!hydrated) return false
    const current = JSON.stringify(
      flowToGraph(nodes, edges, lanes, graph?.version ?? def?.version ?? 1),
    )
    return current !== baselineRef.current
  }, [hydrated, nodes, edges, lanes, graph?.version, def?.version])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const selectedNode = useMemo(
    () => nodes.find((n) => n.selected) ?? null,
    [nodes],
  )

  const addNode = useCallback(
    (type: GraphNodeType) => {
      const { node, edge } = createNodeAtDefaultPosition(
        type,
        nodes,
        lanes,
        selectedLaneId,
      )
      setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), { ...node, selected: true }])
      if (edge) setEdges((eds) => [...eds, edge])
    },
    [lanes, nodes, selectedLaneId, setEdges, setNodes],
  )

  const addLane = () => {
    const order = lanes.length
    const newLane: WorkflowSwimlane = {
      id: nextId('lane'),
      label: `Lane ${order + 1}`,
      order,
    }
    setLanes((ls) => [...ls, newLane])
    setSelectedLaneId(newLane.id)
  }

  const updateSelectedLabel = (label: string) => {
    if (!selectedNode) return
    setNodes((ns) =>
      ns.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...(n.data as WfNodeData), label } satisfies WfNodeData }
          : n,
      ),
    )
  }

  const deleteSelectedNode = () => {
    if (!selectedNode) return
    const nid = selectedNode.id
    setNodes((ns) => ns.filter((n) => n.id !== nid))
    setEdges((eds) => eds.filter((e) => e.source !== nid && e.target !== nid))
    setDeleteNodeConfirm(false)
  }

  const goList = () => nav('/qtht/workflows')

  const guardedNavigate = (fn: () => void) => {
    if (dirty) setLeaveConfirm(() => fn)
    else fn()
  }

  const openStepsEditor = () => {
    if (!id) return
    guardedNavigate(() =>
      nav('/qtht/workflows', { state: { editWorkflowId: id } }),
    )
  }

  const handleSave = () => {
    if (!id || !canUpdate) return
    const payload = flowToGraph(nodes, edges, lanes, graph?.version ?? def?.version ?? 1)
    save.mutate(
      {
        graphJson: payload,
        guideMarkdown: guideMarkdown ?? def?.guideMarkdown ?? null,
        name: def?.name,
        description: def?.description,
      },
      {
        onSuccess: () => {
          baselineRef.current = JSON.stringify(payload)
          setValidateErrors([])
          validate.mutate(undefined, {
            onSuccess: (result) => {
              const errors = result?.errors?.filter(Boolean) ?? []
              if (result?.valid === false || errors.length > 0) {
                setValidateErrors(errors.length ? errors : ['Graph chưa hợp lệ'])
              } else {
                setValidateErrors([])
              }
            },
          })
        },
      },
    )
  }

  const handleValidate = () => {
    if (!id) return
    if (dirty) {
      toast.warning('Lưu graph trước khi kiểm tra')
      return
    }
    validate.mutate(undefined, {
      onSuccess: (result) => {
        const errors = result?.errors?.filter(Boolean) ?? []
        if (result?.valid === false || errors.length > 0) {
          setValidateErrors(errors.length ? errors : ['Graph chưa hợp lệ'])
        } else {
          setValidateErrors([])
        }
      },
    })
  }

  const canvasHeight = useMemo(
    () => Math.max(480, lanes.length * (LANE_HEIGHT + LANE_GAP) + 80),
    [lanes.length],
  )

  if (!id) {
    return (
      <EmptyState
        icon={GitBranch}
        title="Thiếu ID quy trình"
        description="/qtht/workflows/:id/designer"
      />
    )
  }

  if (isError && !hydrated) {
    return (
      <div className="p-6">
        <ErrorState
          title="Không tải được Designer"
          message="Không tải definition / graph. Vui lòng thử lại."
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </div>
    )
  }

  const selectedData = selectedNode
    ? (selectedNode.data as WfNodeData)
    : null

  return (
    <div className="p-4 md:p-6 space-y-3 animate-fade-in h-[calc(100vh-3.5rem)] flex flex-col">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2 min-w-0">
            <span className="truncate">
              Designer · {def?.name || def?.code || id}
            </span>
            {dirty && (
              <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-warning-light text-warning-dark border border-warning/20">
                Chưa lưu
              </span>
            )}
          </span>
        }
        description={
          canUpdate
            ? 'Kéo node từ palette vào canvas — template visual, không phải hộp duyệt đơn.'
            : 'Chế độ xem — thiếu quyền WORKFLOWS.DEFINITIONS.UPDATE để sửa / lưu graph.'
        }
        actions={
          <>
            <PageGuideButton guide={WORKFLOWS_GUIDE} />
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => guardedNavigate(goList)}
            >
              <ArrowLeft size={14} /> Danh sách
            </Button>
            <Button
              variant="outline"
              onClick={() => guardedNavigate(() => nav('/qtht/workflows/templates'))}
            >
              Thư viện mẫu
            </Button>
            {canUpdate && (
              <>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  disabled={validate.isPending || isLoading || dirty}
                  onClick={handleValidate}
                  title={dirty ? 'Lưu trước khi kiểm tra' : 'Gọi POST …/validate'}
                >
                  {validate.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CircleCheck size={14} />
                  )}
                  Kiểm tra
                </Button>
                <Button
                  className="gap-1.5"
                  disabled={save.isPending || isLoading || !dirty}
                  onClick={handleSave}
                >
                  {save.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Lưu graph
                </Button>
              </>
            )}
          </>
        }
      />

      {/* Path A — approver config lives in SIMPLE steps drawer + LNK-04 inbox note */}
      <div className="rounded-xl border border-warning/30 bg-warning-light px-4 py-3 flex flex-wrap items-start gap-3 text-sm text-warning-dark shrink-0">
        <ShieldAlert size={18} className="text-warning shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1 leading-snug">
          <span className="font-semibold">Designer = template visual</span> — duyệt đơn hàng ngày ở{' '}
          <button
            type="button"
            className="font-semibold text-primary-700 underline underline-offset-2"
            onClick={() => guardedNavigate(() => nav('/approval/inbox'))}
          >
            /approval/inbox
          </button>
          . <span className="font-semibold">Ai duyệt</span> cấu hình ở{' '}
          <span className="font-semibold">Chỉnh sửa (steps)</span> — Designer chỉ vẽ graph,
          không đồng bộ approver sang steps trong MVP (Path A).
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 shrink-0"
          onClick={openStepsEditor}
        >
          <Pencil size={12} /> Mở Chỉnh sửa
        </Button>
      </div>

      {validateErrors.length > 0 && (
        <div className="rounded-xl border border-danger/20 bg-danger-light px-4 py-2 text-sm text-danger-dark shrink-0">
          <p className="font-semibold mb-1">Lỗi kiểm tra graph</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {validateErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {guideMarkdown ? (
        <div className="rounded-xl border border-primary-200 bg-primary-50/40 overflow-hidden shrink-0">
          <button
            type="button"
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-primary-900 hover:bg-primary-50"
            onClick={() => setGuideOpen((o) => !o)}
          >
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={14} /> Hướng dẫn quy trình (từ BE)
            </span>
            {guideOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {guideOpen && (
            <div className="px-4 pb-3 max-h-48 overflow-y-auto text-sm text-neutral-800 border-t border-primary-100 bg-white/70">
              <MarkdownView source={guideMarkdown} skipFirstH1 />
            </div>
          )}
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
        {canUpdate && (
          <div className="flex flex-col gap-2 shrink-0">
            <WfPalette onAddClick={addNode} loading={isLoading && !hydrated} />
            <Button size="sm" variant="outline" className="gap-1 w-full sm:w-44" onClick={addLane}>
              <Plus size={12} /> Swimlane
            </Button>
            {selectedLaneId && (
              <p className="text-[11px] text-neutral-500 sm:w-44">
                Lane chọn: {lanes.find((l) => l.id === selectedLaneId)?.label || selectedLaneId}
              </p>
            )}
          </div>
        )}

        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          lanes={lanes}
          selectedLaneId={selectedLaneId}
          isLoading={isLoading}
          hydrated={hydrated}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setNodes={setNodes}
          setEdges={setEdges}
          onLanesChange={canUpdate ? setLanes : undefined}
          onSelectLane={canUpdate ? setSelectedLaneId : undefined}
          canvasHeight={canvasHeight}
          readOnly={!canUpdate}
        />

        {canUpdate && selectedData && selectedNode && (
          <div className="w-full lg:w-56 shrink-0 rounded-xl border border-neutral-200 bg-white p-3 space-y-3">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Node đã chọn
            </p>
            <div>
              <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                Loại
              </label>
              <p className="text-sm text-neutral-800 font-mono">{selectedData.nodeType}</p>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                Nhãn
              </label>
              <input
                type="text"
                value={selectedData.label || ''}
                onChange={(e) => updateSelectedLabel(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-neutral-200 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-danger hover:bg-danger-light"
              onClick={() => setDeleteNodeConfirm(true)}
            >
              <Trash2 size={12} /> Xoá node
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!leaveConfirm}
        onClose={() => setLeaveConfirm(null)}
        onConfirm={() => {
          const fn = leaveConfirm
          setLeaveConfirm(null)
          fn?.()
        }}
        title="Bỏ thay đổi chưa lưu?"
        message="Bạn có thay đổi trên graph chưa lưu. Nếu tiếp tục thoát, các thay đổi sẽ mất."
        confirmText="Thoát mà không lưu"
        cancelText="Ở lại"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={deleteNodeConfirm}
        onClose={() => setDeleteNodeConfirm(false)}
        onConfirm={deleteSelectedNode}
        title={`Xoá node "${selectedData?.label || ''}"?`}
        message="Node và các edge nối tới/đi sẽ bị xoá khỏi canvas (chưa lưu vẫn có thể Huỷ bằng không Lưu)."
        confirmText="Xoá node"
        cancelText="Huỷ"
        variant="danger"
      />
    </div>
  )
}

export function WorkflowDesignerPage() {
  return (
    <ReactFlowProvider>
      <WorkflowDesignerInner />
    </ReactFlowProvider>
  )
}
