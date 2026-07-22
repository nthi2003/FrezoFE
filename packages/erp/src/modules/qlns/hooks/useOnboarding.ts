import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  onboardingApi,
  type OnboardingAssignRequest,
  type OnboardingTemplateRequest,
} from '../services/onboardingApi'

export function useOnboardingTemplates() {
  return useQuery({
    queryKey: ['qlns', 'onboarding', 'templates'],
    queryFn: () => onboardingApi.listTemplates(),
  })
}

export function useOnboardingAssignments() {
  return useQuery({
    queryKey: ['qlns', 'onboarding', 'assignments'],
    queryFn: () => onboardingApi.listAssignments(),
  })
}

export function useCreateOnboardingTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: OnboardingTemplateRequest) =>
      onboardingApi.createTemplate(body),
    onSuccess: () => {
      toast.success('Đã tạo template')
      qc.invalidateQueries({ queryKey: ['qlns', 'onboarding', 'templates'] })
    },
    onError: () => toast.error('Tạo template thất bại'),
  })
}

export function useAssignOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: OnboardingAssignRequest) => onboardingApi.assign(body),
    onSuccess: () => {
      toast.success('Đã gán checklist')
      qc.invalidateQueries({ queryKey: ['qlns', 'onboarding', 'assignments'] })
    },
    onError: () => toast.error('Gán checklist thất bại'),
  })
}

export function useCompleteOnboardingItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      assignmentId,
      itemId,
    }: {
      assignmentId: string
      itemId: string
    }) => onboardingApi.completeItem(assignmentId, itemId),
    onSuccess: () => {
      toast.success('Đã hoàn thành hạng mục')
      qc.invalidateQueries({ queryKey: ['qlns', 'onboarding', 'assignments'] })
    },
    onError: () => toast.error('Complete item thất bại'),
  })
}
