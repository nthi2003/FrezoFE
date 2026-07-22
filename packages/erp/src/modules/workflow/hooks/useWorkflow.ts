import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { workflowApi, type WorkflowDefinition } from '../services/workflowApi'

const QK_DEFS = ['workflow', 'definitions'] as const
const QK_DEF = (id: string) => ['workflow', 'definition', id] as const
const QK_MY_TASKS = ['workflow', 'my-tasks'] as const
const QK_INSTANCE = (type: string, id: string) => ['workflow', 'instance', type, id] as const

const unwrap = <T,>(raw: any): T => (raw?.data ?? raw) as T

// ============================================================
// Definitions
// ============================================================

export function useWorkflowDefinitions(moduleCode?: string, enabled = true) {
  return useQuery({
    queryKey: [...QK_DEFS, moduleCode || 'all'],
    queryFn: () => workflowApi.listDefinitions(moduleCode),
    enabled,
    select: (raw) => unwrap<WorkflowDefinition[]>(raw) || [],
  })
}

export function useWorkflowDefinition(id?: string) {
  return useQuery({
    queryKey: QK_DEF(id || ''),
    queryFn: () => workflowApi.getDefinition(id!),
    enabled: !!id,
    select: (raw) => unwrap<WorkflowDefinition>(raw),
  })
}

export function useWorkflowDefinitionByCode(code?: string) {
  return useQuery({
    queryKey: ['workflow', 'definition-by-code', code || ''],
    queryFn: () => workflowApi.getDefinitionByCode(code!),
    enabled: !!code,
    select: (raw) => unwrap<WorkflowDefinition>(raw),
    retry: false,
  })
}

export function useSaveWorkflowDefinition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: WorkflowDefinition) => workflowApi.saveDefinition(dto),
    onSuccess: (_data, dto) => {
      toast.success(dto.id ? 'Đã cập nhật quy trình' : 'Đã tạo quy trình mới')
      qc.invalidateQueries({ queryKey: ['workflow'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không lưu được'),
  })
}

export function useDeleteWorkflowDefinition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workflowApi.deleteDefinition(id),
    onSuccess: () => {
      toast.success('Đã xoá quy trình')
      qc.invalidateQueries({ queryKey: QK_DEFS })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không xoá được'),
  })
}

// ============================================================
// Instances — dùng trong module business để render progress
// ============================================================

export function useWorkflowInstanceByEntity(entityType: string, entityId?: string) {
  return useQuery({
    queryKey: QK_INSTANCE(entityType, entityId || ''),
    queryFn: () => workflowApi.getInstanceByEntity(entityType, entityId!),
    enabled: !!entityId,
    select: (raw) => unwrap<any>(raw),
  })
}

// ============================================================
// My Tasks — inbox
// ============================================================

export function useMyWorkflowTasks() {
  return useQuery({
    queryKey: QK_MY_TASKS,
    queryFn: () => workflowApi.myTasks(),
    select: (raw) => unwrap<any[]>(raw) || [],
    refetchInterval: 60_000, // refresh mỗi phút để badge cập nhật
  })
}

export function useApproveWorkflowTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => workflowApi.approveTask(id, comment),
    onSuccess: () => {
      toast.success('Đã duyệt task')
      qc.invalidateQueries({ queryKey: ['workflow'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không duyệt được'),
  })
}

export function useRejectWorkflowTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => workflowApi.rejectTask(id, reason),
    onSuccess: () => {
      toast.success('Đã từ chối')
      qc.invalidateQueries({ queryKey: ['workflow'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Không từ chối được'),
  })
}
