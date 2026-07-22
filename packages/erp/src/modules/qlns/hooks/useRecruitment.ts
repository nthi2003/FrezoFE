import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { unwrapList } from '@frezo/utils'
import {
  recruitmentApi,
  type ApplicationFilter,
  type ApplicationStage,
  type RequisitionRequest,
} from '../services/recruitmentApi'

const QK_REQUISITIONS = ['qlns', 'recruitment', 'requisitions'] as const
const QK_APPLICATIONS = ['qlns', 'recruitment', 'applications'] as const

export function useRequisitions() {
  return useQuery({
    queryKey: QK_REQUISITIONS,
    queryFn: () => recruitmentApi.listRequisitions(),
    select: unwrapList,
  })
}

export function useCreateRequisition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RequisitionRequest) => recruitmentApi.createRequisition(data),
    onSuccess: () => {
      toast.success('Đã tạo tin tuyển dụng')
      qc.invalidateQueries({ queryKey: QK_REQUISITIONS })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Không tạo được tin tuyển dụng')
    },
  })
}

export function useApplications(filter?: ApplicationFilter) {
  return useQuery({
    queryKey: [...QK_APPLICATIONS, filter?.requisitionId ?? 'all', filter?.stage ?? 'all'],
    queryFn: () => recruitmentApi.listApplications(filter),
    select: unwrapList,
  })
}

export function useMoveApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: ApplicationStage }) =>
      recruitmentApi.moveApplication(id, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_APPLICATIONS })
      qc.invalidateQueries({ queryKey: QK_REQUISITIONS })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Không di chuyển được ứng viên')
    },
  })
}

export function useHireApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recruitmentApi.hireApplication(id),
    onSuccess: () => {
      toast.success('Đã duyệt thuê (HIRED)')
      qc.invalidateQueries({ queryKey: QK_APPLICATIONS })
      qc.invalidateQueries({ queryKey: QK_REQUISITIONS })
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Hire thất bại')
    },
  })
}
