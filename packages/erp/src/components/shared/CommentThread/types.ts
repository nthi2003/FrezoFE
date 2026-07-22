// ============================================================
// CommentThread types — reuse SubjectType từ approval module
// ============================================================

import { SubjectType } from '@/modules/approval/types'

export { SubjectType }

export interface CommentDto {
  id: string
  content: string
  authorId: string
  authorName: string
  authorAvatar?: string
  mentions: string[]
  parentId?: string | null
  attachments?: Array<{ id: string; url: string; name: string }>
  createdAt: string
  updatedAt?: string
  deleted?: boolean
  /** System activity log (không phải comment user). */
  isSystem?: boolean
  systemAction?: string
}

export interface CommentCreatePayload {
  subjectType: SubjectType | string
  subjectId: string
  content: string
  parentId?: string | null
  mentionedUserIds?: string[]
}

export interface CommentUpdatePayload {
  content: string
  mentionedUserIds?: string[]
}

export interface MentionUser {
  id: string
  username: string
  fullName: string
  avatar?: string
  email?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  number: number
  size: number
}
