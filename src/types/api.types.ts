// ============================================================
// FREZO ERP — Global TypeScript Types
// ============================================================

// ---- API Response Wrapper ----
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp?: string
}

// ---- Pagination ----
export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
  direction?: 'ASC' | 'DESC'
  keyword?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// ---- Select Option ----
export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

// ---- Table Column ----
export interface TableColumn<T = Record<string, unknown>> {
  key: string
  title: string
  dataIndex?: keyof T
  width?: number | string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (value: unknown, record: T, index: number) => React.ReactNode
}

// ---- Common Status ----
export type StatusType = 'active' | 'inactive' | 'pending' | 'blocked' | 'deleted'

// ---- ID type ----
export type ID = string

// ---- Base Entity ----
export interface BaseEntity {
  id: ID
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
  deleted?: boolean
}
