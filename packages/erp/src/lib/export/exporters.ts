// ============================================================
// FREZO — Export utilities (PDF / DOCX / Print)
// Client-side, không cần đụng BE. Dep được dynamic-import để giữ
// bundle chính nhẹ (chỉ tải khi user thực sự bấm Export).
// ============================================================

import { toast } from 'sonner'
import { saveAs } from 'file-saver'

// ============================================================
// PDF
// ============================================================

export interface PdfExportOptions {
  filename: string
  /** Kích thước giấy — mặc định A4 */
  format?: 'a4' | 'letter'
  /** Portrait (default) hoặc Landscape */
  orientation?: 'portrait' | 'landscape'
  /** Margin (mm) — mặc định 10 */
  margin?: number
  /** Tỉ lệ canvas — cao hơn = nét hơn nhưng nặng hơn */
  scale?: number
  /** Callback progress (0..1) */
  onProgress?: (pct: number) => void
}

/**
 * Xuất một DOM element ra PDF (giữ nguyên CSS/font).
 *
 * Nguyên tắc: capture DOM bằng html2canvas → tách nhiều page theo chiều cao A4.
 * Font, background gradient, shadow đều giữ được.
 *
 * @example
 * const el = document.getElementById('payslip-body')!
 * await exportElementToPdf(el, { filename: 'payslip-2026-07.pdf' })
 */
export async function exportElementToPdf(
  element: HTMLElement,
  opts: PdfExportOptions,
): Promise<void> {
  if (!element) {
    toast.error('Không tìm thấy nội dung để xuất PDF')
    return
  }
  const toastId = toast.loading('Đang tạo file PDF...')
  try {
    opts.onProgress?.(0.1)
    // Lazy import — giảm bundle chính
    const [{ default: html2canvas }, jsPdfModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])
    const jsPDF = jsPdfModule.jsPDF

    opts.onProgress?.(0.3)
    const scale = opts.scale ?? 2
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      // Fix cho các CSS animation/pseudo-elements
      onclone: (doc) => {
        // Vô hiệu hoá animation trong bản clone để capture đúng
        doc.querySelectorAll<HTMLElement>('*').forEach((el) => {
          el.style.animation = 'none'
          el.style.transition = 'none'
        })
      },
    })

    opts.onProgress?.(0.7)

    // Kích thước giấy (mm)
    const format = opts.format || 'a4'
    const orientation = opts.orientation || 'portrait'
    const pdf = new jsPDF({ orientation, unit: 'mm', format })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = opts.margin ?? 10
    const contentWidth = pageWidth - margin * 2
    const contentHeight = pageHeight - margin * 2

    // Tính chiều cao ảnh dựa theo width scale
    const imgWidth = contentWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = margin
    const imgData = canvas.toDataURL('image/png')

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST')
    heightLeft -= contentHeight

    // Tự động thêm trang nếu nội dung dài
    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft)
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST')
      heightLeft -= contentHeight
    }

    opts.onProgress?.(0.95)
    const filename = ensureExtension(opts.filename, 'pdf')
    pdf.save(filename)
    opts.onProgress?.(1)

    toast.success('Đã xuất PDF thành công', { id: toastId })
  } catch (err: any) {
    console.error('[exportElementToPdf]', err)
    toast.error(err?.message || 'Xuất PDF thất bại', { id: toastId })
  }
}

// ============================================================
// DOCX (Word)
// ============================================================

export interface DocxExportOptions {
  filename: string
  /** Tiêu đề document (metadata) */
  title?: string
  /** CSS inline được ghép vào <head> */
  extraCss?: string
  /** Header/footer HTML */
  header?: string
  footer?: string
}

/**
 * Xuất HTML string ra file Word (.docx).
 *
 * Word đọc HTML rất tốt — có thể giữ table, style, image inline.
 * Note: một số CSS advanced (flexbox, grid) có thể bị Word render đơn giản hoá.
 *
 * @example
 * await exportHtmlToDocx('<h1>Hello</h1>', { filename: 'test.docx', title: 'Test' })
 */
export async function exportHtmlToDocx(
  html: string,
  opts: DocxExportOptions,
): Promise<void> {
  const toastId = toast.loading('Đang tạo file Word...')
  try {
    // Lazy load
    const { asBlob } = await import('html-docx-js-typescript')

    const wrapped = wrapForWord(html, opts)
    const blob = await asBlob(wrapped, { orientation: 'portrait', margins: { top: 720 } })

    const filename = ensureExtension(opts.filename, 'docx')
    // asBlob có thể trả Blob hoặc Buffer tuỳ môi trường
    const finalBlob = blob instanceof Blob ? blob : new Blob([blob as any], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    saveAs(finalBlob, filename)
    toast.success('Đã xuất Word thành công', { id: toastId })
  } catch (err: any) {
    console.error('[exportHtmlToDocx]', err)
    toast.error(err?.message || 'Xuất Word thất bại', { id: toastId })
  }
}

/**
 * Xuất element ra Word (dùng outerHTML + inline CSS quan trọng).
 * Convenience wrapper cho `exportHtmlToDocx`.
 */
export async function exportElementToDocx(
  element: HTMLElement,
  opts: DocxExportOptions,
): Promise<void> {
  if (!element) {
    toast.error('Không tìm thấy nội dung để xuất Word')
    return
  }
  // Clone element và inline computed styles để Word render giống nhất có thể
  const clone = element.cloneNode(true) as HTMLElement
  inlineImportantStyles(element, clone)

  await exportHtmlToDocx(clone.outerHTML, opts)
}

// ============================================================
// Print
// ============================================================

/**
 * In element bằng cửa sổ trình duyệt — user có thể chọn "Save as PDF" ngay.
 * Không cần dep. Tận dụng print CSS của trình duyệt.
 *
 * @param element DOM element cần in
 * @param title  Tiêu đề tab in
 * @param extraCss  CSS bổ sung cho bản in
 */
export function printElement(element: HTMLElement, title = 'Print', extraCss = ''): void {
  if (!element) {
    toast.error('Không tìm thấy nội dung để in')
    return
  }
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1200')
  if (!printWindow) {
    toast.error('Trình duyệt chặn cửa sổ in. Cho phép pop-up và thử lại.')
    return
  }

  // Copy tất cả stylesheets từ page hiện tại sang cửa sổ in
  const stylesheets = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        // Inline (cùng-origin) → dùng CSS text
        const rules = Array.from((sheet as CSSStyleSheet).cssRules || [])
          .map((r) => r.cssText)
          .join('\n')
        return `<style>${rules}</style>`
      } catch {
        // External stylesheet không đọc được → nhúng qua <link>
        if (sheet.href) return `<link rel="stylesheet" href="${sheet.href}" />`
        return ''
      }
    })
    .join('\n')

  const clone = element.cloneNode(true) as HTMLElement
  inlineImportantStyles(element, clone)

  printWindow.document.open()
  printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  ${stylesheets}
  <style>
    @page { size: A4; margin: 12mm; }
    body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { animation: none !important; transition: none !important; }
    ${extraCss}
  </style>
</head>
<body>${clone.outerHTML}</body>
</html>`)
  printWindow.document.close()

  // Đợi resource load trước khi in
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      // Cho user cơ hội cancel trước khi đóng
      setTimeout(() => printWindow.close(), 500)
    }, 200)
  }
}

// ============================================================
// Helpers
// ============================================================

function ensureExtension(name: string, ext: string): string {
  const lower = name.toLowerCase()
  return lower.endsWith(`.${ext}`) ? name : `${name}.${ext}`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string))
}

function wrapForWord(bodyHtml: string, opts: DocxExportOptions): string {
  const title = opts.title || 'Frezo Document'
  const extraCss = opts.extraCss || ''
  const header = opts.header || ''
  const footer = opts.footer || ''

  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: 'Times New Roman', 'Cambria', serif; font-size: 12pt; line-height: 1.5; color: #111; }
    h1, h2, h3, h4 { color: #111; margin: 0.6em 0 0.3em; }
    h1 { font-size: 18pt; }
    h2 { font-size: 15pt; }
    h3 { font-size: 13pt; }
    p { margin: 0 0 0.4em; }
    table { border-collapse: collapse; width: 100%; }
    table, th, td { border: 1px solid #999; }
    th, td { padding: 6px 10px; text-align: left; vertical-align: top; }
    .header, .footer { font-size: 10pt; color: #666; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .text-primary { color: #0f766e; }
    ${extraCss}
  </style>
</head>
<body>
  ${header ? `<div class="header">${header}</div>` : ''}
  ${bodyHtml}
  ${footer ? `<div class="footer">${footer}</div>` : ''}
</body>
</html>`
}

/**
 * Copy computed styles (chỉ những property "chuyển hoá được" trong Word/Print)
 * từ source sang clone tree.
 */
function inlineImportantStyles(source: HTMLElement, clone: HTMLElement): void {
  const PROPS = [
    'color', 'background-color', 'background', 'font-size', 'font-weight',
    'font-family', 'font-style', 'text-align', 'text-decoration', 'line-height',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-radius', 'width', 'height', 'min-width', 'max-width',
  ]
  const srcAll = source.querySelectorAll<HTMLElement>('*')
  const cloneAll = clone.querySelectorAll<HTMLElement>('*')
  const total = Math.min(srcAll.length, cloneAll.length)
  const inline = (a: HTMLElement, b: HTMLElement) => {
    const cs = window.getComputedStyle(a)
    let str = ''
    for (const p of PROPS) {
      const v = cs.getPropertyValue(p)
      if (v && v !== 'auto' && v !== 'normal' && v !== 'none') str += `${p}: ${v}; `
    }
    if (str) b.setAttribute('style', str + (b.getAttribute('style') || ''))
  }
  inline(source, clone)
  for (let i = 0; i < total; i++) inline(srcAll[i], cloneAll[i])
}
