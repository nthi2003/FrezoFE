// ============================================================
// FREZO ERP — useTableSelection<T>
// Hook chọn nhiều dòng (bulk selection) — dùng cho AppTable và
// mọi bảng tự viết cần selection + bulk-action-bar.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react'

export interface TableSelectionApi<T> {
  /** Set id đã chọn. */
  selectedIds: Set<string>
  /** Row objects tương ứng, tính từ danh sách hiện tại. */
  selectedRows: T[]
  /** Có chọn dòng này không. */
  isSelected: (row: T) => boolean
  /** Toggle chọn / bỏ chọn 1 dòng. */
  toggleRow: (row: T) => void
  /** Toàn bộ dòng hiển thị đã chọn hết. */
  allSelected: boolean
  /** Có dòng được chọn nhưng chưa hết → dùng cho indeterminate. */
  someSelected: boolean
  /** Toggle chọn/bỏ chọn toàn bộ dòng hiển thị. */
  toggleAll: () => void
  /** Xoá toàn bộ selection. */
  clear: () => void
  /** Số lượng đã chọn. */
  count: number
}

/**
 * Quản lý state selection cho 1 bảng. `rows` truyền vào là danh sách đang
 * hiển thị (đã filter/paginate). `getRowId` map row → id ổn định.
 * <p>
 * Nếu row bị filter ra khỏi list mà vẫn còn trong `selectedIds`, hook sẽ
 * giữ nguyên id (không tự xoá) để user tick-lọc-xoá được nhiều batch.
 */
export function useTableSelection<T>(
  rows: T[],
  getRowId: (row: T) => string,
): TableSelectionApi<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const isSelected = useCallback(
    (row: T) => selectedIds.has(getRowId(row)),
    [selectedIds, getRowId],
  )

  const toggleRow = useCallback(
    (row: T) => {
      const id = getRowId(row)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    },
    [getRowId],
  )

  const allSelected =
    rows.length > 0 && rows.every((r) => selectedIds.has(getRowId(r)))
  const someSelected =
    !allSelected && rows.some((r) => selectedIds.has(getRowId(r)))

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allInCurrent = rows.every((r) => next.has(getRowId(r)))
      if (allInCurrent) {
        rows.forEach((r) => next.delete(getRowId(r)))
      } else {
        rows.forEach((r) => next.add(getRowId(r)))
      }
      return next
    })
  }, [rows, getRowId])

  const clear = useCallback(() => setSelectedIds(new Set()), [])

  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.has(getRowId(r))),
    [rows, selectedIds, getRowId],
  )

  return {
    selectedIds,
    selectedRows,
    isSelected,
    toggleRow,
    allSelected,
    someSelected,
    toggleAll,
    clear,
    count: selectedIds.size,
  }
}

/**
 * Helper indeterminate cho <input type="checkbox">.
 * <p>
 * Dùng: <input ref={useCheckboxIndeterminate(some)} ... />
 */
export function useCheckboxIndeterminate(indeterminate: boolean) {
  return (el: HTMLInputElement | null) => {
    if (el) el.indeterminate = indeterminate
  }
}

/**
 * Reset selection khi danh sách rows thay đổi hoàn toàn (VD chuyển filter tab).
 * Gọi trong useEffect nếu cần.
 */
export function useResetSelectionOn<T>(
  api: TableSelectionApi<T>,
  deps: unknown[],
) {
  // Không auto-clear khi rows chỉ paginate — chỉ clear khi user chủ động đổi
  // dep (VD status filter). Người dùng gọi hook này ở page-level.
  useEffect(() => {
    api.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
