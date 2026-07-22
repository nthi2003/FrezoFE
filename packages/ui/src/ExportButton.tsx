import * as React from 'react'
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileType,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { cn } from '@frezo/utils'
import { Button } from './button'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export interface ExportButtonProps {
  onExport: (format: ExportFormat) => void | Promise<void>
  /** Danh sách format hỗ trợ — mặc định cả 3 */
  formats?: readonly ExportFormat[]
  disabled?: boolean
  isExporting?: boolean
  label?: string
  className?: string
}

const FORMAT_META: Record<ExportFormat, { label: string; icon: React.ElementType; ext: string }> = {
  csv: { label: 'CSV', icon: FileText, ext: '.csv' },
  xlsx: { label: 'Excel', icon: FileSpreadsheet, ext: '.xlsx' },
  pdf: { label: 'PDF', icon: FileType, ext: '.pdf' },
}

const DEFAULT_FORMATS: readonly ExportFormat[] = ['csv', 'xlsx', 'pdf']

/**
 * Nút xuất dữ liệu chuẩn Frezo — dropdown với CSV/Excel/PDF (STANDARD section 17.3).
 *
 * @example
 * <ExportButton
 *   onExport={(fmt) => contractApi.export(fmt)}
 *   formats={['xlsx', 'pdf']}
 *   isExporting={mutation.isPending}
 * />
 *
 * Flow chuẩn (consumer tự lo):
 * - toast.loading('Đang chuẩn bị file...')
 * - BE trả blob → trigger download qua <a download>
 * - toast.success('Đã xuất file')
 */
export function ExportButton({
  onExport,
  formats = DEFAULT_FORMATS,
  disabled = false,
  isExporting = false,
  label = 'Xuất',
  className,
}: ExportButtonProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handleSelect = async (format: ExportFormat) => {
    setOpen(false)
    await onExport(format)
  }

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <Button
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || isExporting}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {isExporting ? (
          <Loader2 size={16} className="mr-2 animate-spin" strokeWidth={2} />
        ) : (
          <Download size={16} className="mr-2" strokeWidth={1.5} />
        )}
        {label}
        <ChevronDown size={14} className="ml-2" strokeWidth={2} />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-40 rounded-lg border border-neutral-200 bg-surface shadow-card-md py-1 animate-fade-in"
        >
          {formats.map((format) => {
            const meta = FORMAT_META[format]
            const Icon = meta.icon
            return (
              <button
                key={format}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(format)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
              >
                <Icon size={16} strokeWidth={1.5} className="text-neutral-500" />
                <span className="flex-1 text-left">{meta.label}</span>
                <span className="text-xs text-neutral-400">{meta.ext}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
