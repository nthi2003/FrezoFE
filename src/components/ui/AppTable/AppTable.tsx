// ============================================================
// FREZO ERP — AppTable (Siêu Component)
// Bọc lại Table của shadcn, tự động render loading, empty state, và phân trang.
// ============================================================

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

// ---- Types ----
export interface AppTableColumn<T> {
  key: string
  title: string
  dataIndex?: keyof T
  align?: 'left' | 'center' | 'right'
  width?: string | number
  render?: (value: any, record: T, index: number) => React.ReactNode
}

export interface AppTableProps<T> {
  columns: AppTableColumn<T>[]
  data: T[]
  isLoading?: boolean
  loadingRows?: number

  // Pagination
  pageIndex?: number // 1-based
  pageSize?: number
  totalElements?: number
  onPageChange?: (page: number, size: number) => void
}

export function AppTable<T>({
  columns,
  data,
  isLoading = false,
  loadingRows = 5,
  pageIndex = 1,
  pageSize = 10,
  totalElements = 0,
  onPageChange,
}: AppTableProps<T>) {
  const totalPages = Math.ceil(totalElements / pageSize)
  const isEmpty = !isLoading && data.length === 0

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50/80">
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                  className="font-semibold text-neutral-600"
                >
                  {col.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading State */}
            {isLoading &&
              Array.from({ length: loadingRows }).map((_, i) => (
                <TableRow key={`loading-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={`loading-${i}-${col.key}`}>
                      <Skeleton className="h-5 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {/* Empty State */}
            {isEmpty && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-neutral-400">
                    <Inbox size={40} className="mb-2 opacity-20" />
                    <p>Không có dữ liệu</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Data Rows */}
            {!isLoading &&
              !isEmpty &&
              data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col) => {
                    const value = col.dataIndex ? row[col.dataIndex] : undefined
                    return (
                      <TableCell
                        key={col.key}
                        style={{ textAlign: col.align || 'left' }}
                      >
                        {col.render
                          ? col.render(value, row, rowIndex)
                          : (value as React.ReactNode)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && totalElements > 0 && (
        <div className="flex items-center justify-between px-2 text-sm">
          <div className="text-neutral-500">
            Hiển thị{' '}
            <span className="font-medium text-neutral-900">
              {Math.min((pageIndex - 1) * pageSize + 1, totalElements)}
            </span>{' '}
            -{' '}
            <span className="font-medium text-neutral-900">
              {Math.min(pageIndex * pageSize, totalElements)}
            </span>{' '}
            trong tổng số <span className="font-medium text-neutral-900">{totalElements}</span> bản ghi
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pageIndex - 1, pageSize)}
              disabled={pageIndex <= 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-medium text-neutral-700">
              Trang {pageIndex} / {totalPages || 1}
            </span>
            <button
              onClick={() => onPageChange?.(pageIndex + 1, pageSize)}
              disabled={pageIndex >= totalPages}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
