// ============================================================
// FREZO — Export UI components
// - <ExportButton /> : nút single-purpose (PDF hoặc DOCX hoặc Print)
// - <ExportMenu />   : dropdown gộp cả 3 lựa chọn
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { FileDown, FileText, Printer, ChevronDown, Loader2, type LucideIcon } from 'lucide-react'
import {
  exportElementToPdf,
  exportElementToDocx,
  exportHtmlToDocx,
  printElement,
  type PdfExportOptions,
  type DocxExportOptions,
} from './exporters'

// ============================================================
// Single-purpose button
// ============================================================

type ExportMode = 'pdf' | 'docx' | 'print'

interface ExportButtonProps {
  mode: ExportMode
  /** ID hoặc ref của element cần export */
  targetRef?: React.RefObject<HTMLElement>
  targetId?: string
  /** Nếu truyền html trực tiếp (DOCX only) */
  html?: string
  filename: string
  title?: string
  /** Tuỳ biến label & class */
  label?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md'
  disabled?: boolean
  pdfOptions?: Partial<PdfExportOptions>
  docxOptions?: Partial<DocxExportOptions>
}

export function ExportButton({
  mode, targetRef, targetId, html, filename, title,
  label, className = '', variant = 'outline', size = 'md', disabled,
  pdfOptions, docxOptions,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const resolveElement = (): HTMLElement | null => {
    if (targetRef?.current) return targetRef.current
    if (targetId) return document.getElementById(targetId)
    return null
  }

  const handleClick = async () => {
    setLoading(true)
    try {
      if (mode === 'pdf') {
        const el = resolveElement()
        if (!el) return
        await exportElementToPdf(el, { filename, ...pdfOptions })
      } else if (mode === 'docx') {
        if (html) {
          await exportHtmlToDocx(html, { filename, title, ...docxOptions })
        } else {
          const el = resolveElement()
          if (!el) return
          await exportElementToDocx(el, { filename, title, ...docxOptions })
        }
      } else if (mode === 'print') {
        const el = resolveElement()
        if (!el) return
        printElement(el, title || filename)
      }
    } finally {
      setLoading(false)
    }
  }

  const icon = loading
    ? <Loader2 size={13} className="animate-spin" />
    : mode === 'pdf' ? <FileDown size={13} />
    : mode === 'docx' ? <FileText size={13} />
    : <Printer size={13} />

  const displayLabel = label ?? (
    mode === 'pdf' ? 'Xuất PDF' :
    mode === 'docx' ? 'Xuất Word' :
    'In'
  )

  const sizeClass = size === 'sm' ? 'h-7 px-2 text-xs gap-1' : 'h-9 px-3 text-sm gap-1.5'
  const variantClass =
    variant === 'default'
      ? 'bg-primary-700 hover:bg-primary-800 text-white'
      : variant === 'ghost'
      ? 'text-neutral-600 hover:text-primary-700 hover:bg-primary-50'
      : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-primary-300 hover:text-primary-700'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      className={`inline-flex items-center rounded-lg font-medium transition disabled:opacity-60 disabled:cursor-not-allowed ${sizeClass} ${variantClass} ${className}`}
      title={displayLabel}
    >
      {icon}
      <span>{displayLabel}</span>
    </button>
  )
}

// ============================================================
// Dropdown menu (gộp cả 3 lựa chọn)
// ============================================================

interface ExportMenuProps {
  targetRef?: React.RefObject<HTMLElement>
  targetId?: string
  filename: string
  title?: string
  html?: string
  /** Bật/tắt từng mode */
  enable?: {
    pdf?: boolean
    docx?: boolean
    print?: boolean
  }
  buttonLabel?: string
  size?: 'sm' | 'md'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  disabled?: boolean
  pdfOptions?: Partial<PdfExportOptions>
  docxOptions?: Partial<DocxExportOptions>
  align?: 'left' | 'right'
}

export function ExportMenu({
  targetRef, targetId, filename, title, html,
  enable = { pdf: true, docx: true, print: true },
  buttonLabel = 'Xuất',
  size = 'md',
  variant = 'outline',
  className = '',
  disabled,
  pdfOptions, docxOptions,
  align = 'right',
}: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<ExportMode | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const resolveElement = (): HTMLElement | null => {
    if (targetRef?.current) return targetRef.current
    if (targetId) return document.getElementById(targetId)
    return null
  }

  const doExport = async (mode: ExportMode) => {
    setLoading(mode)
    try {
      if (mode === 'pdf') {
        const el = resolveElement()
        if (!el) return
        await exportElementToPdf(el, { filename, ...pdfOptions })
      } else if (mode === 'docx') {
        if (html) {
          await exportHtmlToDocx(html, { filename, title, ...docxOptions })
        } else {
          const el = resolveElement()
          if (!el) return
          await exportElementToDocx(el, { filename, title, ...docxOptions })
        }
      } else if (mode === 'print') {
        const el = resolveElement()
        if (!el) return
        printElement(el, title || filename)
      }
    } finally {
      setLoading(null)
      setOpen(false)
    }
  }

  const sizeClass = size === 'sm' ? 'h-7 px-2 text-xs gap-1' : 'h-9 px-3 text-sm gap-1.5'
  const variantClass =
    variant === 'default'
      ? 'bg-primary-700 hover:bg-primary-800 text-white'
      : variant === 'ghost'
      ? 'text-neutral-600 hover:text-primary-700 hover:bg-primary-50'
      : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-primary-300 hover:text-primary-700'

  const isBusy = loading !== null

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isBusy || disabled}
        className={`inline-flex items-center rounded-lg font-medium transition disabled:opacity-60 disabled:cursor-not-allowed ${sizeClass} ${variantClass}`}
      >
        {isBusy ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
        <span>{buttonLabel}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !isBusy && (
        <div
          className={`absolute z-50 mt-1 min-w-[200px] bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden animate-fade-in ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {enable.pdf && (
            <MenuItem
              icon={FileDown}
              label="Xuất PDF"
              hint="File .pdf — chuẩn để in, gửi email"
              onClick={() => doExport('pdf')}
              loading={loading === 'pdf'}
            />
          )}
          {enable.docx && (
            <MenuItem
              icon={FileText}
              label="Xuất Word"
              hint="File .docx — chỉnh sửa lại được"
              onClick={() => doExport('docx')}
              loading={loading === 'docx'}
            />
          )}
          {enable.print && (
            <MenuItem
              icon={Printer}
              label="In"
              hint="Mở hộp thoại in của trình duyệt"
              onClick={() => doExport('print')}
              loading={loading === 'print'}
              divider
            />
          )}
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon: Icon, label, hint, onClick, loading, divider,
}: {
  icon: LucideIcon
  label: string
  hint?: string
  onClick: () => void
  loading?: boolean
  divider?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-primary-50 hover:text-primary-800 transition-colors ${
        divider ? 'border-t border-neutral-100' : ''
      }`}
    >
      <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center shrink-0">
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-neutral-800">{label}</div>
        {hint && <div className="text-[10px] text-neutral-400 truncate">{hint}</div>}
      </div>
    </button>
  )
}
