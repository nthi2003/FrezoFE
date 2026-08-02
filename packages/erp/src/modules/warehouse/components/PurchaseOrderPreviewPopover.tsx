// ============================================================
// PurchaseOrderPreviewPopover — hover/tap preview card cho PO
// ============================================================

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@frezo/utils'
import { usePurchaseOrder } from '../hooks/usePurchaseOrder'
import type { PurchaseOrderDto } from '../services/purchaseOrderApi'
import { WarehouseStatusBadge } from './WarehouseStatusBadge'
import {
  formatProductLabel,
  formatSupplierLabel,
  formatWarehouseLabel,
} from '../utils/displayUtils'

const OPEN_DELAY_MS = 300
const CLOSE_DELAY_MS = 120
const PREVIEW_LINES = 3

function useIsTouchDevice() {
  const [touch, setTouch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)')
    const update = () => setTouch(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return touch
}

function usePreviewPoData(po: PurchaseOrderDto | null, enabled: boolean) {
  const hasLines = (po?.lines?.length ?? 0) > 0
  const shouldFetch = enabled && !!po && !hasLines
  const { data, isLoading, isError } = usePurchaseOrder(shouldFetch ? po!.id : undefined)
  const displayPo = shouldFetch ? (data ?? po) : po
  return { po: displayPo, isLoading: shouldFetch && isLoading, isError: shouldFetch && isError }
}

function computeTotals(po: PurchaseOrderDto | null | undefined) {
  const lines = po?.lines ?? []
  const totalQty = lines.reduce((sum, ln) => sum + Number(ln.qtyOrdered || 0), 0)
  const totalAmount = lines.reduce(
    (sum, ln) => sum + Number(ln.qtyOrdered || 0) * Number(ln.unitPrice || 0),
    0,
  )
  return { totalQty, totalAmount, lineCount: lines.length }
}

interface PreviewCardProps {
  po: PurchaseOrderDto
  isLoading?: boolean
  onViewFull: () => void
}

function PurchaseOrderPreviewCard({ po, isLoading, onViewFull }: PreviewCardProps) {
  const lines = po.lines ?? []
  const previewLines = lines.slice(0, PREVIEW_LINES)
  const extraCount = Math.max(0, lines.length - PREVIEW_LINES)
  const { totalQty, totalAmount, lineCount } = computeTotals(po)

  return (
    <div className="w-[min(380px,calc(100vw-24px))] rounded-lg border border-neutral-200 bg-white p-3 shadow-card-md animate-fade-in">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="font-mono text-sm font-semibold text-neutral-900 truncate">
            {po.code || po.id}
          </div>
        </div>
        <WarehouseStatusBadge status={po.status} kind="po" />
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs mb-2">
        <dt className="text-neutral-500">NCC</dt>
        <dd className="text-neutral-800 truncate">{formatSupplierLabel(po)}</dd>
        <dt className="text-neutral-500">Kho</dt>
        <dd className="text-neutral-800 truncate">{formatWarehouseLabel(po)}</dd>
        <dt className="text-neutral-500">Ngày tạo</dt>
        <dd className="text-neutral-800 tabular-nums">
          {po.createdAt ? formatDate(po.createdAt) : '—'}
        </dd>
        {po.confirmedAt && (
          <>
            <dt className="text-neutral-500">Xác nhận</dt>
            <dd className="text-neutral-800 tabular-nums">{formatDate(po.confirmedAt)}</dd>
          </>
        )}
      </dl>

      <div className="border-t border-neutral-100 pt-2 mb-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
          Hàng hóa
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-neutral-500 py-2">
            <Loader2 size={12} className="animate-spin" />
            Đang tải chi tiết…
          </div>
        ) : lineCount === 0 ? (
          <p className="text-xs text-neutral-400">Chưa có dòng hàng</p>
        ) : (
          <ul className="space-y-1">
            {previewLines.map((ln, i) => (
              <li
                key={ln.id || `${ln.productId}-${i}`}
                className="flex items-baseline justify-between gap-2 text-xs"
              >
                <span className="truncate text-neutral-800" title={formatProductLabel(ln)}>
                  {formatProductLabel(ln)}
                </span>
                <span className="shrink-0 tabular-nums text-neutral-600">
                  ×{Number(ln.qtyOrdered || 0).toLocaleString('vi-VN')}
                </span>
              </li>
            ))}
            {extraCount > 0 && (
              <li className="text-[11px] text-neutral-400">+{extraCount} dòng khác</li>
            )}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-2 text-xs">
        <div className="text-neutral-600 tabular-nums">
          {lineCount > 0 && (
            <>
              <span>{totalQty.toLocaleString('vi-VN')} SP</span>
              {totalAmount > 0 && (
                <span className="text-neutral-400 mx-1">·</span>
              )}
            </>
          )}
          {totalAmount > 0 && (
            <span className="font-medium text-neutral-800">{formatCurrency(totalAmount)}</span>
          )}
          {lineCount === 0 && !isLoading && <span>—</span>}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onViewFull()
          }}
          className="inline-flex items-center gap-0.5 text-primary-700 hover:text-primary-800 hover:underline font-medium shrink-0"
        >
          Xem đầy đủ
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

interface FloatingPreviewProps {
  po: PurchaseOrderDto
  anchorEl: HTMLElement
  onClose: () => void
  onCardMouseEnter?: () => void
  onCardMouseLeave?: () => void
}

function PurchaseOrderPreviewFloating({
  po,
  anchorEl,
  onClose,
  onCardMouseEnter,
  onCardMouseLeave,
}: FloatingPreviewProps) {
  const nav = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const isTouch = useIsTouchDevice()
  const { po: displayPo, isLoading } = usePreviewPoData(po, true)

  const updatePosition = useCallback(() => {
    const rect = anchorEl.getBoundingClientRect()
    const cardW = 380
    const gap = 8
    let left = rect.left
    let top = rect.bottom + gap

    if (left + cardW > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - cardW - 12)
    }
    if (top + 280 > window.innerHeight - 12) {
      top = Math.max(12, rect.top - gap - 280)
    }

    setPos({ top, left })
  }, [anchorEl])

  useEffect(() => {
    updatePosition()
    const onScroll = () => onClose()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [updatePosition, onClose])

  useEffect(() => {
    if (!isTouch) return
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (
        cardRef.current &&
        !cardRef.current.contains(target) &&
        !anchorEl.contains(target)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [isTouch, anchorEl, onClose])

  const handleViewFull = () => {
    onClose()
    nav(`/warehouse/purchase-orders/${po.id}`)
  }

  if (!displayPo) return null

  return createPortal(
    <div
      ref={cardRef}
      className="fixed z-50"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={onCardMouseEnter}
      onMouseLeave={onCardMouseLeave}
      role="dialog"
      aria-label={`Xem nhanh đơn mua ${po.code || po.id}`}
    >
      <PurchaseOrderPreviewCard
        po={displayPo}
        isLoading={isLoading}
        onViewFull={handleViewFull}
      />
    </div>,
    document.body,
  )
}

export interface PurchaseOrderPreviewPopoverProps {
  po: PurchaseOrderDto
  children: ReactNode
  className?: string
}

/** Wrap trigger (mã PO) — hover desktop / tap mobile */
export function PurchaseOrderPreviewPopover({
  po,
  children,
  className,
}: PurchaseOrderPreviewPopoverProps) {
  const triggerRef = useRef<HTMLSpanElement>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false)
  const isTouch = useIsTouchDevice()

  const clearTimers = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const scheduleOpen = () => {
    clearTimers()
    if (isTouch) return
    openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS)
  }

  const scheduleClose = () => {
    clearTimers()
    if (isTouch && open) return
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!isTouch) return
    e.preventDefault()
    e.stopPropagation()
    setOpen((v) => !v)
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={className}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onClick={handleClick}
        onFocus={scheduleOpen}
        onBlur={scheduleClose}
      >
        {children}
      </span>
      {open && triggerRef.current && (
        <PurchaseOrderPreviewFloating
          po={po}
          anchorEl={triggerRef.current}
          onClose={() => setOpen(false)}
          onCardMouseEnter={cancelClose}
          onCardMouseLeave={scheduleClose}
        />
      )}
    </>
  )
}

/** Hook hỗ trợ hover preview trên cả row trong AppTable */
export function usePurchaseOrderRowPreview() {
  const nav = useNavigate()
  const isTouch = useIsTouchDevice()
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [preview, setPreview] = useState<{
    po: PurchaseOrderDto
    anchorEl: HTMLElement
  } | null>(null)

  const clearTimers = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const closePreview = useCallback(() => {
    clearTimers()
    setPreview(null)
  }, [clearTimers])

  const scheduleClose = useCallback(() => {
    clearTimers()
    closeTimer.current = setTimeout(closePreview, CLOSE_DELAY_MS)
  }, [clearTimers, closePreview])

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const getRowProps = useCallback(
    (po: PurchaseOrderDto): HTMLAttributes<HTMLTableRowElement> => ({
      className: 'cursor-default',
      onMouseEnter: (e) => {
        if (isTouch) return
        clearTimers()
        const anchor = e.currentTarget
        openTimer.current = setTimeout(() => {
          setPreview({ po, anchorEl: anchor })
        }, OPEN_DELAY_MS)
      },
      onMouseLeave: () => {
        if (isTouch) return
        scheduleClose()
      },
      onDoubleClick: (e) => {
        if ((e.target as HTMLElement).closest('button')) return
        nav(`/warehouse/purchase-orders/${po.id}`)
      },
      onClick: (e) => {
        if (!isTouch) return
        if ((e.target as HTMLElement).closest('button')) return
        clearTimers()
        setPreview({ po, anchorEl: e.currentTarget })
      },
    }),
    [clearTimers, isTouch, nav, scheduleClose],
  )

  const PreviewLayer = useMemo(() => {
    if (!preview) return null
    return (
      <PurchaseOrderPreviewFloating
        po={preview.po}
        anchorEl={preview.anchorEl}
        onClose={closePreview}
        onCardMouseEnter={cancelClose}
        onCardMouseLeave={scheduleClose}
      />
    )
  }, [preview, closePreview, cancelClose, scheduleClose])

  return { getRowProps, PreviewLayer, closePreview }
}
