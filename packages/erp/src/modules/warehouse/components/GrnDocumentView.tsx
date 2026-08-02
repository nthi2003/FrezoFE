// ============================================================
// GrnDocumentView — khung biên lai PNK (A4 portrait + ký số stub)
// ============================================================

import { useState, type ReactNode } from 'react'
import { Building2, CheckCircle2, PenLine, ShieldCheck } from 'lucide-react'
import { Button, ConfirmDialog } from '@frezo/ui'
import type { GrnDto, GrnItemDto } from '../services/grnApi'
import type { WarehouseLocationDto } from '../services/locationApi'
import { formatLocationLabel } from '../services/locationApi'
import {
  computeGrnLineStats,
  formatGrnDate,
  formatVnd,
} from '../utils/grnGinUtils'
import {
  formatSupplierLabel,
  formatWarehouseLabel,
} from '../utils/displayUtils'
import { resolveWarehouseStatus } from '../constants/warehouseStatus'
import type { GrnSignRole, GrnSignatures } from '../hooks/useGrnSignatures'

const DEMO_COMPANY = {
  name: 'CÔNG TY TNHH FREZO FOODTECH',
  address: '123 Đường Nông Sản, Quận 1, TP. Hồ Chí Minh',
  taxCode: '0312345678',
}

const SIGN_ROLES: Array<{
  role: GrnSignRole
  label: string
  hint: string
}> = [
  { role: 'PREPARER', label: 'Người lập phiếu', hint: 'Ký khi lập phiếu (Nháp)' },
  { role: 'WAREHOUSE', label: 'Thủ kho', hint: 'Ký khi xác nhận nhập kho' },
  { role: 'ACCOUNTANT', label: 'Kế toán', hint: 'Ký khi duyệt HĐ đầu vào' },
  { role: 'DIRECTOR', label: 'Giám đốc', hint: 'Phê duyệt (tuỳ chọn)' },
]

function lineProductName(
  ln: GrnItemDto,
  productMap: Map<string, { code?: string; name?: string }>,
) {
  if (ln.productName) return ln.productName
  const prod = productMap.get(ln.productId)
  return prod?.name || ln.productId
}

function lineProductCode(
  ln: GrnItemDto,
  productMap: Map<string, { code?: string; name?: string }>,
) {
  return ln.productCode || productMap.get(ln.productId)?.code || ln.productId
}

function lineQtyReceived(
  ln: GrnItemDto,
  qtyDrafts?: Record<string, string>,
) {
  if (qtyDrafts && ln.id && qtyDrafts[ln.id] !== undefined) {
    return Number(qtyDrafts[ln.id]) || 0
  }
  if (ln.qtyReceived != null && ln.qtyReceived > 0) return ln.qtyReceived
  return ln.qtyExpected ?? 0
}

function canSignRole(role: GrnSignRole, status: string, signatures: GrnSignatures): boolean {
  if (signatures[role]) return false
  const st = status.toUpperCase()
  switch (role) {
    case 'PREPARER':
      return st !== 'CANCELLED'
    case 'ACCOUNTANT':
      return ['PENDING_APPROVAL', 'APPROVED', 'CONFIRMED'].includes(st)
    case 'WAREHOUSE':
      return ['APPROVED', 'CONFIRMED'].includes(st)
    case 'DIRECTOR':
      return st === 'CONFIRMED'
    default:
      return false
  }
}

export interface GrnDocumentViewProps {
  grn: GrnDto
  qtyDrafts?: Record<string, string>
  locationDrafts?: Record<string, string>
  productMap: Map<string, { code?: string; name?: string }>
  locations: WarehouseLocationDto[]
  signatures: GrnSignatures
  onSign: (role: GrnSignRole) => void
  className?: string
}

export function GrnDocumentView({
  grn,
  qtyDrafts,
  locationDrafts,
  productMap,
  locations,
  signatures,
  onSign,
  className,
}: GrnDocumentViewProps) {
  const [pendingRole, setPendingRole] = useState<GrnSignRole | null>(null)
  const st = (grn.status || '').toUpperCase()
  const statusCfg = resolveWarehouseStatus(grn.status, 'doc')
  const lineStats = computeGrnLineStats(grn.items || [], qtyDrafts)
  const totalValue = grn.totalValue ?? lineStats.totalValue

  const resolveLocation = (ln: GrnItemDto) => {
    const locId = (ln.id && locationDrafts?.[ln.id]) || ln.locationId
    if (!locId) return '—'
    const loc = locations.find((l) => l.id === locId)
    return loc ? formatLocationLabel(loc) : locId
  }

  const pendingLabel = SIGN_ROLES.find((r) => r.role === pendingRole)?.label

  return (
    <>
      <div
        id="grn-document-print"
        className={`grn-document w-full mx-auto bg-[#fafafa] print:bg-white ${className ?? ''}`}
      >
        <div className="grn-document-frame w-full bg-white shadow-sm print:shadow-none">
          {/* Header công ty */}
          <header className="flex flex-col sm:flex-row gap-5 sm:items-start sm:justify-between pb-7 sm:pb-8 border-b border-neutral-300">
            <div className="flex gap-4 items-start">
              <div className="w-16 h-16 shrink-0 border-2 border-neutral-400 rounded flex items-center justify-center bg-neutral-50 print:border-neutral-600">
                <Building2 className="w-8 h-8 text-neutral-500" strokeWidth={1.25} />
              </div>
              <div className="text-base leading-snug">
                <div className="font-bold text-lg uppercase tracking-wide text-neutral-900">
                  {DEMO_COMPANY.name}
                </div>
                <div className="text-neutral-600 mt-1">{DEMO_COMPANY.address}</div>
                <div className="text-neutral-600">
                  MST: <span className="font-mono">{DEMO_COMPANY.taxCode}</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-neutral-500 sm:text-right print:text-neutral-700">
              <div>Mẫu số: 01-VT</div>
              <div className="italic">(Ban hành theo TT 133/2016/TT-BTC)</div>
            </div>
          </header>

          {/* Tiêu đề */}
          <div className="text-center py-8 sm:py-10">
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.15em] text-neutral-900 font-serif">
              Phiếu nhập kho
            </h1>
            <p className="mt-3 text-lg text-neutral-600">
              Số:{' '}
              <span className="font-mono font-semibold text-neutral-900">
                {grn.grnCode || grn.id}
              </span>
            </p>
          </div>

          {/* Meta 2 cột */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 text-base mb-8 font-serif">
            <dl className="space-y-2.5 min-w-0">
              <MetaRow label="Kho nhập" value={formatWarehouseLabel(grn)} />
              <MetaRow label="Nhà cung cấp" value={formatSupplierLabel(grn)} />
              <MetaRow
                label="Mã đơn mua"
                value={grn.purchaseOrderCode || grn.purchaseOrderId || '—'}
                mono
              />
              <MetaRow label="Số HĐ NCC" value={grn.invoiceNo || '—'} mono />
              <MetaRow label="Ngày HĐ" value={grn.invoiceDate || '—'} />
            </dl>
            <dl className="space-y-2.5 min-w-0">
              <MetaRow label="Ngày lập" value={formatGrnDate(grn)} />
              <MetaRow label="Người lập" value={grn.receivedBy || '—'} />
              <MetaRow
                label="Trạng thái"
                value={
                  <span className="inline-block border border-neutral-400 px-2.5 py-0.5 text-sm font-semibold uppercase tracking-wide print:border-neutral-600">
                    {statusCfg.label}
                  </span>
                }
              />
              {grn.approvedBy && (
                <MetaRow label="Người duyệt" value={grn.approvedBy} />
              )}
              {grn.receivedAt && (
                <MetaRow label="Ngày nhập" value={String(grn.receivedAt).slice(0, 10)} />
              )}
            </dl>
          </div>

          {/* Bảng dòng hàng */}
          <div className="overflow-x-auto mb-8 w-full">
            <table className="grn-doc-table w-full text-sm sm:text-base border-collapse font-serif">
              <thead>
                <tr className="bg-neutral-50 print:bg-neutral-100">
                  <th className="border border-neutral-400 px-2.5 py-2.5 w-10 text-center">STT</th>
                  <th className="border border-neutral-400 px-2.5 py-2.5 w-28">Mã SP</th>
                  <th className="border border-neutral-400 px-2.5 py-2.5 min-w-[160px]">Tên hàng</th>
                  <th className="border border-neutral-400 px-2.5 py-2.5 w-14 text-center">ĐVT</th>
                  <th className="border border-neutral-400 px-2.5 py-2.5 w-24 text-right">SL dự kiến</th>
                  <th className="border border-neutral-400 px-2.5 py-2.5 w-24 text-right">SL thực</th>
                  <th className="border border-neutral-400 px-2.5 py-2.5 w-28 text-right">Đơn giá</th>
                  <th className="border border-neutral-400 px-2.5 py-2.5 w-32 text-right">Thành tiền</th>
                  <th className="border border-neutral-400 px-2.5 py-2.5 min-w-[100px]">Vị trí</th>
                </tr>
              </thead>
              <tbody>
                {(grn.items || []).map((ln, i) => {
                  const qty = lineQtyReceived(ln, qtyDrafts)
                  const lineVal = ln.unitCost != null ? qty * ln.unitCost : null
                  return (
                    <tr key={ln.id || `${ln.productId}-${i}`}>
                      <td className="border border-neutral-400 px-2.5 py-2.5 text-center tabular-nums">
                        {i + 1}
                      </td>
                      <td className="border border-neutral-400 px-2.5 py-2.5 font-mono text-sm break-all">
                        {lineProductCode(ln, productMap)}
                      </td>
                      <td className="border border-neutral-400 px-2.5 py-2.5">
                        {lineProductName(ln, productMap)}
                      </td>
                      <td className="border border-neutral-400 px-2.5 py-2.5 text-center">—</td>
                      <td className="border border-neutral-400 px-2.5 py-2.5 text-right tabular-nums">
                        {ln.qtyExpected ?? 0}
                      </td>
                      <td className="border border-neutral-400 px-2.5 py-2.5 text-right tabular-nums font-medium">
                        {qty}
                      </td>
                      <td className="border border-neutral-400 px-2.5 py-2.5 text-right tabular-nums">
                        {formatVnd(ln.unitCost)}
                      </td>
                      <td className="border border-neutral-400 px-2.5 py-2.5 text-right tabular-nums">
                        {formatVnd(lineVal ?? undefined)}
                      </td>
                      <td className="border border-neutral-400 px-2.5 py-2.5 text-sm">
                        {resolveLocation(ln)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer tổng */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-base mb-8 font-serif border-t border-neutral-300 pt-6">
            <div>
              <span className="text-neutral-600">Tổng số lượng: </span>
              <span className="font-semibold tabular-nums">{lineStats.totalQty}</span>
              <span className="text-neutral-400 mx-2">·</span>
              <span className="text-neutral-600">Số dòng: </span>
              <span className="font-semibold">{lineStats.lineCount}</span>
            </div>
            <div>
              <span className="text-neutral-600">Tổng giá trị: </span>
              <span className="font-bold tabular-nums">{formatVnd(totalValue)}</span>
            </div>
          </div>

          {/* Ghi chú */}
          {grn.note && (
            <div className="text-base mb-8 font-serif">
              <span className="font-semibold">Ghi chú: </span>
              <span className="text-neutral-700">{grn.note}</span>
            </div>
          )}

          {/* Khối ký số */}
          <section className="mt-auto pt-8 border-t border-neutral-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {SIGN_ROLES.map(({ role, label, hint }) => {
                const sig = signatures[role]
                const canSign = canSignRole(role, st, signatures)
                return (
                  <SignatureBlock
                    key={role}
                    label={label}
                    hint={hint}
                    signature={sig}
                    canSign={canSign}
                    onSign={() => setPendingRole(role)}
                  />
                )
              })}
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!pendingRole}
        onClose={() => setPendingRole(null)}
        onConfirm={() => {
          if (pendingRole) onSign(pendingRole)
          setPendingRole(null)
        }}
        title={`Ký số — ${pendingLabel}?`}
        message="Xác nhận ký số điện tử (demo). Chưa tích hợp CA thật — chỉ lưu tên và thời gian trên trình duyệt."
        confirmText="Xác nhận ký số"
        cancelText="Huỷ"
        variant="warning"
      />

      <style>{`
        .grn-document-frame {
          border: 3px double #525252;
          padding: 2rem 2rem 2.5rem;
          font-family: Georgia, 'Times New Roman', Times, serif;
          width: 100%;
          max-width: 1200px;
          min-height: 1100px;
          margin-left: auto;
          margin-right: auto;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 640px) {
          .grn-document-frame {
            padding: 3rem 3rem 3.5rem;
          }
        }
        .grn-doc-table th,
        .grn-doc-table td {
          border-color: #737373;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body * {
            visibility: hidden !important;
          }
          #grn-document-print,
          #grn-document-print * {
            visibility: visible !important;
          }
          #grn-document-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .grn-document-frame {
            border: 2px double #000 !important;
            box-shadow: none !important;
            padding: 12mm !important;
            max-width: none !important;
            min-height: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .grn-doc-table {
            font-size: 11pt !important;
          }
          .no-print {
            display: none !important;
          }
          .grn-sign-action {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[8.5rem_1fr] gap-x-2 gap-y-0.5 items-start">
      <dt className="text-neutral-600 shrink-0">{label}:</dt>
      <dd className={`font-medium text-neutral-900 min-w-0 break-words ${mono ? 'font-mono text-sm' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

function SignatureBlock({
  label,
  hint,
  signature,
  canSign,
  onSign,
}: {
  label: string
  hint: string
  signature?: { signedBy: string; signedAt: string }
  canSign: boolean
  onSign: () => void
}) {
  return (
    <div className="text-center text-base font-serif min-w-0">
      <div className="font-semibold text-neutral-800 mb-3">{label}</div>
      <div className="h-24 sm:h-28 flex flex-col items-center justify-end border-b border-neutral-400 mx-1 mb-3 relative px-1">
        {signature ? (
          <>
            <PenLine
              className="absolute top-1 text-emerald-600 opacity-60 rotate-[-8deg]"
              size={32}
              strokeWidth={1.5}
            />
            <span className="text-sm font-medium text-neutral-700 italic pb-0.5 break-words">
              {signature.signedBy}
            </span>
          </>
        ) : (
          <span className="text-xs text-neutral-300 italic pb-1">(Chưa ký)</span>
        )}
      </div>
      {signature ? (
        <div className="space-y-1.5 px-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
            <CheckCircle2 size={12} /> Đã ký số
          </span>
          <div className="text-xs text-neutral-500 leading-snug">
            {new Date(signature.signedAt).toLocaleString('vi-VN')}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 px-1">
          <div className="text-xs text-neutral-400 italic">(Ký, họ tên)</div>
          {canSign && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="grn-sign-action h-8 text-xs gap-1 mx-auto"
              onClick={onSign}
            >
              <ShieldCheck size={14} /> Ký số
            </Button>
          )}
          {!canSign && (
            <div className="text-xs text-neutral-400 leading-snug">{hint}</div>
          )}
        </div>
      )}
    </div>
  )
}
