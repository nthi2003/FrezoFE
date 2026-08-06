import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { hrSetupApi } from '../services/hrSetupApi'

export function useJobPositions() {
  return useQuery({
    queryKey: ['job-positions'],
    queryFn: () => hrSetupApi.listJobPositions(),
    select: (res: any) => (Array.isArray(res?.data) ? res.data : res?.data?.items ?? []),
  })
}

export function useCreateJobPosition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => hrSetupApi.createJobPosition(data),
    onSuccess: () => {
      toast.success('Đã tạo vị trí công việc')
      qc.invalidateQueries({ queryKey: ['job-positions'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi tạo vị trí'),
  })
}

export function useUpdateJobPosition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hrSetupApi.updateJobPosition(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật vị trí')
      qc.invalidateQueries({ queryKey: ['job-positions'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi cập nhật'),
  })
}

export function useDeleteJobPosition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => hrSetupApi.deleteJobPosition(id),
    onSuccess: () => {
      toast.success('Đã xóa vị trí')
      qc.invalidateQueries({ queryKey: ['job-positions'] })
    },
  })
}

export function usePayrollComponents() {
  return useQuery({
    queryKey: ['payroll-components'],
    queryFn: () => hrSetupApi.listPayrollComponents(),
    select: (res: any) => (Array.isArray(res?.data) ? res.data : []),
  })
}

export function useCreatePayrollComponent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => hrSetupApi.createPayrollComponent(data),
    onSuccess: () => {
      toast.success('Đã tạo khoản')
      qc.invalidateQueries({ queryKey: ['payroll-components'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Lỗi'),
  })
}

export function useUpdatePayrollComponent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hrSetupApi.updatePayrollComponent(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật khoản')
      qc.invalidateQueries({ queryKey: ['payroll-components'] })
    },
  })
}

export function useDeletePayrollComponent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => hrSetupApi.deletePayrollComponent(id),
    onSuccess: () => {
      toast.success('Đã xóa khoản')
      qc.invalidateQueries({ queryKey: ['payroll-components'] })
    },
  })
}

export function usePersonWorkHistory(personId?: string) {
  return useQuery({
    queryKey: ['person-work-history', personId],
    queryFn: () => hrSetupApi.listWorkHistory(personId!),
    enabled: !!personId,
    select: (res: any) => (Array.isArray(res?.data) ? res.data : []),
  })
}

export function useCreateWorkHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => hrSetupApi.createWorkHistory(data),
    onSuccess: (_d, vars) => {
      toast.success('Đã thêm quá trình làm việc')
      qc.invalidateQueries({ queryKey: ['person-work-history', vars.personId] })
    },
  })
}

export function useDeleteWorkHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, personId }: { id: string; personId: string }) =>
      hrSetupApi.deleteWorkHistory(id).then(() => personId),
    onSuccess: (personId) => {
      toast.success('Đã xóa bản ghi')
      qc.invalidateQueries({ queryKey: ['person-work-history', personId] })
    },
  })
}

export function usePersonStatistics(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['person-statistics', params],
    queryFn: () => hrSetupApi.getPersonStatistics(params),
    select: (res: any) => res?.data ?? {},
  })
}
