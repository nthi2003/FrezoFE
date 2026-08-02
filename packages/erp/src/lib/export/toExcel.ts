// ============================================================
// FREZO ERP — Excel (.xls) export via HTML table (không cần xlsx lib)
// Excel / LibreOffice mở được; UTF-8 + BOM giữ tiếng Việt.
// ============================================================

import type { CsvColumn } from './toCsv'

function escapeHtml(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cellValue<T>(row: T, col: CsvColumn<T>): string {
  const raw =
    typeof col.accessor === 'function'
      ? col.accessor(row)
      : (row as Record<string, unknown>)[col.accessor as string]
  const formatted = col.format ? col.format(raw, row) : raw
  if (formatted === null || formatted === undefined) return ''
  return String(formatted)
}

/**
 * Tải xuống file .xls (HTML spreadsheet) — Excel mở trực tiếp.
 */
export function downloadExcel<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): void {
  const thead = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')
  const tbody = rows
    .map((row) => {
      const cells = columns
        .map((col) => `<td>${escapeHtml(cellValue(row, col))}</td>`)
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="UTF-8" />
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Sheet1</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->
</head>
<body>
<table border="1">
<thead><tr>${thead}</tr></thead>
<tbody>${tbody}</tbody>
</table>
</body>
</html>`

  const blob = new Blob(['\uFEFF', html], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = ensureXlsExt(filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  requestAnimationFrame(() => URL.revokeObjectURL(url))
}

function ensureXlsExt(name: string): string {
  const trimmed = name.trim() || 'export'
  if (/\.xlsx?$/i.test(trimmed)) return trimmed.replace(/\.xlsx$/i, '.xls')
  return `${trimmed}.xls`
}
