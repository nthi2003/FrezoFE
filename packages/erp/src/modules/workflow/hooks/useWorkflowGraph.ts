import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  emptyGraph,
  workflowApi,
  type WorkflowDefinition,
  type WorkflowGraphDto,
} from '../services/workflowApi'

const QK_TEMPLATES = ['workflows', 'templates'] as const
const QK_VISUAL = (id: string) => ['workflows', 'definitions', id] as const

export function useWorkflowTemplates() {
  return useQuery({
    queryKey: QK_TEMPLATES,
    queryFn: () => workflowApi.listTemplates(),
  })
}

export function useCloneWorkflowTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => workflowApi.cloneTemplate(code),
    onSuccess: () => {
      toast.success('Đã clone mẫu — mở Designer')
      qc.invalidateQueries({ queryKey: ['workflow'] })
      qc.invalidateQueries({ queryKey: QK_TEMPLATES })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response
        ?.data?.message
      toast.error(msg || 'Clone mẫu thất bại (BE có thể chưa sẵn)')
    },
  })
}

/** GET /workflows/definitions/:id — kèm graphJson + guideMarkdown */
export function useVisualWorkflowDefinition(id?: string) {
  return useQuery({
    queryKey: QK_VISUAL(id || ''),
    queryFn: () => workflowApi.getVisualDefinition(id!),
    enabled: !!id,
  })
}

/** Graph từ definition visual — undefined khi chưa load xong. */
export function useWorkflowGraph(id?: string) {
  const q = useVisualWorkflowDefinition(id)
  const graph = useMemo((): WorkflowGraphDto | undefined => {
    if (!q.data) return undefined
    return (q.data.graphJson as WorkflowGraphDto | null) ?? emptyGraph()
  }, [q.data])

  return {
    ...q,
    data: graph,
    definition: q.data as WorkflowDefinition | undefined,
    guideMarkdown: q.data?.guideMarkdown ?? null,
  }
}

export function useSaveWorkflowGraph(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      graphJson: WorkflowGraphDto
      guideMarkdown?: string | null
      name?: string
      description?: string | null
    }) =>
      workflowApi.saveVisualDefinition(id, {
        graphJson: payload.graphJson,
        guideMarkdown: payload.guideMarkdown,
        name: payload.name,
        description: payload.description,
        editorMode: 'VISUAL',
      }),
    onSuccess: () => {
      toast.success('Đã lưu graph')
      qc.invalidateQueries({ queryKey: QK_VISUAL(id) })
      qc.invalidateQueries({ queryKey: ['workflow'] })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response
        ?.data?.message
      toast.error(msg || 'Lưu graph thất bại')
    },
  })
}

export function useValidateWorkflowGraph(id: string) {
  return useMutation({
    mutationFn: () => workflowApi.validateVisualDefinition(id),
    onSuccess: (result) => {
      const errors = result?.errors?.filter(Boolean) ?? []
      if (result?.valid === false || errors.length > 0) {
        toast.error(errors[0] || 'Graph chưa hợp lệ')
        return
      }
      toast.success('Graph hợp lệ')
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response
        ?.data?.message
      toast.error(msg || 'Không kiểm tra được graph')
    },
  })
}
