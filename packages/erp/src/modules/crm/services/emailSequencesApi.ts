// ============================================================
// Email Sequences — khớp BE (stepOrder, bodyHtml)
// ============================================================

import axiosClient from '@/lib/axios/axiosClient'
import type { ApiResponse } from '@frezo/types'

export interface EmailSequenceStepDto {
  id?: string
  stepOrder: number
  delayDays: number
  subject: string
  bodyHtml?: string
}

export interface EmailSequenceDto {
  id: string
  name: string
  description?: string
  active?: boolean
  steps: EmailSequenceStepDto[]
}

export interface EmailSequenceCreateRequest {
  name: string
  description?: string
  steps: Array<{
    stepOrder: number
    delayDays: number
    subject: string
    bodyHtml?: string
  }>
  active?: boolean
}

export interface EnrollRequest {
  leadId: string
}

export const emailSequencesApi = {
  list: () =>
    axiosClient
      .get<ApiResponse<EmailSequenceDto[]>>('/crm/email-sequences')
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),

  create: (body: EmailSequenceCreateRequest) =>
    axiosClient
      .post<ApiResponse<EmailSequenceDto>>('/crm/email-sequences', body)
      .then((r) => r.data.data),

  enroll: (sequenceId: string, body: EnrollRequest) =>
    axiosClient
      .post<ApiResponse<{ id?: string; enrollmentId?: string }>>(
        `/crm/email-sequences/${sequenceId}/enroll`,
        body,
      )
      .then((r) => r.data.data),
}
