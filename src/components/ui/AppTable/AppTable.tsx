// ============================================================
// FREZO ERP — AppTable (Siêu Component)
// Bọc lại Table của shadcn, tự động render loading, empty state, phân trang,
// và bộ lọc tìm kiếm động tự tạo theo tên cột.
// ============================================================

import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Inbox, Search, Filter, RotateCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/Select'

// ---- Types ----
export interface AppTableColumn<T> {
  key?: string
  title: string
  dataIndex?: keyof T
  align?: 'left' | 'center' | 'right'
  width?: string | number
  render?: (value: any, record: T, index: number) => React.ReactNode

  // Dynamic Filtering Fields
  filterType?: 'text' | 'select' | 'boolean'
  filterKey?: string
  filterOptions?: { value: string; label: string }[]
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

  // Dynamic Filtering Props
  showSearch?: boolean
  searchPlaceholder?: string
  searchKey?: string
  onFilterChange?: (filters: Record<string, any>) => void
  onRefresh?: () => void
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
  showSearch = false,
  searchPlaceholder = 'Tìm kiếm...',
  searchKey = 'keyword',
  onFilterChange,
  onRefresh,
}: AppTableProps<T>) {
  const safeData = Array.isArray(data) ? data : []
  const colKey = (col: AppTableColumn<T>) => col.key ?? (col.dataIndex as string) ?? col.title
  const sttCol: AppTableColumn<T> = { key: '__stt', title: 'STT', width: 60, align: 'center' }
  const allColumns = [sttCol, ...columns]
  const totalCols = allColumns.length

  // Internal states for local pagination
  const [internalPageIndex, setInternalPageIndex] = useState(pageIndex)
  const [internalPageSize, setInternalPageSize] = useState(pageSize)

  // Sync internal pagination with props when props change
  useEffect(() => {
    setInternalPageIndex(pageIndex)
  }, [pageIndex])

  useEffect(() => {
    setInternalPageSize(pageSize)
  }, [pageSize])

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  // Identify filterable columns
  const filterableCols = columns.filter((col) => col.filterType)
  const hasFilterOptions = filterableCols.length > 0

  const isClientSide = !onFilterChange

  // Client-side filtering logic
  let filteredData = [...safeData]
  if (isClientSide) {
    // 1. Search Keyword filter
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim()
      filteredData = filteredData.filter((row: any) => {
        return columns.some((col) => {
          const val = col.dataIndex ? row[col.dataIndex] : null
          if (val === null || val === undefined) return false
          return String(val).toLowerCase().includes(keyword)
        })
      })
    }

    // 2. Column-specific filters
    Object.keys(filterValues).forEach((key) => {
      const filterVal = filterValues[key]
      if (filterVal === 'ALL' || filterVal === '' || filterVal === undefined || filterVal === null) {
        return
      }

      filteredData = filteredData.filter((row: any) => {
        const col = columns.find((c) => (c.filterKey || c.dataIndex || c.key) === key)
        if (!col) return true

        const rowVal = col.dataIndex ? row[col.dataIndex] : null

        if (col.filterType === 'boolean') {
          return !!rowVal === (filterVal === true || filterVal === 'true')
        }

        if (rowVal === null || rowVal === undefined) return false
        return String(rowVal).toLowerCase() === String(filterVal).toLowerCase()
      })
    })
  }

  // Display values determined by whether we are server-side or client-side
  const displayPageIndex = isClientSide ? internalPageIndex : pageIndex
  const displayPageSize = isClientSide ? internalPageSize : pageSize
  const displayTotalElements = isClientSide ? filteredData.length : totalElements
  const displayData = isClientSide
    ? filteredData.slice((displayPageIndex - 1) * displayPageSize, displayPageIndex * displayPageSize)
    : safeData
  const displayTotalPages = Math.ceil(displayTotalElements / displayPageSize)

  const isEmpty = !isLoading && displayData.length === 0

  // Trigger filter callback
  const notifyFilterChange = (nextKeyword: string, nextFilters: Record<string, any>) => {
    if (onFilterChange) {
      const cleanParams: Record<string, any> = {}

      if (nextKeyword.trim()) {
        cleanParams[searchKey] = nextKeyword.trim()
      }

      Object.keys(nextFilters).forEach((key) => {
        const val = nextFilters[key]
        if (val !== 'ALL' && val !== '' && val !== undefined && val !== null) {
          if (val === 'true') cleanParams[key] = true
          else if (val === 'false') cleanParams[key] = false
          else cleanParams[key] = val
        }
      })

      onFilterChange(cleanParams)
    } else {
      setInternalPageIndex(1)
    }
  }

  const handleSearchClick = () => {
    notifyFilterChange(searchKeyword, filterValues)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      notifyFilterChange(searchKeyword, filterValues)
    }
  }

  const handleFilterSelect = (key: string, value: any) => {
    const nextFilters = { ...filterValues, [key]: value }
    setFilterValues(nextFilters)
    notifyFilterChange(searchKeyword, nextFilters)
  }

  const handleReset = () => {
    setSearchKeyword('')
    setFilterValues({})
    if (onFilterChange) {
      onFilterChange({})
    } else {
      setInternalPageIndex(1)
    }
    onRefresh?.()
  }

  const handlePageChange = (newPage: number, newSize: number) => {
    if (onPageChange) {
      onPageChange(newPage, newSize)
    } else {
      setInternalPageIndex(newPage)
      setInternalPageSize(newSize)
    }
  }

  // Count active filters (not 'ALL' and not empty)
  const activeFiltersCount = Object.keys(filterValues).filter(
    (k) => filterValues[k] !== 'ALL' && filterValues[k] !== '' && filterValues[k] !== undefined && filterValues[k] !== null
  ).length

  return (
    <div className="space-y-4">
      {/* Dynamic Filter Toolbar */}
      {(showSearch || hasFilterOptions) && (
        <div className="p-4 rounded-xl border border-border bg-surface shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            {showSearch && (
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="pl-9 pr-4"
                />
              </div>
            )}

            {/* Actions */}
            {showSearch && (
              <Button onClick={handleSearchClick} className="gap-1.5 bg-primary-600 hover:bg-primary-700 text-white">
                <Search size={15} /> Tìm kiếm
              </Button>
            )}

            {hasFilterOptions && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`gap-1.5 transition-all relative ${
                  showFiltersPanel ? 'bg-neutral-100 border-neutral-400' : ''
                }`}
              >
                <Filter size={15} />
                Bộ lọc
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              className="gap-1.5 text-neutral-500 hover:text-neutral-900"
            >
              <RotateCw size={15} />
              Làm mới
            </Button>
          </div>

          {/* Expandable Advanced Filters Grid */}
          {hasFilterOptions && showFiltersPanel && (
            <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {filterableCols.map((col) => {
                const key = col.filterKey || (col.dataIndex as string) || col.key || ''
                if (!key) return null

                return (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {col.title}
                    </label>

                    {col.filterType === 'select' && (
                      <Select
                        options={[{ value: 'ALL', label: `-- Tất cả ${col.title.toLowerCase()} --` }, ...(col.filterOptions || [])]}
                        value={filterValues[key] || 'ALL'}
                        onChange={(val) => handleFilterSelect(key, val)}
                        placeholder={`Tất cả ${col.title.toLowerCase()}`}
                      />
                    )}

                    {col.filterType === 'boolean' && (
                      <Select
                        options={[
                          { value: 'ALL', label: `-- Tất cả ${col.title.toLowerCase()} --` },
                          { value: 'true', label: 'Hoạt động / Bật' },
                          { value: 'false', label: 'Không hoạt động / Tắt' },
                        ]}
                        value={
                          filterValues[key] === true
                            ? 'true'
                            : filterValues[key] === false
                            ? 'false'
                            : 'ALL'
                        }
                        onChange={(val) => handleFilterSelect(key, val === 'true' ? true : val === 'false' ? false : 'ALL')}
                        placeholder={`Tất cả ${col.title.toLowerCase()}`}
                      />
                    )}

                    {col.filterType === 'text' && (
                      <Input
                        value={filterValues[key] || ''}
                        onChange={(e) => handleFilterSelect(key, e.target.value)}
                        placeholder={`Nhập ${col.title.toLowerCase()}...`}
                        className="h-9"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50/80">
            <TableRow>
              {allColumns.map((col) => (
                <TableHead
                  key={colKey(col)}
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
                  {allColumns.map((col) => (
                    <TableCell key={`loading-${i}-${colKey(col)}`}>
                      <Skeleton className="h-5 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {/* Empty State */}
            {isEmpty && (
              <TableRow>
                <TableCell key="empty" colSpan={totalCols} className="h-48 text-center">
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
              displayData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {allColumns.map((col) => {
                    if (col.key === '__stt') {
                      return (
                        <TableCell key="__stt" style={{ textAlign: 'center' }}>
                          {(displayPageIndex - 1) * displayPageSize + rowIndex + 1}
                        </TableCell>
                      )
                    }
                    const value = col.dataIndex ? row[col.dataIndex] : undefined
                    return (
                      <TableCell
                        key={colKey(col)}
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
      {!isLoading && displayTotalElements > 0 && (
        <div className="flex items-center justify-between px-2 text-sm">
          <div className="text-neutral-500">
            Hiển thị{' '}
            <span className="font-medium text-neutral-900">
              {Math.min((displayPageIndex - 1) * displayPageSize + 1, displayTotalElements)}
            </span>{' '}
            -{' '}
            <span className="font-medium text-neutral-900">
              {Math.min(displayPageIndex * displayPageSize, displayTotalElements)}
            </span>{' '}
            trong tổng số <span className="font-medium text-neutral-900">{displayTotalElements}</span> bản ghi
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(displayPageIndex - 1, displayPageSize)}
              disabled={displayPageIndex <= 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-medium text-neutral-700">
              Trang {displayPageIndex} / {displayTotalPages || 1}
            </span>
            <button
              onClick={() => handlePageChange(displayPageIndex + 1, displayPageSize)}
              disabled={displayPageIndex >= displayTotalPages}
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
