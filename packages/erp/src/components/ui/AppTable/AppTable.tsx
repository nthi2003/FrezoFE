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
  BulkSelectionBar,
  AppTooltip,
} from '@frezo/ui'
import { Skeleton } from '@frezo/ui'
import notDataImg from '@/img/mas-cost-not-data.png'
import {
  ChevronLeft, ChevronRight, Search, Filter, RotateCw, X, Rows3, Rows4,
  type LucideIcon,
} from 'lucide-react'
import { Input } from '@frezo/ui'
import { Button } from '@frezo/ui'
import { Select } from '@frezo/ui'
import {
  useTableSelection, useCheckboxIndeterminate,
} from '@/lib/table/useTableSelection'

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

export interface BulkAction<T> {
  /** Key duy nhất trong list actions. */
  key: string
  /** Nhãn hiển thị trên nút. */
  label: string
  /** Icon Lucide (tuỳ chọn). */
  icon?: LucideIcon
  /** Variant nút — mặc định 'outline'. Xoá dùng 'destructive'. */
  variant?: 'default' | 'outline' | 'destructive' | 'ghost'
  /** Handler nhận danh sách row đã chọn. Trả Promise → tự disable trong lúc chạy. */
  onClick: (rows: T[]) => void | Promise<void>
  /** Ẩn action tuỳ trạng thái selection (VD chỉ hiện khi chọn >= 2). */
  hidden?: (rows: T[]) => boolean
  /** Disable action mà không ẩn (VD selection có row locked). */
  disabled?: (rows: T[]) => boolean
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
  /**
   * Danh sách page-size cho user chọn — mặc định [10, 20, 50, 100].
   * Truyền `[]` để ẩn selector hoàn toàn.
   */
  pageSizeOptions?: number[]
  /**
   * Ẩn toàn bộ footer phân trang khi chỉ có 1 page (mặc định false — luôn hiện
   * để nhất quán giữa các trang có ít / nhiều data).
   */
  hidePaginationWhenSinglePage?: boolean

  // Dynamic Filtering Props
  showSearch?: boolean
  searchPlaceholder?: string
  searchKey?: string
  onFilterChange?: (filters: Record<string, any>) => void
  onRefresh?: () => void

  // ---- Bulk selection (STANDARD Phần 17.1) ----
  /** Bật cột checkbox chọn nhiều dòng. */
  selectable?: boolean
  /** Hàm map row → id ổn định. Bắt buộc khi selectable. */
  getRowId?: (row: T) => string
  /** Danh sách bulk-action hiển thị trong sticky bar. */
  bulkActions?: BulkAction<T>[]
  /** Offset trái cho sticky bar khi có sidebar cố định (VD "md:left-64"). */
  bulkBarOffsetLeftClass?: string

  /**
   * Density hàng (FR-UX-01).
   * - compact: py-2.5 / h-10 / text-sm (14px @ 16px root) — mặc định
   * - comfortable: p-4 / h-12 / text-base (16px) — đọc dễ hơn
   * Truyền `density` cố định; `defaultDensity` + `showDensityToggle` cho EU đổi.
   */
  density?: TableDensity
  /** Density khởi tạo khi có toggle (mặc định compact). */
  defaultDensity?: TableDensity
  /** Hiện toggle Compact ↔ Comfortable cạnh filter bar. */
  showDensityToggle?: boolean

  /** Thuộc tính tuỳ chọn gắn lên từng TableRow (VD hover preview). */
  getRowProps?: (row: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>
}

export type TableDensity = 'compact' | 'comfortable'

export function AppTable<T>({
  columns,
  data,
  isLoading = false,
  loadingRows = 5,
  pageIndex = 1,
  pageSize = 10,
  totalElements = 0,
  onPageChange,
  pageSizeOptions = [10],
  hidePaginationWhenSinglePage = false,
  showSearch = false,
  searchPlaceholder = 'Tìm kiếm...',
  searchKey = 'keyword',
  onFilterChange,
  onRefresh,
  selectable = false,
  getRowId,
  bulkActions,
  bulkBarOffsetLeftClass,
  density: densityProp,
  defaultDensity = 'compact',
  showDensityToggle = false,
  getRowProps,
}: AppTableProps<T>) {
  const safeData = Array.isArray(data) ? data : []
  const colKey = (col: AppTableColumn<T>) => col.key ?? (col.dataIndex as string) ?? col.title
  const sttCol: AppTableColumn<T> = { key: '__stt', title: 'STT', width: 60, align: 'center' }
  const checkboxCol: AppTableColumn<T> = { key: '__check', title: '', width: 44, align: 'center' }
  const allColumns = selectable ? [checkboxCol, sttCol, ...columns] : [sttCol, ...columns]
  const totalCols = allColumns.length

  // Internal states for local pagination
  const [internalPageIndex, setInternalPageIndex] = useState(pageIndex)
  const [internalPageSize, setInternalPageSize] = useState(pageSize)
  const [densityInternal, setDensityInternal] = useState<TableDensity>(defaultDensity)
  const density: TableDensity = densityProp ?? densityInternal
  const isCompact = density === 'compact'
  const headCellClass = isCompact
    ? 'h-10 min-h-10 px-3 py-2 text-sm font-semibold text-neutral-600'
    : 'h-12 min-h-12 px-4 text-base font-semibold text-neutral-600'
  const bodyCellClass = isCompact ? 'px-3 py-2.5 text-sm leading-snug' : 'p-4 text-base'

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

  // Server-driven when parent owns paging and/or filters.
  // Previously only `onFilterChange` flipped this — pages that paginate on the
  // server via `onPageChange` + `totalElements` (e.g. ApiLogs) were treated as
  // client-side: total became `data.length` (one page) and the pager stuck at 1 page.
  const isClientSide = !onPageChange && !onFilterChange

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

  // ---- Selection state ----
  // Warning nhẹ: nếu selectable=true mà thiếu getRowId → fallback index (không ổn định
  // khi sort/filter). Cảnh báo dev-only, không crash prod.
  const resolveRowId = (row: T, index: number): string => {
    if (getRowId) return getRowId(row)
    const r = row as unknown as Record<string, unknown>
    if (r && (typeof r.id === 'string' || typeof r.id === 'number')) return String(r.id)
    return `__row-${index}`
  }
  const selection = useTableSelection<T>(
    displayData,
    (row) => resolveRowId(row, displayData.indexOf(row)),
  )
  const headerCheckboxRef = useCheckboxIndeterminate(selection.someSelected)

  // Chạy các bulk-action đang chạy → disable buttons tránh double click
  const [runningActionKey, setRunningActionKey] = useState<string | null>(null)
  const handleBulkClick = async (action: BulkAction<T>) => {
    if (runningActionKey) return
    setRunningActionKey(action.key)
    try {
      await Promise.resolve(action.onClick(selection.selectedRows))
    } finally {
      setRunningActionKey(null)
    }
  }

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

  interface FilterItem {
    type: 'search' | 'column'
    key: string
    title: string
    column?: AppTableColumn<T>
  }

  const filterItems: FilterItem[] = []
  if (showSearch) {
    filterItems.push({
      type: 'search',
      key: searchKey,
      title: 'Tìm kiếm'
    })
  }

  filterableCols.forEach((col) => {
    const key = col.filterKey || (col.dataIndex as string) || col.key || ''
    if (key) {
      filterItems.push({
        type: 'column',
        key,
        title: col.title,
        column: col
      })
    }
  })

  const inlineItems = filterItems.slice(0, 4)
  const sidebarItems = filterItems.slice(4)

  // Lock body scroll when sidebar filter is open.
  // Compensate mất scrollbar bằng padding-right để content không dịch trái,
  // tránh hiện tượng "gap trắng lồi" ở rìa phải khi drawer mở.
  useEffect(() => {
    if (!(showFiltersPanel && sidebarItems.length > 0)) return

    const body = document.body
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = body.style.overflow
    const prevPaddingRight = body.style.paddingRight

    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      const currentPadding = parseInt(window.getComputedStyle(body).paddingRight, 10) || 0
      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`
    }

    return () => {
      body.style.overflow = prevOverflow
      body.style.paddingRight = prevPaddingRight
    }
  }, [showFiltersPanel, sidebarItems.length])

  const renderFilterItem = (item: FilterItem, isSidebar = false) => {
    if (item.type === 'search') {
      return (
        <div key={item.key} className={isSidebar ? 'space-y-1.5' : 'flex-1 min-w-[200px] w-full space-y-1.5'}>
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            {isSidebar ? 'Tìm kiếm từ khóa' : 'Từ khóa'}
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="pl-9 pr-4 w-full h-9"
            />
          </div>
        </div>
      )
    }

    const col = item.column
    if (!col) return null
    const key = item.key

    return (
      <div key={key} className={isSidebar ? 'space-y-1.5' : 'flex-1 min-w-[200px] w-full space-y-1.5'}>
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
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
            className="h-9 w-full"
          />
        )}
      </div>
    )
  }

  const DensityToggle = showDensityToggle && !densityProp ? (
    <div
      className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-0.5"
      role="group"
      aria-label="Mật độ bảng"
    >
      <button
        type="button"
        onClick={() => setDensityInternal('compact')}
        className={`inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium transition ${
          isCompact
            ? 'bg-white text-neutral-900 shadow-sm'
            : 'text-neutral-500 hover:text-neutral-800'
        }`}
        title="Compact — nhiều dòng hơn"
      >
        <Rows4 size={13} /> Compact
      </button>
      <button
        type="button"
        onClick={() => setDensityInternal('comfortable')}
        className={`inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium transition ${
          !isCompact
            ? 'bg-white text-neutral-900 shadow-sm'
            : 'text-neutral-500 hover:text-neutral-800'
        }`}
        title="Comfortable — rộng hơn"
      >
        <Rows3 size={13} /> Comfortable
      </button>
    </div>
  ) : null

  return (
    <div className="space-y-4">
      {/* Dynamic Filter Toolbar — sticky khi scroll (FR-UX-01 / SAP Filter Bar) */}
      {(filterItems.length > 0 || showDensityToggle) && (
        <div className="sticky top-0 z-20 p-3 md:p-4 rounded-xl border border-border bg-surface/95 backdrop-blur shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            {/* Inline filters */}
            {filterItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 flex-1">
                {inlineItems.map((item) => renderFilterItem(item, false))}
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Actions group */}
            <div className="flex items-center gap-2 self-end h-9 flex-wrap">
              {DensityToggle}

              {showSearch && (
                <Button onClick={handleSearchClick} className="gap-1.5 bg-primary-600 hover:bg-primary-700 text-white h-9 px-4">
                  <Search size={15} /> Tìm kiếm
                </Button>
              )}

              {sidebarItems.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFiltersPanel(true)}
                  className="gap-1.5 transition-all relative h-9 px-4"
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

              {filterItems.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  className="gap-1.5 text-neutral-500 hover:text-neutral-900 h-9 px-3"
                >
                  <RotateCw size={15} />
                  Làm mới
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Drawer */}
      {sidebarItems.length > 0 && (
        <>
          {/* Backdrop Overlay */}
          <div
            className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-[9999] transition-opacity duration-300 ${
              showFiltersPanel ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setShowFiltersPanel(false)}
          />

          {/* Drawer Panel */}
          <div
            className={`fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-white shadow-2xl z-[10000] flex flex-col transition-transform duration-300 ease-in-out ${
              showFiltersPanel ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-primary-600" />
                <h3 className="font-bold text-neutral-900 text-lg">Bộ lọc nâng cao</h3>
              </div>
              <AppTooltip content="Đóng bộ lọc">
                <button
                  type="button"
                  onClick={() => setShowFiltersPanel(false)}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Đóng bộ lọc"
                >
                  <X size={18} />
                </button>
              </AppTooltip>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {filterItems.map((item) => renderFilterItem(item, true))}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4 bg-neutral-50/50 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="flex-1 gap-1.5 h-10"
              >
                <RotateCw size={15} /> Thiết lập lại
              </Button>
              <Button
                type="button"
                onClick={() => {
                  notifyFilterChange(searchKeyword, filterValues)
                  setShowFiltersPanel(false)
                }}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white h-10"
              >
                Áp dụng
              </Button>
            </div>
          </div>
        </>
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
                  className={headCellClass}
                >
                  {col.key === '__check' ? (
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      className="w-4 h-4 rounded border-neutral-300 accent-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                      checked={selection.allSelected}
                      onChange={selection.toggleAll}
                      aria-label="Chọn tất cả dòng"
                      title="Chọn tất cả dòng đang hiển thị"
                    />
                  ) : (
                    col.title
                  )}
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
                <TableCell key="empty" colSpan={totalCols} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <img src={notDataImg} alt="Không có dữ liệu" className="w-48 h-48 object-contain opacity-70" />
                    <p className="text-sm font-bold text-neutral-400 -mt-8">Frezo không tìm thấy dữ liệu</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Data Rows */}
            {!isLoading &&
              !isEmpty &&
              displayData.map((row, rowIndex) => {
                const rowSelected = selectable && selection.isSelected(row)
                const extraRowProps = getRowProps?.(row, rowIndex) ?? {}
                const mergedClassName = [
                  rowSelected ? 'bg-primary-50/40 hover:bg-primary-50/60' : undefined,
                  extraRowProps.className,
                ]
                  .filter(Boolean)
                  .join(' ') || undefined
                return (
                  <TableRow
                    key={rowIndex}
                    {...extraRowProps}
                    className={mergedClassName}
                  >
                    {allColumns.map((col) => {
                      if (col.key === '__check') {
                        return (
                          <TableCell key="__check" style={{ textAlign: 'center' }} className={bodyCellClass}>
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-neutral-300 accent-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                              checked={rowSelected}
                              onChange={(e) => {
                                e.stopPropagation()
                                selection.toggleRow(row)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Chọn dòng"
                            />
                          </TableCell>
                        )
                      }
                      if (col.key === '__stt') {
                        return (
                          <TableCell key="__stt" style={{ textAlign: 'center' }} className={bodyCellClass}>
                            {(displayPageIndex - 1) * displayPageSize + rowIndex + 1}
                          </TableCell>
                        )
                      }
                      const value = col.dataIndex ? row[col.dataIndex] : undefined
                      return (
                        <TableCell
                          key={colKey(col)}
                          style={{ textAlign: col.align || 'left' }}
                          className={bodyCellClass}
                        >
                          {col.render
                            ? col.render(value, row, rowIndex)
                            : (value as React.ReactNode)}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>
      </div>

      {/* Bulk-action bar — sticky bottom khi có selection */}
      {selectable && (
        <BulkSelectionBar
          selectedCount={selection.count}
          totalCount={displayTotalElements}
          onDeselect={selection.clear}
          offsetLeftClass={bulkBarOffsetLeftClass}
          actions={
            <>
              {(bulkActions || [])
                .filter((a) => {
                  if (a.hidden?.(selection.selectedRows)) return false
                  // Không render nút trống — thiếu / blank label dễ sót thành “nút trắng”
                  const label = (a.label ?? '').trim()
                  return label.length > 0
                })
                .map((action) => {
                  const Icon = action.icon
                  const isRunning = runningActionKey === action.key
                  const isDisabled =
                    isRunning ||
                    !!runningActionKey ||
                    !!action.disabled?.(selection.selectedRows)
                  const variant = action.variant ?? 'outline'
                  const isSecondaryOnDark =
                    variant === 'outline' || variant === 'ghost'
                  return (
                    <Button
                      key={action.key}
                      size="sm"
                      variant={variant}
                      disabled={isDisabled}
                      onClick={() => handleBulkClick(action)}
                      className={
                        isSecondaryOnDark
                          ? 'gap-1.5 bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900'
                          : 'gap-1.5'
                      }
                    >
                      {Icon && <Icon size={14} />}
                      {isRunning ? 'Đang xử lý…' : action.label.trim()}
                    </Button>
                  )
                })}
            </>
          }
        />
      )}

      {/* ============================================================
          Pagination Footer — hiển thị nhất quán bất kể số records
          - Ẩn khi loading hoặc totalElements = 0 (empty state đã show).
          - `hidePaginationWhenSinglePage`: tuỳ chọn ẩn nếu chỉ 1 page.
          - Left  : range + total
          - Right : size selector + prev / N-M / next + jump-to-first/last
          ============================================================ */}
      {!isLoading && displayTotalElements > 0 &&
        !(hidePaginationWhenSinglePage && displayTotalPages <= 1) && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-2 py-2 text-sm border-t border-neutral-100">
          {/* --- LEFT: range info --- */}
          <div className="text-neutral-500 flex items-center gap-1.5 flex-wrap">
            <span>Hiển thị</span>
            <span className="font-medium text-neutral-900">
              {Math.min((displayPageIndex - 1) * displayPageSize + 1, displayTotalElements)}
            </span>
            <span>–</span>
            <span className="font-medium text-neutral-900">
              {Math.min(displayPageIndex * displayPageSize, displayTotalElements)}
            </span>
            <span>của</span>
            <span className="font-medium text-neutral-900">{displayTotalElements}</span>
            <span>bản ghi</span>
          </div>

          {/* --- RIGHT: size selector + navigation --- */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Page-size selector — user luôn thấy quyền chọn 10/20/50/100
                dù có ít record. Ẩn nếu pageSizeOptions rỗng. */}
            {pageSizeOptions.length > 0 && (
              <label className="inline-flex items-center gap-1.5 text-neutral-500">
                <span className="text-xs shrink-0">Hiển thị</span>
                <div className="w-[110px]">
                  <Select
                    options={pageSizeOptions.map((n) => ({
                      value: String(n),
                      label: `${n} / trang`,
                    }))}
                    value={String(displayPageSize)}
                    onChange={(v) => handlePageChange(1, Number(v))}
                    placeholder="Size"
                    aria-label="Số bản ghi mỗi trang"
                    showSearch={false}
                  />
                </div>
              </label>
            )}

            {/* Navigation cluster */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(1, displayPageSize)}
                disabled={displayPageIndex <= 1}
                title="Trang đầu"
                className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                <ChevronLeft size={14} className="-ml-2.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(displayPageIndex - 1, displayPageSize)}
                disabled={displayPageIndex <= 1}
                title="Trang trước"
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 min-w-[70px] text-center text-neutral-700 text-xs">
                Trang <b className="text-neutral-900">{displayPageIndex}</b> /{' '}
                <b className="text-neutral-900">{displayTotalPages || 1}</b>
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(displayPageIndex + 1, displayPageSize)}
                disabled={displayPageIndex >= displayTotalPages}
                title="Trang sau"
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(displayTotalPages || 1, displayPageSize)}
                disabled={displayPageIndex >= displayTotalPages}
                title="Trang cuối"
                className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-surface text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
                <ChevronRight size={14} className="-ml-2.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
