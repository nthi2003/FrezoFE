// ============================================================
// CommentThread types — reuse SubjectType từ approval module
// ============================================================

import { SubjectType } from '@/modules/approval/types'

export { SubjectType }

/** Max nest depth (0 = root). Reply allowed while depth < MAX. SME: 5 lớp tổng. */
export const MAX_COMMENT_DEPTH = 4

/** MVP attach: image / pdf / word, ≤10MB (khớp BE). */
export const COMMENT_ATTACH_MAX_BYTES = 10 * 1024 * 1024
export const COMMENT_ATTACH_ACCEPT =
  'image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export interface CommentAttachment {
  id?: string
  url: string
  name: string
  contentType?: string
  size?: number
  objectName?: string
}

export interface CommentDto {
  id: string
  content: string
  authorId: string
  authorName: string
  authorAvatar?: string
  mentions: string[]
  parentId?: string | null
  attachments?: CommentAttachment[]
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
  attachments?: CommentAttachment[]
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
