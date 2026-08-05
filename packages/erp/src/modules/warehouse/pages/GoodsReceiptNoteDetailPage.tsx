// ============================================================
// GoodsReceiptNoteDetailPage — object page PNK + pipeline + lô hàng
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  CheckCircle2,
  FileText,
  PackagePlus,
  Printer,
  Send,
  Settings2,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  PageGuideButton,
  Select,
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
import { GrnDocumentView } from '../components/GrnDocumentView'
import { WarehouseDetailShell } from '../components/WarehouseDetailShell'
import { useGrnSignatures } from '../hooks/useGrnSignatures'
import { GRN_GUIDE } from '../constants/grn-gin.guide'
import {
  computeGrnLineStats,
  formatGrnDate,
  formatVnd,
  previewBatchCode,
} from '../utils/grnGinUtils'
import {
  formatProductLabel,
  formatSupplierLabel,
  formatWarehouseLabel,
} from '../utils/displayUtils'
import { toast } from 'sonner'
import { useWarehouseLocations } from '../hooks/useWarehouseLocations'
import { formatLocationLabel } from '../services/locationApi'
import type { GrnItemDto } from '../services/grnApi'

type GrnDetailTab = 'view' | 'operations'

function lineProductLabel(
  ln: GrnItemDto,
  productMap: Map<string, { code?: string; name?: string }>,
) {
  if (ln.productName || ln.productCode) {
    return formatProductLabel(ln)
  }
  const prod = productMap.get(ln.productId)
  if (prod) return formatProductLabel({ ...prod, productId: ln.productId })
  return ln.productId
}

function lineProductCode(
  ln: GrnItemDto,
  productMap: Map<string, { code?: string; name?: string }>,
) {
  return ln.productCode || productMap.get(ln.productId)?.code || ln.productId
}

export function GoodsReceiptNoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: GrnDetailTab = searchParams.get('tab') === 'operations' ? 'operations' : 'view'
  const setTab = (next: GrnDetailTab) => {
    setSearchParams(next === 'view' ? {} : { tab: next }, { replace: true })
  }
  const { data: grn, isLoading, isError, refetch, isFetching } = useGrn(id)
  const { signatures, sign } = useGrnSignatures(grn?.id)
  const { data: productsRaw } = useProducts()
  const submit = useSubmitGrn()
  const approve = useApproveGrn()
  const confirm = useConfirmGrn()
  const cancel = useCancelGrn()
  const print = usePrintGrn()
  const updateGrn = useUpdateGrn()
  const canUpdate = usePermission('WAREHOUSE.GRN.UPDATE')
  const canApprove = usePermission('WAREHOUSE.GRN.APPROVE')
  const { data: locations = [] } = useWarehouseLocations(grn?.warehouseId)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [qtyDrafts, setQtyDrafts] = useState<Record<string, string>>({})
  const [locationDrafts, setLocationDrafts] = useState<Record<string, string>>({})
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [noteDraft, setNoteDraft] = useState('')

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
    if (!grn?.items) return
    const init: Record<string, string> = {}
    for (const ln of grn.items) {
      if (!ln.id) continue
      if (ln.locationId) init[ln.id] = ln.locationId
    }
    setLocationDrafts(init)
  }, [grn?.id, grn?.items])

  useEffect(() => {
    if (!grn) return
    setInvoiceNo(grn.invoiceNo || '')
    setInvoiceDate(grn.invoiceDate || '')
    setNoteDraft(grn.note || '')
  }, [grn])

  const st = (grn?.status || '').toUpperCase()
  const isDraft = st === 'DRAFT'
  const isPending = st === 'PENDING_APPROVAL'
  const isApproved = st === 'APPROVED'
  const isConfirmed = st === 'CONFIRMED'
  const isCancelled = st === 'CANCELLED'
  const canEdit = (isDraft || isPending || isApproved) && canUpdate && !isCancelled
  const canEditQty = isDraft || isApproved
  const lineStats = computeGrnLineStats(grn?.items || [], qtyDrafts)
  const requiresInvoice = !!(grn?.supplierId || grn?.purchaseOrderId)
  const invoiceMissing = requiresInvoice && !invoiceNo.trim()
  const locationMissing = (grn?.items || []).some((ln) => {
    if (!ln.id) return false
    const qty = Number(qtyDrafts[ln.id] ?? ln.qtyExpected ?? 0)
    if (qty <= 0) return false
    return !locationDrafts[ln.id]?.trim()
  })

  const handleSaveDocument = () => {
    if (!grn) return
    updateGrn.mutate({
      id: grn.id,
      body: {
        invoiceNo: invoiceNo.trim() || undefined,
        invoiceDate: invoiceDate || undefined,
        note: noteDraft || undefined,
      },
    })
  }

  const handleConfirm = () => {
    if (!grn) return
    if (invoiceMissing) {
      toast.error('Phiếu gắn NCC/đơn mua phải có số hóa đơn NCC trước khi xác nhận nhập')
      return
    }
    if (locationMissing) {
      toast.error('Mỗi dòng cần vị trí kho trước khi xác nhận nhập.')
      return
    }
    const items = (grn.items || [])
      .filter((ln) => ln.id)
      .map((ln) => ({
        itemId: ln.id!,
        qtyReceived: Number(qtyDrafts[ln.id!] ?? ln.qtyExpected ?? 0),
        locationId: locationDrafts[ln.id!] || ln.locationId,
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
              disabled: confirm.isPending || invoiceMissing || locationMissing,
              loading: confirm.isPending,
            }
          : null

  const showBatchPreview = !isConfirmed && !isCancelled && (grn?.items?.length ?? 0) > 0

  return (
    <>
      <WarehouseDetailShell
        missingIdTitle={!id ? 'Thiếu ID phiếu nhập' : undefined}
        missingIdDescription={!id ? '/warehouse/grn/:id' : undefined}
        missingIcon={!id ? PackagePlus : undefined}
        breadcrumb={
          grn
            ? [
                { label: 'Kho', onClick: () => nav('/warehouse') },
                { label: 'Phiếu nhập kho', onClick: () => nav('/warehouse/grn') },
                { label: grn.grnCode || id! },
              ]
            : undefined
        }
        title={grn?.grnCode || id || '—'}
        subtitle={
          grn
            ? `${formatWarehouseLabel(grn)} · ${formatSupplierLabel(grn)} · ${formatGrnDate(grn)}`
            : undefined
        }
        statusBadge={grn ? <GrnGinStatusBadge status={grn.status} /> : undefined}
        kpi={
          grn
            ? [
                { label: 'Tổng SL', value: lineStats.totalQty },
                { label: 'Số dòng', value: lineStats.lineCount },
                {
                  label: 'Chênh SL',
                  value:
                    lineStats.netVariance === 0
                      ? 'Khớp'
                      : `${lineStats.netVariance > 0 ? '+' : ''}${lineStats.netVariance}`,
                },
                {
                  label: 'Giá trị',
                  value: formatVnd(grn.totalValue ?? lineStats.totalValue),
                },
                ...(grn.receivedAt
                  ? [{ label: 'Ngày nhập', value: String(grn.receivedAt).slice(0, 10) }]
                  : []),
              ]
            : undefined
        }
        actions={
          grn ? (
            <div className="flex flex-wrap gap-2 items-center">
              <PageGuideButton guide={GRN_GUIDE} />
              <Button
                variant="outline"
                className="gap-1 no-print"
                disabled={tab === 'operations' && print.isPending}
                onClick={() => {
                  if (tab === 'view') {
                    window.print()
                    return
                  }
                  print.mutate(grn.id)
                }}
              >
                <Printer size={14} /> {tab === 'view' ? 'In phiếu' : 'In'}
              </Button>
              {grn.purchaseOrderId && (
                <Link to={`/warehouse/purchase-orders/${grn.purchaseOrderId}`}>
                  <Button variant="outline" size="sm">
                    Xem đơn mua hàng
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
                <Button
                  className="gap-1"
                  disabled={invoiceMissing || locationMissing}
                  onClick={() => setConfirmOpen(true)}
                >
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
          ) : undefined
        }
        isLoading={isLoading}
        isError={isError || (!isLoading && !grn)}
        isFetching={isFetching}
        onRetry={refetch}
        errorTitle="Không tải được phiếu nhập kho"
        backHref="/warehouse/grn"
        backLabel="Danh sách phiếu nhập kho"
        contentClassName={
          tab === 'view'
            ? 'p-6 space-y-4 w-full max-w-7xl mx-auto'
            : 'p-6 space-y-4 max-w-6xl w-full mx-auto'
        }
      >
        {grn && (
          <>
            <div className="no-print sticky top-0 z-10 flex flex-wrap gap-1 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur -mx-6 px-6 mb-4">
              {(
                [
                  ['view', 'Xem phiếu', FileText],
                  ['operations', 'Thao tác', Settings2],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition ${
                    tab === key
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {tab === 'view' && (
              <div className="flex w-full justify-center">
                <GrnDocumentView
                  grn={grn}
                  qtyDrafts={qtyDrafts}
                  locationDrafts={locationDrafts}
                  productMap={productMap}
                  locations={locations}
                  signatures={signatures}
                  onSign={sign}
                />
              </div>
            )}

            {tab === 'operations' && (
              <div className="space-y-4">
            <StatusPipelineStepper
              steps={GRN_PIPELINE}
              currentIndex={grnStepIndex(st)}
              nextCta={nextCta}
              showInboxLink={isPending}
            />

            {(isDraft || isPending) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {isDraft
                  ? 'Phiếu nhập nháp — nhập số HĐ NCC, gửi duyệt rồi xác nhận nhập khi kiểm hàng xong.'
                  : 'Chờ duyệt — kế toán kiểm tra hóa đơn đầu vào trước khi thủ kho nhập.'}
                {invoiceMissing && (
                  <span className="block mt-1 font-medium text-rose-800">
                    Thiếu số HĐ NCC — bắt buộc khi phiếu gắn đơn mua/NCC.
                  </span>
                )}
              </div>
            )}

            {/* Thông tin chứng từ */}
            <section className="rounded-xl border bg-white overflow-hidden">
              <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide border-b bg-neutral-50/80">
                Thông tin chứng từ
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <dl className="space-y-2">
                  <div className="grid grid-cols-[120px_1fr] gap-1">
                    <dt className="text-neutral-500">NCC</dt>
                    <dd className="font-medium">{formatSupplierLabel(grn)}</dd>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-1">
                    <dt className="text-neutral-500">Đơn mua hàng</dt>
                    <dd>
                      {grn.purchaseOrderId ? (
                        <Link
                          to={`/warehouse/purchase-orders/${grn.purchaseOrderId}`}
                          className="text-primary-700 hover:underline font-mono text-xs"
                        >
                          {grn.purchaseOrderCode || grn.purchaseOrderId}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  {grn.approvedBy && (
                    <div className="grid grid-cols-[120px_1fr] gap-1">
                      <dt className="text-neutral-500">Người duyệt</dt>
                      <dd>{grn.approvedBy}</dd>
                    </div>
                  )}
                </dl>

                {canEdit ? (
                  <div className="space-y-2">
                    <label className="block space-y-1">
                      <span className="text-xs text-neutral-500">
                        Số HĐ NCC {requiresInvoice ? '*' : ''}
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
                    <label className="block space-y-1">
                      <span className="text-xs text-neutral-500">Ghi chú</span>
                      <textarea
                        rows={2}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                      />
                    </label>
                    {invoiceMissing && (
                      <p className="text-xs text-rose-700">
                        Bắt buộc nhập số HĐ NCC khi phiếu gắn đơn mua hoặc nhà cung cấp.
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateGrn.isPending}
                      onClick={handleSaveDocument}
                    >
                      Lưu chứng từ
                    </Button>
                  </div>
                ) : (
                  <dl className="space-y-2">
                    <div className="grid grid-cols-[120px_1fr] gap-1">
                      <dt className="text-neutral-500">Số HĐ NCC</dt>
                      <dd className="font-mono">{grn.invoiceNo || '—'}</dd>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-1">
                      <dt className="text-neutral-500">Ngày HĐ</dt>
                      <dd>{grn.invoiceDate || '—'}</dd>
                    </div>
                    {grn.note && (
                      <div className="grid grid-cols-[120px_1fr] gap-1">
                        <dt className="text-neutral-500">Ghi chú</dt>
                        <dd>{grn.note}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            </section>

            {/* Dòng hàng */}
            <section className="bg-white border rounded-xl overflow-hidden">
              <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide border-b bg-neutral-50/80 flex justify-between">
                <span>Dòng hàng</span>
                <span className="font-normal normal-case">{grn.items?.length ?? 0} dòng</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600 text-left text-xs">
                    <tr>
                      <th className="p-3 w-8">#</th>
                      <th className="p-3">Sản phẩm</th>
                      <th className="p-3 text-right">SL dự kiến</th>
                      <th className="p-3 text-right">SL thực nhận</th>
                      <th className="p-3 text-right">Chênh</th>
                      <th className="p-3">Vị trí kho</th>
                      <th className="p-3 text-right">Đơn giá</th>
                      <th className="p-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(grn.items || []).map((ln, i) => {
                      const key = ln.id || `${ln.productId}-${i}`
                      const expected = ln.qtyExpected ?? 0
                      const received = Number(qtyDrafts[ln.id!] ?? expected)
                      const variance = received - expected
                      const lineVal = ln.unitCost != null ? received * ln.unitCost : null
                      return (
                        <tr
                          key={key}
                          className={
                            variance !== 0 ? 'bg-amber-50/40' : 'hover:bg-neutral-50/60'
                          }
                        >
                          <td className="p-3 text-neutral-400 tabular-nums">{i + 1}</td>
                          <td className="p-3">
                            <div className="font-medium text-neutral-800 text-sm">
                              {lineProductLabel(ln, productMap)}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-400">
                              {lineProductCode(ln, productMap)}
                            </div>
                          </td>
                          <td className="p-3 text-right tabular-nums text-neutral-700">
                            {expected}
                          </td>
                          <td className="p-3 text-right">
                            {canEditQty && ln.id ? (
                              <input
                                type="number"
                                min={0}
                                step="any"
                                aria-label={`SL nhận ${lineProductCode(ln, productMap)}`}
                                className="w-24 border rounded px-2 py-1 text-sm tabular-nums text-right focus:ring-2 focus:ring-primary-400 outline-none"
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
                          <td
                            className={`p-3 text-right tabular-nums font-medium ${
                              variance > 0
                                ? 'text-emerald-700'
                                : variance < 0
                                  ? 'text-rose-700'
                                  : 'text-neutral-400'
                            }`}
                          >
                            {variance === 0 ? '—' : `${variance > 0 ? '+' : ''}${variance}`}
                          </td>
                          <td className="p-3">
                            {canEditQty && ln.id ? (
                              <Select
                                options={[
                                  { value: '', label: 'Chọn vị trí *' },
                                  ...(locations ?? []).map((loc) => ({
                                    value: loc.id,
                                    label: formatLocationLabel(loc),
                                  })),
                                ]}
                                value={locationDrafts[ln.id] ?? ''}
                                onChange={(v) =>
                                  setLocationDrafts((d) => ({
                                    ...d,
                                    [ln.id!]: v,
                                  }))
                                }
                                showSearch={locations.length > 8}
                                aria-label="Vị trí kho"
                              />
                            ) : (
                              <span className="text-xs text-neutral-600">
                                {ln.locationId
                                  ? formatLocationLabel(
                                      locations.find((l) => l.id === ln.locationId) || {
                                        id: ln.locationId,
                                        zoneName: ln.locationId,
                                      },
                                    )
                                  : '—'}
                              </span>
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
            </section>

            {/* Lô hàng */}
            {showBatchPreview && (
              <section className="bg-white border rounded-xl overflow-hidden">
                <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wide border-b bg-neutral-50/80">
                  Lô hàng {isConfirmed ? '' : '(dự kiến khi xác nhận nhập)'}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600 text-left text-xs">
                      <tr>
                        <th className="p-3">Sản phẩm</th>
                        <th className="p-3">Mã lô</th>
                        <th className="p-3 text-right">SL</th>
                        <th className="p-3">Vị trí</th>
                        <th className="p-3">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(grn.items || []).map((ln, i) => {
                        const qty = Number(qtyDrafts[ln.id!] ?? ln.qtyExpected ?? 0)
                        if (qty <= 0) return null
                        const code = lineProductCode(ln, productMap)
                        const locId = locationDrafts[ln.id!] || ln.locationId
                        const loc = locations.find((l) => l.id === locId)
                        return (
                          <tr key={ln.id || i}>
                            <td className="p-3">{lineProductLabel(ln, productMap)}</td>
                            <td className="p-3 font-mono text-xs">
                              {ln.batchId ? (
                                <Link
                                  to={`/warehouse/batches?productId=${ln.productId}`}
                                  className="text-primary-700 hover:underline"
                                >
                                  Đã tạo
                                </Link>
                              ) : (
                                previewBatchCode(code, grn.supplierId)
                              )}
                            </td>
                            <td className="p-3 text-right tabular-nums">{qty}</td>
                            <td className="p-3 text-xs">
                              {loc ? formatLocationLabel(loc) : locId ? '—' : 'Chưa chọn'}
                            </td>
                            <td className="p-3 text-xs text-neutral-500">
                              {ln.batchId ? 'Đang hiệu lực' : 'Chờ xác nhận'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {isConfirmed && (
              <p className="text-xs text-neutral-500">
                Lô hàng đã được tạo khi xác nhận nhập — xem tại{' '}
                <Link to="/warehouse/batches" className="text-primary-700 hover:underline">
                  Quản lý lô
                </Link>
                .
              </p>
            )}
              </div>
            )}
          </>
        )}
      </WarehouseDetailShell>

      <ConfirmDialog
        isOpen={submitOpen}
        onClose={() => !submit.isPending && setSubmitOpen(false)}
        onConfirm={() =>
          grn && submit.mutate(grn.id, { onSettled: () => setSubmitOpen(false) })
        }
        title="Gửi duyệt phiếu nhập?"
        message={`Phiếu ${grn?.grnCode} chuyển sang Chờ duyệt.`}
        confirmText="Gửi duyệt"
        cancelText="Huỷ"
        variant="warning"
        isLoading={submit.isPending}
      />

      <ConfirmDialog
        isOpen={approveOpen}
        onClose={() => !approve.isPending && setApproveOpen(false)}
        onConfirm={() =>
          grn && approve.mutate(grn.id, { onSettled: () => setApproveOpen(false) })
        }
        title="Duyệt phiếu nhập kho?"
        message="Kiểm tra số HĐ NCC và đơn mua trước khi duyệt."
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
            ? 'Cần số hóa đơn NCC trước khi xác nhận nhập (phiếu gắn đơn mua/NCC).'
            : locationMissing
              ? 'Mỗi dòng cần vị trí kho trước khi xác nhận nhập.'
              : `Phiếu ${grn?.grnCode} sẽ cộng tồn kho theo SL thực nhận và tạo lô hàng.`
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
          grn && cancel.mutate({ id: grn.id }, { onSettled: () => setCancelOpen(false) })
        }
        title="Huỷ phiếu nhập kho?"
        message="Chỉ huỷ khi chưa xác nhận nhập."
        confirmText="Huỷ phiếu"
        cancelText="Đóng"
        variant="danger"
        isLoading={cancel.isPending}
      />
    </>
  )
}
