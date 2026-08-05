import { useRef } from 'react'
import { FileText } from 'lucide-react'
import { AppModal, Button, EmptyState, ErrorState } from '@frezo/ui'
import { formatCurrency, formatDate } from '@frezo/utils'
import { ExportMenu } from '@/lib/export'
import { useInvoiceDetail } from '../hooks/useCrm'
import type { InvoiceStatus } from '../services/crmApi'

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Bản nháp',
  ISSUED: 'Đã phát hành',
  PARTIALLY_PAID: 'Trả một phần',
  PAID: 'Đã thanh toán',
  VOID: 'Đã huỷ',
}

function sanitizeFilename(s: string) {
  return s.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'hoa-don'
}

type Props = {
  invoiceId: string | null
  open: boolean
  onClose: () => void
}

export function InvoicePrintPreviewModal({ invoiceId, open, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const { data: inv, isLoading, isError, refetch, isFetching } = useInvoiceDetail(
    open && invoiceId ? invoiceId : undefined,
  )

  const items = inv?.items ?? []
  const remain = (inv?.total || 0) - (inv?.paidAmount || 0)
  const exportName = inv
    ? `hoa-don-${sanitizeFilename(inv.code)}`
    : 'hoa-don'
  const exportTitle = inv
    ? `Hoá đơn ${inv.code}${inv.customerName ? ` — ${inv.customerName}` : ''}`
    : 'Hoá đơn'

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title="Xuất hoá đơn"
      description={inv ? `${inv.code} · ${STATUS_LABEL[inv.status] || inv.status}` : 'Xem trước & tải PDF / in'}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
          {inv && !isLoading && !isError && (
            <ExportMenu
              targetRef={printRef}
              filename={exportName}
              title={exportTitle}
              enable={{ pdf: true, print: true, docx: false }}
              buttonLabel="Xuất / In"
              align="right"
              size="sm"
            />
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>

        {isError ? (
          <ErrorState
            title="Không tải được hoá đơn"
            onRetry={() => void refetch()}
            isRetrying={isFetching}
          />
        ) : isLoading || !inv ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div
            ref={printRef}
            className="bg-white border border-neutral-200 rounded-lg p-6 sm:p-8 text-neutral-900"
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4 mb-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Hoá đơn bán hàng
                  </div>
                  <div className="text-xl font-bold font-mono text-neutral-900 truncate">
                    {inv.code}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {STATUS_LABEL[inv.status] || inv.status}
                    {inv.glJournalEntryId ? ' · Đã hạch toán' : ''}
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-neutral-500 shrink-0">
                <div>Xuất ngày: {new Date().toLocaleDateString('vi-VN')}</div>
                {inv.issuedDate && (
                  <div>Phát hành: {formatDate(inv.issuedDate)}</div>
                )}
                {inv.dueDate && <div>Hạn thanh toán: {formatDate(inv.dueDate)}</div>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <div className="text-xs text-neutral-500 mb-0.5">Khách hàng</div>
                <div className="font-semibold">{inv.customerName || '—'}</div>
                {inv.customerId && (
                  <div className="text-xs text-neutral-400 font-mono mt-0.5">{inv.customerId}</div>
                )}
              </div>
              <div className="sm:text-right">
                <div className="text-xs text-neutral-500 mb-0.5">Tiền tệ</div>
                <div className="font-medium">{inv.currency || 'VND'}</div>
              </div>
            </div>

            {items.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Chưa có dòng hàng"
                description="Hoá đơn không có chi tiết dòng hàng."
              />
            ) : (
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                      <th className="py-2 pr-2 font-medium">#</th>
                      <th className="py-2 pr-2 font-medium">Sản phẩm</th>
                      <th className="py-2 pr-2 font-medium text-right">SL</th>
                      <th className="py-2 pr-2 font-medium">ĐVT</th>
                      <th className="py-2 pr-2 font-medium text-right">Đơn giá</th>
                      <th className="py-2 pr-2 font-medium text-right">Thuế %</th>
                      <th className="py-2 font-medium text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((line, idx) => {
                      const qty = Number(line.quantity) || 0
                      const price = Number(line.unitPrice) || 0
                      const tax = Number(line.taxRate) || 0
                      const lineTotal =
                        line.lineTotal != null
                          ? Number(line.lineTotal)
                          : qty * price * (1 + tax / 100)
                      return (
                        <tr key={line.id || idx} className="border-b border-neutral-100">
                          <td className="py-2 pr-2 text-neutral-400 tabular-nums">{idx + 1}</td>
                          <td className="py-2 pr-2">
                            <div className="font-medium">{line.productName}</div>
                            {line.productCode && (
                              <div className="text-[11px] text-neutral-400 font-mono">
                                {line.productCode}
                              </div>
                            )}
                          </td>
                          <td className="py-2 pr-2 text-right tabular-nums">{qty}</td>
                          <td className="py-2 pr-2 text-neutral-600">{line.unit || 'cái'}</td>
                          <td className="py-2 pr-2 text-right font-mono tabular-nums">
                            {formatCurrency(price)}
                          </td>
                          <td className="py-2 pr-2 text-right tabular-nums">{tax}</td>
                          <td className="py-2 text-right font-mono font-semibold tabular-nums">
                            {formatCurrency(lineTotal)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col items-end gap-1 text-sm border-t border-neutral-200 pt-4">
              <div className="flex justify-between gap-8 w-full max-w-xs">
                <span className="text-neutral-500">Tạm tính</span>
                <span className="font-mono tabular-nums">{formatCurrency(inv.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between gap-8 w-full max-w-xs">
                <span className="text-neutral-500">Thuế</span>
                <span className="font-mono tabular-nums">{formatCurrency(inv.taxAmount || 0)}</span>
              </div>
              {(inv.discountAmount || 0) > 0 && (
                <div className="flex justify-between gap-8 w-full max-w-xs">
                  <span className="text-neutral-500">Chiết khấu</span>
                  <span className="font-mono tabular-nums">
                    −{formatCurrency(inv.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-8 w-full max-w-xs text-base font-bold pt-1">
                <span>Tổng cộng</span>
                <span className="font-mono tabular-nums text-primary-700">
                  {formatCurrency(inv.total || 0)}
                </span>
              </div>
              <div className="flex justify-between gap-8 w-full max-w-xs text-success-dark">
                <span>Đã thanh toán</span>
                <span className="font-mono tabular-nums">{formatCurrency(inv.paidAmount || 0)}</span>
              </div>
              <div className="flex justify-between gap-8 w-full max-w-xs font-semibold text-warning-dark">
                <span>Còn lại</span>
                <span className="font-mono tabular-nums">{formatCurrency(remain)}</span>
              </div>
            </div>

            {inv.notes?.trim() && (
              <div className="mt-6 pt-4 border-t border-neutral-100 text-sm">
                <div className="text-xs text-neutral-500 mb-1">Ghi chú</div>
                <p className="text-neutral-700 whitespace-pre-wrap">{inv.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppModal>
  )
}
