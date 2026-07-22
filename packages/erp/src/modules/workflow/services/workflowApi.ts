// ============================================================
// Workflow Engine API — dùng chung cho mọi module có approval flow.
// SIMPLE: /wf/*  |  VISUAL: /workflows/*
// ============================================================
import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export type ApproverType = 'USER' | 'ROLE' | 'MANAGER' | 'ADMIN'
export type TaskStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED'
export type InstanceStatus = 'RUNNING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'

export interface WorkflowStep {
  id?: string
  stepOrder?: number
  stepName: string
  approverType: ApproverType
  approverValue?: string | null
  allowSkip?: boolean
  slaHours?: number | null
  description?: string | null
}

export interface WorkflowDefinition {
  id?: string
  code: string
  name: string
  moduleCode: string
  description?: string | null
  active?: boolean
  steps: WorkflowStep[]
  createdBy?: string
  createdDate?: string
  /** SIMPLE | VISUAL */
  editorMode?: string
  graphJson?: WorkflowGraphDto | null
  guideMarkdown?: string | null
  templateKey?: string | null
  sourceTemplateCode?: string | null
  version?: number | null
  isTemplate?: boolean
}

export interface WorkflowTask {
  id: string
  instanceId: string
  stepOrder: number
  stepName: string
  approverType: ApproverType
  assigneeUsername?: string | null
  assigneeRole?: string | null
  status: TaskStatus
  decidedBy?: string | null
  decidedAt?: string | null
  comment?: string | null
  deadline?: string | null
  createdDate?: string
  entityType?: string
  entityId?: string
  instanceTitle?: string
  instanceStartedBy?: string
}

export interface WorkflowInstance {
  id: string
  definitionCode: string
  definitionName?: string
  entityType: string
  entityId: string
  title?: string
  startedBy: string
  startedAt: string
  currentStep: number
  status: InstanceStatus
  completedAt?: string | null
  steps: WorkflowStep[]
  tasks: WorkflowTask[]
}

/** Metadata mẫu từ BE — không chứa graph tuyển dụng trên FE. */
export interface WorkflowTemplateMeta {
  key: string
  name: string
  description?: string
  moduleCode?: string
  nodeCount?: number
  updatedAt?: string
  guideMarkdown?: string
  version?: number
}

export type GraphNodeType = 'START' | 'ACTION' | 'DECISION' | 'APPROVAL' | 'END'

export interface WorkflowGraphNode {
  id: string
  type: GraphNodeType
  label: string
  laneId?: string
  position: { x: number; y: number }
  data?: Record<string, unknown>
}

export interface WorkflowGraphEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface WorkflowSwimlane {
  id: string
  label: string
  order: number
}

export interface WorkflowGraphDto {
  version?: number
  lanes: WorkflowSwimlane[]
  nodes: WorkflowGraphNode[]
  edges: WorkflowGraphEdge[]
}

export function emptyGraph(): WorkflowGraphDto {
  return {
    version: 1,
    lanes: [{ id: 'lane-main', label: 'Luồng chính', order: 0 }],
    nodes: [],
    edges: [],
  }
}

export const workflowApi = {
  // ---- Definitions (SIMPLE /wf) ----
  listDefinitions: (moduleCode?: string) =>
    axiosClient
      .get<ApiResponse<WorkflowDefinition[]>>('/wf/definitions', {
        params: moduleCode ? { moduleCode } : {},
      })
      .then((res) => res.data),

  getDefinition: (id: string) =>
    axiosClient
      .get<ApiResponse<WorkflowDefinition>>(`/wf/definitions/${id}`)
      .then((res) => res.data),

  getDefinitionByCode: (code: string) =>
    axiosClient
      .get<ApiResponse<WorkflowDefinition>>(`/wf/definitions/by-code/${code}`)
      .then((res) => res.data),

  saveDefinition: (dto: WorkflowDefinition) =>
    axiosClient
      .post<ApiResponse<WorkflowDefinition>>('/wf/definitions', dto)
      .then((res) => res.data),

  deleteDefinition: (id: string) =>
    axiosClient
      .delete<ApiResponse<null>>(`/wf/definitions/${id}`)
      .then((res) => res.data),

  // ---- Instances ----
  getInstanceByEntity: (entityType: string, entityId: string) =>
    axiosClient
      .get<ApiResponse<WorkflowInstance | null>>(
        `/wf/instances/by-entity/${entityType}/${entityId}`,
      )
      .then((res) => res.data),

  cancelInstance: (id: string) =>
    axiosClient
      .post<ApiResponse<WorkflowInstance>>(`/wf/instances/${id}/cancel`)
      .then((res) => res.data),

  // ---- Tasks ----
  myTasks: () =>
    axiosClient
      .get<ApiResponse<WorkflowTask[]>>('/wf/tasks/mine')
      .then((res) => res.data),

  approveTask: (id: string, comment?: string) =>
    axiosClient
      .post<ApiResponse<WorkflowTask>>(`/wf/tasks/${id}/approve`, { comment })
      .then((res) => res.data),

  rejectTask: (id: string, reason: string) =>
    axiosClient
      .post<ApiResponse<WorkflowTask>>(`/wf/tasks/${id}/reject`, { reason })
      .then((res) => res.data),

  // ---- Visual: template gallery (BE storage — không hardcode graph FE) ----
  listTemplates: () =>
    axiosClient
      .get<ApiResponse<WorkflowTemplateMeta[]>>('/workflows/templates')
      .then((res) => res.data.data ?? [])
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404 || status === 501) return [] as WorkflowTemplateMeta[]
        throw err
      }),

  getTemplate: (code: string) =>
    axiosClient
      .get<ApiResponse<WorkflowDefinition>>(
        `/workflows/templates/${encodeURIComponent(code)}`,
      )
      .then((res) => res.data.data),

  cloneTemplate: (code: string) =>
    axiosClient
      .post<ApiResponse<WorkflowDefinition>>(
        `/workflows/templates/${encodeURIComponent(code)}/clone`,
      )
      .then((res) => res.data.data),

  // ---- Visual: definition + graphJson + guideMarkdown ----
  getVisualDefinition: (id: string) =>
    axiosClient
      .get<ApiResponse<WorkflowDefinition>>(`/workflows/definitions/${id}`)
      .then((res) => res.data.data)
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404 || status === 501) {
          return {
            id,
            code: '',
            name: '',
            moduleCode: '',
            steps: [],
            graphJson: emptyGraph(),
            guideMarkdown: null,
          } satisfies WorkflowDefinition
        }
        throw err
      }),

  saveVisualDefinition: (id: string, dto: Partial<WorkflowDefinition>) =>
    axiosClient
      .put<ApiResponse<WorkflowDefinition>>(`/workflows/definitions/${id}`, dto)
      .then((res) => res.data.data),

  validateVisualDefinition: (id: string) =>
    axiosClient
      .post<ApiResponse<{ valid?: boolean; errors?: string[] }>>(
        `/workflows/definitions/${id}/validate`,
      )
      .then((res) => res.data.data),
}
