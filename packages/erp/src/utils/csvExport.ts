/** Xuất mảng object ra CSV và tải xuống (UTF-8 BOM cho Excel). */
export function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
): void {
  if (rows.length === 0) return
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = columns.map((c) => escape(c.label)).join(',')
  const body = rows
    .map((r) => columns.map((c) => escape(r[c.key])).join(','))
    .join('\n')
  const blob = new Blob(['\ufeff' + header + '\n' + body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
