// ============================================================
// GoodsReceiptNoteDetailPage — object page PNK + hóa đơn NCC + pipeline
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackagePlus,
  Printer,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import {
  Button,
  PageHeader,
  EmptyState,
  ErrorState,
  ConfirmDialog,
  StatCard,
  PageGuideButton,
} from '@frezo/ui'
import { useProducts } from '@/modules/products/hooks/useProduct'
import {
  useGrn,
  useConfirmGrn,
  useCancelGrn,
  usePrintGrn,
  useSubmitGrn,
  useApproveGrn,
  useUpdateGrn,
} from '../hooks/useGrn'
import { usePermission } from '@/lib/hooks/usePermission'
import {
  StatusPipelineStepper,
  GRN_PIPELINE,
  grnStepIndex,
} from '../components/StatusPipelineStepper'
import { GrnGinStatusBadge } from '../components/GrnGinStatusBadge'
import { GRN_GUIDE } from '../constants/grn-gin.guide'
import { computeGrnLineStats, formatVnd } from '../utils/grnGinUtils'
import { formatWarehouseLabel } from '../utils/displayUtils'
import { toast } from 'sonner'

export function GoodsReceiptNoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: grn, isLoading, isError, refetch, isFetching } = useGrn(id)
  const { data: productsRaw } = useProducts()
  const submit = useSubmitGrn()
  const approve = useApproveGrn()
  const confirm = useConfirmGrn()
  const cancel = useCancelGrn()
  const print = usePrintGrn()
  const updateGrn = useUpdateGrn()
  const canUpdate = usePermission('WAREHOUSE.GRN.UPDATE')
  const canApprove = usePermission('WAREHOUSE.GRN.APPROVE')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({})
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')

  const productMap = useMemo(() => {
    const list = productsRaw as Array<{ id: string; code?: string; name?: string }> | undefined
    const map = new Map<string, { code?: string; name?: string }>()
    for (const p of Array.isArray(list) ? list : []) {
      map.set(p.id, { code: p.code, name: p.name })
    }
    return map
  }, [productsRaw])

  useEffect(() => {
    if (!grn?.items) return
    const init: Record<string, string> = {}
    for (const ln of grn.items) {
      if (!ln.id) continue
      const qty =
        ln.qtyReceived && ln.qtyReceived > 0 ? ln.qtyReceived : ln.qtyExpected ?? 0
      init[ln.id] = String(qty)
    }
    setQtyDrafts(init)
  }, [grn?.id, grn?.items])

  useEffect(() => {
    if (!grn) return
    setInvoiceNo(grn.invoiceNo || '')
    setInvoiceDate(grn.invoiceDate || '')
  }, [grn?.id, grn?.invoiceNo, grn?.invoiceDate])

  if (!id) {
    return (
      <EmptyState icon={PackagePlus} title="Thiếu ID" description="/warehouse/grn/:id" />
    )
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
      </div>
    )
  }

  if (isError || !grn) {
    return (
      <div className="p-6 space-y-4">
        <ErrorState
          title="Không tải được PNK"
          message="BE /warehouse/grn/:id"
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => nav('/warehouse/grn')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    )
  }

  const st = (grn.status || '').toUpperCase()
  const isDraft = st === 'DRAFT'
  const isPending = st === 'PENDING_APPROVAL'
  const isApproved = st === 'APPROVED'
  const canEditQty = isDraft || isApproved
  const lineStats = computeGrnLineStats(grn.items || [])
  const requiresInvoice = !!(grn.supplierId || grn.purchaseOrderId)
  const invoiceMissing = requiresInvoice && !invoiceNo.trim()

  const handleSaveInvoice = () => {
    updateGrn.mutate({
      id: grn.id,
      body: {
        invoiceNo: invoiceNo.trim() || undefined,
        invoiceDate: invoiceDate || undefined,
      },
    })
  }

  const handleConfirm = () => {
    if (invoiceMissing) {
      toast.error('Phiếu gắn NCC/PO phải có số hóa đơn NCC trước khi xác nhận nhập')
      return
    }
    const items = (grn.items || [])
      .filter((ln) => ln.id)
      .map((ln) => ({
        itemId: ln.id!,
        qtyReceived: Number(qtyDrafts[ln.id!] ?? ln.qtyExpected ?? 0),
      }))
    confirm.mutate(
      { id: grn.id, body: { items } },
      { onSettled: () => setConfirmOpen(false) },
    )
  }

  const nextCta =
    isDraft && canUpdate
      ? {
          label: 'Bước kế: Gửi duyệt',
          onClick: () => setSubmitOpen(true),
          disabled: submit.isPending,
          loading: submit.isPending,
        }
      : isPending && canApprove
        ? {
            label: 'Bước kế: Duyệt phiếu',
            onClick: () => setApproveOpen(true),
            disabled: approve.isPending,
            loading: approve.isPending,
          }
        : isApproved && canUpdate
          ? {
              label: 'Bước kế: Xác nhận nhập kho',
              onClick: () => setConfirmOpen(true),
              disabled: confirm.isPending,
              loading: confirm.isPending,
            }
          : null

  return (
    <div className="pb-8 animate-fade-in">
      <div className="sticky top-0 z-20 bg-neutral-50/95 backdrop-blur border-b border-neutral-200/80 px-6 py-4 space-y-3">
        <PageHeader
          title={grn.grnCode || grn.id}
          description={
            <>
              {formatWarehouseLabel(grn)}
              {' · '}
              <GrnGinStatusBadge status={grn.status} />
              {grn.purchaseOrderCode ? ` · PO ${grn.purchaseOrderCode}` : ''}
            </>
          }
          actions={
            <div className="flex flex-wrap gap-2 items-center">
              <PageGuideButton guide={GRN_GUIDE} />
              <Button variant="outline" className="gap-1" onClick={() => nav('/warehouse/grn')}>
                <ArrowLeft size={14} /> Danh sách
              </Button>
              <Button
                variant="outline"
                className="gap-1"
                disabled={print.isPending}
                onClick={() => print.mutate(grn.id)}
              >
                <Printer size={14} /> In
              </Button>
              {grn.purchaseOrderId && (
                <Link to={`/warehouse/purchase-orders/${grn.purchaseOrderId}`}>
                  <Button variant="outline" size="sm">
                    Xem PO
                  </Button>
                </Link>
              )}
              {isDraft && canUpdate && (
                <Button className="gap-1" onClick={() => setSubmitOpen(true)}>
                  <Send size={14} /> Gửi duyệt
                </Button>
              )}
              {isPending && canApprove && (
                <Button className="gap-1" onClick={() => setApproveOpen(true)}>
                  <ShieldCheck size={14} /> Duyệt
                </Button>
              )}
              {(isApproved || isDraft) && canUpdate && (
                <Button className="gap-1" onClick={() => setConfirmOpen(true)}>
                  <CheckCircle2 size={14} /> Xác nhận nhập
                </Button>
              )}
              {(isDraft || isPending || isApproved) && canUpdate && (
                <Button
                  variant="outline"
                  className="gap-1 text-rose-700"
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle size={14} /> Huỷ
                </Button>
              )}
            </div>
          }
        />

        <StatusPipelineStepper
          steps={GRN_PIPELINE}
          currentIndex={grnStepIndex(st)}
          nextCta={nextCta}
          showInboxLink={isPending}
        />
      </div>

      <div className="px-6 pt-4 space-y-4 max-w-5xl">
        {(isDraft || isPending) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {isDraft
              ? 'PNK nháp — nhập số HĐ NCC, gửi duyệt rồi xác nhận nhập khi kiểm hàng xong.'
              : 'Chờ duyệt — kế toán kiểm tra hóa đơn đầu vào trước khi thủ kho nhập.'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-white p-4 space-y-3 text-sm">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Hóa đơn NCC & PO
            </h3>
            {(isDraft || isPending || isApproved) && canUpdate ? (
              <div className="space-y-2">
                <label className="block space-y-1">
                  <span className="text-xs text-neutral-500">
                    Số HĐ GTGT đầu vào {requiresInvoice ? '*' : ''}
                  </span>
                  <input
                    className="w-full border rounded-md px-3 py-2 font-mono text-sm"
                    placeholder="VD: 00001234"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-neutral-500">Ngày HĐ</span>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </label>
                {invoiceMissing && (
                  <p className="text-xs text-rose-700">
                    Bắt buộc nhập số HĐ NCC khi phiếu gắn đơn mua hoặc nhà cung cấp (chuẩn SAP/AMIS).
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updateGrn.isPending}
                  onClick={handleSaveInvoice}
                >
                  Lưu HĐ NCC
                </Button>
              </div>
            ) : (
              <dl className="grid grid-cols-[120px_1fr] gap-1">
                <dt className="text-neutral-500">Số HĐ</dt>
                <dd className="font-mono">{grn.invoiceNo || '—'}</dd>
                <dt className="text-neutral-500">Ngày HĐ</dt>
                <dd>{grn.invoiceDate || '—'}</dd>
              </dl>
            )}
            <dl className="grid grid-cols-[120px_1fr] gap-1 pt-2 border-t">
              <dt className="text-neutral-500">NCC</dt>
              <dd>{grn.supplierName || grn.supplierId || '—'}</dd>
              <dt className="text-neutral-500">Đơn mua</dt>
              <dd>
                {grn.purchaseOrderCode || grn.purchaseOrderId ? (
                  grn.purchaseOrderId ? (
                    <Link
                      to={`/warehouse/purchase-orders/${grn.purchaseOrderId}`}
                      className="text-primary-700 hover:underline font-mono text-xs"
                    >
                      {grn.purchaseOrderCode || grn.purchaseOrderId}
                    </Link>
                  ) : (
                    grn.purchaseOrderCode
                  )
                ) : (
                  '—'
                )}
              </dd>
              {grn.approvedBy && (
                <>
                  <dt className="text-neutral-500">Người duyệt</dt>
                  <dd>{grn.approvedBy}</dd>
                </>
              )}
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-3 content-start">
            <StatCard label="Dòng hàng" value={lineStats.lineCount} />
            <StatCard label="Tổng SL" value={lineStats.totalQty} />
            <StatCard
              label="Giá trị"
              value={formatVnd(grn.totalValue ?? lineStats.totalValue)}
            />
            {grn.receivedAt && (
              <StatCard label="Ngày nhập" value={String(grn.receivedAt).slice(0, 10)} />
            )}
          </div>
        </div>

        {grn.note && (
          <div className="rounded-lg border bg-white px-4 py-3 text-sm">
            <span className="text-neutral-500">Ghi chú: </span>
            {grn.note}
          </div>
        )}

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-4 py-2 text-xs text-neutral-500 border-b bg-neutral-50/80">
            {grn.items?.length ?? 0} dòng hàng
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-left text-xs">
                <tr>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3 text-right">Dự kiến</th>
                  <th className="p-3 text-right">Nhận</th>
                  <th className="p-3 text-right">Đơn giá</th>
                  <th className="p-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(grn.items || []).map((ln, i) => {
                  const prod = productMap.get(ln.productId)
                  const qty = Number(qtyDrafts[ln.id!] ?? ln.qtyExpected ?? 0)
                  const lineVal = ln.unitCost != null ? qty * ln.unitCost : null
                  return (
                    <tr key={ln.id || i}>
                      <td className="p-3">
                        <div className="font-mono text-xs text-primary-700">
                          {prod?.code || ln.productId.slice(0, 8)}
                        </div>
                        {prod?.name && (
                          <div className="text-neutral-600 text-xs">{prod.name}</div>
                        )}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {ln.qtyExpected ?? '—'}
                      </td>
                      <td className="p-3 text-right">
                        {canEditQty && ln.id ? (
                          <input
                            type="number"
                            min={0}
                            className="w-24 border rounded px-2 py-1 text-sm tabular-nums text-right"
                            value={qtyDrafts[ln.id] ?? ''}
                            onChange={(e) =>
                              setQtyDrafts((d) => ({
                                ...d,
                                [ln.id!]: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <span className="tabular-nums">{ln.qtyReceived ?? 0}</span>
                        )}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {formatVnd(ln.unitCost)}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {formatVnd(lineVal ?? undefined)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={submitOpen}
        onClose={() => !submit.isPending && setSubmitOpen(false)}
        onConfirm={() =>
          submit.mutate(grn.id, { onSettled: () => setSubmitOpen(false) })
        }
        title="Gửi duyệt phiếu nhập?"
        message={`PNK ${grn.grnCode} chuyển sang Chờ duyệt.`}
        confirmText="Gửi duyệt"
        cancelText="Huỷ"
        variant="warning"
        isLoading={submit.isPending}
      />

      <ConfirmDialog
        isOpen={approveOpen}
        onClose={() => !approve.isPending && setApproveOpen(false)}
        onConfirm={() =>
          approve.mutate(grn.id, { onSettled: () => setApproveOpen(false) })
        }
        title="Duyệt phiếu nhập kho?"
        message="Kiểm tra số HĐ NCC và PO trước khi duyệt."
        confirmText="Duyệt"
        cancelText="Huỷ"
        variant="warning"
        isLoading={approve.isPending}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => !confirm.isPending && setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Xác nhận nhập kho?"
        message={
          invoiceMissing
            ? 'Cần số hóa đơn NCC trước khi xác nhận nhập (phiếu gắn PO/NCC).'
            : `PNK ${grn.grnCode} sẽ cộng tồn kho theo SL thực nhận.`
        }
        confirmText="Xác nhận nhập"
        cancelText="Huỷ"
        variant="warning"
        isLoading={confirm.isPending}
      />

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => !cancel.isPending && setCancelOpen(false)}
        onConfirm={() =>
          cancel.mutate({ id: grn.id }, { onSettled: () => setCancelOpen(false) })
        }
        title="Huỷ phiếu nhập kho?"
        message="Chỉ huỷ khi chưa xác nhận nhập."
        confirmText="Huỷ phiếu"
        cancelText="Đóng"
        variant="danger"
        isLoading={cancel.isPending}
      />
    </div>
  )
}
