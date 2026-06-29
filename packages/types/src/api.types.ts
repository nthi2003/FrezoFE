export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp?: string
}

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

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface TableColumn<T = Record<string, unknown>> {
  key: string
  title: string
  dataIndex?: keyof T
  width?: number | string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (value: unknown, record: T, index: number) => React.ReactNode
}

export type StatusType = 'active' | 'inactive' | 'pending' | 'blocked' | 'deleted'

export type ID = string

export interface BaseEntity {
  id: ID
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
  deleted?: boolean
}
