// ============================================================
// Onboarding API — khớp BE OnboardingController
// POST …/assignments/{id}/items/{itemId}/complete (no body)
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export interface OnboardingChecklistItem {
  id?: string
  title: string
  description?: string
  assigneeRole?: string
  dueDayOffset?: number
  sortOrder?: number
  required?: boolean
}

export interface OnboardingTemplateDto {
  id: string
  name: string
  description?: string
  items: OnboardingChecklistItem[]
  active?: boolean
}

export interface OnboardingAssignmentItemDto {
  id: string
  title: string
  dueDate?: string
  status: string
  completedAt?: string
  completedBy?: string
  sortOrder?: number
}

export interface OnboardingAssignmentDto {
  id: string
  templateId: string
  personId: string
  startDate?: string
  status: string
  /** BE: progress (0–100) */
  progress: number
  items: OnboardingAssignmentItemDto[]
}

export interface OnboardingTemplateRequest {
  name: string
  description?: string
  items: OnboardingChecklistItem[]
  active?: boolean
}

export interface OnboardingAssignRequest {
  templateId: string
  personId: string
  startDate?: string
}

export const onboardingApi = {
  listTemplates: () =>
    axiosClient
      .get<ApiResponse<OnboardingTemplateDto[]>>('/qlns/onboarding/templates')
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  createTemplate: (body: OnboardingTemplateRequest) =>
    axiosClient
      .post<ApiResponse<OnboardingTemplateDto>>('/qlns/onboarding/templates', body)
      .then((r) => r.data.data),

  listAssignments: (personId?: string) =>
    axiosClient
      .get<ApiResponse<OnboardingAssignmentDto[]>>('/qlns/onboarding/assignments', {
        params: personId ? { personId } : undefined,
      })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  assign: (body: OnboardingAssignRequest) =>
    axiosClient
      .post<ApiResponse<OnboardingAssignmentDto>>(
        '/qlns/onboarding/assignments',
        body,
      )
      .then((r) => r.data.data),

  completeItem: (assignmentId: string, itemId: string) =>
    axiosClient
      .post<ApiResponse<OnboardingAssignmentDto>>(
        `/qlns/onboarding/assignments/${assignmentId}/items/${itemId}/complete`,
      )
      .then((r) => r.data.data),
}
