// ============================================================
// FREZO ERP — CSV export utility (client-side, không dùng thư viện)
// Dùng cho bulk action "Export CSV" trong AppTable / danh sách bảng.
// ============================================================

export interface CsvColumn<T> {
  /** Tiêu đề cột trong file CSV. */
  header: string
  /** Trường lấy giá trị: keyof T hoặc function tuỳ biến. */
  accessor: keyof T | ((row: T) => unknown)
  /** Format thêm cho giá trị (VD: Date → dd/MM/yyyy). Nhận value đã accessor. */
  format?: (value: unknown, row: T) => string | number | null | undefined
}

/**
 * Escape 1 ô CSV theo chuẩn RFC 4180:
 *  - Bao "..." nếu chứa dấu phẩy, xuống dòng, dấu nháy kép.
 *  - Nháy kép nội bộ được double.
 */
function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'string' ? v : String(v)
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Sinh chuỗi CSV từ mảng row + định nghĩa cột.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(',')
  const body = rows.map((row) =>
    columns
      .map((col) => {
        const raw =
          typeof col.accessor === 'function'
            ? col.accessor(row)
            : (row as Record<string, unknown>)[col.accessor as string]
        const formatted = col.format ? col.format(raw, row) : raw
        return escapeCell(formatted)
      })
      .join(','),
  )
  return [header, ...body].join('\r\n')
}

/**
 * Tải xuống file CSV. Prepend BOM để Excel (Windows/VN locale) đọc đúng UTF-8
 * và không lỗi dấu tiếng Việt.
 */
export function downloadCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): void {
  const csv = toCsv(rows, columns)
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = ensureCsvExt(filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // requestAnimationFrame để trình duyệt kịp trigger download trước khi revoke
  requestAnimationFrame(() => URL.revokeObjectURL(url))
}

function ensureCsvExt(name: string): string {
  const trimmed = name.trim() || 'export'
  return /\.csv$/i.test(trimmed) ? trimmed : `${trimmed}.csv`
}
